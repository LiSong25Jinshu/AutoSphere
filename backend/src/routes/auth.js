import express from 'express';
import crypto from 'crypto';
import { Op } from 'sequelize';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { hashPassword } from '../utils/password.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { authenticateToken } from '../middleware/auth.js';
import passport from '../config/passport.js';
import { sendVerificationEmail, sendPasswordResetEmail, sendOtpEmail, sendWelcomeEmail } from '../utils/email.js';

// In-memory OTP store: { email -> { otp, expiresAt, attempts } }
// In production you'd use Redis; this is fine for a single-process server.
const otpStore = new Map();

const router = express.Router();

// ── OTP helpers ──────────────────────────────────────────────────────────────
const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const saveOtp = (email, otp) => {
  otpStore.set(email.toLowerCase(), {
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    attempts: 0,
  });
};

const verifyOtp = (email, otp) => {
  const record = otpStore.get(email.toLowerCase());
  if (!record) return { valid: false, reason: 'No verification code found. Please request a new one.' };
  if (Date.now() > record.expiresAt) {
    otpStore.delete(email.toLowerCase());
    return { valid: false, reason: 'Verification code has expired. Please request a new one.' };
  }
  record.attempts += 1;
  if (record.attempts > 5) {
    otpStore.delete(email.toLowerCase());
    return { valid: false, reason: 'Too many attempts. Please request a new code.' };
  }
  if (record.otp !== String(otp).trim()) {
    return { valid: false, reason: 'Incorrect code. Please try again.' };
  }
  otpStore.delete(email.toLowerCase());
  return { valid: true };
};

// Register — always creates account as unverified and sends a 6-digit OTP
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
    const cleanPhone = phone && phone.trim() !== '' ? phone.trim() : null;

    if (role === 'admin') {
      const validCode = process.env.ADMIN_INVITE_CODE;
      if (!adminInviteCode || adminInviteCode !== validCode) {
        return res.status(403).json({
          success: false,
          message: 'Invalid or missing admin invite code.',
        });
      }
    }

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      // If already registered but not verified, resend OTP
      if (!existingUser.isVerified) {
        const otp = generateOtp();
        saveOtp(email, otp);
        try { await sendOtpEmail(email, existingUser.firstName, otp); } catch (e) { console.error(e); }
        return res.status(200).json({
          success: true,
          requiresVerification: true,
          message: 'Account exists but is not verified. A new code has been sent to your email.',
          email,
        });
      }
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const user = await User.create({
      email,
      passwordHash: await hashPassword(password),
      firstName,
      lastName,
      phone: cleanPhone,
      role,
      isVerified: false, // always start unverified
    });

    // Generate and send OTP
    const otp = generateOtp();
    saveOtp(email, otp);
    try {
      await sendOtpEmail(email, firstName, otp);
    } catch (e) {
      console.error('Failed to send OTP email:', e);
    }

    res.status(201).json({
      success: true,
      requiresVerification: true,
      message: 'Account created! Please check your email for a 6-digit verification code.',
      email,
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.name === 'SequelizeUniqueConstraintError')
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    if (error.name === 'SequelizeValidationError')
      return res.status(400).json({ success: false, message: error.errors?.[0]?.message || 'Validation failed' });
    if (error.original?.code === 'ECONNREFUSED')
      return res.status(503).json({ success: false, message: 'Database is not available. Please try again later.' });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/auth/verify-otp — verify the 6-digit code sent after registration
router.post('/verify-otp', [
  body('email').isEmail().normalizeEmail(),
  body('otp').notEmpty().isLength({ min: 6, max: 6 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });

    const { email, otp } = req.body;
    const result = verifyOtp(email, otp);
    if (!result.valid)
      return res.status(400).json({ success: false, message: result.reason });

    const user = await User.findByEmail(email);
    if (!user)
      return res.status(404).json({ success: false, message: 'Account not found.' });

    user.isVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    // Send welcome email (fire-and-forget — never block the response)
    sendWelcomeEmail(user.email, user.firstName).catch((e) =>
      console.error('Failed to send welcome email:', e)
    );

    // Issue a token so the user is logged in immediately after verification
    const token = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
      isVerified: true,
    });

    const refreshToken = generateRefreshToken({ id: user.id });

    res.json({
      success: true,
      message: 'Email verified successfully! Welcome to AutoSphere.',
      user: user.toJSON(),
      token,
      refreshToken,
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/auth/resend-otp — resend a fresh OTP
router.post('/resend-otp', [
  body('email').isEmail().normalizeEmail(),
], async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findByEmail(email);
    if (!user || user.isVerified) {
      // Don't reveal whether account exists
      return res.json({ success: true, message: 'If that email is registered and unverified, a new code has been sent.' });
    }
    const otp = generateOtp();
    saveOtp(email, otp);
    try { await sendOtpEmail(email, user.firstName, otp); } catch (e) { console.error(e); }
    res.json({ success: true, message: 'A new verification code has been sent to your email.' });
  } catch (error) {
    console.error('Resend OTP error:', error);
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

    // Block unverified users regardless of environment
    if (!user.isVerified)
      return res.status(403).json({
        success: false,
        message: 'Please verify your email address before logging in.',
        requiresVerification: true,
        email: user.email,
      });

    user.lastLoginAt = new Date();
    await user.save();

    const token = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
    });

    const refreshToken = generateRefreshToken({ id: user.id });

    res.json({ success: true, message: 'Login successful', user: user.toJSON(), token, refreshToken });
  } catch (error) {
    console.error('Login error:', error);
    if (
      error.name === 'SequelizeConnectionError' ||
      error.name === 'SequelizeConnectionRefusedError' ||
      error.original?.code === 'ECONNREFUSED'
    ) {
      return res.status(503).json({ success: false, message: 'Database is not available. Please try again later.' });
    }
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

// Helper — check if Google OAuth is actually configured
const isGoogleConfigured = () => {
  const id = process.env.GOOGLE_CLIENT_ID;
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  return (
    id && secret &&
    !id.startsWith('your-') &&
    !secret.startsWith('your-')
  );
};

// GET /api/auth/google — initiate Google OAuth
router.get('/google', (req, res, next) => {
  if (!isGoogleConfigured()) {
    return res.status(503).json({
      success: false,
      message: 'Google sign-in is not configured on this server.',
    });
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

// GET /api/auth/google/callback
router.get('/google/callback', (req, res, next) => {
  if (!isGoogleConfigured()) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/login?error=oauth_not_configured`);
  }
  passport.authenticate('google', { session: false, failureRedirect: '/login?error=oauth_failed' })(req, res, next);
}, (req, res) => {
  const token = generateAccessToken({
    id: req.user.id,
    email: req.user.email,
    role: req.user.role,
    isVerified: req.user.isVerified,
  });
  const refreshToken = generateRefreshToken({ id: req.user.id });
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  res.redirect(`${frontendUrl}/auth/callback?token=${token}&refreshToken=${encodeURIComponent(refreshToken)}`);
});

// POST /api/auth/refresh — issue a new access token using a valid refresh token
router.post('/refresh', [
  body('refreshToken').notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Refresh token is required' });
    }

    const { refreshToken } = req.body;
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token', error: 'REFRESH_TOKEN_INVALID' });
    }

    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found', error: 'USER_NOT_FOUND' });
    }

    const newAccessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
    });

    const newRefreshToken = generateRefreshToken({ id: user.id });

    res.json({
      success: true,
      token: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;