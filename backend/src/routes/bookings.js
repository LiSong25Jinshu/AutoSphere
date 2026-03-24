import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { authenticateToken, requireRole, requireProvider } from '../middleware/auth.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import Vehicle from '../models/Vehicle.js';
import { mockBookingService } from '../utils/mockData.js';
import UserVehicleInteraction from '../models/UserVehicleInteraction.js';

const router = express.Router();

// Helper function to check if database is available
const isDatabaseAvailable = async () => {
  try {
    await Booking.findOne({ limit: 1 });
    return true;
  } catch (error) {
    return false;
  }
};

// Get bookings for authenticated user
router.get('/', [
  query('status').optional().isIn(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
], authenticateToken, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    let whereClause = {};
    
    // Filter by user role
    if (req.user.role === 'user') {
      whereClause.userId = req.user.id;
    } else if (req.user.role === 'service_provider') {
      whereClause.serviceProviderId = req.user.id;
    } else {
      // For dealers and admins, show all bookings
    }

    if (req.query.status) {
      whereClause.status = req.query.status;
    }

    // Check if database is available
    const dbAvailable = await isDatabaseAvailable();
    
    if (!dbAvailable) {
      // Use mock data
      console.log('Using mock data for bookings');
      const bookings = await mockBookingService.findAll({
        where: whereClause,
        order: [['scheduledDate', 'DESC']],
        limit,
        offset,
      });

      const totalCount = await mockBookingService.count({ where: whereClause });

      return res.json({
        success: true,
        data: bookings,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        },
      });
    }

    const bookings = await Booking.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
        },
        {
          model: User,
          as: 'serviceProvider',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
        },
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'make', 'model', 'year', 'vin'],
        },
      ],
      order: [['scheduledDate', 'DESC']],
      limit,
      offset,
    });

    const totalCount = await Booking.count({ where: whereClause });

    res.json({
      success: true,
      data: bookings,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });

  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get booking by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    
    if (isNaN(bookingId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID'
      });
    }

    const booking = await Booking.findByPk(bookingId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
        },
        {
          model: User,
          as: 'serviceProvider',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
        },
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'make', 'model', 'year', 'vin'],
        },
      ],
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user has access to this booking
    const hasAccess = booking.userId === req.user.id || 
                     booking.serviceProviderId === req.user.id ||
                     req.user.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: booking,
    });

  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new booking
router.post('/', [
  body('serviceProviderId').isInt().withMessage('Service provider ID is required'),
  body('serviceType').isIn([
    'oil_change', 'brake_service', 'tire_service', 'engine_diagnostic',
    'transmission_service', 'air_conditioning', 'battery_service',
    'general_maintenance', 'inspection', 'repair', 'other'
  ]).withMessage('Invalid service type'),
  body('title').notEmpty().trim().isLength({ min: 5, max: 200 }),
  body('description').optional().trim(),
  body('scheduledDate').isISO8601().withMessage('Valid scheduled date is required'),
  body('scheduledTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time format required (HH:MM)'),
  body('vehicleId').optional().isInt(),
  body('estimatedDuration').optional().isInt({ min: 15, max: 480 }),
  body('customerNotes').optional().trim(),
], authenticateToken, async (req, res) => {
  try {
    console.log('=== BOOKING REQUEST DEBUG ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Request headers:', req.headers);
    console.log('User from auth:', req.user);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('=== VALIDATION ERRORS ===');
      console.log('Errors:', JSON.stringify(errors.array(), null, 2));
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    console.log('=== VALIDATION PASSED ===');
    // Check if database is available
    const dbAvailable = await isDatabaseAvailable();
    
    if (!dbAvailable) {
      // Use mock data
      console.log('Creating booking with mock data');
      const bookingData = {
        ...req.body,
        userId: req.user?.id || 4, // Default to test user
      };

      const booking = await mockBookingService.create(bookingData);

      return res.status(201).json({
        success: true,
        message: 'Booking created successfully',
        data: booking,
      });
    }

    // Verify service provider exists and has correct role
    const serviceProvider = await User.findByPk(req.body.serviceProviderId);
    if (!serviceProvider || serviceProvider.role !== 'service_provider') {
      return res.status(400).json({
        success: false,
        message: 'Invalid service provider'
      });
    }

    // Verify vehicle belongs to user if provided
    if (req.body.vehicleId) {
      const vehicle = await Vehicle.findByPk(req.body.vehicleId);
      if (!vehicle) {
        return res.status(400).json({
          success: false,
          message: 'Vehicle not found'
        });
      }
    }

    const bookingData = {
      ...req.body,
      userId: req.user.id,
    };

    const booking = await Booking.create(bookingData);

    // Log booking interaction for AI recommendations
    if (req.body.vehicleId) {
      await UserVehicleInteraction.create({
        userId: req.user.id,
        vehicleId: req.body.vehicleId,
        interactionType: 'booking'
      });
    }

    // Fetch the complete booking with associations
    const completeBooking = await Booking.findByPk(booking.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
        },
        {
          model: User,
          as: 'serviceProvider',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
        },
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'make', 'model', 'year', 'vin'],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: completeBooking,
    });

  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update booking status (service providers and users)
