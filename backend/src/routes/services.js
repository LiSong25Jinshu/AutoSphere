import express from 'express';
import { body, validationResult } from 'express-validator';
import { Op } from 'sequelize';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import ServiceOffering from '../models/ServiceOffering.js';
import ProviderSchedule from '../models/ProviderSchedule.js';
import User from '../models/User.js';

const router = express.Router();

// ─── SERVICE OFFERINGS ───────────────────────────────────────────────────────

// GET /api/services — list services for the authenticated provider
router.get('/', authenticateToken, async (req, res) => {
  try {
    const services = await ServiceOffering.findAll({
      where: { providerId: req.user.id },
      order: [['createdAt', 'ASC']],
    });
    res.json({ success: true, data: services });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/services/by-type?serviceType=oil_change
// Public: returns all active service providers that offer a given booking service type.
// Maps booking serviceType values to ServiceOffering categories so the customer
// sees real providers after selecting a service.
router.get('/by-type', async (req, res) => {
  try {
    const { serviceType } = req.query;
    if (!serviceType) {
      return res.status(400).json({ success: false, message: 'serviceType query param is required' });
    }

    // Map booking service types → ServiceOffering categories
    const categoryMap = {
      car_wash:             ['car_wash'],
      oil_change:           ['maintenance'],
      brake_service:        ['repair', 'maintenance'],
      tire_service:         ['maintenance', 'repair'],
      engine_diagnostic:    ['repair', 'maintenance'],
      transmission_service: ['repair'],
      air_conditioning:     ['repair', 'maintenance'],
      battery_service:      ['maintenance', 'repair'],
      general_maintenance:  ['maintenance'],
      inspection:           ['maintenance', 'repair'],
      repair:               ['repair'],
      Washing:              ['car_wash'],
      other:                ['maintenance', 'repair', 'car_wash', 'other'],
    };

    const categories = categoryMap[serviceType] || ['maintenance', 'repair', 'other'];

    // Find all active service offerings in matching categories, with their provider
    const offerings = await ServiceOffering.findAll({
      where: {
        category: { [Op.in]: categories },
        isActive: true,
      },
      include: [{
        model: User,
        as: 'provider',
        attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
        where: { role: 'service_provider', isVerified: true },
      }],
      order: [['bookingCount', 'DESC']],
    });

    // Group by provider — one entry per provider with their relevant services listed
    const providerMap = new Map();
    for (const offering of offerings) {
      const pid = offering.provider.id;
      if (!providerMap.has(pid)) {
        providerMap.set(pid, {
          id: pid,
          firstName: offering.provider.firstName,
          lastName: offering.provider.lastName,
          email: offering.provider.email,
          phone: offering.provider.phone,
          services: [],
        });
      }
      providerMap.get(pid).services.push({
        id: offering.id,
        name: offering.name,
        category: offering.category,
        price: parseFloat(offering.price),
        duration: offering.duration,
        description: offering.description,
      });
    }

    const providers = Array.from(providerMap.values());
    res.json({ success: true, data: providers });
  } catch (error) {
    console.error('Get providers by service type error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/services/provider/:providerId — public: list active services for a provider
router.get('/provider/:providerId', async (req, res) => {
  try {
    const services = await ServiceOffering.findAll({
      where: { providerId: req.params.providerId, isActive: true },
      order: [['name', 'ASC']],
    });
    res.json({ success: true, data: services });
  } catch (error) {
    console.error('Get provider services error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/services — create a service
router.post('/', authenticateToken, [
  body('name').trim().notEmpty().isLength({ max: 200 }),
  body('description').optional().trim(),
  body('category').isIn(['car_wash', 'maintenance', 'repair', 'other']),
  body('price').isFloat({ min: 0 }),
  body('duration').isInt({ min: 15 }),
  body('isActive').optional().isBoolean(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });

    if (req.user.role !== 'service_provider' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only service providers can create services' });
    }

    const service = await ServiceOffering.create({
      ...req.body,
      providerId: req.user.id,
    });

    res.status(201).json({ success: true, data: service });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ─── SCHEDULE (must be registered before /:id to avoid route shadowing) ──────

// GET /api/services/schedule — get provider's schedule
router.get('/schedule', authenticateToken, async (req, res) => {
  try {
    const record = await ProviderSchedule.findOne({ where: { providerId: req.user.id } });
    res.json({ success: true, data: record ? record.schedule : null });
  } catch (error) {
    console.error('Get schedule error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/services/schedule — save provider's schedule
router.put('/schedule', authenticateToken, [
  body('schedule').isObject(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation failed' });

    if (req.user.role !== 'service_provider' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only service providers can update schedules' });
    }

    const [record, created] = await ProviderSchedule.findOrCreate({
      where: { providerId: req.user.id },
      defaults: { providerId: req.user.id, schedule: req.body.schedule },
    });

    if (!created) await record.update({ schedule: req.body.schedule });

    res.json({ success: true, data: record.schedule });
  } catch (error) {
    console.error('Save schedule error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ─── CRUD BY ID ───────────────────────────────────────────────────────────────

// PUT /api/services/:id — update a service
router.put('/:id', authenticateToken, [
  body('name').optional().trim().notEmpty().isLength({ max: 200 }),
  body('description').optional().trim(),
  body('category').optional().isIn(['car_wash', 'maintenance', 'repair', 'other']),
  body('price').optional().isFloat({ min: 0 }),
  body('duration').optional().isInt({ min: 15 }),
  body('isActive').optional().isBoolean(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });

    const service = await ServiceOffering.findByPk(req.params.id);
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    if (service.providerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await service.update(req.body);
    res.json({ success: true, data: service });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /api/services/:id — delete a service
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const service = await ServiceOffering.findByPk(req.params.id);
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    if (service.providerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await service.destroy();
    res.json({ success: true, message: 'Service deleted' });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
