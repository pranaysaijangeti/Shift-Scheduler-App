import { format, parse, parseISO, isValid, addDays, differenceInDays, isToday as dateFnsIsToday } from 'date-fns';

/**
 * Date Helper Utility Functions
 * Provides date formatting, parsing, and manipulation functions
 */

/**
 * Format date to readable string
 * @param date - Date object, string, or timestamp
 * @param formatStr - Optional format string (default: 'MMM dd, yyyy')
 * @returns Formatted date string (e.g., 'Dec 15, 2025')
 */
export const formatDate = (date: Date | string | number, formatStr: string = 'MMM dd, yyyy'): string => {
  try {
    let dateObj: Date;
    
    if (typeof date === 'string') {
      // Try parsing ISO string first
      dateObj = parseISO(date);
      // If invalid, try parsing other formats
      if (!isValid(dateObj)) {
        dateObj = new Date(date);
      }
    } else if (typeof date === 'number') {
      dateObj = new Date(date);
    } else {
      dateObj = date;
    }

    if (!isValid(dateObj)) {
      throw new Error('Invalid date');
    }

    return format(dateObj, formatStr);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

/**
 * Format time to readable string
 * @param time - Time string (HH:MM or HH:MM:SS) or Date object
 * @returns Formatted time string (e.g., '09:00 AM')
 */
export const formatTime = (time: string | Date): string => {
  try {
    let dateObj: Date;
    
    if (typeof time === 'string') {
      // Parse time string (HH:MM or HH:MM:SS)
      const timeParts = time.split(':');
      if (timeParts.length < 2) {
        throw new Error('Invalid time format');
      }
      
      const hours = parseInt(timeParts[0], 10);
      const minutes = parseInt(timeParts[1], 10);
      
      // Create a date object with today's date and the specified time
      dateObj = new Date();
      dateObj.setHours(hours, minutes, 0, 0);
    } else {
      dateObj = time;
    }

    if (!isValid(dateObj)) {
      throw new Error('Invalid time');
    }

    return format(dateObj, 'hh:mm a');
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Invalid Time';
  }
};

/**
 * Parse various date formats to Date object
 * Supports: ISO strings, YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY, timestamps
 * @param dateString - Date string in various formats
 * @returns Date object or null if invalid
 */
export const parseDate = (dateString: string | Date | number): Date | null => {
  try {
    if (dateString instanceof Date) {
      return isValid(dateString) ? dateString : null;
    }

    if (typeof dateString === 'number') {
      const date = new Date(dateString);
      return isValid(date) ? date : null;
    }

    // Try ISO format first
    let date = parseISO(dateString);
    if (isValid(date)) {
      return date;
    }

    // Try YYYY-MM-DD format
    date = parse(dateString, 'yyyy-MM-dd', new Date());
    if (isValid(date)) {
      return date;
    }

    // Try MM/DD/YYYY format
    date = parse(dateString, 'MM/dd/yyyy', new Date());
    if (isValid(date)) {
      return date;
    }

    // Try DD/MM/YYYY format
    date = parse(dateString, 'dd/MM/yyyy', new Date());
    if (isValid(date)) {
      return date;
    }

    // Fallback to native Date parsing
    date = new Date(dateString);
    return isValid(date) ? date : null;
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
  }
};

/**
 * Parse time string (AM/PM) to 24-hour format
 * @param timeString - Time string in 12-hour format (e.g., '09:00 AM', '5:30 PM')
 * @returns Time string in 24-hour format (e.g., '09:00', '17:30')
 */
export const parseTime = (timeString: string): string | null => {
  try {
    // Remove extra spaces and convert to uppercase
    const cleaned = timeString.trim().toUpperCase();
    
    // Match patterns like "9:00 AM", "09:00 AM", "5:30 PM", etc.
    const timeRegex = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/;
    const match = cleaned.match(timeRegex);
    
    if (!match) {
      // If already in 24-hour format, return as is
      const hour24Regex = /^(\d{1,2}):(\d{2})$/;
      const hour24Match = cleaned.match(hour24Regex);
      if (hour24Match) {
        const hours = parseInt(hour24Match[1], 10);
        const minutes = hour24Match[2];
        if (hours >= 0 && hours <= 23) {
          return `${hours.toString().padStart(2, '0')}:${minutes}`;
        }
      }
      return null;
    }

    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const period = match[3];

    // Convert to 24-hour format
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }

    // Validate hours
    if (hours < 0 || hours > 23) {
      return null;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  } catch (error) {
    console.error('Error parsing time:', error);
    return null;
  }
};

/**
 * Check if date is today
 * @param date - Date object, string, or timestamp
 * @returns Boolean indicating if date is today
 */
export const isToday = (date: Date | string | number): boolean => {
  try {
    const dateObj = parseDate(date);
    if (!dateObj) {
      return false;
    }
    return dateFnsIsToday(dateObj);
  } catch (error) {
    console.error('Error checking if today:', error);
    return false;
  }
};

/**
 * Get today's date as YYYY-MM-DD string
 * @returns Date string in YYYY-MM-DD format
 */
export const getTodayDateString = (): string => {
  return format(new Date(), 'yyyy-MM-dd');
};

/**
 * Add days to a date
 * @param date - Date object, string, or timestamp
 * @param days - Number of days to add (can be negative)
 * @returns New Date object with days added
 */
export const addDaysToDate = (date: Date | string | number, days: number): Date => {
  try {
    const dateObj = parseDate(date);
    if (!dateObj) {
      throw new Error('Invalid date');
    }
    return addDays(dateObj, days);
  } catch (error) {
    console.error('Error adding days to date:', error);
    throw new Error('Failed to add days to date');
  }
};

/**
 * Get difference in days between two dates
 * @param date1 - First date (Date object, string, or timestamp)
 * @param date2 - Second date (Date object, string, or timestamp)
 * @returns Number of days difference (positive if date1 is after date2)
 */
export const getDaysDifference = (date1: Date | string | number, date2: Date | string | number): number => {
  try {
    const dateObj1 = parseDate(date1);
    const dateObj2 = parseDate(date2);
    
    if (!dateObj1 || !dateObj2) {
      throw new Error('Invalid date(s)');
    }

    return differenceInDays(dateObj1, dateObj2);
  } catch (error) {
    console.error('Error calculating days difference:', error);
    throw new Error('Failed to calculate days difference');
  }
};

/**
 * Format date and time together
 * @param date - Date object, string, or timestamp
 * @param time - Time string (HH:MM) or Date object
 * @returns Formatted string (e.g., 'Dec 15, 2025 at 09:00 AM')
 */
export const formatDateTime = (date: Date | string | number, time: string | Date): string => {
  const formattedDate = formatDate(date);
  const formattedTime = formatTime(time);
  return `${formattedDate} at ${formattedTime}`;
};

/**
 * Get relative time string (e.g., "in 2 days", "3 days ago")
 * @param date - Date object, string, or timestamp
 * @returns Relative time string
 */
export const getRelativeTime = (date: Date | string | number): string => {
  try {
    const dateObj = parseDate(date);
    if (!dateObj) {
      return 'Invalid Date';
    }

    const now = new Date();
    const diffInDays = getDaysDifference(dateObj, now);

    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Tomorrow';
    } else if (diffInDays === -1) {
      return 'Yesterday';
    } else if (diffInDays > 0) {
      return `in ${diffInDays} day${diffInDays > 1 ? 's' : ''}`;
    } else {
      return `${Math.abs(diffInDays)} day${Math.abs(diffInDays) > 1 ? 's' : ''} ago`;
    }
  } catch (error) {
    console.error('Error getting relative time:', error);
    return 'Invalid Date';
  }
};

