import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { hashPassword } from '../utils/password.js';
import { generateAccessToken } from '../utils/jwt.js';
import { authenticateToken } from '../middleware/auth.js';
import passport from '../config/passport.js';
import { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } from '../utils/email.js';

const router = express.Router();

// Register
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').trim().isLength({ min: 2 }),
  body('lastName').trim().isLength({ min: 2 }),
  body('role').optional().isIn(['user', 'dealer', 'service_provider']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });

    const { email, password, firstName, lastName, phone, role = 'user' } = req.body;

    const existingUser = await User.findByEmail(email);
    if (existingUser)
      return res.status(409).json({ success: false, message: 'User with this email already exists' });

    // Auto-verify users in development for convenience
    const isDev = process.env.NODE_ENV === 'development';
    const user = await User.create({
      email,
      passwordHash: await hashPassword(password),
      firstName,
      lastName,
      phone,
      role,
      isVerified: isDev, // true in dev, false in production
    });

    // Only generate verification token if in production
    if (!isDev) {
      const verificationToken = user.generateEmailVerificationToken();
      await user.save();

      try {
        await sendVerificationEmail(user.email, user.firstName, verificationToken);
      } catch (e) {
        console.error('Failed to send verification email:', e);
      }
    }

    res.status(201).json({
      success: true,
      message: isDev
        ? 'Registration successful. You can log in immediately.'
        : 'Registration successful. Please check your email to verify your account.',
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });

    const { email, password } = req.body;
    const user = await User.findByEmail(email);
    if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const isValid = await user.validatePassword(password);
    if (!isValid) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    // In dev, skip email verification
    if (!user.isVerified && process.env.NODE_ENV !== 'development')
      return res.status(403).json({
        success: false,
        message: 'Please verify your email address before logging in.',
        requiresVerification: true,
      });

    user.lastLoginAt = new Date();
    await user.save();

    const token = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
    });

    res.json({ success: true, message: 'Login successful', user: user.toJSON(), token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// The rest of your routes (verify-email, resend-verification, forgot/reset password, logout, me, refresh, Google OAuth) stay unchanged
// GET /api/auth/me — return the currently authenticated user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user: user.toJSON() });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;