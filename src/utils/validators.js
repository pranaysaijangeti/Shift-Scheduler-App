const Joi = require('joi');

/**
 * Validation schemas using Joi
 */
const validators = {
  // User registration
  register: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
  }),

  // User login
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  // Shift creation
  createShift: Joi.object({
    title: Joi.string().min(1).max(200).required(),
    date: Joi.date().required(),
    startTime: Joi.string().pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).required()
      .messages({ 'string.pattern.base': 'Start time must be in HH:MM format (e.g., 09:00)' }),
    endTime: Joi.string().pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).required()
      .messages({ 'string.pattern.base': 'End time must be in HH:MM format (e.g., 17:00)' }),
    location: Joi.string().max(200).allow(''),
    notes: Joi.string().max(1000).allow(''),
    reminderMinutesBefore: Joi.number().min(0).max(1440),
    alarmSet: Joi.boolean(),
    calendarEventId: Joi.string().allow(''),
    notificationId: Joi.string().allow(''),
    extractedFrom: Joi.string().valid('image', 'text', 'excel'),
    fileName: Joi.string().allow('')
  }),

  // Shift update
  updateShift: Joi.object({
    title: Joi.string().min(1).max(200),
    date: Joi.date(),
    startTime: Joi.string().pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
      .messages({ 'string.pattern.base': 'Start time must be in HH:MM format (e.g., 09:00)' }),
    endTime: Joi.string().pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
      .messages({ 'string.pattern.base': 'End time must be in HH:MM format (e.g., 17:00)' }),
    location: Joi.string().max(200).allow(''),
    notes: Joi.string().max(1000).allow(''),
    reminderMinutesBefore: Joi.number().min(0).max(1440),
    alarmSet: Joi.boolean(),
    calendarEventId: Joi.string().allow(''),
    notificationId: Joi.string().allow('')
  }),

  // User registration (updated)
  register: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    phone: Joi.string().pattern(/^[\d\s\-\+\(\)]+$/).allow(''),
    timezone: Joi.string().allow(''),
    defaultReminderMinutes: Joi.number().min(0).max(1440)
  })
};

/**
 * Validate request data
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    next();
  };
};

/**
 * Utility validation functions
 */

/**
 * Validate email format
 * @param {String} email - Email address to validate
 * @returns {Boolean} True if valid, false otherwise
 */
const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validate password strength
 * @param {String} password - Password to validate
 * @returns {Boolean} True if valid (min 6 chars), false otherwise
 */
const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return false;
  }
  
  return password.length >= 6;
};

/**
 * Validate date and time format
 * @param {String|Date} date - ISO date string or Date object
 * @param {String} time - Time in HH:MM format
 * @returns {Boolean} True if both are valid, false otherwise
 */
const validateDateTime = (date, time) => {
  // Validate date (ISO format or Date object)
  let dateValid = false;
  if (date instanceof Date) {
    dateValid = !isNaN(date.getTime());
  } else if (typeof date === 'string') {
    const dateObj = new Date(date);
    // Accept ISO format (with T) or YYYY-MM-DD format
    dateValid = !isNaN(dateObj.getTime()) && (date.includes('T') || /^\d{4}-\d{2}-\d{2}$/.test(date));
  }
  
  // Validate time (HH:MM format)
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  const timeValid = typeof time === 'string' && timeRegex.test(time);
  
  return dateValid && timeValid;
};

/**
 * Validate file MIME type
 * @param {String} mimeType - MIME type to validate
 * @returns {Boolean} True if allowed (image, text, xlsx), false otherwise
 */
const validateFileType = (mimeType) => {
  if (!mimeType || typeof mimeType !== 'string') {
    return false;
  }
  
  const allowedTypes = [
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    // Text files
    'text/plain',
    'text/csv',
    // Excel files
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'application/vnd.ms-excel.sheet.macroEnabled.12', // .xlsm
    'application/vnd.ms-excel.sheet.binary.macroEnabled.12' // .xlsb
  ];
  
  return allowedTypes.includes(mimeType.toLowerCase());
};

module.exports = {
  validators,
  validate,
  validateEmail,
  validatePassword,
  validateDateTime,
  validateFileType
};

