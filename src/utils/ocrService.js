const Tesseract = require('tesseract.js');
const { format, isValid, parseISO } = require('date-fns');

/**
 * Parse date string to ISO format (YYYY-MM-DD)
 * Handles various date formats: 12/15, 12-15, Monday, Dec 15, etc.
 * @param {String} dateString - Date string in various formats
 * @param {Date} referenceDate - Reference date for relative dates (defaults to today)
 * @returns {String|null} ISO date string (YYYY-MM-DD) or null if invalid
 */
const parseDate = (dateString, referenceDate = new Date()) => {
  if (!dateString || typeof dateString !== 'string') {
    return null;
  }

  const trimmed = dateString.trim();
  if (!trimmed) return null;

  try {
    // Handle MM/DD or MM-DD format (e.g., "12/15", "12-15")
    const slashDashMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})(?:\/(\d{2,4}))?$/);
    if (slashDashMatch) {
      let month = parseInt(slashDashMatch[1]);
      let day = parseInt(slashDashMatch[2]);
      let year = slashDashMatch[3] ? parseInt(slashDashMatch[3]) : referenceDate.getFullYear();

      // Handle 2-digit year
      if (slashDashMatch[3] && slashDashMatch[3].length === 2) {
        const currentYear = referenceDate.getFullYear();
        const century = Math.floor(currentYear / 100) * 100;
        year = century + parseInt(slashDashMatch[3]);
        // If year is too far in the future, assume previous century
        if (year > currentYear + 10) {
          year -= 100;
        }
      }

      // Determine if MM/DD or DD/MM format (assume MM/DD if month > 12)
      if (month > 12 && day <= 12) {
        [month, day] = [day, month];
      }

      const date = new Date(year, month - 1, day);
      if (isValid(date)) {
        return format(date, 'yyyy-MM-dd');
      }
    }

    // Handle day names (Monday, Mon, etc.)
    const dayNames = {
      'monday': 1, 'mon': 1,
      'tuesday': 2, 'tue': 2, 'tues': 2,
      'wednesday': 3, 'wed': 3,
      'thursday': 4, 'thu': 3, 'thur': 3, 'thurs': 3,
      'friday': 5, 'fri': 5,
      'saturday': 6, 'sat': 6,
      'sunday': 7, 'sun': 7
    };

    const lowerTrimmed = trimmed.toLowerCase();
    if (dayNames[lowerTrimmed]) {
      const today = referenceDate.getDay() || 7; // Convert Sunday from 0 to 7
      const targetDay = dayNames[lowerTrimmed];
      let daysToAdd = targetDay - today;
      
      // If the day is in the past this week, assume next week
      if (daysToAdd <= 0) {
        daysToAdd += 7;
      }
      
      const date = new Date(referenceDate);
      date.setDate(date.getDate() + daysToAdd);
      return format(date, 'yyyy-MM-dd');
    }

    // Handle month name formats (Dec 15, December 15, Dec 15 2024, etc.)
    const monthNameMatch = trimmed.match(/^(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|september|oct|october|nov|november|dec|december)\s+(\d{1,2})(?:\s+(\d{4}))?$/i);
    if (monthNameMatch) {
      const monthNames = {
        'jan': 1, 'january': 1, 'feb': 2, 'february': 2,
        'mar': 3, 'march': 3, 'apr': 4, 'april': 4,
        'may': 5, 'jun': 6, 'june': 6,
        'jul': 7, 'july': 7, 'aug': 8, 'august': 8,
        'sep': 9, 'september': 9, 'oct': 10, 'october': 10,
        'nov': 11, 'november': 11, 'dec': 12, 'december': 12
      };

      const monthName = monthNameMatch[1].toLowerCase();
      const day = parseInt(monthNameMatch[2]);
      const year = monthNameMatch[3] ? parseInt(monthNameMatch[3]) : referenceDate.getFullYear();
      const month = monthNames[monthName];

      if (month && day >= 1 && day <= 31) {
        const date = new Date(year, month - 1, day);
        if (isValid(date)) {
          return format(date, 'yyyy-MM-dd');
        }
      }
    }

    // Try parsing as ISO date
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const isoDate = parseISO(trimmed);
      if (isValid(isoDate)) {
        return format(isoDate, 'yyyy-MM-dd');
      }
    }

    // Try native Date parsing for flexible formats
    const nativeDate = new Date(trimmed);
    if (isValid(nativeDate) && !isNaN(nativeDate.getTime())) {
      // Check if the parsed date makes sense (not too far in past/future)
      const year = nativeDate.getFullYear();
      const currentYear = referenceDate.getFullYear();
      if (year >= currentYear - 1 && year <= currentYear + 1) {
        return format(nativeDate, 'yyyy-MM-dd');
      }
    }

    return null;
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
  }
};

