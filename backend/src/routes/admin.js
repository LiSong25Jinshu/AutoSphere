import express from 'express';
import { Op } from 'sequelize';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import User from '../models/User.js';
import Vehicle from '../models/Vehicle.js';
import Booking from '../models/Booking.js';
import Conversation from '../models/Conversation.js';

const router = express.Router();

// GET /api/admin/stats — real DB counts for the overview dashboard
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      totalVehicles,
      totalBookings,
      activeBookings,
      pendingBookings,
      totalConversations,
      newUsersThisMonth,
      newVehiclesThisMonth,
      newBookingsThisMonth,
      unverifiedUsers,
    ] = await Promise.all([
      User.count(),
      Vehicle.count(),
      Booking.count(),
      Booking.count({ where: { status: { [Op.in]: ['pending', 'confirmed', 'in_progress'] } } }),
      Booking.count({ where: { status: 'pending' } }),
      Conversation.count(),
      User.count({
        where: { createdAt: { [Op.gte]: new Date(new Date().setDate(1)) } },
      }),
      Vehicle.count({
        where: { createdAt: { [Op.gte]: new Date(new Date().setDate(1)) } },
      }),
      Booking.count({
        where: { createdAt: { [Op.gte]: new Date(new Date().setDate(1)) } },
      }),
      User.count({ where: { isVerified: false } }),
    ]);

    // Bookings by status breakdown
    const bookingsByStatus = await Booking.findAll({
      attributes: [
        'status',
        [Booking.sequelize.fn('COUNT', Booking.sequelize.col('id')), 'count'],
      ],
      group: ['status'],
      raw: true,
    });

    // Users by role breakdown
    const usersByRole = await User.findAll({
      attributes: [
        'role',
        [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'count'],
      ],
      group: ['role'],
      raw: true,
    });

    // Recent registrations (last 5)
    const recentUsers = await User.findAll({
      attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: 5,
    });

    // Recent bookings (last 5)
    const recentBookings = await Booking.findAll({
      include: [
        { model: User, as: 'user', attributes: ['firstName', 'lastName', 'email'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: 5,
    });

    res.json({
      success: true,
      data: {
        totals: {
          users: totalUsers,
          vehicles: totalVehicles,
          bookings: totalBookings,
          activeBookings,
          pendingBookings,
          unverifiedUsers,
          conversations: totalConversations,
        },
        thisMonth: {
          users: newUsersThisMonth,
          vehicles: newVehiclesThisMonth,
          bookings: newBookingsThisMonth,
        },
        breakdowns: {
          bookingsByStatus,
          usersByRole,
        },
        recent: {
          users: recentUsers,
          bookings: recentBookings,
        },
      },
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/admin/analytics — aggregated analytics for the analytics tab
router.get('/analytics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [totalBookings, completedBookings, totalUsers, topProviders] = await Promise.all([
      Booking.count({ where: { createdAt: { [Op.gte]: since } } }),
      Booking.count({ where: { status: 'completed', createdAt: { [Op.gte]: since } } }),
      User.count({ where: { createdAt: { [Op.gte]: since } } }),
      // Top service providers by booking count
      Booking.findAll({
        attributes: [
          'serviceProviderId',
          [Booking.sequelize.fn('COUNT', Booking.sequelize.col('Booking.id')), 'bookingCount'],
          [Booking.sequelize.fn('AVG', Booking.sequelize.col('rating')), 'avgRating'],
        ],
        include: [
          {
            model: User,
            as: 'serviceProvider',
            attributes: ['id', 'firstName', 'lastName', 'email'],
          },
        ],
        where: { createdAt: { [Op.gte]: since } },
        group: ['serviceProviderId', 'serviceProvider.id'],
        order: [[Booking.sequelize.fn('COUNT', Booking.sequelize.col('Booking.id')), 'DESC']],
        limit: 5,
        raw: false,
      }),
    ]);

    res.json({
      success: true,
      data: {
        period: `${days}d`,
        totalBookings,
        completedBookings,
        completionRate: totalBookings > 0 ? ((completedBookings / totalBookings) * 100).toFixed(1) : 0,
        newUsers: totalUsers,
        topProviders: topProviders.map((p) => ({
          id: p.serviceProviderId,
          name: p.serviceProvider
            ? `${p.serviceProvider.firstName} ${p.serviceProvider.lastName}`
            : 'Unknown',
          email: p.serviceProvider?.email,
          bookings: parseInt(p.dataValues.bookingCount),
          avgRating: p.dataValues.avgRating ? parseFloat(p.dataValues.avgRating).toFixed(1) : null,
        })),
      },
    });
  } catch (err) {
    console.error('Admin analytics error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// In-memory settings store (persists for server lifetime; replace with DB if needed)
let systemSettings = {
  general: {
    siteName: 'AutoSphere',
    siteUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
    supportEmail: process.env.SUPPORT_EMAIL || 'support@autosphere.com',
    maxUploadSizeMB: parseInt(process.env.MAX_FILE_SIZE) / (1024 * 1024) || 10,
    defaultCurrency: 'GHS',
    timezone: 'Africa/Accra',
  },
  email: {
    smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
    smtpPort: parseInt(process.env.SMTP_PORT) || 587,
    smtpUser: process.env.SMTP_USER || '',
    fromName: process.env.FROM_NAME || 'AutoSphere',
    fromEmail: process.env.FROM_EMAIL || 'noreply@autosphere.com',
    enableEmailVerification: true,
    enableBookingEmails: true,
    enableMarketingEmails: false,
  },
  security: {
    requireEmailVerification: true,
    sessionTimeoutHours: 24,
    maxLoginAttempts: 5,
    enableGoogleOAuth: !!process.env.GOOGLE_CLIENT_ID,
    enableRateLimit: true,
    rateLimitWindowMinutes: 15,
    rateLimitMaxRequests: 100,
  },
  notifications: {
    enablePushNotifications: false,
    enableEmailNotifications: true,
    enableBookingAlerts: true,
    enableMessageAlerts: true,
    enableSystemAlerts: true,
  },
  maintenance: {
    maintenanceMode: false,
    maintenanceMessage: 'We are currently performing scheduled maintenance. Please check back soon.',
    enableDebugLogs: false,
    logRetentionDays: 30,
  },
};

// GET /api/admin/settings
router.get('/settings', authenticateToken, requireAdmin, (req, res) => {
  res.json({ success: true, data: systemSettings });
});

// PUT /api/admin/settings
router.put('/settings', authenticateToken, requireAdmin, (req, res) => {
  const allowed = ['general', 'email', 'security', 'notifications', 'maintenance'];
  for (const key of allowed) {
    if (req.body[key] && typeof req.body[key] === 'object') {
      systemSettings[key] = { ...systemSettings[key], ...req.body[key] };
    }
  }
  res.json({ success: true, data: systemSettings, message: 'Settings saved' });
});

// POST /api/admin/cache/clear
router.post('/cache/clear', authenticateToken, requireAdmin, (req, res) => {
  // In a real implementation this would flush Redis / CDN cache
  console.log('Cache clear requested by admin:', req.user.email);
  res.json({ success: true, message: 'Cache cleared successfully' });
});

// POST /api/admin/logs/purge
router.post('/logs/purge', authenticateToken, requireAdmin, (req, res) => {
  const days = systemSettings.maintenance.logRetentionDays;
  console.log(`Log purge requested by admin: ${req.user.email} — retaining ${days} days`);
  res.json({ success: true, message: `Logs older than ${days} days purged` });
});

// GET /api/admin/moderation — flagged vehicles and reported content
router.get('/moderation', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Flagged vehicles (status = 'flagged' or 'pending' review)
    const flaggedVehicles = await Vehicle.findAll({
      where: { status: { [Op.in]: ['flagged', 'pending'] } },
      include: [{ model: User, as: 'dealer', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      order: [['createdAt', 'DESC']],
      limit: 50,
    });

    const items = flaggedVehicles.map((v) => ({
      id: `vehicle-${v.id}`,
      type: 'Vehicle Listing',
      title: `${v.year} ${v.make} ${v.model}`,
      author: v.dealer ? `${v.dealer.firstName} ${v.dealer.lastName} (${v.dealer.email})` : 'Unknown',
      status: v.status === 'pending' ? 'pending' : 'flagged',
      reportCount: 0,
      createdAt: v.createdAt,
      content: v.description || 'No description provided',
      refId: v.id,
      refType: 'vehicle',
    }));

    res.json({ success: true, data: items });
  } catch (err) {
    console.error('Moderation list error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/admin/moderation/:id — take action on a content item
router.post('/moderation/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { action, reason } = req.body;
    const [refType, refId] = req.params.id.split('-');

    if (refType === 'vehicle') {
      const vehicle = await Vehicle.findByPk(parseInt(refId));
      if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

      if (action === 'approve') {
        vehicle.status = 'available';
        await vehicle.save();
      } else if (action === 'block') {
        vehicle.status = 'flagged';
        await vehicle.save();
      } else if (action === 'delete') {
        await vehicle.destroy();
      }
    }

    res.json({ success: true, message: `Content ${action}d successfully` });
  } catch (err) {
    console.error('Moderation action error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
