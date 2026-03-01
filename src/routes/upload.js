const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { uploadImage, uploadExcel, uploadText } = require('../controllers/uploadController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Image upload with OCR
router.post('/image', upload.single('file'), uploadImage);

// Excel upload
router.post('/excel', upload.single('file'), uploadExcel);

// Text file upload
router.post('/text', upload.single('file'), uploadText);

module.exports = router;

