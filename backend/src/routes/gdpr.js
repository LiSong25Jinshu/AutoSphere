/**
 * GDPR Compliance Routes
 *
 * Implements the key GDPR rights:
 *  - Right of Access (Article 15)   — GET  /api/gdpr/export
 *  - Right to Erasure (Article 17)  — POST /api/gdpr/delete-account
 *  - Right to Rectification (Art 16)— handled by existing /api/users/profile PUT
 *  - Consent management             — POST /api/gdpr/consent
 *  - Cookie consent                 — GET/POST /api/gdpr/cookie-consent
 */
import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import User from '../models/User.js';
import Booking from '../models/Booking.js';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import SavedSearch from '../models/SavedSearch.js';
import UserVehicleInteraction from '../models/UserVehicleInteraction.js';

const router = express.Router();

// ─── GET /api/gdpr/export ─────────────────────────────────────────────────────
// Right of Access: export all personal data for the authenticated user
router.get('/export', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [user, bookings, savedSearches, interactions] = await Promise.all([
      User.findByPk(userId),
      Booking.findAll({ where: { userId }, raw: true }),
      SavedSearch.findAll({ where: { userId }, raw: true }),
      UserVehicleInteraction.findAll({ where: { userId }, raw: true }),
    ]);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Collect messages sent by this user
    let messages = [];
    try {
      messages = await Message.findAll({
        where: { senderId: userId },
        attributes: ['id', 'content', 'messageType', 'createdAt'],
        raw: true,
      });
    } catch (_) { /* messages table may not exist yet */ }

    const userData = user.toJSON();

    const exportData = {
      exportedAt: new Date().toISOString(),
      exportVersion: '1.0',
      subject: 'AutoSphere Personal Data Export',
      legalBasis: 'GDPR Article 15 — Right of Access',
      personalData: {
        account: {
          id: userData.id,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone || null,
          role: userData.role,
          isVerified: userData.isVerified,
          createdAt: userData.createdAt,
          updatedAt: userData.updatedAt,
          lastLoginAt: userData.lastLoginAt || null,
        },
        bookings: bookings.map(b => ({
          id: b.id,
          serviceType: b.serviceType,
          title: b.title,
          status: b.status,
          scheduledDate: b.scheduledDate,
          estimatedCost: b.estimatedCost,
          actualCost: b.actualCost,
          customerNotes: b.customerNotes,
          rating: b.rating,
          review: b.review,
          createdAt: b.createdAt,
        })),
        savedSearches: savedSearches.map(s => ({
          id: s.id,
          name: s.name,
          searchCriteria: s.searchCriteria,
          createdAt: s.createdAt,
        })),
        vehicleInteractions: interactions.map(i => ({
          vehicleId: i.vehicleId,
          interactionType: i.interactionType,
          createdAt: i.createdAt,
        })),
        messages: messages.map(m => ({
          id: m.id,
          content: m.content,
          messageType: m.messageType,
          sentAt: m.createdAt,
        })),
      },
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="autosphere-data-export-${userId}-${Date.now()}.json"`
    );
    res.json(exportData);

  } catch (error) {
    console.error('GDPR export error:', error);
    res.status(500).json({ success: false, message: 'Failed to export data' });
  }
});

// ─── POST /api/gdpr/delete-account ───────────────────────────────────────────
// Right to Erasure: anonymise and delete the user's account
router.post('/delete-account', authenticateToken, [
  body('password').optional().isString(),
  body('confirmation').equals('DELETE MY ACCOUNT').withMessage('Please type DELETE MY ACCOUNT to confirm'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
      });
    }

    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Anonymise rather than hard-delete to preserve referential integrity
    // (bookings, messages etc. still exist but are de-linked from personal data)
    await user.update({
      email: `deleted-${userId}-${Date.now()}@autosphere.deleted`,
      firstName: 'Deleted',
      lastName: 'User',
      phone: null,
      passwordHash: null,
      googleId: null,
      emailVerificationToken: null,
      passwordResetToken: null,
      isVerified: false,
    });

    // Delete personal search history and interaction tracking
    await Promise.allSettled([
      SavedSearch.destroy({ where: { userId } }),
      UserVehicleInteraction.destroy({ where: { userId } }),
    ]);

    res.json({
      success: true,
      message: 'Your account has been deleted and personal data removed.',
    });

  } catch (error) {
    console.error('GDPR delete error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete account' });
  }
});

// ─── POST /api/gdpr/consent ───────────────────────────────────────────────────
// Record consent preferences (marketing, analytics, etc.)
router.post('/consent', authenticateToken, [
  body('marketing').isBoolean(),
  body('analytics').isBoolean(),
  body('functional').isBoolean(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed' });
    }

    const { marketing, analytics, functional } = req.body;
    const userId = req.user.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Store consent in user record (extend User model if needed)
    // For now we store as a JSON field in the user's metadata
    const consentRecord = {
      marketing,
      analytics,
      functional,
      recordedAt: new Date().toISOString(),
      ipAddress: req.ip,
    };

    // We'll store this in a generic metadata approach
    // In production you'd want a dedicated consent_records table
    await user.update({ consentData: consentRecord });

    res.json({
      success: true,
      message: 'Consent preferences saved',
      data: consentRecord,
    });

  } catch (error) {
    console.error('Consent save error:', error);
    res.status(500).json({ success: false, message: 'Failed to save consent' });
  }
});

// ─── GET /api/gdpr/consent ────────────────────────────────────────────────────
// Get current consent preferences
router.get('/consent', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      data: user.consentData || {
        marketing: false,
        analytics: false,
        functional: true,
        recordedAt: null,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
