const express = require('express');
const router = express.Router();
const {
  getAllShifts,
  getUpcomingShifts,
  getShiftById,
  createShift,
  updateShift,
  deleteShift,
  confirmShift
} = require('../controllers/shiftController');
const { verifyToken } = require('../middleware/auth');

// All routes require authentication
router.use(verifyToken);

/**
 * @route   GET /api/shifts/upcoming
 * @desc    Get upcoming shifts (next 30 days)
 * @access  Private
 */
router.get('/upcoming', getUpcomingShifts);

/**
 * @route   GET /api/shifts
 * @desc    Get all shifts with optional filters
 * @access  Private
 */
router.get('/', getAllShifts);

/**
 * @route   POST /api/shifts
 * @desc    Create a new shift
 * @access  Private
 */
router.post('/', createShift);

/**
 * @route   POST /api/shifts/:id/confirm
 * @desc    Confirm shift and set alarm
 * @access  Private
 */
router.post('/:id/confirm', confirmShift);

/**
 * @route   GET /api/shifts/:id
 * @desc    Get shift by ID
 * @access  Private
 */
router.get('/:id', getShiftById);

/**
 * @route   PUT /api/shifts/:id
 * @desc    Update a shift
 * @access  Private
 */
router.put('/:id', updateShift);

/**
 * @route   DELETE /api/shifts/:id
 * @desc    Delete a shift
 * @access  Private
 */
router.delete('/:id', deleteShift);

module.exports = router;