/**
 * Parse time string to HH:MM format (24-hour)
 * Converts AM/PM time to 24-hour format
 * @param {String} timeString - Time string (e.g., "9:00 AM", "17:00", "9:00PM")
 * @returns {String|null} Time in HH:MM format (24-hour) or null if invalid
 */
const parseTime = (timeString) => {
  if (!timeString || typeof timeString !== 'string') {
    return null;
  }

  const trimmed = timeString.trim().toUpperCase();
  if (!trimmed) return null;

  try {
    // Handle 24-hour format (HH:MM or H:MM)
    const time24Match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
    if (time24Match) {
      let hours = parseInt(time24Match[1]);
      const minutes = parseInt(time24Match[2]);

      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
    }

    // Handle 12-hour format with AM/PM (e.g., "9:00 AM", "5:30PM", "12:00 PM")
    const time12Match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
    if (time12Match) {
      let hours = parseInt(time12Match[1]);
      const minutes = parseInt(time12Match[2]);
      const period = time12Match[3];

      if (hours >= 1 && hours <= 12 && minutes >= 0 && minutes <= 59) {
        // Convert to 24-hour format
        if (period === 'AM') {
          if (hours === 12) {
            hours = 0; // 12 AM = 00:00
          }
        } else { // PM
          if (hours !== 12) {
            hours += 12; // 1 PM = 13:00, 11 PM = 23:00
          }
          // 12 PM = 12:00
        }

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
    }

    // Handle time without colon (e.g., "900", "1730")
    const timeNoColonMatch = trimmed.match(/^(\d{3,4})$/);
    if (timeNoColonMatch) {
      const timeStr = timeNoColonMatch[1];
      if (timeStr.length === 3) {
        const hours = parseInt(timeStr.substring(0, 1));
        const minutes = parseInt(timeStr.substring(1, 3));
        if (hours >= 0 && hours <= 9 && minutes >= 0 && minutes <= 59) {
          return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }
      } else if (timeStr.length === 4) {
        const hours = parseInt(timeStr.substring(0, 2));
        const minutes = parseInt(timeStr.substring(2, 4));
        if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
          return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error parsing time:', error);
    return null;
  }
};

/**
 * Extract shifts from image using OCR
 * @param {String} imagePath - Path to the image file
 * @returns {Promise<Array>} Array of extracted shifts or empty array on error
 */
const extractShiftsFromImage = async (imagePath) => {
  try {
    if (!imagePath) {
      throw new Error('Image path is required');
    }

    // Perform OCR on the image
    const { data: { text } } = await Tesseract.recognize(imagePath, 'eng', {
      logger: (m) => {
        // Only log progress in development
        if (process.env.NODE_ENV === 'development' && m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    });

    if (!text || text.trim().length === 0) {
      console.warn('No text extracted from image');
      return [];
    }

    // Parse OCR text to extract shifts
    const extractedShifts = parseShiftText(text);

    return extractedShifts;
  } catch (error) {
    console.error('OCR extraction error:', error);
    return [];
  }
};

/**
 * Parse OCR text to extract shift information
 * Uses regex patterns to detect dates, times, and shift titles
 * @param {String} text - OCR extracted text
 * @returns {Array} Array of extracted shifts
 */
const parseShiftText = (text) => {
  const shifts = [];
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  const referenceDate = new Date();
  let currentDate = null;
  let currentTitle = null;

  // Common date patterns
  const datePatterns = [
    /(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)/, // MM/DD or DD/MM
    /(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)/i,
    /(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|september|oct|october|nov|november|dec|december)\s+\d{1,2}/i
  ];

  // Time patterns (HH:MM AM/PM or 24-hour)
  const timePattern = /(\d{1,2}:\d{2}(?:\s*(?:AM|PM))?|\d{3,4})/gi;

  // Shift title patterns (common shift names)
  const titlePatterns = [
    /(morning|afternoon|evening|night|day|night shift|day shift)/i,
    /(shift|work|schedule)/i
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Try to extract date
    for (const pattern of datePatterns) {
      const dateMatch = line.match(pattern);
      if (dateMatch) {
        const parsedDate = parseDate(dateMatch[1], referenceDate);
        if (parsedDate) {
          currentDate = parsedDate;
          break;
        }
      }
    }

    // Try to extract shift title
    for (const pattern of titlePatterns) {
      if (pattern.test(line)) {
        currentTitle = line.substring(0, 50).trim(); // Limit title length
        break;
      }
    }

    // Extract times (start and end)
    const timeMatches = line.matchAll(timePattern);
    const times = Array.from(timeMatches).map(match => parseTime(match[1])).filter(t => t !== null);

    if (times.length >= 2 && currentDate) {
      // Found start and end time with a date
      shifts.push({
        date: currentDate,
        startTime: times[0],
        endTime: times[1],
        title: currentTitle || `Shift ${shifts.length + 1}`
      });
    } else if (times.length === 1 && currentDate) {
      // Only one time found, might be start time
      // Look for end time in next lines
      let endTime = null;
      for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
        const nextLineTimes = Array.from(lines[j].matchAll(timePattern))
          .map(match => parseTime(match[1]))
          .filter(t => t !== null);
        if (nextLineTimes.length > 0) {
          endTime = nextLineTimes[0];
          break;
        }
      }

      if (endTime) {
        shifts.push({
          date: currentDate,
          startTime: times[0],
          endTime: endTime,
          title: currentTitle || `Shift ${shifts.length + 1}`
        });
      }
    }

    // Reset current title after processing
    if (times.length > 0) {
      currentTitle = null;
    }
  }

  // If no shifts found with dates, try to extract time ranges without dates
  if (shifts.length === 0) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const timeMatches = Array.from(line.matchAll(timePattern))
        .map(match => parseTime(match[1]))
        .filter(t => t !== null);

      if (timeMatches.length >= 2) {
        shifts.push({
          date: format(referenceDate, 'yyyy-MM-dd'),
          startTime: timeMatches[0],
          endTime: timeMatches[1],
          title: `Shift ${shifts.length + 1}`
        });
      }
    }
  }

  return shifts;
};

/**
 * Normalize shift data
 * Standardize dates to ISO 8601, times to HH:MM, validate, remove duplicates, sort
 * @param {Array} extractedShifts - Array of extracted shifts
 * @returns {Array} Normalized array of shifts
 */
const normalizeShiftData = (extractedShifts) => {
  if (!Array.isArray(extractedShifts)) {
    return [];
  }

  const normalized = [];
  const seen = new Set(); // For duplicate detection

  for (const shift of extractedShifts) {
    try {
      // Validate required fields
      if (!shift.date || !shift.startTime || !shift.endTime) {
        console.warn('Skipping shift with missing required fields:', shift);
        continue;
      }

      // Normalize date to ISO 8601 (YYYY-MM-DD)
      let normalizedDate = null;
      if (typeof shift.date === 'string') {
        // Try parsing if not already in ISO format
        if (!/^\d{4}-\d{2}-\d{2}$/.test(shift.date)) {
          normalizedDate = parseDate(shift.date);
        } else {
          normalizedDate = shift.date;
        }
      } else if (shift.date instanceof Date) {
        normalizedDate = format(shift.date, 'yyyy-MM-dd');
      }

      if (!normalizedDate) {
        console.warn('Skipping shift with invalid date:', shift);
        continue;
      }

      // Normalize time to HH:MM (24-hour)
      const normalizedStartTime = parseTime(shift.startTime);
      const normalizedEndTime = parseTime(shift.endTime);

      if (!normalizedStartTime || !normalizedEndTime) {
        console.warn('Skipping shift with invalid time:', shift);
        continue;
      }

      // Validate end time is after start time
      const [startHours, startMinutes] = normalizedStartTime.split(':').map(Number);
      const [endHours, endMinutes] = normalizedEndTime.split(':').map(Number);
      const startTotal = startHours * 60 + startMinutes;
      const endTotal = endHours * 60 + endMinutes;

      if (endTotal <= startTotal) {
        console.warn('Skipping shift where end time is not after start time:', shift);
        continue;
      }

      // Create normalized shift object
      const normalizedShift = {
        date: normalizedDate,
        startTime: normalizedStartTime,
        endTime: normalizedEndTime,
        title: (shift.title || `Shift`).trim().substring(0, 200) // Limit title length
      };

      // Add optional fields if present
      if (shift.location) {
        normalizedShift.location = String(shift.location).trim().substring(0, 200);
      }
      if (shift.notes) {
        normalizedShift.notes = String(shift.notes).trim().substring(0, 1000);
      }

      // Create unique key for duplicate detection
      const uniqueKey = `${normalizedDate}_${normalizedStartTime}_${normalizedEndTime}`;
      if (seen.has(uniqueKey)) {
        continue; // Skip duplicate
      }
      seen.add(uniqueKey);

      normalized.push(normalizedShift);
    } catch (error) {
      console.error('Error normalizing shift:', error, shift);
      continue;
    }
  }

  // Sort by date ascending, then by start time
  normalized.sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.startTime.localeCompare(b.startTime);
  });

  return normalized;
};

module.exports = {
  extractShiftsFromImage,
  normalizeShiftData,
  parseDate,
  parseTime,
  parseShiftText // Exported for testing purposes
};