router.patch('/:id/status', [
  body('status').isIn(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']),
  body('providerNotes').optional().trim(),
  body('actualCost').optional().isFloat({ min: 0 }),
], authenticateToken, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const bookingId = parseInt(req.params.id);
    
    if (isNaN(bookingId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID'
      });
    }

    // Check if database is available
    const dbAvailable = await isDatabaseAvailable();
    
    if (!dbAvailable) {
      // Use mock data
      console.log('Updating booking status with mock data');
      const booking = await mockBookingService.findByPk(bookingId);

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      // Update booking
      const updateData = { status: req.body.status };
      
      if (req.body.providerNotes) {
        updateData.providerNotes = req.body.providerNotes;
      }
      
      if (req.body.actualCost) {
        updateData.actualCost = req.body.actualCost;
      }

      if (req.body.status === 'completed') {
        updateData.completedAt = new Date();
      } else if (req.body.status === 'cancelled') {
        updateData.cancelledAt = new Date();
      }

      const updatedBooking = await mockBookingService.update(bookingId, updateData);

      return res.json({
        success: true,
        message: 'Booking status updated successfully',
        data: updatedBooking,
      });
    }

    const booking = await Booking.findByPk(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check permissions
    const canUpdate = booking.userId === req.user.id || 
                     booking.serviceProviderId === req.user.id ||
                     req.user.role === 'admin';

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update booking
    const updateData = { status: req.body.status };
    
    if (req.body.providerNotes && booking.serviceProviderId === req.user.id) {
      updateData.providerNotes = req.body.providerNotes;
    }
    
    if (req.body.actualCost && booking.serviceProviderId === req.user.id) {
      updateData.actualCost = req.body.actualCost;
    }

    if (req.body.status === 'completed') {
      updateData.completedAt = new Date();
    } else if (req.body.status === 'cancelled') {
      updateData.cancelledAt = new Date();
    }

    await booking.update(updateData);

    res.json({
      success: true,
      message: 'Booking status updated successfully',
      data: booking,
    });

  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Add rating and review to completed booking
router.patch('/:id/review', [
  body('rating').isInt({ min: 1, max: 5 }),
  body('review').optional().trim().isLength({ max: 1000 }),
], authenticateToken, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const bookingId = parseInt(req.params.id);
    
    if (isNaN(bookingId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID'
      });
    }

    const booking = await Booking.findByPk(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Only the customer can add a review
    if (booking.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the customer can add a review'
      });
    }

    // Booking must be completed
    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only review completed bookings'
      });
    }

    await booking.update({
      rating: req.body.rating,
      review: req.body.review,
    });

    res.json({
      success: true,
      message: 'Review added successfully',
      data: booking,
    });

  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Reschedule booking
router.patch('/:id/reschedule', [
  body('scheduledDate').isISO8601().withMessage('Valid scheduled date is required'),
  body('scheduledTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time format required (HH:MM)'),
], authenticateToken, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const bookingId = parseInt(req.params.id);
    
    if (isNaN(bookingId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID'
      });
    }

    // Check if database is available
    const dbAvailable = await isDatabaseAvailable();
    
    if (!dbAvailable) {
      // Use mock data
      console.log('Rescheduling booking with mock data');
      const booking = await mockBookingService.findByPk(bookingId);

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      // Check if booking can be rescheduled
      if (!['pending', 'confirmed'].includes(booking.status)) {
        return res.status(400).json({
          success: false,
          message: 'Booking cannot be rescheduled'
        });
      }

      const updatedBooking = await mockBookingService.update(bookingId, {
        scheduledDate: req.body.scheduledDate,
        scheduledTime: req.body.scheduledTime
      });

      return res.json({
        success: true,
        message: 'Booking rescheduled successfully',
        data: updatedBooking,
      });
    }

    const booking = await Booking.findByPk(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if booking can be rescheduled
    if (!booking.canBeRescheduled()) {
      return res.status(400).json({
        success: false,
        message: 'Booking cannot be rescheduled'
      });
    }

    // Check permissions
    const canReschedule = booking.userId === req.user.id || 
                         booking.serviceProviderId === req.user.id ||
                         req.user.role === 'admin';

    if (!canReschedule) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await booking.reschedule(req.body.scheduledDate, req.body.scheduledTime);

    res.json({
      success: true,
      message: 'Booking rescheduled successfully',
      data: booking,
    });

  } catch (error) {
    console.error('Reschedule booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;