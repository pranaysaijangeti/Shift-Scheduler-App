import Constants from 'expo-constants';

const getEnvVar = (key: string, defaultValue: string): string => {
  try {
    // Try to get from expo config extra first
    const expoExtra = Constants.expoConfig?.extra as Record<string, string> | undefined;
    if (expoExtra && expoExtra[key]) {
      return expoExtra[key];
    }
  } catch (error) {
    console.warn('Error reading expo config:', error);
  }
  // Fallback to default
  return defaultValue;
};

export const API_BASE_URL = getEnvVar('API_BASE_URL', 'http://localhost:5000/api');
export const APP_NAME = getEnvVar('APP_NAME', 'Shift Scheduler');
export const APP_VERSION = getEnvVar('APP_VERSION', '1.0.0');

