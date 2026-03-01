/**
 * Validation Utility Functions
 * Provides validation functions for forms and user input
 */

/**
 * Email validation regex pattern
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate email address format
 * @param email - Email string to validate
 * @returns Boolean indicating if email is valid
 */
export const validateEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  // Trim whitespace
  const trimmedEmail = email.trim();
  
  // Check basic format
  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return false;
  }
  
  // Check length (reasonable limits)
  if (trimmedEmail.length > 254) {
    return false;
  }
  
  return true;
};

/**
 * Validate password strength
 * @param password - Password string to validate
 * @param minLength - Minimum length (default: 6)
 * @returns Boolean indicating if password meets requirements
 */
export const validatePassword = (password: string, minLength: number = 6): boolean => {
  if (!password || typeof password !== 'string') {
    return false;
  }
  
  // Check minimum length
  if (password.length < minLength) {
    return false;
  }
  
  return true;
};

/**
 * Validate date and time combination
 * Checks if start time is before end time and dates are valid
 * @param date - Date string (YYYY-MM-DD) or Date object
 * @param startTime - Start time string (HH:MM) or Date object
 * @param endTime - End time string (HH:MM) or Date object
 * @returns Boolean indicating if date/time combination is valid
 */
export const validateDateTime = (
  date: string | Date,
  startTime: string | Date,
  endTime: string | Date
): boolean => {
  try {
    // Parse date
    let dateObj: Date;
    if (typeof date === 'string') {
      dateObj = new Date(date);
    } else {
      dateObj = date;
    }

    if (isNaN(dateObj.getTime())) {
      return false;
    }

    // Parse start time
    let startDate: Date;
    if (typeof startTime === 'string') {
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      if (isNaN(startHours) || isNaN(startMinutes)) {
        return false;
      }
      startDate = new Date(dateObj);
      startDate.setHours(startHours, startMinutes, 0, 0);
    } else {
      startDate = startTime;
    }

    if (isNaN(startDate.getTime())) {
      return false;
    }

    // Parse end time
    let endDate: Date;
    if (typeof endTime === 'string') {
      const [endHours, endMinutes] = endTime.split(':').map(Number);
      if (isNaN(endHours) || isNaN(endMinutes)) {
        return false;
      }
      endDate = new Date(dateObj);
      endDate.setHours(endHours, endMinutes, 0, 0);
    } else {
      endDate = endTime;
    }

    if (isNaN(endDate.getTime())) {
      return false;
    }

    // Check if start time is before end time
    if (startDate >= endDate) {
      return false;
    }

    // Check if times are within valid range (00:00 - 23:59)
    const startHours = startDate.getHours();
    const startMinutes = startDate.getMinutes();
    const endHours = endDate.getHours();
    const endMinutes = endDate.getMinutes();

    if (
      startHours < 0 || startHours > 23 ||
      startMinutes < 0 || startMinutes > 59 ||
      endHours < 0 || endHours > 23 ||
      endMinutes < 0 || endMinutes > 59
    ) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error validating date/time:', error);
    return false;
  }
};

/**
 * Validate file size
 * @param fileSizeInMB - File size in megabytes
 * @param maxSizeInMB - Maximum allowed size in MB (default: 10)
 * @returns Boolean indicating if file size is within limit
 */
export const validateFileSize = (fileSizeInMB: number, maxSizeInMB: number = 10): boolean => {
  if (typeof fileSizeInMB !== 'number' || isNaN(fileSizeInMB)) {
    return false;
  }

  if (fileSizeInMB < 0) {
    return false;
  }

  if (fileSizeInMB > maxSizeInMB) {
    return false;
  }

  return true;
};

/**
 * Validate phone number format
 * Supports various formats: (123) 456-7890, 123-456-7890, 1234567890, +1 123 456 7890
 * @param phone - Phone number string to validate
 * @returns Boolean indicating if phone number format is valid
 */
export const validatePhone = (phone: string): boolean => {
  if (!phone || typeof phone !== 'string') {
    return false;
  }

  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Check if it's a valid length (10-15 digits, allowing for country codes)
  const digitsOnly = cleaned.replace(/\+/g, '');
  if (digitsOnly.length < 10 || digitsOnly.length > 15) {
    return false;
  }

  return true;
};

/**
 * Validate time format (HH:MM or HH:MM:SS)
 * @param time - Time string to validate
 * @returns Boolean indicating if time format is valid
 */
export const validateTime = (time: string): boolean => {
  if (!time || typeof time !== 'string') {
    return false;
  }

  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
  return timeRegex.test(time.trim());
};

/**
 * Validate date string format (YYYY-MM-DD)
 * @param dateString - Date string to validate
 * @returns Boolean indicating if date format is valid
 */
export const validateDateString = (dateString: string): boolean => {
  if (!dateString || typeof dateString !== 'string') {
    return false;
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }

  // Check if it's a valid date
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return false;
  }

  // Check if the date string matches the parsed date (prevents invalid dates like 2025-13-45)
  const [year, month, day] = dateString.split('-').map(Number);
  if (
    date.getFullYear() !== year ||
    date.getMonth() + 1 !== month ||
    date.getDate() !== day
  ) {
    return false;
  }

  return true;
};

/**
 * Validate required field
 * @param value - Value to check
 * @returns Boolean indicating if value is not empty
 */
export const validateRequired = (value: string | number | null | undefined): boolean => {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  if (typeof value === 'number') {
    return !isNaN(value);
  }

  return true;
};

/**
 * Validate name (allows letters, spaces, hyphens, apostrophes)
 * @param name - Name string to validate
 * @param minLength - Minimum length (default: 2)
 * @param maxLength - Maximum length (default: 50)
 * @returns Boolean indicating if name is valid
 */
export const validateName = (name: string, minLength: number = 2, maxLength: number = 50): boolean => {
  if (!name || typeof name !== 'string') {
    return false;
  }

  const trimmed = name.trim();
  
  if (trimmed.length < minLength || trimmed.length > maxLength) {
    return false;
  }

  // Allow letters, spaces, hyphens, apostrophes
  const nameRegex = /^[a-zA-Z\s'-]+$/;
  return nameRegex.test(trimmed);
};

