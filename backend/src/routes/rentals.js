/**
 * /api/rentals
 * Rental request workflow:
 *   Customer submits → Dealer confirms/rejects → ready-for-pickup → active → completed
 * Rentals are stored as Bookings with customerNotes starting with "[RENTAL] {...json...}"
 */
import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { Op } from 'sequelize';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import Vehicle from '../models/Vehicle.js';
import User from '../models/User.js';
import Booking from '../models/Booking.js';
import { sendNotification } from '../utils/pushNotifications.js';

// io injected by server.js after startup
let _io = null;
export const setIo = (ioInstance) => { _io = ioInstance; };
const getIo = () => _io;

const router = express.Router();

// ─── helpers ─────────────────────────────────────────────────────────────────

const parseRentalMeta = (customerNotes) => {
  try {
    const raw = (customerNotes || '').replace(/^\[RENTAL\]\s*/, '');
    return JSON.parse(raw);
  } catch { return {}; }
};

const isRentalBooking = (b) =>
  (b.customerNotes || '').startsWith('[RENTAL]');

const bookingToRental = (b) => {
  const meta = parseRentalMeta(b.customerNotes);
  return {
    id: b.id,
    status: b.status,
    vehicleName: meta.vehicleName || b.title,
    vehicle: b.vehicle,
    dealer: b.serviceProvider,
    startDate: meta.startDate || b.scheduledDate,
    endDate: meta.endDate,
    pickupTime: meta.pickupTime || b.scheduledTime,
    pickupLocation: meta.pickupLocation || null,
    days: meta.days,
    dailyRate: meta.dailyRate,
    estimatedTotal: meta.estimatedTotal || b.estimatedCost,
    driverLicense: meta.driverLicense,
    notes: b.description,
    providerNotes: b.providerNotes,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  };
};

