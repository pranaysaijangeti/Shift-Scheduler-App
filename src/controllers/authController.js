const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { validateEmail, validatePassword } = require('../utils/validators');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, timezone } = req.body;

  // Input validation
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Name is required and must be at least 2 characters',
      statusCode: 400
    });
  }

  if (!email || !validateEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Valid email is required',
      statusCode: 400
    });
  }

  if (!password || !validatePassword(password)) {
    return res.status(400).json({
      success: false,
      message: 'Password is required and must be at least 6 characters',
      statusCode: 400
    });
  }

  // Check if user already exists (case-insensitive)
  const existingUser = await User.findOne({ 
    email: email.toLowerCase().trim() 
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User already exists with this email',
      statusCode: 400
    });
  }

  try {
    // Create user in MongoDB
    // Password will be hashed automatically by the pre-save hook in User model
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password, // Will be hashed by pre-save hook
      timezone: timezone || 'America/Toronto'
    });

    // Create JWT token with user._id and email
    const token = generateToken(user._id, user.email);

    // Return success response with specific format
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        timezone: user.timezone
      }
    });
  } catch (error) {
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
        statusCode: 400
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors,
        statusCode: 400
      });
    }

    // Handle other errors
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      statusCode: 500,
      error: process.env.NODE_ENV === 'development' ? { error: error.message } : {}
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Input validation
  if (!email || !validateEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Valid email is required',
      statusCode: 400
    });
  }

  if (!password || typeof password !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Password is required',
      statusCode: 400
    });
  }

  try {
    // Find user by email (case-insensitive)
    const user = await User.findOne({ 
      email: email.toLowerCase().trim() 
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        statusCode: 401
      });
    }

    // Compare password using bcrypt
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        statusCode: 401
      });
    }

    // Create JWT token
    const token = generateToken(user._id, user.email);

    // Return success response with specific format
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        timezone: user.timezone
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      statusCode: 500,
      error: process.env.NODE_ENV === 'development' ? { error: error.message } : {}
    });
  }
});

/**
 * @route   GET /api/auth/verify
 * @desc    Verify token and return current user info
 * @access  Private (requires authentication middleware)
 */
const verifyToken = asyncHandler(async (req, res) => {
  // User is already attached to req.user by verifyToken middleware
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      statusCode: 401
    });
  }

  // Return current user info
  res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      timezone: req.user.timezone
    }
  });
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Public
 * Note: Since JWT is stateless, logout is handled client-side by removing the token
 * Optional: Can implement JWT blacklist for token invalidation
 */
const logout = asyncHandler(async (req, res) => {
  // Optional: Add token to blacklist if implementing JWT blacklist
  // For now, just return success - client should remove token
  
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = {
  register,
  login,
  verifyToken,
  logout
};
