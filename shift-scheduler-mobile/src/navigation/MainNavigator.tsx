import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/MainStack/HomeScreen';
import ShiftsScreen from '../screens/MainStack/ShiftsScreen';
import UploadScreen from '../screens/MainStack/UploadScreen';
import ProfileScreen from '../screens/MainStack/ProfileScreen';
import ShiftDetailScreen from '../screens/MainStack/ShiftDetailScreen';
import ShiftReviewScreen from '../screens/MainStack/ShiftReviewScreen';

export type MainStackParamList = {
  Home: undefined;
  Shifts: undefined;
  Upload: undefined;
  Profile: undefined;
  ShiftDetail: { shiftId: string };
  EditShift: { shiftId: string };
  ShiftReview: undefined;
};

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator<MainStackParamList>();

const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Shifts" component={ShiftsScreen} />
      <Tab.Screen name="Upload" component={UploadScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const MainNavigator: React.FC = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ShiftDetail"
        component={ShiftDetailScreen}
        options={{ title: 'Shift Details' }}
      />
      <Stack.Screen
        name="ShiftReview"
        component={ShiftReviewScreen}
        options={{ title: 'Review Shifts' }}
      />
    </Stack.Navigator>
  );
};

export default MainNavigator;

