const fs = require('fs');
const XLSX = require('xlsx');
const { parseDate, parseTime } = require('./ocrService');

/**
 * Validate shift data
 * Ensure required fields exist, dates are valid, and start time < end time
 * @param {Object} shift - Shift object to validate
 * @returns {Boolean} True if valid, false otherwise
 */
const validateShiftData = (shift) => {
  if (!shift || typeof shift !== 'object') {
    return false;
  }

  // Check required fields
  if (!shift.date || !shift.startTime || !shift.endTime) {
    return false;
  }

  // Validate date format (should be YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(shift.date)) {
    return false;
  }

  // Validate time format (should be HH:MM)
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(shift.startTime) || !timeRegex.test(shift.endTime)) {
    return false;
  }

  // Validate date is a valid date
  const dateObj = new Date(shift.date);
  if (isNaN(dateObj.getTime())) {
    return false;
  }

  // Validate start time < end time
  const [startHours, startMinutes] = shift.startTime.split(':').map(Number);
  const [endHours, endMinutes] = shift.endTime.split(':').map(Number);
  const startTotal = startHours * 60 + startMinutes;
  const endTotal = endHours * 60 + endMinutes;

  if (endTotal <= startTotal) {
    return false;
  }

  return true;
};

/**
 * Auto-detect column indices in Excel sheet
 * @param {Array} headers - Array of header strings
 * @returns {Object} Column indices for date, startTime, endTime, title, location, notes
 */
const detectColumns = (headers) => {
  const columns = {
    date: null,
    startTime: null,
    endTime: null,
    title: null,
    location: null,
    notes: null
  };

  const dateKeywords = ['date', 'day', 'schedule date', 'shift date'];
  const startTimeKeywords = ['start', 'start time', 'starttime', 'begin', 'from', 'time in'];
  const endTimeKeywords = ['end', 'end time', 'endtime', 'finish', 'to', 'time out', 'until'];
  const titleKeywords = ['title', 'shift', 'shift title', 'name', 'shift name', 'type'];
  const locationKeywords = ['location', 'place', 'venue', 'address', 'where'];
  const notesKeywords = ['notes', 'note', 'comment', 'remarks', 'description'];

  headers.forEach((header, index) => {
    if (!header) return;
    
    const lowerHeader = String(header).toLowerCase().trim();

    // Check for date column
    if (!columns.date && dateKeywords.some(keyword => lowerHeader.includes(keyword))) {
      columns.date = index;
    }

    // Check for start time column
    if (!columns.startTime && startTimeKeywords.some(keyword => lowerHeader.includes(keyword))) {
      columns.startTime = index;
    }

    // Check for end time column
    if (!columns.endTime && endTimeKeywords.some(keyword => lowerHeader.includes(keyword))) {
      columns.endTime = index;
    }

    // Check for title column
    if (!columns.title && titleKeywords.some(keyword => lowerHeader.includes(keyword))) {
      columns.title = index;
    }

    // Check for location column
    if (!columns.location && locationKeywords.some(keyword => lowerHeader.includes(keyword))) {
      columns.location = index;
    }

    // Check for notes column
    if (!columns.notes && notesKeywords.some(keyword => lowerHeader.includes(keyword))) {
      columns.notes = index;
    }
  });

  return columns;
};

/**
 * Extract date and time from a single cell value
 * Handles formats like "2025-12-15 09:00-17:00" or "12/15 9am-5pm"
 * @param {String|Number|Date} cellValue - Cell value from Excel
 * @returns {Object|null} Object with date, startTime, endTime or null
 */
