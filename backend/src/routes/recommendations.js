import express from 'express';
import axios from 'axios';
import { Op } from 'sequelize';
import Vehicle from '../models/Vehicle.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const AI_SERVICE_URL = 'http://localhost:5002';

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
        const recommendations = Array.isArray(payload.recommendations) ? payload.recommendations : [];

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

        const statusCode = error.response?.status === 500 ? 200 : 502;
        const fallbackPayload = {
            success: statusCode === 200,
            source: statusCode === 200 ? 'ai' : 'unavailable',
            recommendations: [],
            metadata: {
                result_count: 0,
                fallback_used: true,
                source_status: statusCode === 200 ? 'empty_result' : 'service_unavailable',
            },
            message: statusCode === 200
                ? 'No exact match was found; the dataset returned no ranked vehicles.'
                : 'AI recommendations are temporarily unavailable',
        };

        return res.status(statusCode).json(fallbackPayload);
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