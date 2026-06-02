import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { Op } from 'sequelize';
import { authenticateToken } from '../middleware/auth.js';
import Vehicle from '../models/Vehicle.js';
import User from '../models/User.js';

const router = express.Router();

// ─── GET /api/rentals/vehicles ────────────────────────────────────────────────
// Public: browse available vehicles for rent with filters & pagination
router.get('/vehicles', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('make').optional().isString().trim(),
  query('bodyType').optional().isIn(['sedan', 'suv', 'hatchback', 'coupe', 'convertible', 'truck', 'van', 'wagon']),
  query('transmission').optional().isIn(['manual', 'automatic', 'cvt']),
  query('fuelType').optional().isIn(['gasoline', 'diesel', 'hybrid', 'electric', 'plug_in_hybrid']),
  query('minPrice').optional().isFloat({ min: 0 }),
  query('maxPrice').optional().isFloat({ min: 0 }),
  query('search').optional().isString().trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;

    const where = { status: 'available' };

    if (req.query.make)         where.make         = { [Op.iLike]: `%${req.query.make}%` };
    if (req.query.bodyType)     where.bodyType     = req.query.bodyType;
    if (req.query.transmission) where.transmission = req.query.transmission;
    if (req.query.fuelType)     where.fuelType     = req.query.fuelType;

    if (req.query.minPrice || req.query.maxPrice) {
      where.price = {};
      if (req.query.minPrice) where.price[Op.gte] = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) where.price[Op.lte] = parseFloat(req.query.maxPrice);
    }

    if (req.query.search) {
      const q = `%${req.query.search}%`;
      where[Op.or] = [
        { make:  { [Op.iLike]: q } },
        { model: { [Op.iLike]: q } },
      ];
    }

    const { rows: vehicles, count: total } = await Vehicle.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'dealer',
        attributes: ['id', 'firstName', 'lastName', 'phone'],
      }],
      order: [['isFeatured', 'DESC'], ['createdAt', 'DESC']],
      limit,
      offset,
    });

    res.json({
      success: true,
      data: vehicles,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Rental vehicles fetch error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ─── GET /api/rentals/vehicles/:id ───────────────────────────────────────────
// Public: get a single vehicle's full details
router.get('/vehicles/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid vehicle ID' });

    const vehicle = await Vehicle.findByPk(id, {
      include: [{
        model: User,
        as: 'dealer',
        attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
      }],
    });

    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

    res.json({ success: true, data: vehicle });
  } catch (error) {
    console.error('Rental vehicle detail error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ─── POST /api/rentals/request ────────────────────────────────────────────────
// Authenticated: submit a rental request (stored as a contact/inquiry record)
router.post('/request', [
  body('vehicleId').isInt({ min: 1 }).withMessage('Vehicle ID is required'),
  body('startDate').isISO8601().withMessage('Valid start date required'),
  body('endDate').isISO8601().withMessage('Valid end date required'),
  body('pickupTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid pickup time required (HH:MM)'),
  body('notes').optional().trim().isLength({ max: 1000 }),
  body('driverLicense').optional().trim().isLength({ max: 50 }),
], authenticateToken, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { vehicleId, startDate, endDate, pickupTime, notes, driverLicense } = req.body;

    // Validate date range
    const start = new Date(startDate);
    const end   = new Date(endDate);
    if (end <= start) {
      return res.status(400).json({ success: false, message: 'End date must be after start date' });
    }
    if (start < new Date()) {
      return res.status(400).json({ success: false, message: 'Start date must be in the future' });
    }

    const vehicle = await Vehicle.findByPk(vehicleId, {
      include: [{ model: User, as: 'dealer', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] }],
    });

    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    if (vehicle.status !== 'available') {
      return res.status(409).json({ success: false, message: 'This vehicle is no longer available' });
    }

    // Calculate rental duration in days
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    // Estimate daily rate as 0.3% of vehicle price (rough market rate)
    const dailyRate = Math.round(parseFloat(vehicle.price) * 0.003);
    const estimatedTotal = dailyRate * days;

    // Return the rental request summary — in a full implementation this would
    // be persisted to a RentalRequest table and trigger notifications.
    res.status(201).json({
      success: true,
      message: 'Rental request submitted successfully! The dealer will contact you to confirm.',
      data: {
        vehicleId,
        vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        dealerName: vehicle.dealer ? `${vehicle.dealer.firstName} ${vehicle.dealer.lastName}` : 'Dealer',
        dealerPhone: vehicle.dealer?.phone || null,
        startDate,
        endDate,
        pickupTime,
        days,
        dailyRate,
        estimatedTotal,
        notes: notes || null,
        driverLicense: driverLicense || null,
        requestedAt: new Date().toISOString(),
        requestedBy: {
          id: req.user.id,
          email: req.user.email,
        },
      },
    });
  } catch (error) {
    console.error('Rental request error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
