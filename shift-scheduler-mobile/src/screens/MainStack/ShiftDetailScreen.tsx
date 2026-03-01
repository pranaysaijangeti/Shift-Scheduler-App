import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { MainStackParamList } from '../../navigation/Navigation';

type ShiftDetailScreenRouteProp = RouteProp<MainStackParamList, 'ShiftDetail'>;

interface Props {
  route: ShiftDetailScreenRouteProp;
}

const ShiftDetailScreen: React.FC<Props> = ({ route }) => {
  const { shiftId } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shift Details</Text>
      <Text>Shift ID: {shiftId}</Text>
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
});

export default ShiftDetailScreen;

