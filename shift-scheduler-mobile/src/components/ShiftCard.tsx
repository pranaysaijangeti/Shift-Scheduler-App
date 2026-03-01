import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Shift } from '../types';
import { formatDate, formatTime } from '../utils/dateHelper';

/**
 * ShiftCard Props
 */
export interface ShiftCardProps {
  shift: Shift;
  onEdit?: () => void;
  onDelete?: () => void;
  onTap?: () => void;
}

/**
 * ShiftCard Component
 * Displays shift information in a card format with edit and delete actions
 */
const ShiftCard: React.FC<ShiftCardProps> = ({
  shift,
  onEdit,
  onDelete,
  onTap,
}) => {
  const handleTap = (): void => {
    if (onTap) {
      onTap();
    }
  };

  const handleEdit = (e: any): void => {
    e?.stopPropagation();
    if (onEdit) {
      onEdit();
    }
  };

  const handleDelete = (e: any): void => {
    e?.stopPropagation();
    if (onDelete) {
      onDelete();
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handleTap}
      activeOpacity={0.7}
      testID={`shift-card-${shift._id}`}
    >
      <View style={styles.cardContent}>
        {/* Main Content */}
        <View style={styles.mainContent}>
          <Text style={styles.title} numberOfLines={1}>
            {shift.title}
          </Text>
          <View style={styles.dateTimeRow}>
            <Text style={styles.date}>{formatDate(shift.date)}</Text>
            <Text style={styles.separator}>•</Text>
            <Text style={styles.time}>
              {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
            </Text>
          </View>
          {shift.location && (
            <View style={styles.locationRow}>
              <Text style={styles.locationIcon}>📍</Text>
              <Text style={styles.location} numberOfLines={1}>
                {shift.location}
              </Text>
            </View>
          )}
          <View style={styles.reminderRow}>
            <Text style={styles.reminderIcon}>⏰</Text>
            <Text style={styles.reminder}>
              {shift.reminderMinutesBefore} min before
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        {(onEdit || onDelete) && (
          <View style={styles.actions}>
            {onEdit && (
              <TouchableOpacity
                style={styles.editButton}
                onPress={handleEdit}
                testID={`edit-button-${shift._id}`}
              >
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDelete}
                testID={`delete-button-${shift._id}`}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mainContent: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  separator: {
    fontSize: 14,
    color: '#999',
    marginHorizontal: 6,
  },
  time: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  locationIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  location: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  reminder: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    gap: 8,
  },
  editButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#F0F8FF',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  editButtonText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ShiftCard;

