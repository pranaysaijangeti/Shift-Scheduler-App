import RNCalendarEvents, { Calendar } from 'react-native-calendar-events';
import { Platform } from 'react-native';
import { Shift } from '../types';
import { parseDate } from '../utils/dateHelper';
import { formatDate, formatTime } from '../utils/dateHelper';

/**
 * Calendar Service
 * Handles calendar integration for shift events
 */

/**
 * Request Calendar Permissions
 * Requests READ_CALENDAR and WRITE_CALENDAR permissions
 * @returns Promise<boolean> - True if permissions granted, false otherwise
 */
export const requestCalendarPermission = async (): Promise<boolean> => {
  try {
    const status = await RNCalendarEvents.requestPermissions();

    if (status === 'authorized') {
      if (__DEV__) {
        console.log('Calendar permissions granted');
      }
      return true;
    } else {
      if (__DEV__) {
        console.warn('Calendar permissions denied:', status);
      }
      return false;
    }
  } catch (error) {
    console.error('Error requesting calendar permissions:', error);
    return false;
  }
};

/**
 * Check Calendar Permission
 * Checks if calendar permissions are already granted
 * @returns Promise<boolean> - True if permissions granted, false otherwise
 */
export const checkCalendarPermission = async (): Promise<boolean> => {
  try {
    const status = await RNCalendarEvents.checkPermissions();

    if (status === 'authorized') {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking calendar permissions:', error);
    return false;
  }
};

/**
 * Get Device Calendars
 * Gets list of available calendars on the device
 * @returns Promise<Calendar[]> - Array of calendar objects
 */
export const getDeviceCalendars = async (): Promise<Calendar[]> => {
  try {
    const hasPermission = await checkCalendarPermission();
    if (!hasPermission) {
      const granted = await requestCalendarPermission();
      if (!granted) {
        throw new Error('Calendar permissions not granted');
      }
    }

    const calendars = await RNCalendarEvents.findCalendars();

    if (__DEV__) {
      console.log(`Found ${calendars.length} calendars`);
    }

    return calendars;
  } catch (error) {
    console.error('Error getting device calendars:', error);
    throw error;
  }
};

/**
 * Get Default Calendar ID
 * Gets the default calendar ID for creating events
 * @returns Promise<string | null> - Default calendar ID or null
 */
export const getDefaultCalendarId = async (): Promise<string | null> => {
  try {
    const calendars = await getDeviceCalendars();

    // Find default calendar (usually the first one or one marked as default)
    const defaultCalendar = calendars.find((cal) => cal.allowsModifications) || calendars[0];

    return defaultCalendar?.id || null;
  } catch (error) {
    console.error('Error getting default calendar ID:', error);
    return null;
  }
};

/**
 * Format Shift Details for Calendar Description
 * Creates a formatted description string from shift data
 * @param shift - Shift object
 * @returns Formatted description string
 */
const formatShiftDescription = (shift: Shift): string => {
  const parts: string[] = [];

  if (shift.location) {
    parts.push(`Location: ${shift.location}`);
  }

  if (shift.notes) {
    parts.push(`Notes: ${shift.notes}`);
  }

  if (shift.reminderMinutesBefore) {
    parts.push(`Reminder: ${shift.reminderMinutesBefore} minutes before`);
  }

  parts.push(`Created via Shift Scheduler App`);

  return parts.join('\n\n');
};

/**
 * Create Shift Calendar Event
 * Creates a calendar event for a shift
 * @param shift - Shift object
 * @param calendarId - Optional calendar ID (uses default if not provided)
 * @returns Promise<string> - Calendar event ID
 */
export const createShiftCalendarEvent = async (
  shift: Shift,
  calendarId?: string
): Promise<string> => {
  try {
    // Check permissions
    const hasPermission = await checkCalendarPermission();
    if (!hasPermission) {
      const granted = await requestCalendarPermission();
      if (!granted) {
        throw new Error('Calendar permissions not granted');
      }
    }

    // Parse shift date
    const shiftDate = typeof shift.date === 'string' ? parseDate(shift.date) : shift.date;
    if (!shiftDate) {
      throw new Error('Invalid shift date');
    }

    // Parse start time
    const [startHours, startMinutes] = shift.startTime.split(':').map(Number);
    if (isNaN(startHours) || isNaN(startMinutes)) {
      throw new Error('Invalid shift start time');
    }

    // Parse end time
    const [endHours, endMinutes] = shift.endTime.split(':').map(Number);
    if (isNaN(endHours) || isNaN(endMinutes)) {
      throw new Error('Invalid shift end time');
    }

    // Create start date/time
    const startDateTime = new Date(shiftDate);
    startDateTime.setHours(startHours, startMinutes, 0, 0);

    // Create end date/time
    const endDateTime = new Date(shiftDate);
    endDateTime.setHours(endHours, endMinutes, 0, 0);

    // Validate end time is after start time
    if (endDateTime <= startDateTime) {
      throw new Error('End time must be after start time');
    }

    // Get calendar ID if not provided
    let targetCalendarId = calendarId;
    if (!targetCalendarId) {
      targetCalendarId = await getDefaultCalendarId();
      if (!targetCalendarId) {
        throw new Error('No calendar available');
      }
    }

    // Format dates for calendar (ISO 8601 format)
    const startDateISO = startDateTime.toISOString();
    const endDateISO = endDateTime.toISOString();

    // Create calendar event
    const eventId = await RNCalendarEvents.saveEvent(shift.title, {
      calendarId: targetCalendarId,
      startDate: startDateISO,
      endDate: endDateISO,
      notes: formatShiftDescription(shift),
      description: `Shift: ${shift.title}\nDate: ${formatDate(shift.date)}\nTime: ${formatTime(shift.startTime)} - ${formatTime(shift.endTime)}${shift.location ? `\nLocation: ${shift.location}` : ''}${shift.notes ? `\n\nNotes:\n${shift.notes}` : ''}`,
      alarms: shift.reminderMinutesBefore > 0
        ? [
            {
              date: new Date(startDateTime.getTime() - shift.reminderMinutesBefore * 60 * 1000).toISOString(),
            },
          ]
        : undefined,
      location: shift.location,
      allDay: false,
    });

    if (__DEV__) {
      console.log('Calendar event created:', {
        eventId,
        shiftId: shift._id,
        title: shift.title,
        startDate: startDateISO,
        endDate: endDateISO,
      });
    }

    return eventId;
  } catch (error: any) {
    console.error('Error creating calendar event:', error);
    throw new Error(
      error?.message || 'Failed to create calendar event. Please check calendar permissions.'
    );
  }
};

/**
 * Update Shift Calendar Event
 * Updates an existing calendar event with new shift data
 * @param eventId - Calendar event ID
 * @param shift - Updated shift object
 * @param calendarId - Optional calendar ID
 * @returns Promise<string> - Updated calendar event ID (may be new ID if moved to different calendar)
 */
export const updateShiftCalendarEvent = async (
  eventId: string,
  shift: Shift,
  calendarId?: string
): Promise<string> => {
  try {
    // Check permissions
    const hasPermission = await checkCalendarPermission();
    if (!hasPermission) {
      const granted = await requestCalendarPermission();
      if (!granted) {
        throw new Error('Calendar permissions not granted');
      }
    }

    // Parse shift date
    const shiftDate = typeof shift.date === 'string' ? parseDate(shift.date) : shift.date;
    if (!shiftDate) {
      throw new Error('Invalid shift date');
    }

    // Parse start time
    const [startHours, startMinutes] = shift.startTime.split(':').map(Number);
    if (isNaN(startHours) || isNaN(startMinutes)) {
      throw new Error('Invalid shift start time');
    }

    // Parse end time
    const [endHours, endMinutes] = shift.endTime.split(':').map(Number);
    if (isNaN(endHours) || isNaN(endMinutes)) {
      throw new Error('Invalid shift end time');
    }

    // Create start date/time
    const startDateTime = new Date(shiftDate);
    startDateTime.setHours(startHours, startMinutes, 0, 0);

    // Create end date/time
    const endDateTime = new Date(shiftDate);
    endDateTime.setHours(endHours, endMinutes, 0, 0);

    // Validate end time is after start time
    if (endDateTime <= startDateTime) {
      throw new Error('End time must be after start time');
    }

    // Get calendar ID if not provided
    let targetCalendarId = calendarId;
    if (!targetCalendarId) {
      targetCalendarId = await getDefaultCalendarId();
      if (!targetCalendarId) {
        throw new Error('No calendar available');
      }
    }

    // Format dates for calendar (ISO 8601 format)
    const startDateISO = startDateTime.toISOString();
    const endDateISO = endDateTime.toISOString();

    // Update calendar event
    const updatedEventId = await RNCalendarEvents.saveEvent(shift.title, {
      id: eventId,
      calendarId: targetCalendarId,
      startDate: startDateISO,
      endDate: endDateISO,
      notes: formatShiftDescription(shift),
      description: `Shift: ${shift.title}\nDate: ${formatDate(shift.date)}\nTime: ${formatTime(shift.startTime)} - ${formatTime(shift.endTime)}${shift.location ? `\nLocation: ${shift.location}` : ''}${shift.notes ? `\n\nNotes:\n${shift.notes}` : ''}`,
      alarms: shift.reminderMinutesBefore > 0
        ? [
            {
              date: new Date(startDateTime.getTime() - shift.reminderMinutesBefore * 60 * 1000).toISOString(),
            },
          ]
        : undefined,
      location: shift.location,
      allDay: false,
    });

    if (__DEV__) {
      console.log('Calendar event updated:', {
        eventId: updatedEventId,
        shiftId: shift._id,
        title: shift.title,
      });
    }

    return updatedEventId;
  } catch (error: any) {
    console.error('Error updating calendar event:', error);
    throw new Error(
      error?.message || 'Failed to update calendar event. Please check calendar permissions.'
    );
  }
};

/**
 * Delete Shift Calendar Event
 * Removes a calendar event by ID
 * @param eventId - Calendar event ID to delete
 * @returns Promise<void>
 */
export const deleteShiftCalendarEvent = async (eventId: string): Promise<void> => {
  try {
    // Check permissions
    const hasPermission = await checkCalendarPermission();
    if (!hasPermission) {
      const granted = await requestCalendarPermission();
      if (!granted) {
        throw new Error('Calendar permissions not granted');
      }
    }

    await RNCalendarEvents.removeEvent(eventId);

    if (__DEV__) {
      console.log('Calendar event deleted:', eventId);
    }
  } catch (error: any) {
    console.error('Error deleting calendar event:', error);
    // If event doesn't exist, that's okay - it's already deleted
    if (error?.message?.includes('not found') || error?.message?.includes('does not exist')) {
      if (__DEV__) {
        console.log('Event already deleted or not found:', eventId);
      }
      return;
    }
    throw new Error(
      error?.message || 'Failed to delete calendar event. Please check calendar permissions.'
    );
  }
};

/**
 * Get Calendar Event by ID
 * Retrieves a calendar event by its ID
 * Note: react-native-calendar-events doesn't have a direct getEventById method
 * This function is a placeholder for future implementation
 * @param eventId - Calendar event ID
 * @returns Promise with event details or null if not found
 */
export const getCalendarEventById = async (eventId: string): Promise<any | null> => {
  try {
    const hasPermission = await checkCalendarPermission();
    if (!hasPermission) {
      return null;
    }

    // Note: react-native-calendar-events doesn't have a direct getEventById
    // We would need to fetch all events and filter, which is not efficient
    // For now, we'll return null and note this limitation
    if (__DEV__) {
      console.warn('getCalendarEventById: Direct event retrieval not available in this library');
    }
    return null;
  } catch (error) {
    console.error('Error getting calendar event:', error);
    return null;
  }
};

/**
 * Sync All Shifts to Calendar
 * Creates or updates calendar events for all shifts
 * @param shifts - Array of shifts to sync
 * @param calendarId - Optional calendar ID
 * @returns Promise with array of event IDs
 */
export const syncAllShiftsToCalendar = async (
  shifts: Shift[],
  calendarId?: string
): Promise<string[]> => {
  try {
    const hasPermission = await checkCalendarPermission();
    if (!hasPermission) {
      const granted = await requestCalendarPermission();
      if (!granted) {
        throw new Error('Calendar permissions not granted');
      }
    }

    const eventIds: string[] = [];

    for (const shift of shifts) {
      try {
        if (shift.calendarEventId) {
          // Update existing event
          const updatedId = await updateShiftCalendarEvent(shift.calendarEventId, shift, calendarId);
          eventIds.push(updatedId);
        } else {
          // Create new event
          const newId = await createShiftCalendarEvent(shift, calendarId);
          eventIds.push(newId);
        }
      } catch (error) {
        console.error(`Error syncing shift ${shift._id} to calendar:`, error);
        // Continue with other shifts even if one fails
      }
    }

    if (__DEV__) {
      console.log(`Synced ${eventIds.length} shifts to calendar`);
    }

    return eventIds;
  } catch (error: any) {
    console.error('Error syncing shifts to calendar:', error);
    throw error;
  }
};

/**
 * Remove All Shift Events from Calendar
 * Removes all calendar events for given shifts
 * @param shifts - Array of shifts with calendarEventId
 * @returns Promise<void>
 */
export const removeAllShiftEventsFromCalendar = async (shifts: Shift[]): Promise<void> => {
  try {
    const hasPermission = await checkCalendarPermission();
    if (!hasPermission) {
      return; // No permission, nothing to remove
    }

    for (const shift of shifts) {
      if (shift.calendarEventId) {
        try {
          await deleteShiftCalendarEvent(shift.calendarEventId);
        } catch (error) {
          console.error(`Error removing calendar event for shift ${shift._id}:`, error);
          // Continue with other shifts
        }
      }
    }

    if (__DEV__) {
      console.log('Removed all shift events from calendar');
    }
  } catch (error) {
    console.error('Error removing shift events from calendar:', error);
    throw error;
  }
};

// Export default for convenience
export default {
  requestCalendarPermission,
  checkCalendarPermission,
  getDeviceCalendars,
  getDefaultCalendarId,
  createShiftCalendarEvent,
  updateShiftCalendarEvent,
  deleteShiftCalendarEvent,
  getCalendarEventById,
  syncAllShiftsToCalendar,
  removeAllShiftEventsFromCalendar,
};

