import express from 'express';
import { Op } from 'sequelize';
import Vehicle from '../models/Vehicle.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/recommendations - Get personalized vehicle recommendations
// Uses simple DB-based logic: recent vehicles + similar to user's viewed/saved
router.get('/', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Return recently added vehicles as recommendations
    // In a full implementation this would use user interaction history
    const vehicles = await Vehicle.findAll({
      where: { status: 'available' },
      order: [['createdAt', 'DESC']],
      limit,
    });

    res.json({
      success: true,
      source: 'db',
      recommendations: vehicles,
      count: vehicles.length,
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ success: false, message: 'Could not fetch recommendations' });
  }
});

// GET /api/recommendations/similar/:vehicleId - Get similar vehicles
router.get('/similar/:vehicleId', async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const limit = parseInt(req.query.limit) || 6;

    // Find the reference vehicle
    const vehicle = await Vehicle.findByPk(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    // Find similar vehicles by make or price range
    const priceRange = vehicle.price * 0.3; // ±30%
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
