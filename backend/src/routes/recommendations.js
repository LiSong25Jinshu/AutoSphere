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

    try {
        const response = await axios.get(
            `${AI_SERVICE_URL}/recommendations/${userId}`, 
            { params: req.query }   //forward all query params to Flask
        );
        return res.json({ source: 'ai', ...response.data });

    } catch (error) {
        console.error('AI service error:', error.message);

        // Fallback to simple DB recommendations if AI service is down
        const vehicles = await Vehicle.findAll({
            where: { status: 'available' },
            order: [['createdAt', 'DESC']],
            limit: 10,
        });

        return res.json({
            source: 'fallback',
            recommendations: vehicles
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