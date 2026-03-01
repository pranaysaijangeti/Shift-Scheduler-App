const Shift = require('../models/Shift');
const { asyncHandler } = require('../middleware/errorHandler');
const { addDays, startOfDay } = require('date-fns');

/**
 * @route   GET /api/shifts
 * @desc    Get all shifts for current user with optional filters
 * @access  Private
 */
const getAllShifts = asyncHandler(async (req, res) => {
  try {
    const { startDate, endDate, limit = 50, skip = 0 } = req.query;

    // Build query
    const query = { userId: req.user._id };

    // Apply date filters
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    // Parse pagination
    const limitNum = Math.min(parseInt(limit) || 50, 100); // Max 100
    const skipNum = Math.max(parseInt(skip) || 0, 0);

    // Find shifts
    const shifts = await Shift.find(query)
      .sort({ date: 1, startTime: 1 }) // Sort by date ascending, then start time
      .limit(limitNum)
      .skip(skipNum)
      .lean();

    // Get total count for pagination
    const total = await Shift.countDocuments(query);

    res.status(200).json({
      success: true,
      shifts,
      pagination: {
        total,
        limit: limitNum,
        skip: skipNum,
        hasMore: skipNum + limitNum < total
      }
    });
  } catch (error) {
    console.error('Get all shifts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching shifts',
      statusCode: 500,
      error: process.env.NODE_ENV === 'development' ? { error: error.message } : {}
    });
  }
});

/**
 * @route   GET /api/shifts/upcoming
 * @desc    Get upcoming shifts (today to 30 days ahead)
 * @access  Private
 */
const getUpcomingShifts = asyncHandler(async (req, res) => {
  try {
    const today = startOfDay(new Date());
    const thirtyDaysLater = addDays(today, 30);

    // Find shifts from today to 30 days ahead
    const shifts = await Shift.find({
      userId: req.user._id,
      date: {
        $gte: today,
        $lte: thirtyDaysLater
      }
    })
      .sort({ date: 1, startTime: 1 }) // Sort by date ascending
      .lean();

    res.status(200).json({
      success: true,
      shifts,
      count: shifts.length
    });
  } catch (error) {
    console.error('Get upcoming shifts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching upcoming shifts',
      statusCode: 500,
      error: process.env.NODE_ENV === 'development' ? { error: error.message } : {}
    });
  }
});

/**
 * @route   GET /api/shifts/:id
 * @desc    Get shift by ID
 * @access  Private
 */
const getShiftById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    // Find shift by ID
    const shift = await Shift.findById(id);

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

    res.status(200).json({
      success: true,
      shift
    });
  } catch (error) {
    console.error('Get shift by ID error:', error);
    
    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid shift ID',
        statusCode: 400
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while fetching shift',
      statusCode: 500,
      error: process.env.NODE_ENV === 'development' ? { error: error.message } : {}
    });
  }
});

/**
 * @route   POST /api/shifts
 * @desc    Create a new shift
 * @access  Private
 */
const createShift = asyncHandler(async (req, res) => {
  try {
    const {
      title,
      date,
      startTime,
      endTime,
      location,
      notes,
      reminderMinutesBefore
    } = req.body;

    // Validate all inputs
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Title is required',
        statusCode: 400
      });
    }

    if (title.trim().length > 200) {
      return res.status(400).json({
        success: false,
        message: 'Title cannot exceed 200 characters',
        statusCode: 400
      });
    }

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required',
        statusCode: 400
      });
    }

    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format',
        statusCode: 400
      });
    }

    if (!startTime || typeof startTime !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Start time is required',
        statusCode: 400
      });
    }

    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime)) {
      return res.status(400).json({
        success: false,
        message: 'Start time must be in HH:MM format (e.g., 09:00)',
        statusCode: 400
      });
    }

    if (!endTime || typeof endTime !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'End time is required',
        statusCode: 400
      });
    }

    if (!timeRegex.test(endTime)) {
      return res.status(400).json({
        success: false,
        message: 'End time must be in HH:MM format (e.g., 17:00)',
        statusCode: 400
      });
    }

    // Validate end time is after start time
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    const startTotal = startHours * 60 + startMinutes;
    const endTotal = endHours * 60 + endMinutes;

    if (endTotal <= startTotal) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time',
        statusCode: 400
      });
    }

    // Validate optional fields
    if (location && location.length > 200) {
      return res.status(400).json({
        success: false,
        message: 'Location cannot exceed 200 characters',
        statusCode: 400
      });
    }

    if (notes && notes.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Notes cannot exceed 1000 characters',
        statusCode: 400
      });
    }

    if (reminderMinutesBefore !== undefined) {
      const reminder = Number(reminderMinutesBefore);
      if (isNaN(reminder) || reminder < 0 || reminder > 1440) {
        return res.status(400).json({
          success: false,
          message: 'Reminder minutes must be between 0 and 1440',
          statusCode: 400
        });
      }
    }

    // Create shift
    const shift = await Shift.create({
      userId: req.user._id,
      title: title.trim(),
      date: dateObj,
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      location: location ? location.trim() : undefined,
      notes: notes ? notes.trim() : undefined,
      reminderMinutesBefore: reminderMinutesBefore || 30
    });

    res.status(201).json({
      success: true,
      message: 'Shift created successfully',
      shift: {
        _id: shift._id,
        title: shift.title,
        date: shift.date,
        startTime: shift.startTime,
        endTime: shift.endTime,
        location: shift.location,
        notes: shift.notes,
        reminderMinutesBefore: shift.reminderMinutesBefore,
        alarmSet: shift.alarmSet,
        createdAt: shift.createdAt,
        updatedAt: shift.updatedAt
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

    console.error('Create shift error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating shift',
      statusCode: 500,
      error: process.env.NODE_ENV === 'development' ? { error: error.message } : {}
    });
  }
});

