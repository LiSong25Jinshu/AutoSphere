import express from 'express';
import axios from 'axios';
import { Op } from 'sequelize';
import Vehicle from '../models/Vehicle.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const AI_SERVICE_URL = 'http://localhost:5002';

const resolveMarketplaceVehicleId = async (recommendation) => {
    if (Number.isInteger(Number(recommendation.marketplace_vehicle_id))) {
        return Number(recommendation.marketplace_vehicle_id);
    }

    if (!recommendation.make || !recommendation.model || !recommendation.year) {
        return null;
    }

    const candidates = await Vehicle.findAll({
        where: {
            make: recommendation.make,
            model: recommendation.model,
            year: Number(recommendation.year),
            status: { [Op.ne]: 'sold' },
        },
        attributes: ['id', 'price'],
        order: [['createdAt', 'DESC']],
        limit: 10,
    });

    if (candidates.length === 0) return null;
    if (recommendation.price == null) return candidates[0].id;

    const targetPrice = Number(recommendation.price);
    return candidates.reduce((closest, candidate) => (
        Math.abs(Number(candidate.price) - targetPrice) < Math.abs(Number(closest.price) - targetPrice)
            ? candidate
            : closest
    )).id;
};

// GET /api/recommendations/:userId - Get AI powered recommendations
router.get('/:userId', authenticateToken, async (req, res) => {
    const { userId } = req.params;

    const allowedParams = new Set([
        'n', 'budget_min', 'budget_max', 'fuel_type', 'body_type',
        'transmission', 'condition', 'make', 'model', 'min_year',
        'max_year', 'min_mileage', 'max_mileage', 'features', 'usage',
        'lifestyle',
    ]);
    const unsupportedParams = Object.keys(req.query).filter((key) => !allowedParams.has(key));
    if (unsupportedParams.length > 0) {
        return res.status(400).json({
            success: false,
            message: `Unsupported recommendation parameter: ${unsupportedParams[0]}`,
        });
    }

    try {
        const response = await axios.get(
            `${AI_SERVICE_URL}/recommendations/${userId}`, 
            { params: req.query }   // forward all query params to Flask
        );

        const payload = response?.data || {};
        const rawRecommendations = Array.isArray(payload.recommendations) ? payload.recommendations : [];
        const recommendations = await Promise.all(rawRecommendations.map(async (recommendation) => ({
            ...recommendation,
            marketplace_vehicle_id: await resolveMarketplaceVehicleId(recommendation),
        })));

        return res.json({
            success: true,
            source: 'ai',
            ...payload,
            recommendations,
            metadata: {
                ...(payload.metadata || {}),
                result_count: recommendations.length,
            },
        });

    } catch (error) {
        console.error('AI service error:', error.response?.data || error.message);

        // Always return 200 with graceful degradation — a missing AI service
        // should not break the page with a 500 error in the browser.
        const isFlask500 = error.response?.status === 500;
        const isUnavailable = !error.response; // connection refused / timeout

        return res.status(200).json({
            success: isFlask500, // Flask returned something — just no results
            source: 'unavailable',
            recommendations: [],
            metadata: {
                result_count: 0,
                fallback_used: true,
                source_status: isUnavailable ? 'service_unavailable' : 'empty_result',
            },
            message: isUnavailable
                ? 'AI recommendations are temporarily unavailable'
                : 'No exact match was found; the dataset returned no ranked vehicles.',
        });
    }
});

// GET /api/recommendations/similar/:vehicleId - Get similar vehicles
router.get('/similar/:vehicleId', async (req, res) => {
    try {
        const { vehicleId } = req.params;
        const limit = parseInt(req.query.limit) || 6;

        const vehicle = await Vehicle.findByPk(vehicleId);
        if (!vehicle) {
            return res.status(404).json({ success: false, message: 'Vehicle not found' });
        }

        const priceRange = vehicle.price * 0.3;
        const similar = await Vehicle.findAll({
            where: {
                id: { [Op.ne]: vehicleId },
                status: 'available',
                [Op.or]: [
                    { make: vehicle.make },
                    {
                        price: {
                            [Op.between]: [vehicle.price - priceRange, vehicle.price + priceRange],
                        },
                    },
                ],
            },
            order: [['createdAt', 'DESC']],
            limit,
        });

        res.json({
            success: true,
            similar,
            count: similar.length,
        });

    } catch (error) {
        console.error('Similar vehicles error:', error);
        res.status(500).json({ success: false, message: 'Could not fetch similar vehicles' });
    }
});

export default router;