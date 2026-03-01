const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  updatePreferences
} = require('../controllers/userController');
const { verifyToken } = require('../middleware/auth');

/**
 * @route   GET /api/users/profile
 * @desc    Get user profile and preferences
 * @access  Private (requires authentication)
 */
router.get('/profile', verifyToken, getProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private (requires authentication)
 */
router.put('/profile', verifyToken, updateProfile);

/**
 * @route   PUT /api/users/preferences
 * @desc    Update user preferences
 * @access  Private (requires authentication)
 */
router.put('/preferences', verifyToken, updatePreferences);

module.exports = router;

