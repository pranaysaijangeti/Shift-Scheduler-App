import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
} from 'react-native';

/**
 * Reminder time options
 */
export const REMINDER_OPTIONS = [
  { label: '15 minutes before', value: 15 },
  { label: '30 minutes before', value: 30 },
  { label: '60 minutes before', value: 60 },
  { label: '1 day before', value: 1440 },
];

/**
 * ReminderConfigurator Props
 */
export interface ReminderConfiguratorProps {
  onSave: (reminderMinutes: number) => void;
  currentValue?: number;
  showSaveButton?: boolean;
}

/**
 * ReminderConfigurator Component
 * Allows users to select reminder time with a dropdown
 */
const ReminderConfigurator: React.FC<ReminderConfiguratorProps> = ({
  onSave,
  currentValue = 30,
  showSaveButton = true,
}) => {
  const [selectedValue, setSelectedValue] = useState<number>(currentValue);
  const [showModal, setShowModal] = useState(false);

  const handleSave = (): void => {
    onSave(selectedValue);
    setShowModal(false);
  };

  const handleSelect = (value: number): void => {
    setSelectedValue(value);
    if (!showSaveButton) {
      onSave(value);
      setShowModal(false);
    }
  };

  const getCurrentLabel = (): string => {
    const option = REMINDER_OPTIONS.find((opt) => opt.value === selectedValue);
    return option ? option.label : `${selectedValue} minutes before`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Reminder Time</Text>
      <TouchableOpacity
        style={styles.pickerButton}
        onPress={() => setShowModal(true)}
        testID="reminder-picker-button"
      >
        <Text style={styles.pickerButtonText}>{getCurrentLabel()}</Text>
        <Text style={styles.pickerArrow}>▼</Text>
      </TouchableOpacity>

      {showSaveButton && (
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          testID="reminder-save-button"
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      )}

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Reminder Time</Text>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
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
                    styles.modalOption,
                    selectedValue === item.value && styles.modalOptionSelected,
                  ]}
                  onPress={() => handleSelect(item.value)}
                  testID={`reminder-option-${item.value}`}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      selectedValue === item.value && styles.modalOptionTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {selectedValue === item.value && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
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
  saveButton: {
    height: 44,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
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

export default ReminderConfigurator;