const extractDateTimeFromCell = (cellValue) => {
  if (!cellValue) return null;

  const str = String(cellValue).trim();
  if (!str) return null;

  // Pattern: "2025-12-15 09:00-17:00" or "12/15 9am-5pm"
  const dateTimeRangePattern = /(.+?)\s+(\d{1,2}:\d{2}(?:\s*(?:AM|PM))?|\d{3,4})\s*[-–—]\s*(\d{1,2}:\d{2}(?:\s*(?:AM|PM))?|\d{3,4})/i;
  const match = str.match(dateTimeRangePattern);

  if (match) {
    const dateStr = match[1].trim();
    const startTimeStr = match[2].trim();
    const endTimeStr = match[3].trim();

    const date = parseDate(dateStr);
    const startTime = parseTime(startTimeStr);
    const endTime = parseTime(endTimeStr);

    if (date && startTime && endTime) {
      return { date, startTime, endTime };
    }
  }

  return null;
};

/**
 * Extract shifts from Excel file
 * @param {String} filePath - Path to Excel file
 * @returns {Promise<Array>} Array of extracted shifts
 */
const extractShiftsFromExcel = async (filePath) => {
  try {
    if (!filePath || !fs.existsSync(filePath)) {
      throw new Error('File path is invalid or file does not exist');
    }

    // Read Excel file
    const workbook = XLSX.readFile(filePath);
    
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error('Excel file has no sheets');
    }

    // Use first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON with header row
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1, // Use array of arrays format
      defval: '' // Default value for empty cells
    });

    if (!jsonData || jsonData.length === 0) {
      return [];
    }

    // Find header row (first non-empty row)
    let headerRowIndex = 0;
    for (let i = 0; i < Math.min(5, jsonData.length); i++) {
      if (jsonData[i] && jsonData[i].some(cell => cell && String(cell).trim().length > 0)) {
        headerRowIndex = i;
        break;
      }
    }

    const headers = jsonData[headerRowIndex] || [];
    const columns = detectColumns(headers);

    // If no columns detected, try to infer from first data row
    if (!columns.date && !columns.startTime && !columns.endTime && jsonData.length > headerRowIndex + 1) {
      // Try to parse first data row to detect pattern
      const firstRow = jsonData[headerRowIndex + 1];
      if (firstRow) {
        for (let i = 0; i < firstRow.length; i++) {
          const cellValue = firstRow[i];
          const dateTimeData = extractDateTimeFromCell(cellValue);
          if (dateTimeData) {
            // Found date/time in single cell, use this column
            columns.date = i;
            columns.startTime = i;
            columns.endTime = i;
            break;
          }
        }
      }
    }

    const shifts = [];
    const referenceDate = new Date();

    // Process data rows
    for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || row.length === 0) continue;

      try {
        let date = null;
        let startTime = null;
        let endTime = null;
        let title = null;
        let location = null;
        let notes = null;

        // Try to extract date/time from single cell first
        if (columns.date === columns.startTime && columns.date === columns.endTime && columns.date !== null) {
          const dateTimeData = extractDateTimeFromCell(row[columns.date]);
          if (dateTimeData) {
            date = dateTimeData.date;
            startTime = dateTimeData.startTime;
            endTime = dateTimeData.endTime;
          }
        } else {
          // Extract from separate columns
          if (columns.date !== null && row[columns.date]) {
            const dateValue = row[columns.date];
            // Handle Excel date serial numbers
            if (typeof dateValue === 'number') {
              // Excel date serial number (days since 1900-01-01)
              const excelEpoch = new Date(1899, 11, 30);
              const dateObj = new Date(excelEpoch.getTime() + dateValue * 86400000);
              date = parseDate(dateObj.toISOString().split('T')[0]);
            } else {
              date = parseDate(String(dateValue), referenceDate);
            }
          }

          if (columns.startTime !== null && row[columns.startTime]) {
            const timeValue = row[columns.startTime];
            // Handle Excel time serial numbers
            if (typeof timeValue === 'number' && timeValue < 1) {
              // Excel time serial number (fraction of day)
              const totalSeconds = Math.round(timeValue * 86400);
              const hours = Math.floor(totalSeconds / 3600);
              const minutes = Math.floor((totalSeconds % 3600) / 60);
              startTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            } else {
              startTime = parseTime(String(timeValue));
            }
          }

          if (columns.endTime !== null && row[columns.endTime]) {
            const timeValue = row[columns.endTime];
            // Handle Excel time serial numbers
            if (typeof timeValue === 'number' && timeValue < 1) {
              const totalSeconds = Math.round(timeValue * 86400);
              const hours = Math.floor(totalSeconds / 3600);
              const minutes = Math.floor((totalSeconds % 3600) / 60);
              endTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            } else {
              endTime = parseTime(String(timeValue));
            }
          }
        }

        // Extract optional fields
        if (columns.title !== null && row[columns.title]) {
          title = String(row[columns.title]).trim();
        }

        if (columns.location !== null && row[columns.location]) {
          location = String(row[columns.location]).trim();
        }

        if (columns.notes !== null && row[columns.notes]) {
          notes = String(row[columns.notes]).trim();
        }

        // Validate that we have at least date and time
        if (date && startTime && endTime) {
          const shift = {
            date,
            startTime,
            endTime,
            title: title || `Shift ${shifts.length + 1}`,
            ...(location && { location }),
            ...(notes && { notes })
          };

          if (validateShiftData(shift)) {
            shifts.push(shift);
          }
        }
      } catch (error) {
        console.warn(`Error processing row ${i + 1}:`, error.message);
        continue;
      }
    }

    return shifts;
  } catch (error) {
    console.error('Excel extraction error:', error);
    throw error;
  }
};