/**
 * @route   PUT /api/shifts/:id
 * @desc    Update a shift
 * @access  Private
 */
const updateShift = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    // Find shift and verify ownership
    const shift = await Shift.findById(id);

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

    // Prepare update data (exclude userId)
    const updateData = {};
    const allowedFields = ['title', 'date', 'startTime', 'endTime', 'location', 'notes', 'reminderMinutesBefore', 'alarmSet', 'calendarEventId', 'notificationId'];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    // Validate time format if provided
    if (updateData.startTime) {
      const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(updateData.startTime)) {
        return res.status(400).json({
          success: false,
          message: 'Start time must be in HH:MM format (e.g., 09:00)',
          statusCode: 400
        });
      }
    }

    if (updateData.endTime) {
      const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(updateData.endTime)) {
        return res.status(400).json({
          success: false,
          message: 'End time must be in HH:MM format (e.g., 17:00)',
          statusCode: 400
        });
      }
    }

    // Validate end time is after start time
    const startTime = updateData.startTime || shift.startTime;
    const endTime = updateData.endTime || shift.endTime;
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    const startTotal = startHours * 60 + startMinutes;
    const endTotal = endHours * 60 + endMinutes;

    if (endTotal <= startTotal) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time',
        statusCode: 400
      });
    }

    // Update shift
    const updatedShift = await Shift.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Shift updated successfully',
      shift: updatedShift
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

    console.error('Update shift error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating shift',
      statusCode: 500,
      error: process.env.NODE_ENV === 'development' ? { error: error.message } : {}
    });
  }
});

/**
 * @route   DELETE /api/shifts/:id
 * @desc    Delete a shift
 * @access  Private
 */
const deleteShift = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    // Find shift and verify ownership
    const shift = await Shift.findById(id);

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

    // Delete shift
    await Shift.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Shift deleted successfully'
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

    console.error('Delete shift error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting shift',
      statusCode: 500,
      error: process.env.NODE_ENV === 'development' ? { error: error.message } : {}
    });
  }
});

/**
 * @route   POST /api/shifts/:id/confirm
 * @desc    Confirm shift and set alarm
 * @access  Private
 */
const confirmShift = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { reminderMinutesBefore } = req.body;

    // Find shift
    const shift = await Shift.findById(id);

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

    // Prepare update data
    const updateData = {
      alarmSet: true
    };

    // Update reminderMinutesBefore if provided
    if (reminderMinutesBefore !== undefined) {
      const reminder = Number(reminderMinutesBefore);
      if (isNaN(reminder) || reminder < 0 || reminder > 1440) {
        return res.status(400).json({
          success: false,
          message: 'Reminder minutes must be between 0 and 1440',
          statusCode: 400
        });
      }
      updateData.reminderMinutesBefore = reminder;
    }

    // Update shift
    const updatedShift = await Shift.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Shift confirmed and alarm set',
      shift: updatedShift
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

    console.error('Confirm shift error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while confirming shift',
      statusCode: 500,
      error: process.env.NODE_ENV === 'development' ? { error: error.message } : {}
    });
  }
});

module.exports = {
  getAllShifts,
  getUpcomingShifts,
  getShiftById,
  createShift,
  updateShift,
  deleteShift,
  confirmShift
};
