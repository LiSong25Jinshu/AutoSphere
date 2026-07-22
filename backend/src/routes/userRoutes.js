import express from 'express';
import User from '../models/User.js';
const router = express.Router();
router.get('/', async (req, res) => {
  try { const users = await User.findAll({ attributes: { exclude: ['passwordHash'] } }); res.json(users); } catch (e) { res.status(500).json({ error: e.message }); }
});
router.get('/:id', async (req, res) => {
  try { const user = await User.findByPk(req.params.id, { attributes: { exclude: ['passwordHash'] } }); if (!user) return res.status(404).json({ error: 'User not found' }); res.json(user); } catch (e) { res.status(500).json({ error: e.message }); }
});
export default router;
