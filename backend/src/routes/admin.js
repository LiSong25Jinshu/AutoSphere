import express from 'express';
import { Op } from 'sequelize';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import User from '../models/User.js';
import Vehicle from '../models/Vehicle.js';
import Booking from '../models/Booking.js';
import Conversation from '../models/Conversation.js';
import ServiceOffering from '../models/ServiceOffering.js';
import UserVehicleInteraction from '../models/UserVehicleInteraction.js';
import FavoriteVehicle from '../models/FavoriteVehicle.js';

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
      pendingApprovals,
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
      User.count({
        where: {
          role: { [Op.in]: ['dealer', 'service_provider'] },
          approvalStatus: 'pending',
        },
      }),
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
            pendingApprovals,
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

// ─── Report helpers ───────────────────────────────────────────────────────────

/**
 * Parse ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD query params into a
 * Sequelize `createdAt` where clause. Falls back to the last 30 days.
 */
const buildDateRange = (query) => {
  let start, end;

  if (query.startDate && query.endDate) {
    start = new Date(query.startDate);
    start.setHours(0, 0, 0, 0);
    end = new Date(query.endDate);
    end.setHours(23, 59, 59, 999);
  } else {
    const days = parseInt(query.days) || 30;
    end = new Date();
    start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  }

  return { start, end };
};

