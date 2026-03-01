import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { shiftService } from '../../services';
import { Shift } from '../../types';

const HomeScreen: React.FC = () => {
  const [upcomingShifts, setUpcomingShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUpcomingShifts();
  }, []);

  const loadUpcomingShifts = async () => {
    try {
      const shifts = await shiftService.fetchUpcomingShifts();
      setUpcomingShifts(shifts);
    } catch (error) {
      console.error('Error loading shifts:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upcoming Shifts</Text>
      {loading ? (
        <Text>Loading...</Text>
      ) : (
        <FlatList
          data={upcomingShifts}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.shiftCard}>
              <Text style={styles.shiftTitle}>{item.title}</Text>
              <Text>{item.date} • {item.startTime} - {item.endTime}</Text>
              {item.location && <Text>📍 {item.location}</Text>}
            </View>
          )}
          ListEmptyComponent={<Text>No upcoming shifts</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  shiftCard: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  shiftTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
});

export default HomeScreen;

