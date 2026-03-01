import React, { useEffect, useState, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ShiftProvider, useShifts } from './context/ShiftContext';
import { initializeNotifications } from './services/notificationService';
import { requestCalendarPermission } from './services/calendarService';
import { userService } from './services/userService';
import Navigation from './navigation/Navigation';
import LoadingScreen from './screens/MainStack/LoadingScreen';

/**
 * Error Boundary Props
 */
interface ErrorBoundaryProps {
  children: ReactNode;
}

/**
 * Error Boundary State
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary Component
 * Catches errors in the component tree and displays error screen
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error caught by boundary:', error, errorInfo);
    // Log to help with debugging
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Component stack:', errorInfo.componentStack);
    
    // Also log to AsyncStorage for persistence (non-blocking)
    if (typeof AsyncStorage !== 'undefined') {
      AsyncStorage.setItem('lastError', JSON.stringify({
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      })).catch(() => {});
    }
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || 'An unexpected error occurred';
      const errorStack = this.state.error?.stack || '';
      
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>{errorMessage}</Text>
          {__DEV__ && errorStack ? (
            <ScrollView style={styles.errorStackContainer}>
              <Text style={styles.errorStack}>{errorStack.substring(0, 500)}...</Text>
            </ScrollView>
          ) : null}
          <TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

/**
 * App Initialization Component
 * Handles app initialization and permissions
 */
const AppInitializer: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { checkAuthStatus, user, loading: authLoading } = useAuth();
  const { fetchUpcomingShifts } = useShifts();
  const [initializing, setInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const additionalFeaturesInitialized = React.useRef(false);
  const hasInitialized = React.useRef(false);

  /**
   * Initialize app on mount - only once
   */
  useEffect(() => {
    let isMounted = true;

    const initializeApp = async (): Promise<void> => {
      if (hasInitialized.current) {
        return;
      }
      hasInitialized.current = true;

      try {
        console.log('AppInitializer: Starting initialization...');
        if (!isMounted) return;
        
        setInitializing(true);
        setInitError(null);

        // 1. Check authentication status (non-blocking - don't fail if API is unavailable)
        try {
          console.log('AppInitializer: Checking auth status...');
          await checkAuthStatus();
          console.log('AppInitializer: Auth check completed');
        } catch (error: any) {
          // If auth check fails (e.g., backend not running), continue anyway
          console.warn('AppInitializer: Auth check failed, continuing without auth:', error?.message);
          // Don't set error - allow app to load in unauthenticated state
        }

        // Set initializing to false after auth check completes (or fails)
        if (isMounted) {
          console.log('AppInitializer: Initialization complete');
          setInitializing(false);
        }
      } catch (error: any) {
        console.error('AppInitializer: Error initializing app:', error);
        console.error('AppInitializer: Error stack:', error?.stack);
        // Only show error for critical failures, not API connectivity issues
        if (isMounted) {
          setInitializing(false);
        }
      }
    };

    initializeApp();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run once on mount

  /**
   * Initialize additional features (permissions, data loading)
   */
  const initializeAdditionalFeatures = React.useCallback(async (): Promise<void> => {
    if (additionalFeaturesInitialized.current) {
      return;
    }
    additionalFeaturesInitialized.current = true;

    try {
      console.log('AppInitializer: Initializing additional features...');
      // If authenticated, load additional data
      if (user) {
        console.log('AppInitializer: User authenticated, loading preferences and permissions...');
        // Load user preferences (non-blocking)
        userService.getPreferences().catch((error) => {
          console.warn('Failed to load preferences:', error);
          // Non-critical, continue
        });

        // Request notification permissions (non-blocking)
        initializeNotifications().catch((error) => {
          console.warn('Failed to initialize notifications:', error);
          // Non-critical, continue
        });

        // Request calendar permissions (non-blocking)
        requestCalendarPermission().catch((error) => {
          console.warn('Failed to request calendar permissions:', error);
          // Non-critical, continue
        });

        // Fetch upcoming shifts (non-blocking)
        fetchUpcomingShifts().catch((error) => {
          console.warn('Failed to fetch upcoming shifts:', error);
          // Non-critical, continue
        });
      } else {
        console.log('AppInitializer: User not authenticated, requesting basic notification permissions...');
        // If not authenticated, still request notification permissions
        // (user might want to enable them before login)
        initializeNotifications().catch((error) => {
          console.warn('Failed to initialize notifications:', error);
        });
      }
      console.log('AppInitializer: Additional features initialized.');
    } catch (error: any) {
      console.error('AppInitializer: Error initializing additional features:', error);
      // Non-critical, don't block app
    }
  }, [user, fetchUpcomingShifts]);

  /**
   * Initialize additional features after auth check completes
   */
  useEffect(() => {
    // Wait for auth loading to complete and initializing to finish
    if (!authLoading && !initializing) {
      initializeAdditionalFeatures();
    }
  }, [authLoading, initializing, initializeAdditionalFeatures]);

  // Show loading screen while initializing or checking auth
  if (initializing || authLoading) {
    return <LoadingScreen />;
  }

  // Show error screen if initialization failed
  if (initError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Initialization Error</Text>
        <Text style={styles.errorMessage}>{initError}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={initializeApp}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <>{children}</>;
};

/**
 * Root App Component
 * Wraps app with providers and handles initialization
 */
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <AuthProvider>
            <ShiftProvider>
              <AppInitializer>
                <NavigationContainer>
                  <Navigation />
                </NavigationContainer>
                <StatusBar style="auto" />
              </AppInitializer>
            </ShiftProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    minWidth: 120,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorStackContainer: {
    maxHeight: 200,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    marginBottom: 16,
  },
  errorStack: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#666',
  },
});

export default App;

