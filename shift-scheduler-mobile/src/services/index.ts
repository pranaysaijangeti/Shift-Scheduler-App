/**
 * Central export for all services
 */
export { default as api } from './api';
export { authService, default as authServiceDefault } from './AuthService';
export { shiftService, default as shiftServiceDefault } from './ShiftService';
export { fileService, default as fileServiceDefault } from './fileService';
export { userService, default as userServiceDefault } from './userService';
export { default as notificationService } from './notificationService';
export { default as calendarService } from './calendarService';

// Named exports for notification service
export {
  initializeNotifications,
  configureNotificationHandler,
  setNotificationHandler,
  requestPermissions,
  checkPermissions,
  scheduleLocalNotification,
  cancelLocalNotification,
  cancelAllNotifications,
  getScheduledNotifications,
  getNotificationById,
  updateNotification,
  scheduleMultipleNotifications,
  cancelNotificationsForShift,
  setBadgeCount,
  clearBadge,
} from './notificationService';

// Named exports for calendar service
export {
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
} from './calendarService';

// Backward compatibility exports (uppercase)
export { authService as AuthService } from './AuthService';
export { shiftService as ShiftService } from './ShiftService';
export { fileService as FileService } from './fileService';
export { userService as UserService } from './userService';

