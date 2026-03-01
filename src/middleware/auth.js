const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Verify JWT token and attach user to request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const verifyToken = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'No token provided, authorization denied',
        statusCode: 401
      });
    }

    // Check if Bearer token format
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format. Use: Bearer <token>',
        statusCode: 401
      });
    }

    // Extract token
    const token = authHeader.replace('Bearer ', '').trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided, authorization denied',
        statusCode: 401
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      // Handle specific JWT errors
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired',
          statusCode: 401,
          error: process.env.NODE_ENV === 'development' ? { expiredAt: error.expiredAt } : {}
        });
      }
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
          statusCode: 401,
          error: process.env.NODE_ENV === 'development' ? { error: error.message } : {}
        });
      }

      // Other JWT errors
      return res.status(401).json({
        success: false,
        message: 'Token verification failed',
        statusCode: 401,
        error: process.env.NODE_ENV === 'development' ? { error: error.message } : {}
      });
    }

    // Check if user exists
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Token is not valid.',
        statusCode: 401
      });
    }

    // Attach user to request object
    req.user = user;
    req.userId = decoded.id; // Also attach userId for convenience
    
    // Continue to next middleware
    next();
  } catch (error) {
    // Unexpected errors
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      statusCode: 500,
      error: process.env.NODE_ENV === 'development' ? { error: error.message } : {}
    });
  }
};

/**
 * Error handler middleware
 * Catches all errors from routes and returns consistent error response
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const errorHandler = (err, req, res, next) => {
  // Log error with timestamp
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] Error:`, {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method
  });

  // Determine status code
  const statusCode = err.statusCode || err.status || 500;

  // Return consistent error response
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    statusCode: statusCode,
    error: process.env.NODE_ENV === 'development' ? {
      message: err.message,
      stack: err.stack,
      ...err
    } : {}
  });
};

/**
 * Async handler wrapper
 * Wraps async route handlers to catch errors and pass to error handler
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      // Pass error to error handler
      next(error);
    });
  };
};

/**
 * Middleware to check user roles (optional helper)
 * @param {...String} roles - Allowed roles
 * @returns {Function} Middleware function
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        statusCode: 401
      });
    }

    // Note: User model doesn't have role field in new schema
    // This is kept for backward compatibility if needed
    // You can remove this if not using roles
    next();
  };
};

module.exports = {
  verifyToken,
  errorHandler,
  asyncHandler,
  authorize,
  // Alias for backward compatibility
  authenticate: verifyToken
};
