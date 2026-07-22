import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// GET /api/notifications  — paginated list for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;

    const { rows: notifications, count } = await Notification.findAndCountAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    const unreadCount = await Notification.count({
      where: { userId: req.user.id, read: false },
    });

    res.json({ success: true, data: notifications, total: count, unreadCount });
  } catch (err) {
    console.error('GET /notifications error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PATCH /api/notifications/:id/read  — mark one as read
router.patch('/:id/read', authenticateToken, async (req, res) => {
  try {
    const notif = await Notification.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!notif) return res.status(404).json({ success: false, message: 'Not found' });

    await notif.update({ read: true });
    res.json({ success: true, data: notif });
  } catch (err) {
    console.error('PATCH /notifications/:id/read error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PATCH /api/notifications/read-all  — mark all as read
router.patch('/read-all', authenticateToken, async (req, res) => {
  try {
    await Notification.update(
      { read: true },
      { where: { userId: req.user.id, read: false } }
    );
    res.json({ success: true });
  } catch (err) {
    console.error('PATCH /notifications/read-all error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /api/notifications/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const deleted = await Notification.destroy({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!deleted) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /notifications/:id error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