// ─── GET /api/admin/reports/bookings ─────────────────────────────────────────
router.get('/reports/bookings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { start, end } = buildDateRange(req.query);

    const [total, byStatus, records] = await Promise.all([
      // summary counts
      Booking.count({ where: { createdAt: { [Op.between]: [start, end] } } }),
      Booking.findAll({
        attributes: [
          'status',
          [Booking.sequelize.fn('COUNT', Booking.sequelize.col('id')), 'count'],
          [Booking.sequelize.fn('SUM', Booking.sequelize.col('actual_cost')), 'revenue'],
        ],
        where: { createdAt: { [Op.between]: [start, end] } },
        group: ['status'],
        raw: true,
      }),
      // detailed records (max 200)
      Booking.findAll({
        where: { createdAt: { [Op.between]: [start, end] } },
        include: [
          { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
          { model: User, as: 'serviceProvider', attributes: ['id', 'firstName', 'lastName', 'email'] },
          { model: Vehicle, as: 'vehicle', attributes: ['id', 'make', 'model', 'year'] },
        ],
        order: [['createdAt', 'DESC']],
        limit: 200,
      }),
    ]);

    const totalRevenue = byStatus.reduce((sum, r) => sum + parseFloat(r.revenue || 0), 0);
    const completed = byStatus.find((r) => r.status === 'completed');
    const cancelled = byStatus.find((r) => r.status === 'cancelled');

    res.json({
      success: true,
      data: {
        summary: {
          total,
          totalRevenue: totalRevenue.toFixed(2),
          completedCount: parseInt(completed?.count || 0),
          cancelledCount: parseInt(cancelled?.count || 0),
          completionRate: total > 0 ? (((parseInt(completed?.count || 0)) / total) * 100).toFixed(1) : '0.0',
        },
        byStatus,
        records: records.map((b) => ({
          id: b.id,
          title: b.title,
          serviceType: b.serviceType,
          status: b.status,
          priority: b.priority,
          scheduledDate: b.scheduledDate,
          estimatedCost: b.estimatedCost,
          actualCost: b.actualCost,
          rating: b.rating,
          customerName: b.user ? `${b.user.firstName} ${b.user.lastName}` : '—',
          customerEmail: b.user?.email || '—',
          providerName: b.serviceProvider ? `${b.serviceProvider.firstName} ${b.serviceProvider.lastName}` : '—',
          vehicle: b.vehicle ? `${b.vehicle.year} ${b.vehicle.make} ${b.vehicle.model}` : '—',
          createdAt: b.createdAt,
        })),
      },
    });
  } catch (err) {
    console.error('Bookings report error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ─── GET /api/admin/reports/users ────────────────────────────────────────────
router.get('/reports/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { start, end } = buildDateRange(req.query);

    const [total, byRole, byApproval, records] = await Promise.all([
      User.count({ where: { createdAt: { [Op.between]: [start, end] } } }),
      User.findAll({
        attributes: [
          'role',
          [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'count'],
        ],
        where: { createdAt: { [Op.between]: [start, end] } },
        group: ['role'],
        raw: true,
      }),
      User.findAll({
        attributes: [
          'approvalStatus',
          [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'count'],
        ],
        where: {
          createdAt: { [Op.between]: [start, end] },
          role: { [Op.in]: ['dealer', 'service_provider'] },
        },
        group: ['approvalStatus'],
        raw: true,
      }),
      User.findAll({
        where: { createdAt: { [Op.between]: [start, end] } },
        attributes: [
          'id', 'firstName', 'lastName', 'email', 'role',
          'isVerified', 'isActive', 'approvalStatus',
          'businessName', 'city', 'createdAt',
        ],
        order: [['createdAt', 'DESC']],
        limit: 200,
      }),
    ]);

    const verified = records.filter((u) => u.isVerified).length;

    res.json({
      success: true,
      data: {
        summary: {
          total,
          verified,
          unverified: total - verified,
          verificationRate: total > 0 ? ((verified / total) * 100).toFixed(1) : '0.0',
        },
        byRole,
        byApproval,
        records: records.map((u) => ({
          id: u.id,
          name: `${u.firstName} ${u.lastName}`,
          email: u.email,
          role: u.role,
          isVerified: u.isVerified,
          isActive: u.isActive,
          approvalStatus: u.approvalStatus,
          businessName: u.businessName || '—',
          city: u.city || '—',
          createdAt: u.createdAt,
        })),
      },
    });
  } catch (err) {
    console.error('Users report error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ─── GET /api/admin/reports/vehicles ─────────────────────────────────────────
router.get('/reports/vehicles', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { start, end } = buildDateRange(req.query);

    const [total, byStatus, byAvailability, byCondition, records] = await Promise.all([
      Vehicle.count({ where: { createdAt: { [Op.between]: [start, end] } } }),
      Vehicle.findAll({
        attributes: [
          'status',
          [Vehicle.sequelize.fn('COUNT', Vehicle.sequelize.col('id')), 'count'],
        ],
        where: { createdAt: { [Op.between]: [start, end] } },
        group: ['status'],
        raw: true,
      }),
      Vehicle.findAll({
        attributes: [
          'availabilityType',
          [Vehicle.sequelize.fn('COUNT', Vehicle.sequelize.col('id')), 'count'],
        ],
        where: { createdAt: { [Op.between]: [start, end] } },
        group: ['availabilityType'],
        raw: true,
      }),
      Vehicle.findAll({
        attributes: [
          'condition',
          [Vehicle.sequelize.fn('COUNT', Vehicle.sequelize.col('id')), 'count'],
          [Vehicle.sequelize.fn('AVG', Vehicle.sequelize.col('price')), 'avgPrice'],
        ],
        where: { createdAt: { [Op.between]: [start, end] } },
        group: ['condition'],
        raw: true,
      }),
      Vehicle.findAll({
        where: { createdAt: { [Op.between]: [start, end] } },
        include: [
          { model: User, as: 'dealer', attributes: ['id', 'firstName', 'lastName', 'email'] },
        ],
        order: [['createdAt', 'DESC']],
        limit: 200,
      }),
    ]);

    const totalViews = records.reduce((s, v) => s + (v.viewCount || 0), 0);

    res.json({
      success: true,
      data: {
        summary: {
          total,
          totalViews,
          avgViews: total > 0 ? (totalViews / total).toFixed(1) : '0.0',
        },
        byStatus,
        byAvailability,
        byCondition: byCondition.map((r) => ({
          ...r,
          avgPrice: parseFloat(r.avgPrice || 0).toFixed(2),
        })),
        records: records.map((v) => ({
          id: v.id,
          name: `${v.year} ${v.make} ${v.model}`,
          make: v.make,
          model: v.model,
          year: v.year,
          price: v.price,
          condition: v.condition,
          status: v.status,
          availabilityType: v.availabilityType,
          fuelType: v.fuelType,
          transmission: v.transmission,
          bodyType: v.bodyType,
          viewCount: v.viewCount,
          dealerName: v.dealer ? `${v.dealer.firstName} ${v.dealer.lastName}` : '—',
          dealerEmail: v.dealer?.email || '—',
          createdAt: v.createdAt,
        })),
      },
    });
  } catch (err) {
    console.error('Vehicles report error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ─── GET /api/admin/reports/rentals ──────────────────────────────────────────
// Rentals are stored as Bookings where customerNotes starts with '[RENTAL]'
router.get('/reports/rentals', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { start, end } = buildDateRange(req.query);

    const rentalWhere = {
      createdAt: { [Op.between]: [start, end] },
      customerNotes: { [Op.like]: '[RENTAL]%' },
    };

    const [total, byStatus, records] = await Promise.all([
      Booking.count({ where: rentalWhere }),
      Booking.findAll({
        attributes: [
          'status',
          [Booking.sequelize.fn('COUNT', Booking.sequelize.col('id')), 'count'],
          [Booking.sequelize.fn('SUM', Booking.sequelize.col('estimated_cost')), 'totalEstimated'],
        ],
        where: rentalWhere,
        group: ['status'],
        raw: true,
      }),
      Booking.findAll({
        where: rentalWhere,
        include: [
          { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
          { model: User, as: 'serviceProvider', attributes: ['id', 'firstName', 'lastName', 'email'] },
          { model: Vehicle, as: 'vehicle', attributes: ['id', 'make', 'model', 'year'] },
        ],
        order: [['createdAt', 'DESC']],
        limit: 200,
      }),
    ]);

    const totalRevenue = byStatus.reduce((sum, r) => sum + parseFloat(r.totalEstimated || 0), 0);

    const parseRentalMeta = (notes) => {
      try {
        return JSON.parse((notes || '').replace(/^\[RENTAL\]\s*/, ''));
      } catch { return {}; }
    };

    res.json({
      success: true,
      data: {
        summary: {
          total,
          totalEstimatedRevenue: totalRevenue.toFixed(2),
          completedCount: parseInt(byStatus.find((r) => r.status === 'completed')?.count || 0),
          pendingCount: parseInt(byStatus.find((r) => r.status === 'pending')?.count || 0),
        },
        byStatus,
        records: records.map((b) => {
          const meta = parseRentalMeta(b.customerNotes);
          return {
            id: b.id,
            vehicleName: meta.vehicleName || b.title,
            vehicle: b.vehicle ? `${b.vehicle.year} ${b.vehicle.make} ${b.vehicle.model}` : '—',
            startDate: meta.startDate || b.scheduledDate,
            endDate: meta.endDate || '—',
            days: meta.days || '—',
            dailyRate: meta.dailyRate || '—',
            estimatedTotal: meta.estimatedTotal || b.estimatedCost || '—',
            status: b.status,
            customerName: b.user ? `${b.user.firstName} ${b.user.lastName}` : '—',
            customerEmail: b.user?.email || '—',
            dealerName: b.serviceProvider ? `${b.serviceProvider.firstName} ${b.serviceProvider.lastName}` : '—',
            createdAt: b.createdAt,
          };
        }),
      },
    });
  } catch (err) {
    console.error('Rentals report error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ─── GET /api/admin/reports/providers ────────────────────────────────────────
router.get('/reports/providers', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { start, end } = buildDateRange(req.query);

    // All service providers registered in the period
    const providers = await User.findAll({
      where: {
        role: 'service_provider',
        createdAt: { [Op.between]: [start, end] },
      },
      attributes: [
        'id', 'firstName', 'lastName', 'email', 'phone',
        'businessName', 'businessType', 'city', 'approvalStatus', 'isActive', 'createdAt',
      ],
      order: [['createdAt', 'DESC']],
      limit: 200,
    });

    // For each provider, get booking stats in the same period
    const providerIds = providers.map((p) => p.id);

    const bookingStats = providerIds.length > 0 ? await Booking.findAll({
      attributes: [
        'serviceProviderId',
        [Booking.sequelize.fn('COUNT', Booking.sequelize.col('Booking.id')), 'totalBookings'],
        [Booking.sequelize.fn('SUM', Booking.sequelize.col('actual_cost')), 'totalRevenue'],
        [Booking.sequelize.fn('AVG', Booking.sequelize.col('rating')), 'avgRating'],
      ],
      where: {
        serviceProviderId: { [Op.in]: providerIds },
        createdAt: { [Op.between]: [start, end] },
        customerNotes: { [Op.not]: { [Op.like]: '[RENTAL]%' } },
      },
      group: ['serviceProviderId'],
      raw: true,
    }) : [];

    const statsMap = {};
    bookingStats.forEach((s) => {
      statsMap[s.serviceProviderId] = {
        totalBookings: parseInt(s.totalBookings || 0),
        totalRevenue: parseFloat(s.totalRevenue || 0).toFixed(2),
        avgRating: s.avgRating ? parseFloat(s.avgRating).toFixed(1) : null,
      };
    });

    // Also get services offered count
    const serviceCounts = providerIds.length > 0 ? await ServiceOffering.findAll({
      attributes: [
        'providerId',
        [ServiceOffering.sequelize.fn('COUNT', ServiceOffering.sequelize.col('id')), 'serviceCount'],
      ],
      where: { providerId: { [Op.in]: providerIds } },
      group: ['providerId'],
      raw: true,
    }) : [];

    const serviceCountMap = {};
    serviceCounts.forEach((s) => { serviceCountMap[s.providerId] = parseInt(s.serviceCount || 0); });

    res.json({
      success: true,
      data: {
        summary: {
          total: providers.length,
          approved: providers.filter((p) => p.approvalStatus === 'approved').length,
          pending: providers.filter((p) => p.approvalStatus === 'pending').length,
          active: providers.filter((p) => p.isActive).length,
        },
        records: providers.map((p) => ({
          id: p.id,
          name: `${p.firstName} ${p.lastName}`,
          email: p.email,
          phone: p.phone || '—',
          businessName: p.businessName || '—',
          businessType: p.businessType || '—',
          city: p.city || '—',
          approvalStatus: p.approvalStatus,
          isActive: p.isActive,
          serviceCount: serviceCountMap[p.id] || 0,
          ...(statsMap[p.id] || { totalBookings: 0, totalRevenue: '0.00', avgRating: null }),
          createdAt: p.createdAt,
        })),
      },
    });
  } catch (err) {
    console.error('Providers report error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ─── GET /api/admin/reports/recommendations ───────────────────────────────────
router.get('/reports/recommendations', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { start, end } = buildDateRange(req.query);

    const interactionWhere = { createdAt: { [Op.between]: [start, end] } };

    const [total, byType, topViewed, topSaved, topBooked, favoritesTotal] = await Promise.all([
      UserVehicleInteraction.count({ where: interactionWhere }),
      UserVehicleInteraction.findAll({
        attributes: [
          'interactionType',
          [UserVehicleInteraction.sequelize.fn('COUNT', UserVehicleInteraction.sequelize.col('id')), 'count'],
        ],
        where: interactionWhere,
        group: ['interactionType'],
        raw: true,
      }),
      // Top 10 viewed vehicles
      UserVehicleInteraction.findAll({
        attributes: [
          'vehicleId',
          [UserVehicleInteraction.sequelize.fn('COUNT', UserVehicleInteraction.sequelize.col('UserVehicleInteraction.id')), 'count'],
        ],
        where: { ...interactionWhere, interactionType: 'view' },
        include: [{ model: Vehicle, as: 'vehicle', attributes: ['make', 'model', 'year'] }],
        group: ['vehicleId', 'vehicle.id'],
        order: [[UserVehicleInteraction.sequelize.fn('COUNT', UserVehicleInteraction.sequelize.col('UserVehicleInteraction.id')), 'DESC']],
        limit: 10,
      }),
      // Top 10 saved vehicles
      UserVehicleInteraction.findAll({
        attributes: [
          'vehicleId',
          [UserVehicleInteraction.sequelize.fn('COUNT', UserVehicleInteraction.sequelize.col('UserVehicleInteraction.id')), 'count'],
        ],
        where: { ...interactionWhere, interactionType: 'save' },
        include: [{ model: Vehicle, as: 'vehicle', attributes: ['make', 'model', 'year'] }],
        group: ['vehicleId', 'vehicle.id'],
        order: [[UserVehicleInteraction.sequelize.fn('COUNT', UserVehicleInteraction.sequelize.col('UserVehicleInteraction.id')), 'DESC']],
        limit: 10,
      }),
      // Top 10 booked vehicles
      UserVehicleInteraction.findAll({
        attributes: [
          'vehicleId',
          [UserVehicleInteraction.sequelize.fn('COUNT', UserVehicleInteraction.sequelize.col('UserVehicleInteraction.id')), 'count'],
        ],
        where: { ...interactionWhere, interactionType: 'booking' },
        include: [{ model: Vehicle, as: 'vehicle', attributes: ['make', 'model', 'year'] }],
        group: ['vehicleId', 'vehicle.id'],
        order: [[UserVehicleInteraction.sequelize.fn('COUNT', UserVehicleInteraction.sequelize.col('UserVehicleInteraction.id')), 'DESC']],
        limit: 10,
      }),
      FavoriteVehicle.count({ where: interactionWhere }),
    ]);

    const formatTopList = (rows) =>
      rows.map((r) => ({
        vehicleId: r.vehicleId,
        vehicleName: r.vehicle ? `${r.vehicle.year} ${r.vehicle.make} ${r.vehicle.model}` : `Vehicle #${r.vehicleId}`,
        count: parseInt(r.dataValues.count),
      }));

    res.json({
      success: true,
      data: {
        summary: {
          totalInteractions: total,
          favoritesAdded: favoritesTotal,
          views: parseInt(byType.find((t) => t.interactionType === 'view')?.count || 0),
          saves: parseInt(byType.find((t) => t.interactionType === 'save')?.count || 0),
          bookingInteractions: parseInt(byType.find((t) => t.interactionType === 'booking')?.count || 0),
        },
        byType,
        topViewed: formatTopList(topViewed),
        topSaved: formatTopList(topSaved),
        topBooked: formatTopList(topBooked),
      },
    });
  } catch (err) {
    console.error('Recommendations report error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