/**
 * Extract shifts from text file
 * @param {String} filePath - Path to text file
 * @returns {Promise<Array>} Array of extracted shifts
 */
const extractShiftsFromText = async (filePath) => {
  try {
    if (!filePath || !fs.existsSync(filePath)) {
      throw new Error('File path is invalid or file does not exist');
    }

    // Read text file
    const text = fs.readFileSync(filePath, 'utf8');
    
    if (!text || text.trim().length === 0) {
      return [];
    }

    const shifts = [];
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const referenceDate = new Date();
    let currentDate = null;

    // Common patterns for shift extraction
    const patterns = [
      // Pattern 1: "2025-12-15 09:00-17:00"
      {
        regex: /(\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2}(?:\s*(?:AM|PM))?)\s*[-–—]\s*(\d{1,2}:\d{2}(?:\s*(?:AM|PM))?)/i,
        extract: (match) => ({
          date: match[1],
          startTime: parseTime(match[2]),
          endTime: parseTime(match[3])
        })
      },
      // Pattern 2: "Dec 15: 9am - 5pm" or "December 15: 9am - 5pm"
      {
        regex: /(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|september|oct|october|nov|november|dec|december)\s+(\d{1,2})(?:\s*:|\s+)(\d{1,2}:\d{2}(?:\s*(?:AM|PM))?|\d{1,2}(?:\s*(?:AM|PM))?)\s*[-–—]\s*(\d{1,2}:\d{2}(?:\s*(?:AM|PM))?|\d{1,2}(?:\s*(?:AM|PM))?)/i,
        extract: (match) => {
          const dateStr = `${match[1]} ${match[2]}`;
          const date = parseDate(dateStr, referenceDate);
          return {
            date,
            startTime: parseTime(match[3]),
            endTime: parseTime(match[4])
          };
        }
      },
      // Pattern 3: "Monday 15th, 9:00-17:00" or "Mon 15, 9:00-17:00"
      {
        regex: /(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{1,2}:\d{2}(?:\s*(?:AM|PM))?)\s*[-–—]\s*(\d{1,2}:\d{2}(?:\s*(?:AM|PM))?)/i,
        extract: (match) => {
          const dateStr = `${match[1]} ${match[2]}`;
          const date = parseDate(dateStr, referenceDate);
          return {
            date,
            startTime: parseTime(match[3]),
            endTime: parseTime(match[4])
          };
        }
      },
      // Pattern 4: "12/15 9:00 AM - 5:00 PM"
      {
        regex: /(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)\s+(\d{1,2}:\d{2}(?:\s*(?:AM|PM))?)\s*[-–—]\s*(\d{1,2}:\d{2}(?:\s*(?:AM|PM))?)/i,
        extract: (match) => ({
          date: parseDate(match[1], referenceDate),
          startTime: parseTime(match[2]),
          endTime: parseTime(match[3])
        })
      },
      // Pattern 5: Date on one line, time on next line
      {
        regex: /(\d{4}-\d{2}-\d{2}|\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?|(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\s+\d{1,2})/i,
        extract: null // Special handling below
      }
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let shift = null;

      // Try each pattern
      for (const pattern of patterns) {
        const match = line.match(pattern.regex);
        if (match) {
          if (pattern.extract) {
            const extracted = pattern.extract(match);
            if (extracted.date && extracted.startTime && extracted.endTime) {
              shift = extracted;
              break;
            }
          } else {
            // Special handling for date-only pattern
            const dateStr = match[1];
            const date = parseDate(dateStr, referenceDate);
            if (date) {
              currentDate = date;
              // Look for time in next line
              if (i + 1 < lines.length) {
                const nextLine = lines[i + 1];
                const timeMatch = nextLine.match(/(\d{1,2}:\d{2}(?:\s*(?:AM|PM))?)\s*[-–—]\s*(\d{1,2}:\d{2}(?:\s*(?:AM|PM))?)/i);
                if (timeMatch) {
                  shift = {
                    date,
                    startTime: parseTime(timeMatch[1]),
                    endTime: parseTime(timeMatch[2])
                  };
                  i++; // Skip next line as we've processed it
                }
              }
            }
            break;
          }
        }
      }

      // If no pattern matched but we have a current date, try to extract time from this line
      if (!shift && currentDate) {
        const timeMatch = line.match(/(\d{1,2}:\d{2}(?:\s*(?:AM|PM))?)\s*[-–—]\s*(\d{1,2}:\d{2}(?:\s*(?:AM|PM))?)/i);
        if (timeMatch) {
          shift = {
            date: currentDate,
            startTime: parseTime(timeMatch[1]),
            endTime: parseTime(timeMatch[2])
          };
        }
      }

      // Extract title if present (usually before or after date/time)
      if (shift) {
        // Try to extract title from the line
        const titleMatch = line.match(/^(.+?)\s+(?:\d{4}-\d{2}-\d{2}|\d{1,2}[\/\-]|\d{1,2}(?:st|nd|rd|th)?|(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun))/i);
        if (titleMatch && titleMatch[1].trim().length > 0) {
          shift.title = titleMatch[1].trim().substring(0, 200);
        } else {
          shift.title = `Shift ${shifts.length + 1}`;
        }

        if (validateShiftData(shift)) {
          shifts.push(shift);
        }
      }
    }

    return shifts;
  } catch (error) {
    console.error('Text extraction error:', error);
    throw error;
  }
};

/**
 * Detect file format and call appropriate parser
 * @param {String} filePath - Path to file
 * @param {String} fileType - File type ('image', 'text', 'excel')
 * @returns {Promise<Array>} Array of extracted shifts
 */
const detectFileFormat = async (filePath, fileType) => {
  try {
    if (!filePath) {
      throw new Error('File path is required');
    }

    if (!fs.existsSync(filePath)) {
      throw new Error('File does not exist');
    }

    switch (fileType?.toLowerCase()) {
      case 'excel':
      case 'xlsx':
      case 'xls':
        return await extractShiftsFromExcel(filePath);

      case 'text':
      case 'txt':
      case 'csv':
        return await extractShiftsFromText(filePath);

      case 'image':
      case 'jpg':
      case 'jpeg':
      case 'png':
        // Image files should use OCR service, not file parser
        throw new Error('Image files should be processed using OCR service');

      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  } catch (error) {
    console.error('File format detection error:', error);
    throw error;
  }
};

module.exports = {
  extractShiftsFromExcel,
  extractShiftsFromText,
  detectFileFormat,
  validateShiftData
};

