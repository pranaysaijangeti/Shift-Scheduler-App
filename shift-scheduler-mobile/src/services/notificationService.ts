import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Shift } from '../types';
import { parseDate } from '../utils/dateHelper';

/**
 * Notification handler configuration
 */
let notificationHandler: ((notification: Notifications.Notification) => void) | null = null;

/**
 * Initialize Notifications Service
 * Sets up notification handlers and requests permissions
 */
export const initializeNotifications = async (): Promise<void> => {
  try {
    // Configure notification behavior
    await configureNotificationHandler();

    // Request permissions
    await requestPermissions();

    // Set up notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Shift Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
      });
    }

    if (__DEV__) {
      console.log('Notifications initialized successfully');
    }
  } catch (error) {
    console.error('Error initializing notifications:', error);
    throw error;
  }
};

/**
 * Configure Notification Handler
 * Sets up handlers for foreground and background notifications
 */
export const configureNotificationHandler = async (): Promise<void> => {
  try {
    // Set notification handler for when app is in foreground
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        // Show notification even when app is in foreground
        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        };
      },
    });

    // Handle notification received while app is in foreground
    Notifications.addNotificationReceivedListener((notification) => {
      if (notificationHandler) {
        notificationHandler(notification);
      }
      if (__DEV__) {
        console.log('Notification received:', notification);
      }
    });

    // Handle notification tap
    Notifications.addNotificationResponseReceivedListener((response) => {
      const { notification } = response;
      const shiftId = notification.request.content.data?.shiftId;

      if (__DEV__) {
        console.log('Notification tapped:', notification);
      }

      // Handle navigation to shift details
      // This will be handled by the app's navigation system
      // You can emit an event or use a navigation ref here
      if (shiftId && notificationHandler) {
        notificationHandler(notification);
      }
    });

    if (__DEV__) {
      console.log('Notification handler configured');
    }
  } catch (error) {
    console.error('Error configuring notification handler:', error);
    throw error;
  }
};

/**
 * Set custom notification handler callback
 * @param handler - Function to call when notification is received/tapped
 */
export const setNotificationHandler = (
  handler: (notification: Notifications.Notification) => void
): void => {
  notificationHandler = handler;
};

/**
 * Request Notification Permissions
 * Requests NOTIFICATIONS permission from the user
 */
export const requestPermissions = async (): Promise<boolean> => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;

    // If permission not granted, request it
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      if (__DEV__) {
        console.warn('Notification permissions not granted');
      }
      return false;
    }

    // Request Android-specific permissions
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Shift Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
      });
    }

    if (__DEV__) {
      console.log('Notification permissions granted');
    }

    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

/**
 * Check Notification Permissions
 * Returns current permission status
 */
export const checkPermissions = async (): Promise<Notifications.PermissionStatus> => {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  } catch (error) {
    console.error('Error checking notification permissions:', error);
    return 'undetermined';
  }
};

/**
 * Schedule Local Notification
 * Schedules a notification for a shift at the specified time before the shift
 * @param shift - Shift object
 * @param minutesBefore - Minutes before shift to trigger notification
 * @param notificationType - User's notification preference (sound, vibration, silent)
 * @returns Promise with notification ID
 */
export const scheduleLocalNotification = async (
  shift: Shift,
  minutesBefore: number,
  notificationType: 'sound' | 'vibration' | 'silent' = 'sound'
): Promise<string> => {
  try {
    // Parse shift date
    const shiftDate = typeof shift.date === 'string' ? parseDate(shift.date) : shift.date;
    if (!shiftDate) {
      throw new Error('Invalid shift date');
    }

    // Parse start time
    const [hours, minutes] = shift.startTime.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) {
      throw new Error('Invalid shift start time');
    }

    // Set shift date and time
    const shiftDateTime = new Date(shiftDate);
    shiftDateTime.setHours(hours, minutes, 0, 0);

    // Calculate trigger time (shift time - minutesBefore)
    const triggerTime = new Date(shiftDateTime.getTime() - minutesBefore * 60 * 1000);

    // Don't schedule if trigger time is in the past
    if (triggerTime < new Date()) {
      if (__DEV__) {
        console.warn('Cannot schedule notification in the past:', triggerTime);
      }
      throw new Error('Cannot schedule notification in the past');
    }

    // Configure notification content
    const notificationContent: Notifications.NotificationContentInput = {
      title: 'Upcoming Shift',
      body: `${shift.title} at ${shift.startTime}${shift.location ? ` - ${shift.location}` : ''}`,
      data: {
        shiftId: shift._id,
        shiftTitle: shift.title,
        shiftDate: shiftDateTime.toISOString(),
        reminderMinutesBefore: minutesBefore,
      },
      sound: notificationType === 'sound' ? 'default' : false,
      badge: 1,
    };

    // Configure notification trigger
    const trigger: Notifications.NotificationTriggerInput = {
      date: triggerTime,
    };

    // Schedule notification
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger,
    });

    if (__DEV__) {
      console.log('Notification scheduled:', {
        notificationId,
        shiftId: shift._id,
        triggerTime: triggerTime.toISOString(),
        minutesBefore,
      });
    }

    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    throw error;
  }
};

