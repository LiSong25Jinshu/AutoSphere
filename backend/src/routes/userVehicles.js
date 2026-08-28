/**
 * /api/user-vehicles — Customer-owned vehicle garage.
 *
 * Customers can add their own cars (make, model, year, plate, color, mileage)
 * for service booking reference. Stored in the users.consent_data JSON field
 * under key "myVehicles" — no migration required.
 */
import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

const getMyVehicles = (user) =>
  (user.consentData?.myVehicles) || [];

// GET /api/user-vehicles — list customer's own vehicles
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: getMyVehicles(user) });
  } catch (err) {
    console.error('Get user vehicles error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/user-vehicles — add a vehicle
router.post('/', authenticateToken, [
  body('make').trim().notEmpty().withMessage('Make is required').isLength({ max: 60 }),
  body('model').trim().notEmpty().withMessage('Model is required').isLength({ max: 60 }),
  body('year').isInt({ min: 1900, max: new Date().getFullYear() + 2 }).withMessage('Valid year required'),
  body('color').optional({ checkFalsy: true }).trim().isLength({ max: 40 }),
  body('plate').optional({ checkFalsy: true }).trim().isLength({ max: 20 }),
  body('vin').optional({ checkFalsy: true }).trim().isLength({ max: 17 }),
  body('mileage').optional({ checkFalsy: true }).isInt({ min: 0 }),
  body('notes').optional({ checkFalsy: true }).trim().isLength({ max: 300 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, message: errors.array()[0].msg });

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const vehicles = getMyVehicles(user);
    const newVehicle = {
      id: Date.now(),                           // simple unique ID
      make:    req.body.make.trim(),
      model:   req.body.model.trim(),
      year:    parseInt(req.body.year),
      color:   req.body.color?.trim()   || null,
      plate:   req.body.plate?.trim()   || null,
      vin:     req.body.vin?.trim()     || null,
      mileage: req.body.mileage ? parseInt(req.body.mileage) : null,
      notes:   req.body.notes?.trim()   || null,
      addedAt: new Date().toISOString(),
    };

    const updated = [...vehicles, newVehicle];
    await user.update({
      consentData: { ...(user.consentData || {}), myVehicles: updated },
    });

    res.status(201).json({ success: true, data: newVehicle });
  } catch (err) {
    console.error('Add user vehicle error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/user-vehicles/:vid — update a vehicle
router.put('/:vid', authenticateToken, [
  body('make').optional().trim().isLength({ max: 60 }),
  body('model').optional().trim().isLength({ max: 60 }),
  body('year').optional().isInt({ min: 1900, max: new Date().getFullYear() + 2 }),
  body('color').optional({ checkFalsy: true }).trim().isLength({ max: 40 }),
  body('plate').optional({ checkFalsy: true }).trim().isLength({ max: 20 }),
  body('vin').optional({ checkFalsy: true }).trim().isLength({ max: 17 }),
  body('mileage').optional({ checkFalsy: true }).isInt({ min: 0 }),
  body('notes').optional({ checkFalsy: true }).trim().isLength({ max: 300 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, message: errors.array()[0].msg });

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const vid = parseInt(req.params.vid);
    const vehicles = getMyVehicles(user);
    const idx = vehicles.findIndex(v => v.id === vid);
    if (idx === -1)
      return res.status(404).json({ success: false, message: 'Vehicle not found' });

    const updated = [...vehicles];
    updated[idx] = {
      ...updated[idx],
      make:    req.body.make?.trim()    ?? updated[idx].make,
      model:   req.body.model?.trim()   ?? updated[idx].model,
      year:    req.body.year ? parseInt(req.body.year) : updated[idx].year,
      color:   req.body.color?.trim()   ?? updated[idx].color,
      plate:   req.body.plate?.trim()   ?? updated[idx].plate,
      vin:     req.body.vin?.trim()     ?? updated[idx].vin,
      mileage: req.body.mileage != null ? parseInt(req.body.mileage) : updated[idx].mileage,
      notes:   req.body.notes?.trim()   ?? updated[idx].notes,
    };

    await user.update({
      consentData: { ...(user.consentData || {}), myVehicles: updated },
    });

    res.json({ success: true, data: updated[idx] });
  } catch (err) {
    console.error('Update user vehicle error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /api/user-vehicles/:vid — remove a vehicle
router.delete('/:vid', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const vid = parseInt(req.params.vid);
    const updated = getMyVehicles(user).filter(v => v.id !== vid);
    await user.update({
      consentData: { ...(user.consentData || {}), myVehicles: updated },
    });

    res.json({ success: true, message: 'Vehicle removed' });
  } catch (err) {
    console.error('Delete user vehicle error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
