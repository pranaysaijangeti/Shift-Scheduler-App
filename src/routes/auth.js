const express = require('express');
const router = express.Router();
const { register, login, verifyToken, logout } = require('../controllers/authController');
const { verifyToken: verifyTokenMiddleware } = require('../middleware/auth');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   GET /api/auth/verify
 * @desc    Verify token and get current user info
 * @access  Private (requires authentication)
 */
router.get('/verify', verifyTokenMiddleware, verifyToken);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Public
 */
router.post('/logout', logout);

module.exports = router;
