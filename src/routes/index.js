const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const shiftRoutes = require('./shifts');
const uploadRoutes = require('./upload');
const userRoutes = require('./users');
const fileRoutes = require('./files');
const notificationRoutes = require('./notifications');

// Mount routes
router.use('/auth', authRoutes);
router.use('/shifts', shiftRoutes);
router.use('/upload', uploadRoutes);
router.use('/users', userRoutes);
router.use('/files', fileRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router;

