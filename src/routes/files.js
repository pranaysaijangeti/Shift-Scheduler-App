const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { verifyToken } = require('../middleware/auth');
const {
  uploadFile,
  getUploadHistory,
  deleteUpload
} = require('../controllers/fileController');

/**
 * @route   POST /api/files/upload
 * @desc    Upload and process file (image, text, or Excel)
 * @access  Private (requires authentication)
 */
router.post('/upload', verifyToken, upload.single('file'), uploadFile);

/**
 * @route   GET /api/files/history
 * @desc    Get upload history for current user
 * @access  Private (requires authentication)
 */
router.get('/history', verifyToken, getUploadHistory);

/**
 * @route   DELETE /api/files/:uploadId
 * @desc    Delete upload record and file
 * @access  Private (requires authentication)
 */
router.delete('/:uploadId', verifyToken, deleteUpload);

module.exports = router;

