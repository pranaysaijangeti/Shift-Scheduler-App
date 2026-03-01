import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services';
import { clearAllStorage } from '../utils/storage';
import { User, LoginResponse } from '../types';

/**
 * AuthContextType Interface
 * Defines the shape of the authentication context
 */
interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, timezone?: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

/**
 * Create AuthContext
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider Component
 * Manages authentication state and provides auth methods to children
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State management
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Check authentication status on mount
   */
  useEffect(() => {
    checkAuthStatus();
  }, []);

  /**
   * Check authentication status
   * Gets token from AsyncStorage and verifies with backend
   */
  const checkAuthStatus = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Get token from storage
      const storedToken = await authService.getToken();

      if (!storedToken) {
        // No token found, user is not authenticated
        setToken(null);
        setUser(null);
        setLoading(false);
        return;
      }

      // Verify token with backend
      try {
        const userData = await authService.verifyToken();
        
        // Token is valid, update state
        setToken(storedToken);
        setUser(userData);
      } catch (verifyError: any) {
        // Token is invalid or expired
        console.error('Token verification failed:', verifyError);
        
        // Clear invalid token
        await authService.removeToken();
        setToken(null);
        setUser(null);
        
        // Set error if it's not a network error
        if (verifyError?.statusCode !== 401) {
          setError(verifyError?.message || 'Failed to verify authentication');
        }
      }
    } catch (error: any) {
      console.error('Error checking auth status:', error);
      // Don't set error for network/connection issues - allow app to load
      // Only set error for critical authentication failures
      if (error?.error === 'NETWORK_ERROR' || error?.code === 'ECONNREFUSED' || error?.statusCode === 0) {
        console.warn('Backend not available, continuing without auth');
        setError(null); // Don't block app if backend is unavailable
      } else {
        setError(error?.message || 'Failed to check authentication status');
      }
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Login user
   * Calls authService.login(), saves token, fetches user, and updates state
   */
  const login = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Call login service
      const response: LoginResponse = await authService.login(email, password);

      // Save token to storage
      await authService.saveToken(response.token);

      // Map response user to User interface
      // Backend returns: { id, name, email, timezone }
      const userData: User = {
        _id: response.user.id,
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        timezone: response.user.timezone || 'America/Toronto',
        defaultReminderMinutes: 30, // Default value, can be updated later
      };

      // Update state
      setToken(response.token);
      setUser(userData);
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error?.message || error?.response?.data?.message || 'Login failed. Please try again.';
      setError(errorMessage);
      setToken(null);
      setUser(null);
      throw error; // Re-throw to allow component to handle
    } finally {
      setLoading(false);
    }
  };

  /**
   * Register new user
   * Calls authService.register(), saves token, and updates state
   */
  const register = async (
    name: string,
    email: string,
    password: string,
    timezone?: string
  ): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Call register service
      const response: LoginResponse = await authService.register(name, email, password, timezone);

      // Save token to storage
      await authService.saveToken(response.token);

      // Map response user to User interface
      const userData: User = {
        _id: response.user.id || response.user._id || '',
        id: response.user.id || response.user._id,
        name: response.user.name,
        email: response.user.email,
        timezone: response.user.timezone || timezone || 'America/Toronto',
        defaultReminderMinutes: response.user.defaultReminderMinutes || 30,
        phone: response.user.phone,
        createdAt: response.user.createdAt,
        updatedAt: response.user.updatedAt,
      };

      // Update state
      setToken(response.token);
      setUser(userData);
    } catch (error: any) {
      console.error('Register error:', error);
      const errorMessage = error?.message || error?.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      setToken(null);
      setUser(null);
      throw error; // Re-throw to allow component to handle
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout user
   * Clears token, clears AsyncStorage, and updates state
   */
  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Call logout service (optional, may fail if token is already invalid)
      try {
        await authService.logout();
      } catch (logoutError) {
        // Continue with logout even if API call fails
        console.warn('Logout API call failed, continuing with local logout:', logoutError);
      }

      // Clear all storage
      await clearAllStorage();

      // Update state
      setToken(null);
      setUser(null);
    } catch (error: any) {
      console.error('Logout error:', error);
      // Even if there's an error, clear local state
      setToken(null);
      setUser(null);
      setError(error?.message || 'Logout failed');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Context value
   */
  const value: AuthContextType = {
    user,
    token,
    loading,
    error,
    login,
    register,
    logout,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * useAuth Hook
 * Custom hook to access authentication context
 * @returns AuthContextType
 * @throws Error if used outside AuthProvider
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

