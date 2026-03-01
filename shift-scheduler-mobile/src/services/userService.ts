import api from './api';
import { User, UpdateProfileRequest, ApiResponse } from '../types';

/**
 * User Service
 * Handles user profile-related API calls
 */
export const userService = {
  /**
   * Get current user profile
   * @returns Promise with user data
   */
  async getProfile(): Promise<User> {
    const response = await api.get<{ success: boolean; user: User }>('/users/profile');
    return response.user;
  },

  /**
   * Update user profile
   * @param profileData - Profile data to update
   * @returns Promise with updated user data
   */
  async updateProfile(profileData: UpdateProfileRequest): Promise<User> {
    const response = await api.put<{ success: boolean; user: User }>('/users/profile', profileData);
    return response.user;
  },

  /**
   * Get user preferences
   * @returns Promise with user preferences
   */
  async getPreferences(): Promise<ApiResponse<{ preferences: any }>> {
    const response = await api.get('/users/preferences');
    return response;
  },

  /**
   * Update user preferences
   * @param preferencesData - Preferences data to update
   * @returns Promise with updated preferences
   */
  async updatePreferences(preferencesData: any): Promise<any> {
    const response = await api.put('/users/preferences', preferencesData);
    return response;
  },
};

// Export default for convenience
export default userService;

