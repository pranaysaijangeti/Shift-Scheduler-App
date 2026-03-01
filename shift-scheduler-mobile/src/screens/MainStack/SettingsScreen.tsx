import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  Switch,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Calendar from 'react-native-calendar-events';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { validateName } from '../../utils/validators';
import { MainStackParamList } from '../../navigation/Navigation';
import { UpdateProfileRequest, UpdatePreferencesRequest, UserPreferences } from '../../types';
import { APP_NAME, APP_VERSION } from '../../utils/config';

type SettingsScreenNavigationProp = StackNavigationProp<MainStackParamList, 'Profile'>;

/**
 * Timezone options
 */
const TIMEZONES = [
  { label: 'Eastern Time (Toronto, New York)', value: 'America/Toronto' },
  { label: 'Central Time (Chicago)', value: 'America/Chicago' },
  { label: 'Mountain Time (Denver)', value: 'America/Denver' },
  { label: 'Pacific Time (Los Angeles)', value: 'America/Los_Angeles' },
  { label: 'Atlantic Time (Halifax)', value: 'America/Halifax' },
  { label: 'Newfoundland Time', value: 'America/St_Johns' },
  { label: 'London, UK', value: 'Europe/London' },
  { label: 'Paris, France', value: 'Europe/Paris' },
  { label: 'Berlin, Germany', value: 'Europe/Berlin' },
  { label: 'Tokyo, Japan', value: 'Asia/Tokyo' },
  { label: 'Sydney, Australia', value: 'Australia/Sydney' },
  { label: 'UTC', value: 'UTC' },
];

/**
 * Notification type options
 */
const NOTIFICATION_TYPES = [
  { label: 'Sound', value: 'sound' as const },
  { label: 'Vibration', value: 'vibration' as const },
  { label: 'Silent', value: 'silent' as const },
];

/**
 * Reminder time options
 */
const REMINDER_TIMES = [
  { label: '15 minutes', value: 15 },
  { label: '30 minutes', value: 30 },
  { label: '60 minutes', value: 60 },
];

/**
 * SettingsScreen Component
 * Handles user profile and preferences settings
 */
