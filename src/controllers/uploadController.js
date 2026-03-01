const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const Tesseract = require('tesseract.js');
const { successResponse, errorResponse } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');
const Shift = require('../models/Shift');

/**
 * @route   POST /api/upload/image
 * @desc    Upload and process image with OCR
 * @access  Private
 */
const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    return errorResponse(res, 'No file uploaded', 400);
  }

  const filePath = req.file.path;
  
  try {
    // Perform OCR on the image
    const { data: { text } } = await Tesseract.recognize(filePath, 'eng', {
      logger: m => console.log(m)
    });

    // TODO: Parse the OCR text to extract shift information
    // This will need custom parsing logic based on your shift schedule format

    successResponse(res, 'Image processed successfully', {
      text,
      filePath: req.file.filename
    });
  } catch (error) {
    // Clean up uploaded file on error
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw error;
  }
});

/**
 * @route   POST /api/upload/excel
 * @desc    Upload and process Excel file
 * @access  Private
 */
const uploadExcel = asyncHandler(async (req, res) => {
  if (!req.file) {
    return errorResponse(res, 'No file uploaded', 400);
  }

  const filePath = req.file.path;
  
  try {
    // Read Excel file
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    // TODO: Parse Excel data and create shifts
    // This will need custom parsing logic based on your Excel format

    successResponse(res, 'Excel file processed successfully', {
      rows: data.length,
      data: data.slice(0, 10) // Return first 10 rows as sample
    });
  } catch (error) {
    // Clean up uploaded file on error
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw error;
  }
});

/**
 * @route   POST /api/upload/text
 * @desc    Upload and process text file
 * @access  Private
 */
const uploadText = asyncHandler(async (req, res) => {
  if (!req.file) {
    return errorResponse(res, 'No file uploaded', 400);
  }

  const filePath = req.file.path;
  
  try {
    // Read text file
    const text = fs.readFileSync(filePath, 'utf8');

    // TODO: Parse text and extract shift information
    // This will need custom parsing logic based on your text format

    successResponse(res, 'Text file processed successfully', {
      text: text.substring(0, 500) // Return first 500 characters as sample
    });
  } catch (error) {
    // Clean up uploaded file on error
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw error;
  }
});

module.exports = {
  uploadImage,
  uploadExcel,
  uploadText
};

