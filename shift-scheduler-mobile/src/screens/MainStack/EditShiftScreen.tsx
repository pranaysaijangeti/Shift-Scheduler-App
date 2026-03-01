import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../../navigation/Navigation';

type EditShiftScreenRouteProp = RouteProp<MainStackParamList, 'EditShift'>;
type EditShiftScreenNavigationProp = StackNavigationProp<MainStackParamList, 'EditShift'>;

interface Props {
  route: EditShiftScreenRouteProp;
}

/**
 * EditShiftScreen Component
 * Placeholder for shift editing functionality
 */
const EditShiftScreen: React.FC<Props> = ({ route }) => {
  const navigation = useNavigation<EditShiftScreenNavigationProp>();
  const { shiftId } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Shift</Text>
      <Text style={styles.text}>Shift ID: {shiftId}</Text>
      <Text style={styles.text}>Edit shift form will be implemented here</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  text: {
    fontSize: 16,
    color: '#666',
  },
});

export default EditShiftScreen;

