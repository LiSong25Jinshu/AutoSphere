import { verifyAccessToken, extractTokenFromHeader } from '../utils/jwt.js';
import User from '../models/User.js';

/**
 * Authentication middleware to verify JWT tokens.
 * Also checks that the account is still active — deactivated accounts
 * get a 403 ACCOUNT_DEACTIVATED response on every request.
 */
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    // Development bypass for testing without database
    if (process.env.NODE_ENV === 'development' && req.headers['x-test-mode'] === 'true' && !token) {
      req.user = {
        id: 4,
        email: 'test@autosphere.com',
        role: 'user',
        isVerified: true,
        isActive: true,
      };
      return next();
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required',
        error: 'MISSING_TOKEN',
      });
    }

    // Verify the JWT signature and expiry
    const decoded = verifyAccessToken(token);

    // ── Check account is still active in the DB ────────────────────────────
    // We do a lightweight DB lookup so deactivation takes effect immediately
    // without waiting for the token to expire.
    let dbUser = null;
    try {
      dbUser = await User.findByPk(decoded.id, {
        attributes: ['id', 'email', 'role', 'isVerified', 'isActive'],
      });
    } catch (_) {
      // DB unavailable — fall back to token data only (development tolerance)
    }

    if (dbUser && !dbUser.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
        error: 'ACCOUNT_DEACTIVATED',
      });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      isVerified: decoded.isVerified,
      isActive: dbUser ? dbUser.isActive : true,
    };

    next();
  } catch (error) {
    let statusCode = 401;
    let errorCode = 'INVALID_TOKEN';
    let message = 'Invalid or expired token';

    if (error.message === 'Access token expired') {
      errorCode = 'TOKEN_EXPIRED';
      message = 'Access token expired';
    } else if (error.message === 'Invalid access token') {
      errorCode = 'INVALID_TOKEN';
      message = 'Invalid access token';
    }

    return res.status(statusCode).json({
      success: false,
      message,
      error: errorCode,
    });
  }
};

/**
 * Optional authentication middleware - doesn't fail if no token provided
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (token) {
      const decoded = verifyAccessToken(token);
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        isVerified: decoded.isVerified,
      };
    }

    next();
  } catch (error) {
    // For optional auth, we continue even if token is invalid
    next();
  }
};

/**
 * Role-based authorization middleware
 * @param {string|Array<string>} allowedRoles - Role(s) allowed to access the route
 * @returns {Function} Express middleware function
 */
export const requireRole = (allowedRoles) => {
  // Normalize to array
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'NOT_AUTHENTICATED',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        error: 'INSUFFICIENT_PERMISSIONS',
        required: roles,
        current: req.user.role,
      });
    }

    next();
  };
};

/**
 * Email verification requirement middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const requireEmailVerification = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      error: 'NOT_AUTHENTICATED',
    });
  }

  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Email verification required',
      error: 'EMAIL_NOT_VERIFIED',
    });
  }

  next();
};

/**
 * Admin-only middleware
 */
export const requireAdmin = requireRole('admin');

/**
 * Dealer-only middleware
 */
export const requireDealer = requireRole('dealer');

/**
 * Service provider-only middleware
 */
export const requireServiceProvider = requireRole('service_provider');

/**
 * Dealer or Service Provider middleware
 */
export const requireProvider = requireRole(['dealer', 'service_provider']);

/**
 * Any authenticated user middleware (alias for authenticateToken)
 */
export const requireAuth = authenticateToken;