const rentalIncludes = [
  { model: User, as: 'serviceProvider', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
  { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
  { model: Vehicle, as: 'vehicle', attributes: ['id', 'make', 'model', 'year', 'images'] },
];

// ─── Public: browse rentable vehicles ────────────────────────────────────────
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
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });

    const page   = parseInt(req.query.page)  || 1;
    const limit  = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;

    // Include vehicles available for rent OR both
    const where = {
      status: 'available',
      availabilityType: { [Op.in]: ['rent', 'both'] },
    };

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
      where[Op.or] = [{ make: { [Op.iLike]: q } }, { model: { [Op.iLike]: q } }];
    }

    const { rows: vehicles, count: total } = await Vehicle.findAndCountAll({
      where,
      include: [{ model: User, as: 'dealer', attributes: ['id', 'firstName', 'lastName', 'phone'] }],
      order: [['isFeatured', 'DESC'], ['createdAt', 'DESC']],
      limit,
      offset,
    });

    res.json({ success: true, data: vehicles, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error('Rental vehicles fetch error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ─── Public: single vehicle detail ───────────────────────────────────────────
router.get('/vehicles/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid vehicle ID' });

    const vehicle = await Vehicle.findByPk(id, {
      include: [{ model: User, as: 'dealer', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] }],
    });

    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    res.json({ success: true, data: vehicle });
  } catch (err) {
    console.error('Rental vehicle detail error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ─── Customer: my rentals ─────────────────────────────────────────────────────
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      where: { userId: req.user.id, customerNotes: { [Op.like]: '[RENTAL]%' } },
      include: rentalIncludes,
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: bookings.map(bookingToRental) });
  } catch (err) {
    console.error('Get my rentals error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ─── Dealer: get all rental requests for my vehicles ─────────────────────────
router.get('/dealer', authenticateToken, requireRole('dealer'), async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      where: {
        serviceProviderId: req.user.id,
        customerNotes: { [Op.like]: '[RENTAL]%' },
      },
      include: rentalIncludes,
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: bookings.map(bookingToRental) });
  } catch (err) {
    console.error('Get dealer rentals error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ─── Dealer: get all test-drive requests for my vehicles ──────────────────────
router.get('/dealer/test-drives', authenticateToken, requireRole('dealer'), async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      where: {
        serviceProviderId: req.user.id,
        customerNotes: { [Op.like]: '[TEST_DRIVE]%' },
      },
      include: rentalIncludes,
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: bookings.map(b => {
      let meta = {};
      try { meta = JSON.parse((b.customerNotes || '').replace(/^\[TEST_DRIVE\]\s*/, '')); } catch {}
      return {
        id: b.id,
        status: b.status,
        vehicleName: meta.vehicleName || b.title,
        vehicle: b.vehicle,
        customer: b.user,
        scheduledDate: b.scheduledDate,
        scheduledTime: b.scheduledTime,
        notes: b.description,
        providerNotes: b.providerNotes,
        createdAt: b.createdAt,
      };
    })});
  } catch (err) {
    console.error('Get dealer test-drives error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ─── Customer: submit rental request ─────────────────────────────────────────
router.post('/request', [
  body('vehicleId').isInt({ min: 1 }).withMessage('Vehicle ID is required'),
  body('startDate').isISO8601().withMessage('Valid start date required'),
  body('endDate').isISO8601().withMessage('Valid end date required'),
  body('pickupTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid pickup time required (HH:MM)'),
  body('pickupLocation').optional().trim().isLength({ max: 200 }),
  body('notes').optional().trim().isLength({ max: 1000 }),
  body('driverLicense').optional().trim().isLength({ max: 50 }),
  body('contactPhone').optional().trim().isLength({ max: 20 }),
], authenticateToken, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });

    const { vehicleId, startDate, endDate, pickupTime, pickupLocation, notes, driverLicense, contactPhone } = req.body;

    const start = new Date(startDate);
    const end   = new Date(endDate);
    if (end <= start)
      return res.status(400).json({ success: false, message: 'End date must be after start date' });
    if (start < new Date())
      return res.status(400).json({ success: false, message: 'Start date must be in the future' });

    const vehicle = await Vehicle.findByPk(vehicleId, {
      include: [{ model: User, as: 'dealer', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] }],
    });

    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    if (!['available'].includes(vehicle.status))
      return res.status(409).json({ success: false, message: 'This vehicle is no longer available' });

    const dealerId = vehicle.dealerId;
    if (!dealerId) return res.status(400).json({ success: false, message: 'Vehicle has no assigned dealer' });

    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const dailyRate = Math.round(parseFloat(vehicle.price) * 0.003);
    const estimatedTotal = dailyRate * days;
    const vehicleName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

    const rentalMeta = JSON.stringify({
      isRental: true,
      vehicleId,
      vehicleName,
      startDate,
      endDate,
      pickupTime,
      pickupLocation: pickupLocation || null,
      days,
      dailyRate,
      estimatedTotal,
      driverLicense: driverLicense || null,
      contactPhone: contactPhone || null,
    });

    const booking = await Booking.create({
      userId:            req.user.id,
      serviceProviderId: dealerId,
      vehicleId,
      serviceType:       'other',
      title:             `Rental: ${vehicleName}`,
      description:       notes || `Rental request for ${vehicleName}`,
      scheduledDate:     startDate,
      scheduledTime:     pickupTime,
      estimatedCost:     estimatedTotal,
      customerNotes:     `[RENTAL] ${rentalMeta}`,
      status:            'pending',
      priority:          'normal',
    });

    // Notify dealer
    const customer = await User.findByPk(req.user.id, { attributes: ['firstName', 'lastName'] });
    sendNotification(
      dealerId, 'booking',
      '🚗 New Rental Request',
      `${customer.firstName} ${customer.lastName} wants to rent ${vehicleName} from ${new Date(startDate).toLocaleDateString()}.`,
      { linkType: 'booking', linkId: booking.id, url: '/dealer/rentals', io: getIo() }
    ).catch(() => {});

    res.status(201).json({
      success: true,
      message: 'Rental request submitted! The dealer will confirm shortly.',
      data: {
        bookingId: booking.id, vehicleId, vehicleName,
        dealerName: vehicle.dealer ? `${vehicle.dealer.firstName} ${vehicle.dealer.lastName}` : 'Dealer',
        dealerPhone: vehicle.dealer?.phone || null,
        startDate, endDate, pickupTime, pickupLocation: pickupLocation || null,
        days, dailyRate, estimatedTotal,
        status: 'pending',
        requestedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('Rental request error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ─── Customer: schedule a test drive ─────────────────────────────────────────
router.post('/test-drive', [
  body('vehicleId').isInt({ min: 1 }).withMessage('Vehicle ID is required'),
  body('scheduledDate').isISO8601().withMessage('Valid date required'),
  body('scheduledTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time required (HH:MM)'),
  body('notes').optional().trim().isLength({ max: 500 }),
  body('contactPhone').optional().trim().isLength({ max: 20 }),
], authenticateToken, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });

    const { vehicleId, scheduledDate, scheduledTime, notes, contactPhone } = req.body;

    if (new Date(scheduledDate) < new Date())
      return res.status(400).json({ success: false, message: 'Scheduled date must be in the future' });

    const vehicle = await Vehicle.findByPk(vehicleId, {
      include: [{ model: User, as: 'dealer', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] }],
    });

    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

    const dealerId = vehicle.dealerId;
    if (!dealerId) return res.status(400).json({ success: false, message: 'Vehicle has no assigned dealer' });

    const vehicleName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
    const tdMeta = JSON.stringify({
      isTestDrive: true,
      vehicleId,
      vehicleName,
      scheduledDate,
      scheduledTime,
      contactPhone: contactPhone || null,
    });

    const booking = await Booking.create({
      userId:            req.user.id,
      serviceProviderId: dealerId,
      vehicleId,
      serviceType:       'other',
      title:             `Test Drive: ${vehicleName}`,
      description:       notes || `Test drive request for ${vehicleName}`,
      scheduledDate,
      scheduledTime,
      estimatedCost:     0,
      customerNotes:     `[TEST_DRIVE] ${tdMeta}`,
      status:            'pending',
      priority:          'normal',
    });

    // Notify dealer
    const customer = await User.findByPk(req.user.id, { attributes: ['firstName', 'lastName'] });
    sendNotification(
      dealerId, 'booking',
      '🔑 New Test Drive Request',
      `${customer.firstName} ${customer.lastName} wants to test-drive ${vehicleName} on ${new Date(scheduledDate).toLocaleDateString()}.`,
      { linkType: 'booking', linkId: booking.id, url: '/dealer/test-drives', io: getIo() }
    ).catch(() => {});

    res.status(201).json({
      success: true,
      message: 'Test drive scheduled! The dealer will confirm shortly.',
      data: {
        bookingId: booking.id, vehicleId, vehicleName,
        dealerName: vehicle.dealer ? `${vehicle.dealer.firstName} ${vehicle.dealer.lastName}` : 'Dealer',
        scheduledDate, scheduledTime,
        status: 'pending',
      },
    });
  } catch (err) {
    console.error('Test drive request error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ─── Dealer: update rental/test-drive status ──────────────────────────────────
// Valid transitions:
//   Rental:    pending → confirmed | cancelled
//              confirmed → ready_for_pickup | cancelled
//              ready_for_pickup → in_progress
//              in_progress → completed
//   Test drive: pending → confirmed | cancelled
//               confirmed → completed | cancelled
const RENTAL_STATUS_LABELS = {
  confirmed:      'Rental Confirmed',
  cancelled:      'Rental Cancelled',
  ready_for_pickup: 'Vehicle Ready for Pickup',
  in_progress:    'Rental Started',
  completed:      'Rental Completed',
};
const TD_STATUS_LABELS = {
  confirmed: 'Test Drive Confirmed',
  cancelled: 'Test Drive Cancelled',
  completed: 'Test Drive Completed',
};

router.patch('/:bookingId/status', [
  body('status').isIn(['confirmed', 'cancelled', 'in_progress', 'completed', 'ready_for_pickup']).withMessage('Invalid status'),
  body('providerNotes').optional().trim().isLength({ max: 500 }),
], authenticateToken, requireRole('dealer'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });

    const bookingId = parseInt(req.params.bookingId);
    if (isNaN(bookingId)) return res.status(400).json({ success: false, message: 'Invalid booking ID' });

    const booking = await Booking.findByPk(bookingId, {
      include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName'] }],
    });

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // Security: dealer can only update bookings for their own vehicles
    if (booking.serviceProviderId !== req.user.id)
      return res.status(403).json({ success: false, message: 'Access denied' });

    const isRental = isRentalBooking(booking);
    const newStatus = req.body.status;
    const updateData = { status: newStatus };

    // Map 'ready_for_pickup' to 'confirmed' in DB (re-use the confirmed enum value)
    // We store the full status meaning in providerNotes
    if (newStatus === 'ready_for_pickup') {
      updateData.status = 'confirmed';
      updateData.providerNotes = `[READY_FOR_PICKUP] ${req.body.providerNotes || ''}`;
    } else {
      if (req.body.providerNotes) updateData.providerNotes = req.body.providerNotes;
    }
    if (newStatus === 'completed') updateData.completedAt = new Date();
    if (newStatus === 'cancelled') updateData.cancelledAt = new Date();

    await booking.update(updateData);

    // Notify customer
    const labels = isRental ? RENTAL_STATUS_LABELS : TD_STATUS_LABELS;
    const notifTitle = labels[newStatus] || 'Booking Updated';
    const meta = isRental ? parseRentalMeta(booking.customerNotes) : {};
    const vehicleName = meta.vehicleName || booking.title;

    const statusMessages = {
      confirmed:        `Your ${isRental ? 'rental' : 'test drive'} for ${vehicleName} has been confirmed.`,
      cancelled:        `Your ${isRental ? 'rental' : 'test drive'} for ${vehicleName} has been cancelled by the dealer.`,
      ready_for_pickup: `Your rental vehicle ${vehicleName} is ready for pickup!`,
      in_progress:      `Your rental of ${vehicleName} is now active. Enjoy your ride!`,
      completed:        `Your rental of ${vehicleName} has been completed. Thank you!`,
    };

    if (booking.user) {
      sendNotification(
        booking.user.id, 'booking',
        notifTitle,
        statusMessages[newStatus] || notifTitle,
        {
          linkType: 'booking',
          linkId: booking.id,
          url: isRental ? '/my-rentals' : '/appointments',
          io: getIo(),
        }
      ).catch(() => {});
    }

    res.json({
      success: true,
      message: `Status updated to ${newStatus}`,
      data: bookingToRental(booking),
    });
  } catch (err) {
    console.error('Rental status update error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
