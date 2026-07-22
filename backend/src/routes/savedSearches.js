import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import SavedSearch from '../models/SavedSearch.js';

const router = express.Router();

// Get all saved searches for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const savedSearches = await SavedSearch.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: savedSearches,
    });
  } catch (error) {
    console.error('Get saved searches error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Create new saved search
router.post('/', [
  body('name').notEmpty().trim().isLength({ min: 1, max: 100 }),
  body('searchCriteria').isObject(),
  body('notificationsEnabled').optional().isBoolean(),
], authenticateToken, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const savedSearch = await SavedSearch.create({
      userId: req.user.id,
      name: req.body.name,
      searchCriteria: req.body.searchCriteria,
      notificationsEnabled: req.body.notificationsEnabled || false,
    });

    res.status(201).json({
      success: true,
      data: savedSearch,
      message: 'Search saved successfully',
    });
  } catch (error) {
    console.error('Create saved search error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Update saved search
router.put('/:id', [
  body('name').optional().trim().isLength({ min: 1, max: 100 }),
  body('searchCriteria').optional().isObject(),
  body('notificationsEnabled').optional().isBoolean(),
], authenticateToken, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const savedSearch = await SavedSearch.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!savedSearch) {
      return res.status(404).json({
        success: false,
        message: 'Saved search not found',
      });
    }

    await savedSearch.update({
      name: req.body.name || savedSearch.name,
      searchCriteria: req.body.searchCriteria || savedSearch.searchCriteria,
      notificationsEnabled: req.body.notificationsEnabled !== undefined 
        ? req.body.notificationsEnabled 
        : savedSearch.notificationsEnabled,
    });

    res.json({
      success: true,
      data: savedSearch,
      message: 'Search updated successfully',
    });
  } catch (error) {
    console.error('Update saved search error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Delete saved search
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const savedSearch = await SavedSearch.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!savedSearch) {
      return res.status(404).json({
        success: false,
        message: 'Saved search not found',
      });
    }

    await savedSearch.destroy();

    res.json({
      success: true,
      message: 'Search deleted successfully',
    });
  } catch (error) {
    console.error('Delete saved search error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

export default router;
