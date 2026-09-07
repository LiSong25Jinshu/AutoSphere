/**
 * /api/recommendations
 *
 * Architecture note — the AI service has TWO vehicle data sources:
 *
 *   1. PostgreSQL (database.py → fetch_vehicle_data)
 *      vehicle_id = integer PK as a string, e.g. "13415"
 *      → These exist in the DB; all actions (details, favorites, test drive) work.
 *
 *   2. Kaggle CSVs (csv_loader.py → load_Kaggle_vehicles)
 *      vehicle_id = "kaggle_0", "kaggle_1", … (synthetic, NOT in PostgreSQL)
 *      → These do NOT have a DB record; we try a fuzzy make/model/year/price
 *        match to find the equivalent seeded vehicle. If no match, the
 *        recommendation is returned as display-only (canInteract: false).
 *
 * This route normalises ALL vehicle_ids to real DB integer PKs before
 * sending the response to the frontend so that:
 *   - /api/vehicles/:id       always receives an integer
 *   - /api/favorites/:id      always receives an integer
 *   - /api/rentals/test-drive always receives an integer vehicleId
 */
import express from 'express';
import axios from 'axios';
import { Op } from 'sequelize';
import Vehicle from '../models/Vehicle.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const AI_SERVICE_URL = 'http://localhost:5002';

// ─── ID resolution cache (in-process, per server lifetime) ───────────────────
// Avoids hitting the DB for the same kaggle_N repeatedly within a session.
const kaggleIdCache = new Map(); // kaggle_N → integer DB id | null

/**
 * Given a raw AI vehicle_id string and the enriched vehicle data from the AI,
 * return the real integer PostgreSQL id (or null if no DB record exists).
 *
 * Strategy:
 *   1. If the id is already a plain integer string ("13415") → parse and return.
 *   2. If it is "kaggle_N":
 *      a. Check the in-process cache.
 *      b. Query vehicles table: exact make + model + year, price within ±20%.
 *      c. Cache and return the result (or null).
 */
async function resolveToDbId(vehicleId, recData) {
  const vid = String(vehicleId || '').trim();

  // Case 1 — already a DB integer id
  if (/^\d+$/.test(vid)) {
    return parseInt(vid, 10);
  }

  // Case 2 — kaggle_N synthetic id
  if (vid.startsWith('kaggle_') || !/^\d+$/.test(vid)) {
    if (kaggleIdCache.has(vid)) {
      return kaggleIdCache.get(vid); // may be null (previously found no match)
    }

    try {
      const make  = (recData.make  || '').trim();
      const model = (recData.model || '').trim();
      const year  = parseInt(recData.year,  10);
      const price = parseFloat(recData.price);

      if (!make || !model || !year) {
        kaggleIdCache.set(vid, null);
        return null;
      }

      const where = {
        make:  { [Op.iLike]: make  },
        model: { [Op.iLike]: model },
        year,
      };

      // Price tolerance ±20% to handle currency conversion/rounding
      if (Number.isFinite(price) && price > 0) {
        where.price = { [Op.between]: [price * 0.80, price * 1.20] };
      }

      const match = await Vehicle.findOne({
        where,
        attributes: ['id'],
        order: [['createdAt', 'ASC']], // prefer oldest (most canonical) record
      });

      const dbId = match ? match.id : null;
      kaggleIdCache.set(vid, dbId);
      return dbId;
    } catch (err) {
      console.error('resolveToDbId lookup failed:', err.message);
      kaggleIdCache.set(vid, null);
      return null;
    }
  }

  return null;
}

// ─── GET /api/recommendations/:userId ────────────────────────────────────────
router.get('/:userId', authenticateToken, async (req, res) => {
  const { userId } = req.params;

  const allowedParams = new Set([
    'n', 'budget_min', 'budget_max', 'fuel_type', 'body_type',
    'transmission', 'condition', 'make', 'model', 'min_year',
    'max_year', 'min_mileage', 'max_mileage', 'features', 'usage',
    'lifestyle',
  ]);

  const badParam = Object.keys(req.query).find(k => !allowedParams.has(k));
  if (badParam) {
    return res.status(400).json({
      success: false,
      message: `Unsupported recommendation parameter: ${badParam}`,
    });
  }

  try {
    const aiResponse = await axios.get(
      `${AI_SERVICE_URL}/recommendations/${userId}`,
      { params: req.query, timeout: 15000 },
    );

    const payload = aiResponse?.data || {};
    const rawRecs = Array.isArray(payload.recommendations) ? payload.recommendations : [];

    // Resolve all vehicle_ids to real DB PKs in parallel
    const resolvedIds = await Promise.all(
      rawRecs.map(rec => resolveToDbId(rec.vehicle_id, rec))
    );

    // Build the final recommendations list with normalised IDs
    const recommendations = rawRecs.map((rec, i) => {
      const dbId = resolvedIds[i];
      return {
        ...rec,
        // Always expose a numeric id (or null) — never a kaggle string
        vehicle_id: dbId,
        // canInteract tells the frontend whether this vehicle exists in the DB
        canInteract: dbId !== null,
      };
    });

    return res.json({
      success: true,
      source: 'ai',
      ...payload,
      recommendations,
      metadata: {
        ...(payload.metadata || {}),
        result_count: recommendations.length,
      },
    });

  } catch (error) {
    console.error('AI service error:', error.response?.data || error.message);

    const isUnavailable = !error.response; // connection refused / timeout

    return res.status(200).json({
      success: false,
      source: 'unavailable',
      recommendations: [],
      metadata: {
        result_count: 0,
        fallback_used: true,
        source_status: isUnavailable ? 'service_unavailable' : 'empty_result',
      },
      message: isUnavailable
        ? 'AI recommendations are temporarily unavailable'
        : 'No matches found.',
    });
  }
});

// ─── GET /api/recommendations/similar/:vehicleId ──────────────────────────────
router.get('/similar/:vehicleId', async (req, res) => {
  try {
    const vehicleId = parseInt(req.params.vehicleId, 10);
    if (isNaN(vehicleId)) {
      return res.status(400).json({ success: false, message: 'Invalid vehicle ID' });
    }

    const vehicle = await Vehicle.findByPk(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    const priceRange = vehicle.price * 0.3;
    const similar = await Vehicle.findAll({
      where: {
        id: { [Op.ne]: vehicleId },
        status: 'available',
        [Op.or]: [
          { make: vehicle.make },
          {
            price: {
              [Op.between]: [vehicle.price - priceRange, vehicle.price + priceRange],
            },
          },
        ],
      },
      order: [['createdAt', 'DESC']],
      limit: parseInt(req.query.limit) || 6,
    });

    res.json({ success: true, similar, count: similar.length });
  } catch (error) {
    console.error('Similar vehicles error:', error);
    res.status(500).json({ success: false, message: 'Could not fetch similar vehicles' });
  }
});

export default router;
