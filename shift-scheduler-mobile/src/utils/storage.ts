import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';

/**
 * Storage Keys
 */
const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER_DATA: 'userData',
} as const;

/**
 * Storage Utility Functions
 * Handles all AsyncStorage operations for the app
 */

/**
 * Save JWT token to AsyncStorage
 * @param token - JWT token string
 * @returns Promise<void>
 */
export const saveToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  } catch (error) {
    console.error('Error saving token:', error);
    throw new Error('Failed to save token');
  }
};

/**
 * Get JWT token from AsyncStorage
 * @returns Promise<string | null> - Token string or null if not found
 */
export const getToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    return token;
  } catch (error) {
    console.error('Error getting token:', error);
    throw new Error('Failed to get token');
  }
};

/**
 * Remove JWT token from AsyncStorage
 * @returns Promise<void>
 */
export const removeToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  } catch (error) {
    console.error('Error removing token:', error);
    throw new Error('Failed to remove token');
  }
};

/**
 * Save user data to AsyncStorage
 * @param user - User object to save
 * @returns Promise<void>
 */
export const saveUserData = async (user: User): Promise<void> => {
  try {
    const userJson = JSON.stringify(user);
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, userJson);
  } catch (error) {
    console.error('Error saving user data:', error);
    throw new Error('Failed to save user data');
  }
};

/**
 * Get user data from AsyncStorage
 * @returns Promise<User | null> - User object or null if not found
 */
export const getUserData = async (): Promise<User | null> => {
  try {
    const userJson = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    if (!userJson) {
      return null;
    }
    const user = JSON.parse(userJson) as User;
    return user;
  } catch (error) {
    console.error('Error getting user data:', error);
    throw new Error('Failed to get user data');
  }
};

/**
 * Remove user data from AsyncStorage
 * @returns Promise<void>
 */
export const removeUserData = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
  } catch (error) {
    console.error('Error removing user data:', error);
    throw new Error('Failed to remove user data');
  }
};

/**
 * Clear all app data from AsyncStorage
 * This removes all stored data including tokens and user data
 * @returns Promise<void>
 */
export const clearAllStorage = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.USER_DATA,
    ]);
  } catch (error) {
    console.error('Error clearing storage:', error);
    // Fallback: clear all AsyncStorage
    try {
      await AsyncStorage.clear();
    } catch (clearError) {
      console.error('Error clearing all AsyncStorage:', clearError);
      throw new Error('Failed to clear storage');
    }
  }
};

/**
 * Get all storage keys (for debugging)
 * @returns Promise<string[]> - Array of all storage keys
 */
export const getAllKeys = async (): Promise<string[]> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    return keys;
  } catch (error) {
    console.error('Error getting all keys:', error);
    throw new Error('Failed to get storage keys');
  }
};

