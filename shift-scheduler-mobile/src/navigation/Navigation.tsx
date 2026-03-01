import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

// Auth Stack Screens
import LoginScreen from '../screens/AuthStack/LoginScreen';
import RegisterScreen from '../screens/AuthStack/RegisterScreen';

// Main Stack Screens
import HomeScreen from '../screens/MainStack/HomeScreen';
import UploadScreen from '../screens/MainStack/UploadScreen';
import ScheduleScreen from '../screens/MainStack/ScheduleScreen';
import SettingsScreen from '../screens/MainStack/SettingsScreen';
import ShiftDetailScreen from '../screens/MainStack/ShiftDetailScreen';
import ShiftReviewScreen from '../screens/MainStack/ShiftReviewScreen';
import EditShiftScreen from '../screens/MainStack/EditShiftScreen';
import LoadingScreen from '../screens/MainStack/LoadingScreen';

/**
 * Auth Stack Param List
 */
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

/**
 * Main Stack Param List
 */
export type MainStackParamList = {
  MainTabs: undefined;
  ShiftDetail: { shiftId: string };
  EditShift: { shiftId: string };
  ShiftReview: undefined;
};

/**
 * Root Stack Param List
 */
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Loading: undefined;
};

const AuthStack = createStackNavigator<AuthStackParamList>();
const MainStack = createStackNavigator<MainStackParamList>();
const Tab = createBottomTabNavigator();
const RootStack = createStackNavigator<RootStackParamList>();

/**
 * Auth Navigator
 * Stack navigator for unauthenticated users
 */
const AuthNavigator: React.FC = () => {
  return (
    <AuthStack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#FFFFFF' },
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen
        name="Register"
        component={RegisterScreen}
        options={{
          headerShown: true,
          title: 'Create Account',
          headerBackTitleVisible: false,
        }}
      />
    </AuthStack.Navigator>
  );
};

/**
 * Main Tabs Navigator
 * Bottom tab navigator for authenticated users
 */
const MainTabsNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Upload') {
            iconName = focused ? 'cloud-upload' : 'cloud-upload-outline';
          } else if (route.name === 'Schedule') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          paddingBottom: 4,
          paddingTop: 4,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="Upload"
        component={UploadScreen}
        options={{
          tabBarLabel: 'Upload',
        }}
      />
      <Tab.Screen
        name="Schedule"
        component={ScheduleScreen}
        options={{
          tabBarLabel: 'Schedule',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
};

/**
 * Main Stack Navigator
 * Stack navigator with tabs and additional screens
 */
const MainNavigator: React.FC = () => {
  return (
    <MainStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#FFFFFF',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#E0E0E0',
        },
        headerTintColor: '#1A1A1A',
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
        headerBackTitleVisible: false,
      }}
    >
      <MainStack.Screen
        name="MainTabs"
        component={MainTabsNavigator}
        options={{ headerShown: false }}
      />
      <MainStack.Screen
        name="ShiftDetail"
        component={ShiftDetailScreen}
        options={({ route }) => ({
          title: 'Shift Details',
          headerBackTitle: 'Back',
        })}
      />
      <MainStack.Screen
        name="EditShift"
        component={EditShiftScreen}
        options={{
          title: 'Edit Shift',
          headerBackTitle: 'Cancel',
        }}
      />
      <MainStack.Screen
        name="ShiftReview"
        component={ShiftReviewScreen}
        options={{
          title: 'Review Shifts',
          headerBackTitle: 'Back',
        }}
      />
    </MainStack.Navigator>
  );
};

/**
 * Root Navigator
 * Switches between Auth and Main stacks based on authentication status
 */
const RootNavigator: React.FC = () => {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Loading" component={LoadingScreen} />
      </RootStack.Navigator>
    );
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {token ? (
        <RootStack.Screen name="Main" component={MainNavigator} />
      ) : (
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      )}
    </RootStack.Navigator>
  );
};

/**
 * Navigation Component
 * Root navigator (NavigationContainer is handled in App.tsx)
 */
const Navigation: React.FC = () => {
  return <RootNavigator />;
};

export default Navigation;

