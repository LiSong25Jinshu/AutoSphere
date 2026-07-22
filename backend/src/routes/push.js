import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import PushSubscription from '../models/PushSubscription.js';

const router = express.Router();

// GET /api/push/vapid-public-key — frontend needs this to subscribe
router.get('/vapid-public-key', (_req, res) => {
  const key = process.env.VAPID_PUBLIC_KEY;
  if (!key) {
    return res.status(503).json({ success: false, message: 'Push notifications not configured' });
  }
  res.json({ success: true, publicKey: key });
});

// POST /api/push/subscribe — save a push subscription
router.post('/subscribe', authenticateToken, [
  body('endpoint').notEmpty().isURL(),
  body('keys').isObject(),
  body('keys.p256dh').notEmpty(),
  body('keys.auth').notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Invalid subscription', errors: errors.array() });
    }

    const { endpoint, keys } = req.body;
    const userAgent = req.headers['user-agent']?.slice(0, 500);

    // Upsert — update userId if the same endpoint re-subscribes
    const [sub, created] = await PushSubscription.findOrCreate({
      where: { endpoint },
      defaults: { userId: req.user.id, endpoint, keys, userAgent },
    });

    if (!created && sub.userId !== req.user.id) {
      await sub.update({ userId: req.user.id, keys, userAgent });
    }

    res.status(created ? 201 : 200).json({ success: true, message: 'Subscribed' });
  } catch (err) {
    console.error('Push subscribe error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /api/push/unsubscribe — remove a subscription
router.delete('/unsubscribe', authenticateToken, [
  body('endpoint').notEmpty(),
], async (req, res) => {
  try {
    await PushSubscription.destroy({
      where: { endpoint: req.body.endpoint, userId: req.user.id },
    });
    res.json({ success: true, message: 'Unsubscribed' });
  } catch (err) {
    console.error('Push unsubscribe error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
