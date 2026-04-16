import express from 'express';
import crypto from 'crypto';
import { Op } from 'sequelize';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { hashPassword } from '../utils/password.js';
import { generateAccessToken } from '../utils/jwt.js';
import { authenticateToken } from '../middleware/auth.js';
import passport from '../config/passport.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email.js';

const router = express.Router();

// Register
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').trim().isLength({ min: 2 }),
  body('lastName').trim().isLength({ min: 2 }),
  body('role').optional().isIn(['user', 'dealer', 'service_provider', 'admin']),
  body('adminInviteCode').optional().isString(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });

    const { email, password, firstName, lastName, phone, role = 'user', adminInviteCode } = req.body;

    // Admin registration requires a valid invite code
    if (role === 'admin') {
      const validCode = process.env.ADMIN_INVITE_CODE;
      if (!adminInviteCode || adminInviteCode !== validCode) {
        return res.status(403).json({
          success: false,
          message: 'Invalid or missing admin invite code. Admin registration is restricted.',
        });
      }
    }

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

// POST /api/auth/logout
router.post('/logout', authenticateToken, (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// POST /api/auth/verify-email
router.post('/verify-email', [
  body('token').notEmpty(),
], async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findOne({
      where: { emailVerificationToken: token },
    });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification token' });
    }
    if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
      return res.status(400).json({ success: false, message: 'Verification token has expired' });
    }
    user.isVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();
    res.json({ success: true, message: 'Email verified successfully. You can now log in.' });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/auth/resend-verification
router.post('/resend-verification', [
  body('email').isEmail().normalizeEmail(),
], async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findByEmail(email);
    if (!user) {
      // Don't reveal whether the email exists
      return res.json({ success: true, message: 'If that email exists, a verification link has been sent.' });
    }
    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Email is already verified' });
    }
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();
    try {
      await sendVerificationEmail(user.email, user.firstName, verificationToken);
    } catch (e) {
      console.error('Failed to send verification email:', e);
    }
    res.json({ success: true, message: 'Verification email sent. Please check your inbox.' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail(),
], async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findByEmail(email);
    // Always return success to avoid email enumeration
    if (!user) {
      return res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
    }
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();
    try {
      await sendPasswordResetEmail(user.email, user.firstName, resetToken);
    } catch (e) {
      console.error('Failed to send password reset email:', e);
    }
    res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', [
  body('token').notEmpty(),
  body('password').isLength({ min: 6 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }
    const { token, password } = req.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: { [Op.gt]: new Date() },
      },
    });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }
    user.passwordHash = await hashPassword(password);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();
    res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/auth/google — initiate Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// GET /api/auth/google/callback
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login?error=oauth_failed' }),
  (req, res) => {
    const token = generateAccessToken({
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      isVerified: req.user.isVerified,
    });
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  }
);

export default router;