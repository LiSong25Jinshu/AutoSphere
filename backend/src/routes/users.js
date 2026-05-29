import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { Op } from 'sequelize';
import { authenticateToken, requireRole, requireAdmin } from '../middleware/auth.js';
import User from '../models/User.js';
import { hashPassword } from '../utils/password.js';
import Booking from '../models/Booking.js';

const router = express.Router();

// GET /api/users/stats — stats for the authenticated user
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [totalBookings, completedBookings, ratingData] = await Promise.all([
      Booking.count({ where: { userId } }),
      Booking.count({ where: { userId, status: 'completed' } }),
      Booking.findOne({
        where: { userId, rating: { [Op.ne]: null } },
        attributes: [
          [Booking.sequelize.fn('AVG', Booking.sequelize.col('rating')), 'avgRating'],
          [Booking.sequelize.fn('COUNT', Booking.sequelize.col('rating')), 'ratingCount'],
        ],
        raw: true,
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalBookings,
        completedBookings,
        avgRating: ratingData?.avgRating ? parseFloat(ratingData.avgRating).toFixed(1) : null,
        ratingCount: parseInt(ratingData?.ratingCount || 0),
      },
    });
  } catch (err) {
    console.error('User stats error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user.toJSON(),
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update user profile
router.put('/profile', [
  body('firstName').optional().trim().isLength({ min: 2, max: 100 }),
  body('lastName').optional().trim().isLength({ min: 2, max: 100 }),
  body('phone').optional({ checkFalsy: true }).trim().isLength({ min: 7, max: 20 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('address').optional().trim().isLength({ max: 255 }),
  body('city').optional().trim().isLength({ max: 100 }),
  body('state').optional().trim().isLength({ max: 100 }),
  body('zipCode').optional().trim().isLength({ max: 20 }),
  body('bio').optional().trim().isLength({ max: 1000 }),
  body('dateOfBirth').optional().isISO8601().withMessage('Invalid date format'),
  // Business fields (service providers & dealers)
  body('businessName').optional().trim().isLength({ max: 200 }),
  body('businessType').optional().trim().isLength({ max: 100 }),
  body('businessDescription').optional().trim().isLength({ max: 2000 }),
], authenticateToken, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg || 'Validation failed',
        errors: errors.array()
      });
    }

    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if email is being changed and if it's already taken
    if (req.body.email && req.body.email !== user.email) {
      const existingUser = await User.findByEmail(req.body.email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email already in use'
        });
      }
    }

    // Update allowed fields — includes business fields for service providers & dealers
    const allowedFields = [
      'firstName', 'lastName', 'phone', 'email',
      'address', 'city', 'state', 'zipCode', 'bio', 'dateOfBirth',
      'businessName', 'businessType', 'businessDescription',
    ];
    const updateData = {};
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        // Treat empty string as null for optional fields
        updateData[field] = req.body[field] === '' ? null : req.body[field];
      }
    });

    await user.update(updateData);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user.toJSON(),
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Change password
router.patch('/change-password', [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
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

    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isValidPassword = await user.validatePassword(req.body.currentPassword);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    await user.setPassword(req.body.newPassword);
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully',
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all users (admin only)
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('role').optional().isIn(['user', 'dealer', 'service_provider', 'admin']),
  query('search').optional().trim(),
], authenticateToken, requireAdmin, async (req, res) => {
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

    const whereClause = {};
    
    if (req.query.role) {
      whereClause.role = req.query.role;
    }

    if (req.query.search) {
      const searchTerm = `%${req.query.search}%`;
      whereClause[Op.or] = [
        { firstName: { [Op.iLike]: searchTerm } },
        { lastName: { [Op.iLike]: searchTerm } },
        { email: { [Op.iLike]: searchTerm } },
      ];
    }

    const users = await User.findAll({
      where: whereClause,
      attributes: { exclude: ['passwordHash'] },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    const totalCount = await User.count({ where: whereClause });

    res.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user by ID (admin only)
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const user = await User.findByPk(userId, {
      attributes: { exclude: ['passwordHash'] },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user,
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update user role (admin only)
router.patch('/:id/role', [
  body('role').isIn(['user', 'dealer', 'service_provider', 'admin']),
], authenticateToken, requireAdmin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from changing their own role
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own role'
      });
    }

    await user.update({ role: req.body.role });

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: user.toJSON(),
    });

  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Deactivate/activate user (admin only)
router.patch('/:id/status', [
  body('isActive').isBoolean(),
], authenticateToken, requireAdmin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from deactivating themselves
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own status'
      });
    }

    await user.update({ isActive: req.body.isActive });

    res.json({
      success: true,
      message: `User ${req.body.isActive ? 'activated' : 'deactivated'} successfully`,
      data: user.toJSON(),
    });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Search users — any authenticated user can search to start a conversation
router.get('/search', [
  query('q').optional().trim(),
  query('limit').optional().isInt({ min: 1, max: 20 }),
], authenticateToken, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const q = req.query.q || '';
    const limit = parseInt(req.query.limit) || 10;

    if (q.trim().length < 2) {
      return res.json({ success: true, data: [] });
    }

    const searchTerm = `%${q.trim()}%`;
    const users = await User.findAll({
      where: {
        isActive: true,
        id: { [Op.ne]: req.user.id }, // exclude self
        [Op.or]: [
          { firstName: { [Op.iLike]: searchTerm } },
          { lastName: { [Op.iLike]: searchTerm } },
          { email: { [Op.iLike]: searchTerm } },
        ],
      },
      attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
      order: [['firstName', 'ASC']],
      limit,
    });

    res.json({ success: true, data: users });
  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get service providers (public endpoint for booking)
router.get('/service-providers/list', async (req, res) => {
  try {
    const serviceProviders = await User.findAll({
      where: { 
        role: 'service_provider',
        isVerified: true,
      },
      attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
      order: [['firstName', 'ASC']],
    });

    res.json({
      success: true,
      data: serviceProviders,
    });

  } catch (error) {
    console.error('Get service providers error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;