import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, LoginResponse, ApiResponse } from '../types';

const TOKEN_KEY = 'token';

/**
 * Authentication Service
 * Handles all authentication-related API calls and token management
 */
export const authService = {
  /**
   * Register a new user
   * @param name - User's full name
   * @param email - User's email address
   * @param password - User's password
   * @param timezone - User's timezone (optional, defaults to 'America/Toronto')
   * @returns Promise with user data and token
   */
  async register(
    name: string,
    email: string,
    password: string,
    timezone?: string
  ): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/register', {
      name,
      email,
      password,
      timezone: timezone || 'America/Toronto',
    });
    return response;
  },

  /**
   * Login user
   * @param email - User's email address
   * @param password - User's password
   * @returns Promise with user data and token
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', {
      email,
      password,
    });
    return response;
  },

  /**
   * Logout user
   * Clears token from storage and calls logout endpoint
   * @returns Promise<void>
   */
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Continue even if API call fails
      console.error('Logout API call failed:', error);
    } finally {
      // Always remove token from storage
      await this.removeToken();
    }
  },

  /**
   * Verify JWT token and get current user
   * @returns Promise with user data
   */
  async verifyToken(): Promise<User> {
    const response = await api.get<{ success: boolean; user: User }>('/auth/verify');
    return response.user;
  },

  /**
   * Save JWT token to AsyncStorage
   * @param token - JWT token string
   * @returns Promise<void>
   */
  async saveToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } catch (error) {
      console.error('Error saving token:', error);
      throw error;
    }
  },

  /**
   * Get JWT token from AsyncStorage
   * @returns Promise with token string or null
   */
  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },

  /**
   * Remove JWT token from AsyncStorage
   * @returns Promise<void>
   */
  async removeToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
    } catch (error) {
      console.error('Error removing token:', error);
      throw error;
    }
  },
};

// Export default for convenience
export default authService;
