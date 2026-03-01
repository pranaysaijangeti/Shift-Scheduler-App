const Notification = require('../models/Notification');
const Shift = require('../models/Shift');
const { asyncHandler } = require('../middleware/errorHandler');
const { subMinutes } = require('date-fns');

/**
 * @route   POST /api/notifications/schedule
 * @desc    Schedule a notification for a shift
 * @access  Private
 */
const scheduleNotification = asyncHandler(async (req, res) => {
  try {
    const { shiftId, reminderMinutesBefore } = req.body;

    // Validate input
    if (!shiftId) {
      return res.status(400).json({
        success: false,
        message: 'Shift ID is required',
        statusCode: 400
      });
    }

    if (reminderMinutesBefore === undefined || reminderMinutesBefore === null) {
      return res.status(400).json({
        success: false,
        message: 'Reminder minutes before is required',
        statusCode: 400
      });
    }

    const reminderMinutes = Number(reminderMinutesBefore);
    if (isNaN(reminderMinutes) || reminderMinutes < 0 || reminderMinutes > 1440) {
      return res.status(400).json({
        success: false,
        message: 'Reminder minutes must be between 0 and 1440',
        statusCode: 400
      });
    }

    // Find shift by ID
    const shift = await Shift.findById(shiftId);

    if (!shift) {
      return res.status(404).json({
        success: false,
        message: 'Shift not found',
        statusCode: 404
      });
    }

    // Verify ownership
    if (shift.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not own this shift.',
        statusCode: 403
      });
    }

    // Calculate notification trigger time (shiftDate + startTime - reminderMinutes)
    const shiftDate = new Date(shift.date);
    const [startHours, startMinutes] = shift.startTime.split(':').map(Number);
    
    // Set the shift start time
    const shiftStartDateTime = new Date(shiftDate);
    shiftStartDateTime.setHours(startHours, startMinutes, 0, 0);

    // Calculate trigger time (shift start time - reminder minutes)
    const triggerTime = subMinutes(shiftStartDateTime, reminderMinutes);

    // Check if trigger time is in the past
    if (triggerTime < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot schedule notification in the past',
        statusCode: 400
      });
    }

    // Check if notification already exists for this shift
    const existingNotification = await Notification.findOne({
      shiftId: shiftId,
      userId: req.user._id,
      status: 'pending'
    });

    if (existingNotification) {
      // Update existing notification
      existingNotification.reminderMinutesBefore = reminderMinutes;
      existingNotification.triggerTime = triggerTime;
      await existingNotification.save();

      return res.status(200).json({
        success: true,
        message: 'Notification updated successfully',
        notificationId: existingNotification._id.toString(),
        triggerTime: triggerTime
      });
    }

    // Create notification record
    const notification = await Notification.create({
      userId: req.user._id,
      shiftId: shiftId,
      reminderMinutesBefore: reminderMinutes,
      triggerTime: triggerTime,
      status: 'pending'
    });

    // Update shift with notification ID
    shift.notificationId = notification._id.toString();
    await shift.save();

    res.status(201).json({
      success: true,
      message: 'Notification scheduled successfully',
      notificationId: notification._id.toString(),
      triggerTime: triggerTime
    });
  } catch (error) {
    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid shift ID',
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

    console.error('Schedule notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while scheduling notification',
      statusCode: 500,
      error: process.env.NODE_ENV === 'development' ? { error: error.message } : {}
    });
  }
});

/**
 * @route   GET /api/notifications/pending
 * @desc    Get all pending notifications due in next 1 hour
 * @access  Private
 */
const getPendingNotifications = asyncHandler(async (req, res) => {
  try {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now

    // Find all notifications due in next 1 hour for current user
    const notifications = await Notification.find({
      userId: req.user._id,
      status: 'pending',
      triggerTime: {
        $gte: now,
        $lte: oneHourLater
      }
    })
      .populate('shiftId', 'title date startTime endTime location notes')
      .sort({ triggerTime: 1 }) // Sort by trigger time ascending
      .lean();

    // Format response with shift details
    const formattedNotifications = notifications.map(notification => ({
      id: notification._id,
      shiftId: notification.shiftId._id,
      shift: {
        title: notification.shiftId.title,
        date: notification.shiftId.date,
        startTime: notification.shiftId.startTime,
        endTime: notification.shiftId.endTime,
        location: notification.shiftId.location,
        notes: notification.shiftId.notes
      },
      reminderMinutesBefore: notification.reminderMinutesBefore,
      triggerTime: notification.triggerTime,
      createdAt: notification.createdAt
    }));

    res.status(200).json({
      success: true,
      notifications: formattedNotifications,
      count: formattedNotifications.length
    });
  } catch (error) {
    console.error('Get pending notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching pending notifications',
      statusCode: 500,
      error: process.env.NODE_ENV === 'development' ? { error: error.message } : {}
    });
  }
});

/**
 * @route   POST /api/notifications/:id/mark-sent
 * @desc    Mark notification as sent
 * @access  Private
 */
const markNotificationSent = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    // Find notification
    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
        statusCode: 404
      });
    }

    // Verify ownership
    if (notification.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not own this notification.',
        statusCode: 403
      });
    }

    // Mark notification as sent
    await notification.markAsSent();

    res.status(200).json({
      success: true,
      message: 'Notification marked as sent',
      notification: {
        id: notification._id,
        sent: notification.sent,
        sentAt: notification.sentAt,
        status: notification.status
      }
    });
  } catch (error) {
    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID',
        statusCode: 400
      });
    }

    console.error('Mark notification sent error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while marking notification as sent',
      statusCode: 500,
      error: process.env.NODE_ENV === 'development' ? { error: error.message } : {}
    });
  }
});

module.exports = {
  scheduleNotification,
  getPendingNotifications,
  markNotificationSent
};

