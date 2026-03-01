const path = require('path');
const fs = require('fs');
const UploadedFile = require('../models/UploadedFile');
const { extractShiftsFromImage, normalizeShiftData } = require('../utils/ocrService');
const { detectFileFormat } = require('../utils/fileParser');
const { asyncHandler } = require('../middleware/errorHandler');
const { validateFileType } = require('../utils/validators');
const { MAX_FILE_SIZE } = require('../config/constants');

/**
 * Determine file type from MIME type or extension
 * @param {String} mimeType - MIME type
 * @param {String} filename - File name
 * @returns {String} File type ('image', 'text', 'excel')
 */
const determineFileType = (mimeType, filename) => {
  const ext = path.extname(filename).toLowerCase();
  
  // Check MIME type first
  if (mimeType) {
    if (mimeType.startsWith('image/')) {
      return 'image';
    }
    if (mimeType === 'text/plain' || mimeType === 'text/csv') {
      return 'text';
    }
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType === 'application/vnd.ms-excel') {
      return 'excel';
    }
  }
  
  // Fallback to extension
  const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const textExts = ['.txt', '.csv'];
  const excelExts = ['.xlsx', '.xls'];
  
  if (imageExts.includes(ext)) return 'image';
  if (textExts.includes(ext)) return 'text';
  if (excelExts.includes(ext)) return 'excel';
  
  return null;
};

/**
 * @route   POST /api/files/upload
 * @desc    Upload and process file (image, text, or Excel)
 * @access  Private
 */
const uploadFile = asyncHandler(async (req, res) => {
  try {
    // Get file from req.file (multer)
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
        statusCode: 400
      });
    }

    const file = req.file;

    // Validate file type
    const fileType = determineFileType(file.mimetype, file.originalname);
    if (!fileType) {
      // Clean up uploaded file
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Only image, text, and Excel files are allowed.',
        statusCode: 400
      });
    }

    // Validate file size (multer already handles this, but double-check)
    if (file.size > MAX_FILE_SIZE) {
      // Clean up uploaded file
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      return res.status(400).json({
        success: false,
        message: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        statusCode: 400
      });
    }

    // Validate file type using utility function
    if (!validateFileType(file.mimetype)) {
      // Clean up uploaded file
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      return res.status(400).json({
        success: false,
        message: 'File type not allowed',
        statusCode: 400
      });
    }

    // Create UploadedFile record with status='pending'
    const uploadedFile = await UploadedFile.create({
      userId: req.user._id,
      fileName: file.originalname,
      storedFileName: file.filename, // Store multer-generated filename for deletion
      fileType: fileType,
      status: 'pending'
    });

    let extractedShifts = [];
    let errorMessage = null;

    try {
      // Call appropriate parser based on file type
      if (fileType === 'image') {
        // Use OCR service for images
        extractedShifts = await extractShiftsFromImage(file.path);
      } else {
        // Use file parser for text and Excel files
        extractedShifts = await detectFileFormat(file.path, fileType);
      }

      // Normalize shift data
      const normalizedShifts = normalizeShiftData(extractedShifts);

      // Update uploaded file record with extracted shifts count
      uploadedFile.shiftsExtracted = normalizedShifts.length;
      uploadedFile.status = normalizedShifts.length > 0 ? 'pending' : 'error';
      if (normalizedShifts.length === 0) {
        uploadedFile.errorMessage = 'No shifts could be extracted from the file';
      }
      await uploadedFile.save();

      // Return extracted shifts for user review (don't save to Shift collection yet)
      res.status(200).json({
        success: true,
        shifts: normalizedShifts,
        uploadFileId: uploadedFile._id.toString(),
        fileName: file.originalname,
        fileType: fileType,
        shiftsCount: normalizedShifts.length
      });
    } catch (parseError) {
      // Handle parsing errors
      errorMessage = parseError.message || 'Error processing file';
      console.error('File processing error:', parseError);

      // Update uploaded file with error status
      await uploadedFile.markAsError(errorMessage);

      // Clean up uploaded file on error
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      return res.status(500).json({
        success: false,
        message: 'Error processing file',
        error: errorMessage,
        statusCode: 500,
        uploadFileId: uploadedFile._id.toString()
      });
    }
  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up uploaded file on error
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: 'Server error during file upload',
      statusCode: 500,
      error: process.env.NODE_ENV === 'development' ? { error: error.message } : {}
    });
  }
});

/**
 * @route   GET /api/files/history
 * @desc    Get upload history for current user
 * @access  Private
 */
const getUploadHistory = asyncHandler(async (req, res) => {
  try {
    // Get all uploads for this user
    const uploads = await UploadedFile.find({ userId: req.user._id })
      .sort({ uploadedAt: -1 }) // Most recent first
      .select('fileName fileType uploadedAt shiftsExtracted status errorMessage')
      .lean();

    res.status(200).json({
      success: true,
      uploads: uploads.map(upload => ({
        id: upload._id,
        fileName: upload.fileName,
        fileType: upload.fileType,
        uploadedAt: upload.uploadedAt,
        shiftsExtracted: upload.shiftsExtracted,
        status: upload.status,
        errorMessage: upload.errorMessage || undefined
      })),
      count: uploads.length
    });
  } catch (error) {
    console.error('Get upload history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching upload history',
      statusCode: 500,
      error: process.env.NODE_ENV === 'development' ? { error: error.message } : {}
    });
  }
});

/**
 * @route   DELETE /api/files/:uploadId
 * @desc    Delete upload record and file
 * @access  Private
 */
const deleteUpload = asyncHandler(async (req, res) => {
  try {
    const { uploadId } = req.params;

    // Find upload record
    const uploadedFile = await UploadedFile.findOne({
      _id: uploadId,
      userId: req.user._id // Ensure user owns this upload
    });

    if (!uploadedFile) {
      return res.status(404).json({
        success: false,
        message: 'Upload record not found',
        statusCode: 404
      });
    }

    // Get file path using stored filename
    const { UPLOAD_PATH } = require('../config/constants');
    let filePath = null;

    // Try to use storedFileName first (multer-generated filename)
    if (uploadedFile.storedFileName) {
      filePath = path.join(UPLOAD_PATH, uploadedFile.storedFileName);
    } else {
      // Fallback to original filename (less reliable)
      filePath = path.join(UPLOAD_PATH, uploadedFile.fileName);
    }

    // Delete file from server if it exists
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (fileError) {
        console.warn('Error deleting file:', fileError);
        // Continue even if file deletion fails
      }
    }

    // Delete upload record from MongoDB
    await UploadedFile.findByIdAndDelete(uploadId);

    res.status(200).json({
      success: true,
      message: 'Upload record and file deleted successfully'
    });
  } catch (error) {
    console.error('Delete upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting upload',
      statusCode: 500,
      error: process.env.NODE_ENV === 'development' ? { error: error.message } : {}
    });
  }
});

module.exports = {
  uploadFile,
  getUploadHistory,
  deleteUpload
};

