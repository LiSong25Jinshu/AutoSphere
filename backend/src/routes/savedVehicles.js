import express from 'express';
import { param, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import UserVehicleInteraction from '../models/UserVehicleInteraction.js';
import Vehicle from '../models/Vehicle.js';

const router = express.Router();

const vehicleIdValidation = param('vehicleId').isInt({ min: 1 });

router.get('/', authenticateToken, async (req, res) => {
  try {
    const savedVehicles = await UserVehicleInteraction.findAll({
      where: { userId: req.user.id, interactionType: 'save' },
      include: [{ model: Vehicle, as: 'vehicle' }],
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, data: savedVehicles.map((item) => item.vehicle).filter(Boolean) });
  } catch (error) {
    console.error('Get saved vehicles error:', error);
    res.status(500).json({ success: false, message: 'Could not load saved vehicles' });
  }
});

router.post('/:vehicleId', [vehicleIdValidation], authenticateToken, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Invalid vehicle ID', errors: errors.array() });
  }

  try {
    const vehicle = await Vehicle.findByPk(req.params.vehicleId);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    const [savedVehicle] = await UserVehicleInteraction.findOrCreate({
      where: { userId: req.user.id, vehicleId: vehicle.id, interactionType: 'save' },
      defaults: { userId: req.user.id, vehicleId: vehicle.id, interactionType: 'save' },
    });

    res.status(201).json({ success: true, saved: true, data: vehicle, interaction: savedVehicle });
  } catch (error) {
    console.error('Save vehicle error:', error);
    res.status(500).json({ success: false, message: 'Could not save vehicle' });
  }
});

router.delete('/:vehicleId', [vehicleIdValidation], authenticateToken, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Invalid vehicle ID', errors: errors.array() });
  }

  try {
    const deleted = await UserVehicleInteraction.destroy({
      where: { userId: req.user.id, vehicleId: req.params.vehicleId, interactionType: 'save' },
    });

    res.json({ success: true, saved: false, removed: deleted > 0 });
  } catch (error) {
    console.error('Remove saved vehicle error:', error);
    res.status(500).json({ success: false, message: 'Could not remove saved vehicle' });
  }
});

export default router;