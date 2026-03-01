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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useShifts } from '../../context/ShiftContext';
import { Shift, UpdateShiftRequest } from '../../types';
import { MainStackParamList } from '../../navigation/Navigation';
import { validateDateTime, validateDateString, validateTime } from '../../utils/validators';
import { formatDate, formatTime, parseDate, getTodayDateString } from '../../utils/dateHelper';

type ShiftReviewScreenNavigationProp = StackNavigationProp<MainStackParamList, 'ShiftReview'>;

interface EditableShift extends Shift {
  isConfirmed: boolean;
  isExpanded: boolean;
  isEditing: boolean;
  errors: {
    date?: string;
    startTime?: string;
    endTime?: string;
    title?: string;
  };
}

/**
 * Reminder time options
 */
const REMINDER_OPTIONS = [
  { label: '15 minutes before', value: 15 },
  { label: '30 minutes before', value: 30 },
  { label: '60 minutes before', value: 60 },
  { label: '1 day before', value: 1440 },
];

/**
 * ShiftReviewScreen Component
 * Allows users to review and confirm extracted shifts
 */
const ShiftReviewScreen: React.FC = () => {
  const navigation = useNavigation<ShiftReviewScreenNavigationProp>();
  const { uploadedShifts, confirmShift, setUploadedShifts } = useShifts();

  // State management
  const [editableShifts, setEditableShifts] = useState<EditableShift[]>([]);
  const [globalReminderTime, setGlobalReminderTime] = useState<number>(30);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize editable shifts from context
  useEffect(() => {
    if (uploadedShifts.length > 0) {
      const initialShifts: EditableShift[] = uploadedShifts.map((shift) => ({
        ...shift,
        isConfirmed: false,
        isExpanded: false,
        isEditing: false,
        errors: {},
      }));
      setEditableShifts(initialShifts);
    }
  }, [uploadedShifts]);

  /**
   * Toggle shift expansion
   */
  const toggleShiftExpansion = (index: number): void => {
    setEditableShifts((prev) =>
      prev.map((shift, i) =>
        i === index ? { ...shift, isExpanded: !shift.isExpanded } : shift
      )
    );
  };

  /**
   * Toggle shift editing mode
   */
  const toggleShiftEditing = (index: number): void => {
    setEditableShifts((prev) =>
      prev.map((shift, i) =>
        i === index ? { ...shift, isEditing: !shift.isEditing, errors: {} } : shift
      )
    );
  };

  /**
   * Toggle shift confirmation checkbox
   */
  const toggleShiftConfirmation = (index: number): void => {
    setEditableShifts((prev) =>
      prev.map((shift, i) =>
        i === index ? { ...shift, isConfirmed: !shift.isConfirmed } : shift
      )
    );
  };

  /**
   * Update shift field
   */
  const updateShiftField = (
    index: number,
    field: keyof Shift,
    value: string | number
  ): void => {
    setEditableShifts((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
        errors: {},
      };
      return updated;
    });
  };

  /**
   * Validate shift fields
   */
  const validateShift = (shift: EditableShift): boolean => {
    const errors: EditableShift['errors'] = {};

    // Validate date
    if (!shift.date) {
      errors.date = 'Date is required';
    } else {
      let dateString: string;
      if (typeof shift.date === 'string') {
        dateString = shift.date.includes('T') ? shift.date.split('T')[0] : shift.date;
      } else {
        dateString = shift.date.toISOString().split('T')[0];
      }
      if (!validateDateString(dateString)) {
        errors.date = 'Invalid date format (YYYY-MM-DD)';
      }
    }

    // Validate start time
    if (!shift.startTime) {
      errors.startTime = 'Start time is required';
    } else if (!validateTime(shift.startTime)) {
      errors.startTime = 'Invalid time format (HH:MM)';
    }

    // Validate end time
    if (!shift.endTime) {
      errors.endTime = 'End time is required';
    } else if (!validateTime(shift.endTime)) {
      errors.endTime = 'Invalid time format (HH:MM)';
    }

    // Validate date/time combination
    if (shift.date && shift.startTime && shift.endTime && !errors.date && !errors.startTime && !errors.endTime) {
      const dateString = typeof shift.date === 'string' ? shift.date : shift.date.toISOString().split('T')[0];
      if (!validateDateTime(dateString, shift.startTime, shift.endTime)) {
        errors.endTime = 'End time must be after start time';
      }
    }

    // Validate title
    if (!shift.title || shift.title.trim().length === 0) {
      errors.title = 'Title is required';
    } else if (shift.title.trim().length > 200) {
      errors.title = 'Title must be less than 200 characters';
    }

    return Object.keys(errors).length === 0;
  };

  /**
   * Validate all shifts
   */
  const validateAllShifts = (): boolean => {
    let allValid = true;
    const updatedShifts = editableShifts.map((shift) => {
      const isValid = validateShift(shift);
      if (!isValid) {
        allValid = false;
        const errors: EditableShift['errors'] = {};
        
        // Re-validate to get errors
        if (!shift.date) errors.date = 'Date is required';
        else {
          let dateString: string;
          if (typeof shift.date === 'string') {
            dateString = shift.date.includes('T') ? shift.date.split('T')[0] : shift.date;
          } else {
            dateString = shift.date.toISOString().split('T')[0];
          }
          if (!validateDateString(dateString)) errors.date = 'Invalid date format';
        }
        
        if (!shift.startTime) errors.startTime = 'Start time is required';
        else if (!validateTime(shift.startTime)) errors.startTime = 'Invalid time format';
        
        if (!shift.endTime) errors.endTime = 'End time is required';
        else if (!validateTime(shift.endTime)) errors.endTime = 'Invalid time format';
        
        if (shift.date && shift.startTime && shift.endTime && !errors.date && !errors.startTime && !errors.endTime) {
          const dateString = typeof shift.date === 'string' ? shift.date : shift.date.toISOString().split('T')[0];
          if (!validateDateTime(dateString, shift.startTime, shift.endTime)) {
            errors.endTime = 'End time must be after start time';
          }
        }
        
        if (!shift.title || shift.title.trim().length === 0) errors.title = 'Title is required';
        else if (shift.title.trim().length > 200) errors.title = 'Title must be less than 200 characters';
        
        return { ...shift, errors, isExpanded: true };
      }
      return shift;
    });

    setEditableShifts(updatedShifts);
    return allValid;
  };

  /**
   * Handle confirm and schedule
   */
  const handleConfirmAndSchedule = async (): Promise<void> => {
    // Check if at least one shift is confirmed
    const confirmedShifts = editableShifts.filter((shift) => shift.isConfirmed);
    if (confirmedShifts.length === 0) {
      Alert.alert('No Shifts Selected', 'Please select at least one shift to confirm.');
      return;
    }

    // Validate all confirmed shifts
    const shiftsToValidate = editableShifts.filter((shift) => shift.isConfirmed);
    const allValid = shiftsToValidate.every((shift) => validateShift(shift));

    if (!allValid) {
      Alert.alert(
        'Validation Error',
        'Please fix all errors before confirming shifts.'
      );
      validateAllShifts();
      return;
    }

    try {
      setConfirming(true);
      setError(null);

      // Confirm each shift
      const confirmationPromises = confirmedShifts.map((shift) =>
        confirmShift(shift._id, shift.reminderMinutesBefore || globalReminderTime)
      );

      await Promise.all(confirmationPromises);

      // Clear uploaded shifts from context
      setUploadedShifts([]);

      // Show success message
      Alert.alert(
        'Success',
        `Successfully confirmed ${confirmedShifts.length} shift(s).`,
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('Home');
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error confirming shifts:', error);
      const errorMessage =
        error?.message || 'Failed to confirm shifts. Please try again.';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setConfirming(false);
    }
  };

  /**
   * Handle cancel
   */
  const handleCancel = (): void => {
    Alert.alert(
      'Cancel Review',
      'Are you sure you want to discard all extracted shifts?',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: () => {
            setUploadedShifts([]);
            navigation.goBack();
          },
        },
      ]
    );
  };

  /**
   * Apply global reminder time to all shifts
   */
  const applyGlobalReminder = (): void => {
    setEditableShifts((prev) =>
      prev.map((shift) => ({
        ...shift,
        reminderMinutesBefore: globalReminderTime,
      }))
    );
    setShowReminderModal(false);
  };

  /**
   * Format date for input
   */
  const formatDateForInput = (date: string | Date): string => {
    if (typeof date === 'string') {
      return date.split('T')[0];
    }
    return date.toISOString().split('T')[0];
  };

  if (editableShifts.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No shifts to review</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Review Shifts</Text>
          <Text style={styles.subtitle}>
            {editableShifts.length} shift(s) extracted. Review and confirm.
          </Text>
        </View>

        {/* Global Reminder Time Selector */}
        <View style={styles.globalReminderContainer}>
          <Text style={styles.globalReminderLabel}>Default Reminder:</Text>
          <TouchableOpacity
            style={styles.reminderButton}
            onPress={() => setShowReminderModal(true)}
            testID="global-reminder-button"
          >
            <Text style={styles.reminderButtonText}>
              {REMINDER_OPTIONS.find((opt) => opt.value === globalReminderTime)?.label ||
                `${globalReminderTime} minutes`}
            </Text>
            <Text style={styles.reminderArrow}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer} testID="error-message">
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Shifts List */}
        <ScrollView style={styles.shiftsList} showsVerticalScrollIndicator={false}>
          {editableShifts.map((shift, index) => (
            <View key={shift._id} style={styles.shiftCard}>
              {/* Shift Header */}
              <TouchableOpacity
                style={styles.shiftHeader}
                onPress={() => toggleShiftExpansion(index)}
                activeOpacity={0.7}
              >
                <View style={styles.shiftHeaderLeft}>
                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={(e) => {
                      e.stopPropagation();
                      toggleShiftConfirmation(index);
                    }}
                    testID={`checkbox-${index}`}
                  >
                    {shift.isConfirmed && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                  <View style={styles.shiftHeaderInfo}>
                    <Text style={styles.shiftTitle} numberOfLines={1}>
                      {shift.title || 'Untitled Shift'}
                    </Text>
                    <Text style={styles.shiftDate}>
                      {formatDate(shift.date)} • {formatTime(shift.startTime)} -{' '}
                      {formatTime(shift.endTime)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.expandIcon}>
                  {shift.isExpanded ? '▲' : '▼'}
                </Text>
              </TouchableOpacity>

              {/* Shift Details (Expanded) */}
              {shift.isExpanded && (
                <View style={styles.shiftDetails}>
                  {/* Title */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>Title *</Text>
                    {shift.isEditing ? (
                      <TextInput
                        style={[styles.input, shift.errors.title && styles.inputError]}
                        value={shift.title}
                        onChangeText={(value) => updateShiftField(index, 'title', value)}
                        placeholder="Shift title"
                        testID={`title-input-${index}`}
                      />
                    ) : (
                      <Text style={styles.fieldValue}>{shift.title || 'No title'}</Text>
                    )}
                    {shift.errors.title && (
                      <Text style={styles.errorText}>{shift.errors.title}</Text>
                    )}
                  </View>

                  {/* Date */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>Date *</Text>
                    {shift.isEditing ? (
                      <TextInput
                        style={[styles.input, shift.errors.date && styles.inputError]}
                        value={formatDateForInput(shift.date)}
                        onChangeText={(value) => updateShiftField(index, 'date', value)}
                        placeholder="YYYY-MM-DD"
                        testID={`date-input-${index}`}
                      />
                    ) : (
                      <Text style={styles.fieldValue}>{formatDate(shift.date)}</Text>
                    )}
                    {shift.errors.date && (
                      <Text style={styles.errorText}>{shift.errors.date}</Text>
                    )}
                  </View>

                  {/* Start Time */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>Start Time *</Text>
                    {shift.isEditing ? (
                      <TextInput
                        style={[styles.input, shift.errors.startTime && styles.inputError]}
                        value={shift.startTime}
                        onChangeText={(value) => updateShiftField(index, 'startTime', value)}
                        placeholder="HH:MM"
                        testID={`start-time-input-${index}`}
                      />
                    ) : (
                      <Text style={styles.fieldValue}>{formatTime(shift.startTime)}</Text>
                    )}
                    {shift.errors.startTime && (
                      <Text style={styles.errorText}>{shift.errors.startTime}</Text>
                    )}
                  </View>

                  {/* End Time */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>End Time *</Text>
                    {shift.isEditing ? (
                      <TextInput
                        style={[styles.input, shift.errors.endTime && styles.inputError]}
                        value={shift.endTime}
                        onChangeText={(value) => updateShiftField(index, 'endTime', value)}
                        placeholder="HH:MM"
                        testID={`end-time-input-${index}`}
                      />
                    ) : (
                      <Text style={styles.fieldValue}>{formatTime(shift.endTime)}</Text>
                    )}
                    {shift.errors.endTime && (
                      <Text style={styles.errorText}>{shift.errors.endTime}</Text>
                    )}
                  </View>

                  {/* Location */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>Location</Text>
                    {shift.isEditing ? (
                      <TextInput
                        style={styles.input}
                        value={shift.location || ''}
                        onChangeText={(value) => updateShiftField(index, 'location', value)}
                        placeholder="Location (optional)"
                        testID={`location-input-${index}`}
                      />
                    ) : (
                      <Text style={styles.fieldValue}>
                        {shift.location || 'No location'}
                      </Text>
                    )}
                  </View>

                  {/* Notes */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>Notes</Text>
                    {shift.isEditing ? (
                      <TextInput
                        style={[styles.input, styles.textArea]}
                        value={shift.notes || ''}
                        onChangeText={(value) => updateShiftField(index, 'notes', value)}
                        placeholder="Notes (optional)"
                        multiline
                        numberOfLines={3}
                        testID={`notes-input-${index}`}
                      />
                    ) : (
                      <Text style={styles.fieldValue}>{shift.notes || 'No notes'}</Text>
                    )}
                  </View>

                  {/* Reminder Time */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>Reminder</Text>
                    <Text style={styles.fieldValue}>
                      {REMINDER_OPTIONS.find((opt) => opt.value === shift.reminderMinutesBefore)
                        ?.label || `${shift.reminderMinutesBefore} minutes before`}
                    </Text>
                  </View>

                  {/* Edit Button */}
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => toggleShiftEditing(index)}
                    testID={`edit-button-${index}`}
                  >
                    <Text style={styles.editButtonText}>
                      {shift.isEditing ? 'Save' : 'Edit'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.cancelButton, confirming && styles.buttonDisabled]}
            onPress={handleCancel}
            disabled={confirming}
            testID="cancel-button"
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.confirmButton,
              confirming && styles.buttonDisabled,
              editableShifts.filter((s) => s.isConfirmed).length === 0 &&
                styles.buttonDisabled,
            ]}
            onPress={handleConfirmAndSchedule}
            disabled={confirming || editableShifts.filter((s) => s.isConfirmed).length === 0}
            testID="confirm-button"
          >
            {confirming ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.confirmButtonText}>Confirming...</Text>
              </View>
            ) : (
              <Text style={styles.confirmButtonText}>
                    Confirm & Schedule ({editableShifts.filter((s) => s.isConfirmed).length})
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Reminder Time Modal */}
      <Modal
        visible={showReminderModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReminderModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Reminder Time</Text>
              <TouchableOpacity
                onPress={() => setShowReminderModal(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={REMINDER_OPTIONS}
              keyExtractor={(item) => item.value.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.reminderOption,
                    globalReminderTime === item.value && styles.reminderOptionSelected,
                  ]}
                  onPress={() => {
                    setGlobalReminderTime(item.value);
                    applyGlobalReminder();
                  }}
                >
                  <Text
                    style={[
                      styles.reminderOptionText,
                      globalReminderTime === item.value && styles.reminderOptionTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {globalReminderTime === item.value && (
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
  container: {
    flex: 1,
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  globalReminderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  globalReminderLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  reminderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  reminderButtonText: {
    fontSize: 14,
    color: '#1A1A1A',
    marginRight: 8,
  },
  reminderArrow: {
    fontSize: 12,
    color: '#666',
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
  shiftsList: {
    flex: 1,
    padding: 16,
  },
  shiftCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 12,
    overflow: 'hidden',
  },
  shiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  shiftHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 6,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkmark: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  shiftHeaderInfo: {
    flex: 1,
  },
  shiftTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  shiftDate: {
    fontSize: 14,
    color: '#666',
  },
  expandIcon: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  shiftDetails: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  fieldValue: {
    fontSize: 14,
    color: '#1A1A1A',
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
  inputError: {
    borderColor: '#FF3B30',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  editButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    marginTop: 8,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 2,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#007AFF',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  backButtonText: {
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
    maxHeight: '50%',
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
  reminderOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  reminderOptionSelected: {
    backgroundColor: '#F0F8FF',
  },
  reminderOptionText: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  reminderOptionTextSelected: {
    fontWeight: '600',
    color: '#007AFF',
  },
});

export default ShiftReviewScreen;