const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const { user, logout, checkAuthStatus } = useAuth();

  // Profile state
  const [name, setName] = useState('');
  const [timezone, setTimezone] = useState('America/Toronto');
  const [nameError, setNameError] = useState<string | null>(null);

  // Preferences state
  const [preferences, setPreferences] = useState<UserPreferences>({
    notificationType: 'sound',
    reminderTime: 30,
    enableCalendarSync: true,
    enableNotifications: true,
    autoCreateCalendarEvents: true,
  });

  // UI state
  const [showTimezoneModal, setShowTimezoneModal] = useState(false);
  const [showNotificationTypeModal, setShowNotificationTypeModal] = useState(false);
  const [showReminderTimeModal, setShowReminderTimeModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setName(user.name);
      setTimezone(user.timezone || 'America/Toronto');
      loadPreferences();
    }
  }, [user]);

  /**
   * Load user preferences
   */
  const loadPreferences = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await userService.getPreferences();
      if (response.success && response.data?.preferences) {
        setPreferences(response.data.preferences);
      }
    } catch (error: any) {
      console.error('Error loading preferences:', error);
      // Use defaults if preferences don't exist
    } finally {
      setLoading(false);
    }
  };

  /**
   * Validate name input
   */
  const validateNameInput = (): boolean => {
    if (!name.trim()) {
      setNameError('Name is required');
      return false;
    }

    if (!validateName(name.trim())) {
      setNameError('Name must be 2-50 characters');
      return false;
    }

    setNameError(null);
    return true;
  };

  /**
   * Check if form has changes
   */
  useEffect(() => {
    if (user) {
      const nameChanged = name !== user.name;
      const timezoneChanged = timezone !== user.timezone;
      setHasChanges(nameChanged || timezoneChanged);
    }
  }, [name, timezone, user]);

  /**
   * Handle save profile
   */
  const handleSaveProfile = async (): Promise<void> => {
    if (!validateNameInput()) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const profileData: UpdateProfileRequest = {
        name: name.trim(),
        timezone,
      };

      const updatedUser = await userService.updateProfile(profileData);

      // Update auth context
      await checkAuthStatus();

      setSuccessMessage('Profile updated successfully');
      setHasChanges(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      const errorMessage =
        error?.message || 'Failed to update profile. Please try again.';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Handle save preferences
   */
  const handleSavePreferences = async (): Promise<void> => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const preferencesData: UpdatePreferencesRequest = {
        notificationType: preferences.notificationType,
        reminderTime: preferences.reminderTime,
        enableCalendarSync: preferences.enableCalendarSync,
        enableNotifications: preferences.enableNotifications,
        autoCreateCalendarEvents: preferences.autoCreateCalendarEvents,
      };

      await userService.updatePreferences(preferencesData);

      setSuccessMessage('Preferences updated successfully');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error('Error updating preferences:', error);
      const errorMessage =
        error?.message || 'Failed to update preferences. Please try again.';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Handle test calendar permissions
   */
  const handleTestCalendarPermissions = async (): Promise<void> => {
    try {
      const status = await Calendar.requestPermissions();
      if (status === 'authorized') {
        Alert.alert('Success', 'Calendar permissions granted');
        setLastSyncTime(new Date().toLocaleString());
      } else {
        Alert.alert(
          'Permission Denied',
          'Calendar permissions are required to sync shifts. Please enable them in Settings.'
        );
      }
    } catch (error: any) {
      console.error('Error requesting calendar permissions:', error);
      Alert.alert('Error', 'Failed to request calendar permissions');
    }
  };

  /**
   * Handle logout
   */
  const handleLogout = (): void => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              // Navigation is handled automatically by AppNavigator
            } catch (error: any) {
              Alert.alert('Error', error?.message || 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  /**
   * Get timezone label
   */
  const getTimezoneLabel = (): string => {
    const tz = TIMEZONES.find((tz) => tz.value === timezone);
    return tz ? tz.label : timezone;
  };

  /**
   * Get notification type label
   */
  const getNotificationTypeLabel = (): string => {
    const type = NOTIFICATION_TYPES.find((t) => t.value === preferences.notificationType);
    return type ? type.label : preferences.notificationType;
  };

  /**
   * Get reminder time label
   */
  const getReminderTimeLabel = (): string => {
    const time = REMINDER_TIMES.find((t) => t.value === preferences.reminderTime);
    return time ? time.label : `${preferences.reminderTime} minutes`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* Success/Error Messages */}
        {successMessage && (
          <View style={styles.successContainer}>
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        )}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* User Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Profile</Text>

          {/* Name */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Name *</Text>
            <TextInput
              style={[styles.input, nameError && styles.inputError]}
              value={name}
              onChangeText={(value) => {
                setName(value);
                setNameError(null);
              }}
              onBlur={validateNameInput}
              placeholder="Enter your name"
              editable={!saving}
              testID="name-input"
            />
            {nameError && <Text style={styles.errorText}>{nameError}</Text>}
          </View>

          {/* Email (Read-only) */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput
              style={[styles.input, styles.inputReadOnly]}
              value={user?.email || ''}
              editable={false}
              testID="email-input"
            />
            <Text style={styles.fieldHint}>Email cannot be changed</Text>
          </View>

          {/* Timezone */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Timezone</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowTimezoneModal(true)}
              disabled={saving}
              testID="timezone-picker"
            >
              <Text style={styles.pickerButtonText}>{getTimezoneLabel()}</Text>
              <Text style={styles.pickerArrow}>▼</Text>
            </TouchableOpacity>
          </View>

          {/* Save Profile Button */}
          <TouchableOpacity
            style={[styles.saveButton, (!hasChanges || saving) && styles.saveButtonDisabled]}
            onPress={handleSaveProfile}
            disabled={!hasChanges || saving}
            testID="save-profile-button"
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Save Profile</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Notification Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Preferences</Text>

          {/* Enable Notifications Toggle */}
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleLabel}>Enable Notifications</Text>
            <Switch
              value={preferences.enableNotifications}
              onValueChange={(value) =>
                setPreferences({ ...preferences, enableNotifications: value })
              }
              trackColor={{ false: '#E0E0E0', true: '#007AFF' }}
              testID="enable-notifications-toggle"
            />
          </View>

          {/* Notification Type */}
          {preferences.enableNotifications && (
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Notification Type</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowNotificationTypeModal(true)}
                disabled={saving}
                testID="notification-type-picker"
              >
                <Text style={styles.pickerButtonText}>{getNotificationTypeLabel()}</Text>
                <Text style={styles.pickerArrow}>▼</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Default Reminder Time */}
          {preferences.enableNotifications && (
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Default Reminder Time</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowReminderTimeModal(true)}
                disabled={saving}
                testID="reminder-time-picker"
              >
                <Text style={styles.pickerButtonText}>{getReminderTimeLabel()}</Text>
                <Text style={styles.pickerArrow}>▼</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Enable Calendar Sync Toggle */}
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleLabel}>Enable Calendar Sync</Text>
            <Switch
              value={preferences.enableCalendarSync}
              onValueChange={(value) =>
                setPreferences({ ...preferences, enableCalendarSync: value })
              }
              trackColor={{ false: '#E0E0E0', true: '#007AFF' }}
              testID="enable-calendar-sync-toggle"
            />
          </View>

          {/* Save Preferences Button */}
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSavePreferences}
            disabled={saving}
            testID="save-preferences-button"
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Save Preferences</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Calendar Integration Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Calendar Integration</Text>

          {/* Test Calendar Permissions */}
          <TouchableOpacity
            style={styles.testButton}
            onPress={handleTestCalendarPermissions}
            testID="test-calendar-permissions-button"
          >
            <Text style={styles.testButtonText}>Test Calendar Permissions</Text>
          </TouchableOpacity>

          {/* Last Sync Time */}
          {lastSyncTime && (
            <Text style={styles.lastSyncText}>Last sync: {lastSyncTime}</Text>
          )}
        </View>

        {/* App Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Info</Text>
          <Text style={styles.appInfoText}>App: {APP_NAME}</Text>
          <Text style={styles.appInfoText}>Version: {APP_VERSION}</Text>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => Linking.openURL('https://example.com/privacy')}
            testID="privacy-policy-link"
          >
            <Text style={styles.linkText}>Privacy Policy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => Linking.openURL('https://example.com/terms')}
            testID="terms-of-service-link"
          >
            <Text style={styles.linkText}>Terms of Service</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          testID="logout-button"
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Timezone Modal */}
      <Modal
        visible={showTimezoneModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTimezoneModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Timezone</Text>
              <TouchableOpacity
                onPress={() => setShowTimezoneModal(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={TIMEZONES}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    timezone === item.value && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setTimezone(item.value);
                    setShowTimezoneModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      timezone === item.value && styles.modalOptionTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {timezone === item.value && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Notification Type Modal */}
      <Modal
        visible={showNotificationTypeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNotificationTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notification Type</Text>
              <TouchableOpacity
                onPress={() => setShowNotificationTypeModal(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={NOTIFICATION_TYPES}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    preferences.notificationType === item.value && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setPreferences({ ...preferences, notificationType: item.value });
                    setShowNotificationTypeModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      preferences.notificationType === item.value && styles.modalOptionTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {preferences.notificationType === item.value && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Reminder Time Modal */}
      <Modal
        visible={showReminderTimeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReminderTimeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reminder Time</Text>
              <TouchableOpacity
                onPress={() => setShowReminderTimeModal(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={REMINDER_TIMES}
              keyExtractor={(item) => item.value.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    preferences.reminderTime === item.value && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setPreferences({ ...preferences, reminderTime: item.value });
                    setShowReminderTimeModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      preferences.reminderTime === item.value && styles.modalOptionTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {preferences.reminderTime === item.value && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  header: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  successContainer: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  successText: {
    fontSize: 14,
    color: '#4CAF50',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  fieldHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#1A1A1A',
    backgroundColor: '#FFFFFF',
  },
  inputReadOnly: {
    backgroundColor: '#F5F5F5',
    color: '#666',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  pickerButton: {
    height: 44,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  pickerButtonText: {
    fontSize: 14,
    color: '#1A1A1A',
    flex: 1,
  },
  pickerArrow: {
    fontSize: 12,
    color: '#666',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  toggleLabel: {
    fontSize: 14,
    color: '#1A1A1A',
    flex: 1,
  },
  saveButton: {
    height: 44,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  testButton: {
    height: 44,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  testButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  lastSyncText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  appInfoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  linkButton: {
    paddingVertical: 12,
  },
  linkText: {
    fontSize: 14,
    color: '#007AFF',
  },
  logoutButton: {
    height: 52,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 16,
    marginTop: 24,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 24,
    color: '#666',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalOptionSelected: {
    backgroundColor: '#F0F8FF',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  modalOptionTextSelected: {
    fontWeight: '600',
    color: '#007AFF',
  },
  checkmark: {
    fontSize: 18,
    color: '#007AFF',
    marginLeft: 8,
  },
});

export default SettingsScreen;

