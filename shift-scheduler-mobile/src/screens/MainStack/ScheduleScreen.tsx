import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useShifts } from '../../context/ShiftContext';
import { Shift } from '../../types';
import { MainStackParamList } from '../../navigation/Navigation';
import {
  formatDate,
  formatTime,
  parseDate,
  getTodayDateString,
  isToday,
  getDaysDifference,
} from '../../utils/dateHelper';

type ScheduleScreenNavigationProp = StackNavigationProp<MainStackParamList, 'Shifts'>;

type SortOption = 'date' | 'title';
type FilterOption = 'all' | 'upcoming' | 'past';

/**
 * Calendar Day Component
 */
interface CalendarDayProps {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  shiftCount: number;
  isSelected: boolean;
  onPress: () => void;
}

const CalendarDay: React.FC<CalendarDayProps> = ({
  date,
  isCurrentMonth,
  isToday: isTodayDate,
  shiftCount,
  isSelected,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.calendarDay,
        !isCurrentMonth && styles.calendarDayOtherMonth,
        isTodayDate && styles.calendarDayToday,
        isSelected && styles.calendarDaySelected,
      ]}
      onPress={onPress}
      disabled={!isCurrentMonth}
    >
      <Text
        style={[
          styles.calendarDayText,
          !isCurrentMonth && styles.calendarDayTextOtherMonth,
          isTodayDate && styles.calendarDayTextToday,
          isSelected && styles.calendarDayTextSelected,
        ]}
      >
        {date.getDate()}
      </Text>
      {shiftCount > 0 && (
        <View style={styles.shiftBadge}>
          <Text style={styles.shiftBadgeText}>{shiftCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

/**
 * ScheduleScreen Component
 * Displays calendar view and list of shifts
 */
const ScheduleScreen: React.FC = () => {
  const navigation = useNavigation<ScheduleScreenNavigationProp>();
  const { shifts, loading, error, fetchAllShifts, deleteShift } = useShifts();

  // State management
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('date');
  const [filterOption, setFilterOption] = useState<FilterOption>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Fetch shifts on mount and focus
  useFocusEffect(
    React.useCallback(() => {
      fetchAllShifts();
    }, [fetchAllShifts])
  );

  /**
   * Get shifts for a specific date
   */
  const getShiftsForDate = (date: Date): Shift[] => {
    const dateString = date.toISOString().split('T')[0];
    return shifts.filter((shift) => {
      const shiftDate = typeof shift.date === 'string' ? shift.date : shift.date.toISOString().split('T')[0];
      return shiftDate === dateString;
    });
  };

  /**
   * Get shift count for a date
   */
  const getShiftCountForDate = (date: Date): number => {
    return getShiftsForDate(date).length;
  };

  /**
   * Generate calendar days for current month
   */
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: Date[] = [];

    // Add previous month's trailing days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push(new Date(year, month - 1, prevMonthLastDay - i));
    }

    // Add current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    // Add next month's leading days to fill the grid
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }

    return days;
  }, [currentMonth]);

  /**
   * Navigate to previous month
   */
  const goToPreviousMonth = (): void => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  /**
   * Navigate to next month
   */
  const goToNextMonth = (): void => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  /**
   * Navigate to today
   */
  const goToToday = (): void => {
    setCurrentMonth(new Date());
    setSelectedDate(getTodayDateString());
  };

  /**
   * Handle date selection
   */
  const handleDateSelect = (date: Date): void => {
    const dateString = date.toISOString().split('T')[0];
    setSelectedDate(selectedDate === dateString ? null : dateString);
  };

  /**
   * Filter and sort shifts
   */
  const filteredAndSortedShifts = useMemo(() => {
    let filtered = [...shifts];

    // Apply date filter
    if (selectedDate) {
      filtered = filtered.filter((shift) => {
        const shiftDate = typeof shift.date === 'string' ? shift.date : shift.date.toISOString().split('T')[0];
        return shiftDate === selectedDate;
      });
    } else {
      // Apply filter option
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (filterOption === 'upcoming') {
        filtered = filtered.filter((shift) => {
          const shiftDate = typeof shift.date === 'string' ? parseDate(shift.date) : shift.date;
          if (!shiftDate) return false;
          const shiftDateOnly = new Date(shiftDate);
          shiftDateOnly.setHours(0, 0, 0, 0);
          return shiftDateOnly >= today;
        });
      } else if (filterOption === 'past') {
        filtered = filtered.filter((shift) => {
          const shiftDate = typeof shift.date === 'string' ? parseDate(shift.date) : shift.date;
          if (!shiftDate) return false;
          const shiftDateOnly = new Date(shiftDate);
          shiftDateOnly.setHours(0, 0, 0, 0);
          return shiftDateOnly < today;
        });
      }
    }

    // Sort shifts
    filtered.sort((a, b) => {
      if (sortOption === 'title') {
        return a.title.localeCompare(b.title);
      } else {
        // Sort by date, then by start time
        const dateA = typeof a.date === 'string' ? parseDate(a.date) : a.date;
        const dateB = typeof b.date === 'string' ? parseDate(b.date) : b.date;
        
        if (!dateA || !dateB) return 0;
        
        const dateCompare = dateA.getTime() - dateB.getTime();
        if (dateCompare !== 0) return dateCompare;
        
        return a.startTime.localeCompare(b.startTime);
      }
    });

    return filtered;
  }, [shifts, selectedDate, filterOption, sortOption]);

  /**
   * Handle shift deletion
   */
  const handleDeleteShift = (shiftId: string, shiftTitle: string): void => {
    Alert.alert(
      'Delete Shift',
      `Are you sure you want to delete "${shiftTitle}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteShift(shiftId);
            } catch (error: any) {
              Alert.alert('Error', error?.message || 'Failed to delete shift');
            }
          },
        },
      ]
    );
  };

  /**
   * Navigate to shift detail
   */
  const handleShiftPress = (shiftId: string): void => {
    navigation.navigate('ShiftDetail', { shiftId });
  };

  /**
   * Get month name
   */
  const getMonthName = (): string => {
    return currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  /**
   * Get day names for calendar header
   */
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Schedule</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowFilterModal(true)}
              testID="filter-button"
            >
              <Text style={styles.filterButtonText}>Filter</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.todayButton}
              onPress={goToToday}
              testID="today-button"
            >
              <Text style={styles.todayButtonText}>Today</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Calendar */}
        <View style={styles.calendarContainer}>
          {/* Calendar Header */}
          <View style={styles.calendarHeader}>
            <TouchableOpacity
              style={styles.monthNavButton}
              onPress={goToPreviousMonth}
              testID="prev-month-button"
            >
              <Text style={styles.monthNavButtonText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.monthName}>{getMonthName()}</Text>
            <TouchableOpacity
              style={styles.monthNavButton}
              onPress={goToNextMonth}
              testID="next-month-button"
            >
              <Text style={styles.monthNavButtonText}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Day Names */}
          <View style={styles.dayNamesRow}>
            {dayNames.map((day) => (
              <View key={day} style={styles.dayName}>
                <Text style={styles.dayNameText}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {calendarDays.map((date, index) => {
              const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
              const shiftCount = getShiftCountForDate(date);
              const dateString = date.toISOString().split('T')[0];
              const isSelected = selectedDate === dateString;

              return (
                <CalendarDay
                  key={index}
                  date={date}
                  isCurrentMonth={isCurrentMonth}
                  isToday={isToday(date)}
                  shiftCount={shiftCount}
                  isSelected={isSelected}
                  onPress={() => handleDateSelect(date)}
                />
              );
            })}
          </View>
        </View>

        {/* Filter and Sort Options */}
        {showFilterModal && (
          <View style={styles.filterModal}>
            <View style={styles.filterModalContent}>
              <Text style={styles.filterModalTitle}>Filter & Sort</Text>
              
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Filter</Text>
                {(['all', 'upcoming', 'past'] as FilterOption[]).map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.filterOption,
                      filterOption === option && styles.filterOptionSelected,
                    ]}
                    onPress={() => {
                      setFilterOption(option);
                      setSelectedDate(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        filterOption === option && styles.filterOptionTextSelected,
                      ]}
                    >
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Sort By</Text>
                {(['date', 'title'] as SortOption[]).map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.filterOption,
                      sortOption === option && styles.filterOptionSelected,
                    ]}
                    onPress={() => setSortOption(option)}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        sortOption === option && styles.filterOptionTextSelected,
                      ]}
                    >
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.filterModalClose}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.filterModalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Shifts List */}
        <View style={styles.shiftsListContainer}>
          <Text style={styles.shiftsListTitle}>
            {selectedDate
              ? `Shifts on ${formatDate(selectedDate)}`
              : filterOption === 'all'
              ? 'All Shifts'
              : filterOption === 'upcoming'
              ? 'Upcoming Shifts'
              : 'Past Shifts'}
            {` (${filteredAndSortedShifts.length})`}
          </Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Loading shifts...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={fetchAllShifts}
                testID="retry-button"
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : filteredAndSortedShifts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No shifts found</Text>
              {selectedDate && (
                <TouchableOpacity
                  style={styles.clearSelectionButton}
                  onPress={() => setSelectedDate(null)}
                >
                  <Text style={styles.clearSelectionButtonText}>Clear Selection</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <FlatList
              data={filteredAndSortedShifts}
              keyExtractor={(item) => item._id}
              renderItem={({ item: shift }) => {
                const shiftDate = typeof shift.date === 'string' ? parseDate(shift.date) : shift.date;
                const isPast = shiftDate
                  ? getDaysDifference(new Date(), shiftDate) < 0
                  : false;

                return (
                  <TouchableOpacity
                    style={[styles.shiftCard, isPast && styles.shiftCardPast]}
                    onPress={() => handleShiftPress(shift._id)}
                    testID={`shift-card-${shift._id}`}
                  >
                    <View style={styles.shiftCardContent}>
                      <View style={styles.shiftCardLeft}>
                        <Text style={styles.shiftDate}>{formatDate(shift.date)}</Text>
                        <Text style={styles.shiftTitle}>{shift.title}</Text>
                        <Text style={styles.shiftTime}>
                          {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                        </Text>
                        {shift.location && (
                          <Text style={styles.shiftLocation}>📍 {shift.location}</Text>
                        )}
                      </View>
                      <View style={styles.shiftCardRight}>
                        <Text style={styles.shiftReminder}>
                          {shift.reminderMinutesBefore} min before
                        </Text>
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleDeleteShift(shift._id, shift.title);
                          }}
                          testID={`delete-button-${shift._id}`}
                        >
                          <Text style={styles.deleteButtonText}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={styles.shiftsListContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  todayButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#007AFF',
  },
  todayButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingBottom: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  monthNavButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  monthNavButtonText: {
    fontSize: 24,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  monthName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  dayNamesRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  dayName: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayNameText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderRadius: 8,
    margin: 2,
  },
  calendarDayOtherMonth: {
    opacity: 0.3,
  },
  calendarDayToday: {
    backgroundColor: '#007AFF',
  },
  calendarDaySelected: {
    backgroundColor: '#F0F8FF',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  calendarDayText: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  calendarDayTextOtherMonth: {
    color: '#999',
  },
  calendarDayTextToday: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  calendarDayTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  shiftBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  shiftBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  filterModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  filterModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  filterModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  filterOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F5F5F5',
  },
  filterOptionSelected: {
    backgroundColor: '#F0F8FF',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  filterOptionTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  filterModalClose: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  filterModalCloseText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  shiftsListContainer: {
    flex: 1,
    padding: 16,
  },
  shiftsListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  shiftsListContent: {
    paddingBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    padding: 24,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  clearSelectionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  clearSelectionButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  shiftCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 12,
    padding: 16,
  },
  shiftCardPast: {
    opacity: 0.6,
    backgroundColor: '#F5F5F5',
  },
  shiftCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  shiftCardLeft: {
    flex: 1,
  },
  shiftCardRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  shiftDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  shiftTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  shiftTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  shiftLocation: {
    fontSize: 12,
    color: '#666',
  },
  shiftReminder: {
    fontSize: 12,
    color: '#007AFF',
    marginBottom: 8,
  },
  deleteButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#FFEBEE',
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ScheduleScreen;

