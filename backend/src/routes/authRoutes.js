import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone } = req.body;
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'User exists' });
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = await User.create({ firstName, lastName, email, passwordHash: hashedPassword, phone, isActive: true, role: 'user' });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'my_jwt_secret_key_123', { expiresIn: '7d' });
    res.status(201).json({ message: 'User created', token, user: { id: user.id, firstName, lastName, email, phone, role: user.role } });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'my_jwt_secret_key_123', { expiresIn: '7d' });
    res.json({ message: 'Login successful', token, user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone, role: user.role } });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'my_jwt_secret_key_123');
    const user = await User.findByPk(decoded.id, { attributes: { exclude: ['passwordHash'] } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) { res.status(401).json({ error: 'Invalid token' }); }
});
export default router;
