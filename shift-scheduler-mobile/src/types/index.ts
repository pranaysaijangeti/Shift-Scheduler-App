/**
 * TypeScript Types and Interfaces for Shift Scheduler Mobile App
 */

/**
 * User interface
 */
export interface User {
  _id: string;
  id?: string; // Alias for _id (some APIs return id instead of _id)
  name: string;
  email: string;
  phone?: string;
  timezone: string;
  defaultReminderMinutes: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Shift interface
 */
export interface Shift {
  _id: string;
  userId: string;
  title: string;
  date: string | Date; // ISO date string or Date object
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  location?: string;
  notes?: string;
  reminderMinutesBefore: number;
  alarmSet: boolean;
  calendarEventId?: string;
  notificationId?: string;
  extractedFrom?: 'image' | 'text' | 'excel';
  fileName?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * UserPreferences interface
 */
export interface UserPreferences {
  notificationType: 'sound' | 'vibration' | 'silent';
  reminderTime: number; // Minutes before shift
  enableCalendarSync: boolean;
  enableNotifications: boolean;
  autoCreateCalendarEvents: boolean;
  updatedAt?: string;
}

/**
 * LoginResponse interface
 * Response from login/register endpoints
 */
export interface LoginResponse {
  success: boolean;
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    timezone: string;
  };
}

/**
 * AuthState interface
 * State management for authentication
 */
export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

/**
 * ShiftState interface
 * State management for shifts
 */
export interface ShiftState {
  shifts: Shift[];
  uploadedShifts: Shift[]; // Shifts extracted from uploaded files (pending confirmation)
  loading: boolean;
  error: string | null;
  pagination?: {
    total: number;
    limit: number;
    skip: number;
    hasMore: boolean;
  };
}

/**
 * ApiResponse<T> generic interface
 * Standard API response format
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  statusCode?: number;
  error?: string | Record<string, any>;
}

/**
 * Notification interface
 */
export interface Notification {
  id: string;
  _id?: string; // Alias for id
  shiftId: string;
  reminderMinutesBefore: number;
  triggerTime: string | Date; // ISO date string or Date object
  sent: boolean;
  sentAt?: string | Date;
  status: 'pending' | 'sent' | 'cancelled';
  createdAt?: string;
  updatedAt?: string;
}

/**
 * UploadedFile interface
 */
export interface UploadedFile {
  id: string;
  _id?: string; // Alias for id
  fileName: string;
  fileType: 'image' | 'text' | 'excel';
  uploadedAt: string | Date;
  shiftsExtracted: number;
  status: 'pending' | 'processed' | 'error';
  errorMessage?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * CreateShiftRequest interface
 * Request payload for creating a shift
 */
export interface CreateShiftRequest {
  title: string;
  date: string | Date;
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  location?: string;
  notes?: string;
  reminderMinutesBefore?: number;
}

/**
 * UpdateShiftRequest interface
 * Request payload for updating a shift
 */
export interface UpdateShiftRequest {
  title?: string;
  date?: string | Date;
  startTime?: string; // HH:MM format
  endTime?: string; // HH:MM format
  location?: string;
  notes?: string;
  reminderMinutesBefore?: number;
  alarmSet?: boolean;
  calendarEventId?: string;
  notificationId?: string;
}

/**
 * ConfirmShiftRequest interface
 * Request payload for confirming a shift
 */
export interface ConfirmShiftRequest {
  reminderMinutesBefore?: number;
}

/**
 * ScheduleNotificationRequest interface
 * Request payload for scheduling a notification
 */
export interface ScheduleNotificationRequest {
  shiftId: string;
  reminderMinutesBefore: number;
}

/**
 * UpdateProfileRequest interface
 * Request payload for updating user profile
 */
export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  timezone?: string;
  defaultReminderMinutes?: number;
}

/**
 * UpdatePreferencesRequest interface
 * Request payload for updating user preferences
 */
export interface UpdatePreferencesRequest {
  notificationType?: 'sound' | 'vibration' | 'silent';
  reminderTime?: number;
  enableCalendarSync?: boolean;
  enableNotifications?: boolean;
  autoCreateCalendarEvents?: boolean;
}

/**
 * PaginationParams interface
 * Query parameters for paginated requests
 */
export interface PaginationParams {
  limit?: number;
  skip?: number;
  page?: number;
}

/**
 * ShiftFilters interface
 * Filters for shift queries
 */
export interface ShiftFilters extends PaginationParams {
  startDate?: string;
  endDate?: string;
  status?: string;
}

/**
 * UploadFileResponse interface
 * Response from file upload endpoint
 */
export interface UploadFileResponse {
  success: boolean;
  shifts: Shift[];
  uploadFileId: string;
  fileName: string;
  fileType: 'image' | 'text' | 'excel';
  shiftsCount: number;
}

/**
 * GetShiftsResponse interface
 * Response from get all shifts endpoint
 */
export interface GetShiftsResponse {
  success: boolean;
  shifts: Shift[];
  pagination: {
    total: number;
    limit: number;
    skip: number;
    hasMore: boolean;
  };
}

/**
 * GetUpcomingShiftsResponse interface
 * Response from get upcoming shifts endpoint
 */
export interface GetUpcomingShiftsResponse {
  success: boolean;
  shifts: Shift[];
  count: number;
}

/**
 * GetPendingNotificationsResponse interface
 * Response from get pending notifications endpoint
 */
export interface GetPendingNotificationsResponse {
  success: boolean;
  notifications: Array<{
    id: string;
    shiftId: string;
    shift: {
      title: string;
      date: string | Date;
      startTime: string;
      endTime: string;
      location?: string;
      notes?: string;
    };
    reminderMinutesBefore: number;
    triggerTime: string | Date;
    createdAt: string | Date;
  }>;
  count: number;
}

/**
 * ErrorResponse interface
 * Standard error response format
 */
export interface ErrorResponse {
  success: false;
  message: string;
  statusCode: number;
  error?: string | Record<string, any>;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

/**
 * Navigation Types
 */
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainStackParamList = {
  MainTabs: undefined;
  ShiftDetail: { shiftId: string };
};

export type MainTabParamList = {
  Home: undefined;
  Shifts: undefined;
  Upload: undefined;
  Profile: undefined;
};
