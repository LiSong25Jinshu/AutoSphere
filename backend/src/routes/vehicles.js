import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { Op } from 'sequelize';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken, requireRole, optionalAuth } from '../middleware/auth.js';
import Vehicle from '../models/Vehicle.js';
import User from '../models/User.js';
import UserVehicleInteraction from '../models/UserVehicleInteraction.js';
import { mockVehicleService } from '../utils/mockData.js';

const router = express.Router();

// ─── Multer setup for vehicle photo uploads ───────────────────────────────────
const UPLOAD_DIR = process.env.UPLOAD_PATH || 'uploads/vehicles';
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `vehicle-${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase()) &&
               allowed.test(file.mimetype);
    ok ? cb(null, true) : cb(new Error('Only JPEG, PNG and WebP images are allowed'));
  },
});

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
  query('minMileage').optional().isInt({ min: 0 }),
  query('maxMileage').optional().isInt({ min: 0 }),
  query('condition').optional().isIn(['new', 'used', 'certified_pre_owned']),
  query('fuelType').optional().isIn(['gasoline', 'diesel', 'hybrid', 'electric', 'plug_in_hybrid']),
  query('transmission').optional().isIn(['manual', 'automatic', 'cvt']),
  query('bodyType').optional().isIn(['sedan', 'suv', 'hatchback', 'coupe', 'convertible', 'truck', 'van', 'wagon']),
  query('color').optional().isString().trim(),
  query('featured').optional().isBoolean(),
  query('search').optional().isString().trim(),
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
      minYear: req.query.minYear ? parseInt(req.query.minYear) : undefined,
      maxYear: req.query.maxYear ? parseInt(req.query.maxYear) : undefined,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : undefined,
      minMileage: req.query.minMileage ? parseInt(req.query.minMileage) : undefined,
      maxMileage: req.query.maxMileage ? parseInt(req.query.maxMileage) : undefined,
      condition: req.query.condition,
      fuelType: req.query.fuelType,
      transmission: req.query.transmission,
      bodyType: req.query.bodyType,
      color: req.query.color,
      search: req.query.search,
      limit,
      offset,
    };

    let vehicles;
    let totalCount;

    try {
      // Try to use database first
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
      totalCount = await Vehicle.count({
        where: { status: 'available' }
      });
    } catch (dbError) {
      console.log('Database not available, using mock data:', dbError.message);
      
      // Use mock data as fallback
      if (req.query.featured === 'true') {
        vehicles = await mockVehicleService.findFeatured({ limit, offset });
      } else {
        vehicles = await mockVehicleService.searchVehicles(searchParams);
      }
      
      totalCount = await mockVehicleService.count({ where: { status: 'available' } });
    }

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

// Get search suggestions (autocomplete)
router.get('/suggestions', [
  query('q').notEmpty().trim().withMessage('Query parameter q is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const searchQuery = req.query.q.toLowerCase();
    const suggestions = {
      makes: [],
      models: [],
      keywords: []
    };

    try {
      // Get unique makes and models from database
      const vehicles = await Vehicle.findAll({
        attributes: ['make', 'model'],
        where: {
          status: 'available',
          [Op.or]: [
            { make: { [Op.iLike]: `%${searchQuery}%` } },
            { model: { [Op.iLike]: `%${searchQuery}%` } }
          ]
        },
        limit: 20,
        raw: true
      });

      // Extract unique makes and models
      const makesSet = new Set();
      const modelsSet = new Set();

      vehicles.forEach(v => {
        if (v.make.toLowerCase().includes(searchQuery)) {
          makesSet.add(v.make);
        }
        if (v.model.toLowerCase().includes(searchQuery)) {
          modelsSet.add(v.model);
        }
      });

      suggestions.makes = Array.from(makesSet).slice(0, 5);
      suggestions.models = Array.from(modelsSet).slice(0, 5);

      // Add common keywords
      const keywords = ['sedan', 'suv', 'truck', 'hybrid', 'electric', 'automatic', 'manual'];
      suggestions.keywords = keywords.filter(k => k.includes(searchQuery)).slice(0, 5);

    } catch (dbError) {
      console.log('Database not available for suggestions:', dbError.message);
      // Return empty suggestions if database is not available
    }

    res.json({
      success: true,
      data: suggestions
    });

  } catch (error) {
    console.error('Get suggestions error:', error);
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

    let vehicle;
    
    try {
      // Try database first
      vehicle = await Vehicle.findByPk(vehicleId, {
        include: [{
          model: User,
          as: 'dealer',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
        }],
      });

      if (vehicle) {
        // Increment view count
        await vehicle.incrementViewCount();
      }
    } catch (dbError) {
      console.log('Database not available, using mock data:', dbError.message);
      // Use mock data as fallback
      vehicle = await mockVehicleService.findByPk(vehicleId);
    }

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Increment view count
    await vehicle.incrementViewCount();

    // Log the view interaction for AI recommendations
    if (req.user?.id) {
      await UserVehicleInteraction.create({
        userId: req.user.id,
        vehicleId: vehicleId,
        interactionType: 'view'
      });
    }

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

// GET /api/vehicles/my — fetch only the authenticated dealer's vehicles
router.get('/my', authenticateToken, requireRole('dealer'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const offset = (page - 1) * limit;

    const [vehicles, total] = await Promise.all([
      Vehicle.findAll({
        where: { dealerId: req.user.id },
        order: [['createdAt', 'DESC']],
        limit,
        offset,
      }),
      Vehicle.count({ where: { dealerId: req.user.id } }),
    ]);

    res.json({
      success: true,
      data: vehicles,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('Get my vehicles error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/vehicles/dealer/stats — real stats for the authenticated dealer
router.get('/dealer/stats', authenticateToken, requireRole('dealer'), async (req, res) => {
  try {
    const dealerId = req.user.id;
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [
      totalInventory,
      availableVehicles,
      soldThisMonth,
      totalViews,
    ] = await Promise.all([
      Vehicle.count({ where: { dealerId } }),
      Vehicle.count({ where: { dealerId, status: 'available' } }),
      Vehicle.count({ where: { dealerId, status: 'sold', updatedAt: { [Op.gte]: startOfMonth } } }),
      Vehicle.sum('viewCount', { where: { dealerId } }),
    ]);

    // Top performing vehicles by views
    const topVehicles = await Vehicle.findAll({
      where: { dealerId },
      attributes: ['id', 'make', 'model', 'year', 'price', 'viewCount', 'status'],
      order: [['viewCount', 'DESC']],
      limit: 5,
    });

    // New vehicles added this month
    const newThisMonth = await Vehicle.count({
      where: { dealerId, createdAt: { [Op.gte]: startOfMonth } },
    });

    res.json({
      success: true,
      data: {
        totalInventory,
        availableVehicles,
        soldThisMonth,
        totalViews: totalViews || 0,
        newThisMonth,
        topVehicles: topVehicles.map(v => ({
          id: v.id,
          model: `${v.year} ${v.make} ${v.model}`,
          views: v.viewCount || 0,
          price: `$${Number(v.price).toLocaleString()}`,
          status: v.status,
        })),
      },
    });
  } catch (err) {
    console.error('Dealer stats error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
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

// POST /api/vehicles/:id/photos — upload up to 10 photos for a vehicle
router.post('/:id/photos', authenticateToken, requireRole('dealer'), upload.array('photos', 10), async (req, res) => {
  try {
    const vehicleId = parseInt(req.params.id);
    if (isNaN(vehicleId)) {
      return res.status(400).json({ success: false, message: 'Invalid vehicle ID' });
    }

    const vehicle = await Vehicle.findByPk(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }
    if (vehicle.dealerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only upload photos for your own vehicles' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5001}`;
    const newUrls = req.files.map((f) => `${baseUrl}/uploads/vehicles/${f.filename}`);
    const existing = Array.isArray(vehicle.images) ? vehicle.images : [];
    const images = [...existing, ...newUrls].slice(0, 20); // cap at 20 total

    await vehicle.update({ images });

    res.json({ success: true, data: { images }, message: `${req.files.length} photo(s) uploaded` });
  } catch (err) {
    console.error('Photo upload error:', err);
    if (err.message?.includes('Only JPEG')) {
      return res.status(400).json({ success: false, message: err.message });
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /api/vehicles/:id/photos — remove a photo by URL
router.delete('/:id/photos', authenticateToken, requireRole('dealer'), async (req, res) => {
  try {
    const vehicleId = parseInt(req.params.id);
    const { url } = req.body;

    if (!url) return res.status(400).json({ success: false, message: 'Photo URL is required' });

    const vehicle = await Vehicle.findByPk(vehicleId);
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    if (vehicle.dealerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const images = (vehicle.images || []).filter((img) => img !== url);
    await vehicle.update({ images });

    // Try to delete the file from disk
    try {
      const filename = url.split('/uploads/vehicles/').pop();
      if (filename) {
        const filePath = path.join(UPLOAD_DIR, filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    } catch (_) { /* ignore disk errors */ }

    res.json({ success: true, data: { images } });
  } catch (err) {
    console.error('Delete photo error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;