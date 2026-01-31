import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { authenticateToken, requireRole, optionalAuth } from '../middleware/auth.js';
import Vehicle from '../models/Vehicle.js';
import User from '../models/User.js';

const router = express.Router();

// Get all vehicles with search and filtering
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('make').optional().isString().trim(),
  query('model').optional().isString().trim(),
  query('minYear').optional().isInt({ min: 1900 }),
  query('maxYear').optional().isInt({ max: new Date().getFullYear() + 2 }),
  query('minPrice').optional().isFloat({ min: 0 }),
  query('maxPrice').optional().isFloat({ min: 0 }),
  query('condition').optional().isIn(['new', 'used', 'certified_pre_owned']),
  query('fuelType').optional().isIn(['gasoline', 'diesel', 'hybrid', 'electric', 'plug_in_hybrid']),
  query('bodyType').optional().isIn(['sedan', 'suv', 'hatchback', 'coupe', 'convertible', 'truck', 'van', 'wagon']),
  query('featured').optional().isBoolean(),
], optionalAuth, async (req, res) => {
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

    const searchParams = {
      make: req.query.make,
      model: req.query.model,
      minYear: req.query.minYear,
      maxYear: req.query.maxYear,
      minPrice: req.query.minPrice,
      maxPrice: req.query.maxPrice,
      condition: req.query.condition,
      fuelType: req.query.fuelType,
      bodyType: req.query.bodyType,
      limit,
      offset,
    };

    let vehicles;
    if (req.query.featured === 'true') {
      vehicles = await Vehicle.findFeatured({
        include: [{
          model: User,
          as: 'dealer',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
        }],
        limit,
        offset,
      });
    } else {
      vehicles = await Vehicle.searchVehicles(searchParams);
      
      // Include dealer information
      for (let vehicle of vehicles) {
        const dealer = await User.findByPk(vehicle.dealerId, {
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
        });
        vehicle.dataValues.dealer = dealer;
      }
    }

    // Get total count for pagination
    const totalCount = await Vehicle.count({
      where: { status: 'available' }
    });

    res.json({
      success: true,
      data: vehicles,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });

  } catch (error) {
    console.error('Get vehicles error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get vehicle by ID
router.get('/:id', async (req, res) => {
  try {
    const vehicleId = parseInt(req.params.id);
    
    if (isNaN(vehicleId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle ID'
      });
    }

    const vehicle = await Vehicle.findByPk(vehicleId, {
      include: [{
        model: User,
        as: 'dealer',
        attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
      }],
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Increment view count
    await vehicle.incrementViewCount();

    res.json({
      success: true,
      data: vehicle,
    });

  } catch (error) {
    console.error('Get vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new vehicle (dealers only)
router.post('/', [
  body('make').notEmpty().trim().isLength({ min: 1, max: 50 }),
  body('model').notEmpty().trim().isLength({ min: 1, max: 50 }),
  body('year').isInt({ min: 1900, max: new Date().getFullYear() + 2 }),
  body('price').isFloat({ min: 0 }),
  body('condition').isIn(['new', 'used', 'certified_pre_owned']),
  body('fuelType').isIn(['gasoline', 'diesel', 'hybrid', 'electric', 'plug_in_hybrid']),
  body('transmission').isIn(['manual', 'automatic', 'cvt']),
  body('bodyType').isIn(['sedan', 'suv', 'hatchback', 'coupe', 'convertible', 'truck', 'van', 'wagon']),
  body('mileage').optional().isInt({ min: 0 }),
  body('color').optional().trim().isLength({ max: 30 }),
  body('vin').optional().isLength({ min: 17, max: 17 }),
  body('description').optional().trim(),
  body('features').optional().isArray(),
  body('images').optional().isArray(),
], authenticateToken, requireRole('dealer'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const vehicleData = {
      ...req.body,
      dealerId: req.user.id,
    };

    const vehicle = await Vehicle.create(vehicleData);

    res.status(201).json({
      success: true,
      message: 'Vehicle created successfully',
      data: vehicle,
    });

  } catch (error) {
    console.error('Create vehicle error:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'Vehicle with this VIN already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update vehicle (dealer who owns it only)
router.put('/:id', [
  body('make').optional().trim().isLength({ min: 1, max: 50 }),
  body('model').optional().trim().isLength({ min: 1, max: 50 }),
  body('year').optional().isInt({ min: 1900, max: new Date().getFullYear() + 2 }),
  body('price').optional().isFloat({ min: 0 }),
  body('condition').optional().isIn(['new', 'used', 'certified_pre_owned']),
  body('fuelType').optional().isIn(['gasoline', 'diesel', 'hybrid', 'electric', 'plug_in_hybrid']),
  body('transmission').optional().isIn(['manual', 'automatic', 'cvt']),
  body('bodyType').optional().isIn(['sedan', 'suv', 'hatchback', 'coupe', 'convertible', 'truck', 'van', 'wagon']),
  body('status').optional().isIn(['available', 'sold', 'pending', 'reserved']),
], authenticateToken, requireRole('dealer'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const vehicleId = parseInt(req.params.id);
    
    if (isNaN(vehicleId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle ID'
      });
    }

    const vehicle = await Vehicle.findByPk(vehicleId);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Check if the dealer owns this vehicle
    if (vehicle.dealerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own vehicles'
      });
    }

    await vehicle.update(req.body);

    res.json({
      success: true,
      message: 'Vehicle updated successfully',
      data: vehicle,
    });

  } catch (error) {
    console.error('Update vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete vehicle (dealer who owns it only)
router.delete('/:id', authenticateToken, requireRole('dealer'), async (req, res) => {
  try {
    const vehicleId = parseInt(req.params.id);
    
    if (isNaN(vehicleId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle ID'
      });
    }

    const vehicle = await Vehicle.findByPk(vehicleId);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Check if the dealer owns this vehicle
    if (vehicle.dealerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own vehicles'
      });
    }

    await vehicle.destroy();

    res.json({
      success: true,
      message: 'Vehicle deleted successfully',
    });

  } catch (error) {
    console.error('Delete vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get vehicles by dealer
router.get('/dealer/:dealerId', async (req, res) => {
  try {
    const dealerId = parseInt(req.params.dealerId);
    
    if (isNaN(dealerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid dealer ID'
      });
    }

    const vehicles = await Vehicle.findByDealer(dealerId, {
      include: [{
        model: User,
        as: 'dealer',
        attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
      }],
    });

    res.json({
      success: true,
      data: vehicles,
    });

  } catch (error) {
    console.error('Get dealer vehicles error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;