import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../utils/config';
import { ApiResponse, ErrorResponse } from '../types';

/**
 * Create axios instance with base configuration
 */
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor
 * Adds JWT token to Authorization header if available
 */
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token from storage:', error);
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor
 * Handles responses and errors globally
 */
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Return response.data if successful
    return response.data;
  },
  async (error: AxiosError<ErrorResponse>) => {
    // Handle 401 (Unauthorized) - token expired or invalid
    if (error.response?.status === 401) {
      try {
        // Clear token from storage
        await AsyncStorage.removeItem('token');
        
        // Emit logout event (can be handled by AuthContext)
        // For now, we'll just log it - the AuthContext should handle this
        if (__DEV__) {
          console.log('Token expired or invalid. User should be logged out.');
        }
      } catch (storageError) {
        console.error('Error removing token from storage:', storageError);
      }
    }

    // Handle network errors (backend not available)
    if (!error.response && error.request) {
      const networkError: ErrorResponse = {
        success: false,
        message: 'Network error: Unable to connect to server',
        statusCode: 0,
        error: 'NETWORK_ERROR',
      };
      
      if (__DEV__) {
        console.warn('Network error - backend may not be running:', error.message);
      }
      
      return Promise.reject(networkError);
    }

    // Format error response
    const errorResponse: ErrorResponse = {
      success: false,
      message: error.response?.data?.message || error.message || 'An error occurred',
      statusCode: error.response?.status || 500,
      error: error.response?.data?.error || undefined,
      errors: error.response?.data?.errors || undefined,
    };

    // Log errors in development
    if (__DEV__) {
      console.error('API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        message: errorResponse.message,
        error: errorResponse.error,
      });
    }

    return Promise.reject(errorResponse);
  }
);

export default api;

