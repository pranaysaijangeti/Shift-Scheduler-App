const User = require('../models/User');
const UserPreferences = require('../models/UserPreferences');
const { asyncHandler } = require('../middleware/errorHandler');
const { validateEmail } = require('../utils/validators');

/**
 * @route   GET /api/users/profile
 * @desc    Get user profile and preferences
 * @access  Private
 */
const getProfile = asyncHandler(async (req, res) => {
  try {
    // Find user by ID from req.user
    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        statusCode: 404
      });
    }

    // Find user preferences for this user
    let preferences = await UserPreferences.findOne({ userId: req.user._id });

    // If preferences don't exist, create default preferences
    if (!preferences) {
      preferences = await UserPreferences.create({
        userId: req.user._id
      });
    }

    // Return user data + preferences
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        timezone: user.timezone,
        defaultReminderMinutes: user.defaultReminderMinutes,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      preferences: {
        notificationType: preferences.notificationType,
        reminderTime: preferences.reminderTime,
        enableCalendarSync: preferences.enableCalendarSync,
        enableNotifications: preferences.enableNotifications,
        autoCreateCalendarEvents: preferences.autoCreateCalendarEvents,
        updatedAt: preferences.updatedAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile',
      statusCode: 500,
      error: process.env.NODE_ENV === 'development' ? { error: error.message } : {}
    });
  }
});

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  try {
    const { name, phone, timezone, defaultReminderMinutes } = req.body;

    // Validate input
    const updateData = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Name must be at least 2 characters',
          statusCode: 400
        });
      }
      if (name.trim().length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Name cannot exceed 100 characters',
          statusCode: 400
        });
      }
      updateData.name = name.trim();
    }

    if (phone !== undefined) {
      if (phone !== null && phone !== '') {
        // Validate phone format
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        if (!phoneRegex.test(phone)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid phone number format',
            statusCode: 400
          });
        }
        updateData.phone = phone.trim();
      } else {
        updateData.phone = null;
      }
    }

    if (timezone !== undefined) {
      if (typeof timezone !== 'string' || timezone.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Timezone must be a valid string',
          statusCode: 400
        });
      }
      updateData.timezone = timezone.trim();
    }

    if (defaultReminderMinutes !== undefined) {
      const reminderMinutes = Number(defaultReminderMinutes);
      if (isNaN(reminderMinutes) || reminderMinutes < 0 || reminderMinutes > 1440) {
        return res.status(400).json({
          success: false,
          message: 'Default reminder minutes must be between 0 and 1440',
          statusCode: 400
        });
      }
      updateData.defaultReminderMinutes = reminderMinutes;
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update',
        statusCode: 400
      });
    }

    // Update user in MongoDB
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        statusCode: 404
      });
    }

    // Return updated user
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        timezone: user.timezone,
        defaultReminderMinutes: user.defaultReminderMinutes,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
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

    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile',
      statusCode: 500,
      error: process.env.NODE_ENV === 'development' ? { error: error.message } : {}
    });
  }
});

/**
 * @route   PUT /api/users/preferences
 * @desc    Update user preferences
 * @access  Private
 */
const updatePreferences = asyncHandler(async (req, res) => {
  try {
    const {
      notificationType,
      reminderTime,
      enableCalendarSync,
      enableNotifications,
      autoCreateCalendarEvents
    } = req.body;

    // Validate input
    const updateData = {};

    if (notificationType !== undefined) {
      const validTypes = ['sound', 'vibration', 'silent'];
      if (!validTypes.includes(notificationType)) {
        return res.status(400).json({
          success: false,
          message: 'notificationType must be one of: sound, vibration, silent',
          statusCode: 400
        });
      }
      updateData.notificationType = notificationType;
    }

    if (reminderTime !== undefined) {
      const reminder = Number(reminderTime);
      if (isNaN(reminder) || reminder < 0 || reminder > 1440) {
        return res.status(400).json({
          success: false,
          message: 'Reminder time must be between 0 and 1440 minutes',
          statusCode: 400
        });
      }
      updateData.reminderTime = reminder;
    }

    if (enableCalendarSync !== undefined) {
      if (typeof enableCalendarSync !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'enableCalendarSync must be a boolean',
          statusCode: 400
        });
      }
      updateData.enableCalendarSync = enableCalendarSync;
    }

    if (enableNotifications !== undefined) {
      if (typeof enableNotifications !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'enableNotifications must be a boolean',
          statusCode: 400
        });
      }
      updateData.enableNotifications = enableNotifications;
    }

    if (autoCreateCalendarEvents !== undefined) {
      if (typeof autoCreateCalendarEvents !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'autoCreateCalendarEvents must be a boolean',
          statusCode: 400
        });
      }
      updateData.autoCreateCalendarEvents = autoCreateCalendarEvents;
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update',
        statusCode: 400
      });
    }

    // Find or create UserPreferences for user
    let preferences = await UserPreferences.findOne({ userId: req.user._id });

    if (!preferences) {
      // Create new preferences with update data
      preferences = await UserPreferences.create({
        userId: req.user._id,
        ...updateData
      });
    } else {
      // Update existing preferences
      Object.assign(preferences, updateData);
      await preferences.save();
    }

    // Return updated preferences
    res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: {
        notificationType: preferences.notificationType,
        reminderTime: preferences.reminderTime,
        enableCalendarSync: preferences.enableCalendarSync,
        enableNotifications: preferences.enableNotifications,
        autoCreateCalendarEvents: preferences.autoCreateCalendarEvents,
        updatedAt: preferences.updatedAt
      }
    });
  } catch (error) {
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

    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating preferences',
      statusCode: 500,
      error: process.env.NODE_ENV === 'development' ? { error: error.message } : {}
    });
  }
});

module.exports = {
  getProfile,
  updateProfile,
  updatePreferences
};