/**
 * Cancel Local Notification
 * Cancels a scheduled notification by ID
 * @param notificationId - Notification ID to cancel
 */
export const cancelLocalNotification = async (notificationId: string): Promise<void> => {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);

    if (__DEV__) {
      console.log('Notification cancelled:', notificationId);
    }
  } catch (error) {
    console.error('Error cancelling notification:', error);
    throw error;
  }
};

/**
 * Cancel All Notifications
 * Cancels all scheduled notifications
 */
export const cancelAllNotifications = async (): Promise<void> => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();

    if (__DEV__) {
      console.log('All notifications cancelled');
    }
  } catch (error) {
    console.error('Error cancelling all notifications:', error);
    throw error;
  }
};

/**
 * Get Scheduled Notifications
 * Returns array of all scheduled notifications with their IDs
 * @returns Promise with array of scheduled notification info
 */
export const getScheduledNotifications = async (): Promise<
  Array<{
    identifier: string;
    trigger: Notifications.NotificationTrigger;
    content: Notifications.NotificationContent;
  }>
> => {
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();

    if (__DEV__) {
      console.log('Scheduled notifications:', notifications.length);
    }

    return notifications;
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    throw error;
  }
};

/**
 * Get Notification by ID
 * Returns notification info for a specific ID
 * @param notificationId - Notification ID
 * @returns Promise with notification info or null if not found
 */
export const getNotificationById = async (
  notificationId: string
): Promise<{
  identifier: string;
  trigger: Notifications.NotificationTrigger;
  content: Notifications.NotificationContent;
} | null> => {
  try {
    const notifications = await getScheduledNotifications();
    return notifications.find((n) => n.identifier === notificationId) || null;
  } catch (error) {
    console.error('Error getting notification by ID:', error);
    return null;
  }
};

/**
 * Update Notification
 * Updates an existing scheduled notification
 * @param notificationId - Notification ID to update
 * @param shift - Updated shift object
 * @param minutesBefore - Updated minutes before
 * @param notificationType - Updated notification type
 */
export const updateNotification = async (
  notificationId: string,
  shift: Shift,
  minutesBefore: number,
  notificationType: 'sound' | 'vibration' | 'silent' = 'sound'
): Promise<string> => {
  try {
    // Cancel existing notification
    await cancelLocalNotification(notificationId);

    // Schedule new notification
    const newNotificationId = await scheduleLocalNotification(shift, minutesBefore, notificationType);

    if (__DEV__) {
      console.log('Notification updated:', {
        oldId: notificationId,
        newId: newNotificationId,
      });
    }

    return newNotificationId;
  } catch (error) {
    console.error('Error updating notification:', error);
    throw error;
  }
};

/**
 * Schedule Multiple Notifications
 * Schedules notifications for multiple shifts
 * @param shifts - Array of shifts
 * @param minutesBefore - Minutes before each shift
 * @param notificationType - Notification type preference
 * @returns Promise with array of notification IDs
 */
export const scheduleMultipleNotifications = async (
  shifts: Shift[],
  minutesBefore: number,
  notificationType: 'sound' | 'vibration' | 'silent' = 'sound'
): Promise<string[]> => {
  try {
    const notificationIds: string[] = [];

    for (const shift of shifts) {
      try {
        const notificationId = await scheduleLocalNotification(
          shift,
          minutesBefore,
          notificationType
        );
        notificationIds.push(notificationId);
      } catch (error) {
        console.error(`Error scheduling notification for shift ${shift._id}:`, error);
        // Continue with other shifts even if one fails
      }
    }

    if (__DEV__) {
      console.log(`Scheduled ${notificationIds.length} notifications`);
    }

    return notificationIds;
  } catch (error) {
    console.error('Error scheduling multiple notifications:', error);
    throw error;
  }
};

/**
 * Cancel Notifications for Shift
 * Cancels all notifications associated with a shift
 * @param shiftId - Shift ID
 */
export const cancelNotificationsForShift = async (shiftId: string): Promise<void> => {
  try {
    const notifications = await getScheduledNotifications();
    const shiftNotifications = notifications.filter(
      (n) => n.content.data?.shiftId === shiftId
    );

    for (const notification of shiftNotifications) {
      await cancelLocalNotification(notification.identifier);
    }

    if (__DEV__) {
      console.log(`Cancelled ${shiftNotifications.length} notifications for shift ${shiftId}`);
    }
  } catch (error) {
    console.error('Error cancelling notifications for shift:', error);
    throw error;
  }
};

/**
 * Set Badge Count
 * Sets the app badge count
 * @param count - Badge count (0 to clear)
 */
export const setBadgeCount = async (count: number): Promise<void> => {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    console.error('Error setting badge count:', error);
    // Badge count is not critical, so we don't throw
  }
};

/**
 * Clear Badge
 * Clears the app badge
 */
export const clearBadge = async (): Promise<void> => {
  await setBadgeCount(0);
};

// Export default for convenience
export default {
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
};

