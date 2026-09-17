/**
 * /api/favorites
 * Authenticated customers can save/unsave vehicles and list their favorites.
 */
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import FavoriteVehicle from '../models/FavoriteVehicle.js';
import Vehicle from '../models/Vehicle.js';
import User from '../models/User.js';
import UserVehicleInteraction from '../models/UserVehicleInteraction.js';

const router = express.Router();

// GET /api/favorites  — list all favorited vehicles for the current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const favorites = await FavoriteVehicle.findAll({
      where: { userId: req.user.id },
      include: [{
        model: Vehicle,
        as: 'vehicle',
        include: [{ model: User, as: 'dealer', attributes: ['id', 'firstName', 'lastName', 'phone'] }],
      }],
      order: [['createdAt', 'DESC']],
    });

    const vehicleIds = favorites.map(f => f.vehicleId);
    res.json({ success: true, data: favorites.map(f => f.vehicle).filter(Boolean), vehicleIds });
  } catch (err) {
    console.error('GET /favorites error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/favorites/ids  — just the list of favorited vehicle IDs (lightweight)
router.get('/ids', authenticateToken, async (req, res) => {
  try {
    const favorites = await FavoriteVehicle.findAll({
      where: { userId: req.user.id },
      attributes: ['vehicleId'],
    });
    res.json({ success: true, data: favorites.map(f => f.vehicleId) });
  } catch (err) {
    console.error('GET /favorites/ids error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/favorites/:vehicleId  — save a vehicle
router.post('/:vehicleId', authenticateToken, async (req, res) => {
  try {
    const vehicleId = parseInt(req.params.vehicleId);
    if (isNaN(vehicleId)) return res.status(400).json({ success: false, message: 'Invalid vehicle ID' });

    const vehicle = await Vehicle.findByPk(vehicleId);
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

    const [fav, created] = await FavoriteVehicle.findOrCreate({
      where: { userId: req.user.id, vehicleId },
    });

    // Log a 'save' interaction for recommendations
    if (created) {
      await UserVehicleInteraction.findOrCreate({
        where: { userId: req.user.id, vehicleId, interactionType: 'save' },
      });
    }

    res.status(created ? 201 : 200).json({
      success: true,
      message: created ? 'Vehicle saved to favorites' : 'Already in favorites',
      favorited: true,
    });
  } catch (err) {
    console.error('POST /favorites/:vehicleId error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /api/favorites/:vehicleId  — remove from favorites
router.delete('/:vehicleId', authenticateToken, async (req, res) => {
  try {
    const vehicleId = parseInt(req.params.vehicleId);
    if (isNaN(vehicleId)) return res.status(400).json({ success: false, message: 'Invalid vehicle ID' });

    const deleted = await FavoriteVehicle.destroy({
      where: { userId: req.user.id, vehicleId },
    });

    res.json({
      success: true,
      message: deleted ? 'Removed from favorites' : 'Not in favorites',
      favorited: false,
    });
  } catch (err) {
    console.error('DELETE /favorites/:vehicleId error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
