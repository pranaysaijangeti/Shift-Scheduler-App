const express = require('express');
const router = express.Router();
const {
  scheduleNotification,
  getPendingNotifications,
  markNotificationSent
} = require('../controllers/notificationController');
const { verifyToken } = require('../middleware/auth');

// All routes require authentication
router.use(verifyToken);

/**
 * @route   POST /api/notifications/schedule
 * @desc    Schedule a notification for a shift
 * @access  Private
 */
router.post('/schedule', scheduleNotification);

/**
 * @route   GET /api/notifications/pending
 * @desc    Get all pending notifications due in next 1 hour
 * @access  Private
 */
router.get('/pending', getPendingNotifications);

/**
 * @route   POST /api/notifications/:id/mark-sent
 * @desc    Mark notification as sent
 * @access  Private
 */
router.post('/:id/mark-sent', markNotificationSent);

module.exports = router;

