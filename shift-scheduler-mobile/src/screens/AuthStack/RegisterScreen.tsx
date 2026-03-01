import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../context/AuthContext';
import { validateEmail, validatePassword, validateName } from '../../utils/validators';
import { AuthStackParamList } from '../../navigation/Navigation';

type RegisterScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Register'>;

/**
 * Common timezones list
 */
const TIMEZONES = [
  { label: 'Eastern Time (Toronto, New York)', value: 'America/Toronto' },
  { label: 'Central Time (Chicago)', value: 'America/Chicago' },
  { label: 'Mountain Time (Denver)', value: 'America/Denver' },
  { label: 'Pacific Time (Los Angeles)', value: 'America/Los_Angeles' },
  { label: 'Atlantic Time (Halifax)', value: 'America/Halifax' },
  { label: 'Newfoundland Time', value: 'America/St_Johns' },
  { label: 'London, UK', value: 'Europe/London' },
  { label: 'Paris, France', value: 'Europe/Paris' },
  { label: 'Berlin, Germany', value: 'Europe/Berlin' },
  { label: 'Tokyo, Japan', value: 'Asia/Tokyo' },
  { label: 'Sydney, Australia', value: 'Australia/Sydney' },
  { label: 'UTC', value: 'UTC' },
];

/**
 * Get password strength indicator
 */
const getPasswordStrength = (password: string): { strength: 'weak' | 'medium' | 'strong'; color: string; label: string } => {
  if (!password) {
    return { strength: 'weak', color: '#E0E0E0', label: '' };
  }

  if (password.length < 6) {
    return { strength: 'weak', color: '#FF3B30', label: 'Weak' };
  }

  // Check for complexity: has letters, numbers, and special chars
  const hasLetters = /[a-zA-Z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const complexityScore = [hasLetters, hasNumbers, hasSpecial].filter(Boolean).length;

  if (password.length >= 8 && complexityScore >= 2) {
    return { strength: 'strong', color: '#34C759', label: 'Strong' };
  }

  if (password.length >= 6 && complexityScore >= 1) {
    return { strength: 'medium', color: '#FF9500', label: 'Medium' };
  }

  return { strength: 'weak', color: '#FF3B30', label: 'Weak' };
};

/**
 * RegisterScreen Component
 * Handles user registration with name, email, password, and timezone
 */
const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { register, loading: authLoading, error: authError } = useAuth();

  // Local state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [timezone, setTimezone] = useState('America/Toronto');
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [timezoneError, setTimezoneError] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTimezoneModal, setShowTimezoneModal] = useState(false);

  // Password strength
  const passwordStrength = getPasswordStrength(password);

  // Clear errors when inputs change
  useEffect(() => {
    if (name && nameError) {
      setNameError(null);
    }
  }, [name]);

  useEffect(() => {
    if (email && emailError) {
      setEmailError(null);
    }
  }, [email]);

  useEffect(() => {
    if (password && passwordError) {
      setPasswordError(null);
    }
  }, [password]);

  // Clear local error when auth error changes
  useEffect(() => {
    if (authError) {
      setLocalError(authError);
    }
  }, [authError]);

  /**
   * Validate name input
   */
  const validateNameInput = (): boolean => {
    if (!name.trim()) {
      setNameError('Name is required');
      return false;
    }

    if (!validateName(name.trim())) {
      setNameError('Name must be 2-50 characters and contain only letters, spaces, hyphens, or apostrophes');
      return false;
    }

    setNameError(null);
    return true;
  };

  /**
   * Validate email input
   */
  const validateEmailInput = (): boolean => {
    if (!email.trim()) {
      setEmailError('Email is required');
      return false;
    }

    if (!validateEmail(email.trim())) {
      setEmailError('Please enter a valid email address');
      return false;
    }

    setEmailError(null);
    return true;
  };

  /**
   * Validate password input
   */
  const validatePasswordInput = (): boolean => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    }

    if (!validatePassword(password)) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }

    setPasswordError(null);
    return true;
  };

  /**
   * Validate timezone selection
   */
  const validateTimezoneInput = (): boolean => {
    if (!timezone) {
      setTimezoneError('Please select a timezone');
      return false;
    }

    setTimezoneError(null);
    return true;
  };

  /**
   * Handle register button press
   */
  const handleRegister = async (): Promise<void> => {
    // Clear previous errors
    setLocalError(null);
    setNameError(null);
    setEmailError(null);
    setPasswordError(null);
    setTimezoneError(null);

    // Validate all inputs
    const isNameValid = validateNameInput();
    const isEmailValid = validateEmailInput();
    const isPasswordValid = validatePasswordInput();
    const isTimezoneValid = validateTimezoneInput();

    if (!isNameValid || !isEmailValid || !isPasswordValid || !isTimezoneValid) {
      return;
    }

    try {
      setIsSubmitting(true);
      setLocalError(null);

      // Call register from AuthContext
      await register(name.trim(), email.trim(), password, timezone);

      // Navigation is handled automatically by AppNavigator based on auth state
      // No need to manually navigate
    } catch (error: any) {
      // Error is already handled by AuthContext, but we can show additional message
      const errorMessage =
        error?.message ||
        error?.response?.data?.message ||
        'Registration failed. Please try again.';
      setLocalError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Navigate to Login screen
   */
  const handleNavigateToLogin = (): void => {
    navigation.navigate('Login');
  };

  /**
   * Handle timezone selection
   */
  const handleSelectTimezone = (selectedTimezone: string): void => {
    setTimezone(selectedTimezone);
    setShowTimezoneModal(false);
    setTimezoneError(null);
  };

  /**
   * Get timezone label for display
   */
  const getTimezoneLabel = (): string => {
    const tz = TIMEZONES.find((tz) => tz.value === timezone);
    return tz ? tz.label : timezone;
  };

  const isLoading = authLoading || isSubmitting;
  const displayError = localError || authError;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.logoText}>📅</Text>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Sign up to start managing your shifts</Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Name Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={[styles.input, nameError && styles.inputError]}
                  placeholder="Enter your full name"
                  placeholderTextColor="#999"
                  value={name}
                  onChangeText={setName}
                  onBlur={validateNameInput}
                  autoCapitalize="words"
                  autoCorrect={false}
                  textContentType="name"
                  editable={!isLoading}
                  testID="name-input"
                />
                {nameError && (
                  <Text style={styles.errorText} testID="name-error">
                    {nameError}
                  </Text>
                )}
              </View>

              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={[styles.input, emailError && styles.inputError]}
                  placeholder="Enter your email"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={setEmail}
                  onBlur={validateEmailInput}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="emailAddress"
                  editable={!isLoading}
                  testID="email-input"
                />
                {emailError && (
                  <Text style={styles.errorText} testID="email-error">
                    {emailError}
                  </Text>
                )}
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={[styles.input, passwordError && styles.inputError]}
                  placeholder="Enter your password"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={setPassword}
                  onBlur={validatePasswordInput}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="newPassword"
                  editable={!isLoading}
                  testID="password-input"
                />
                {/* Password Strength Indicator */}
                {password.length > 0 && (
                  <View style={styles.passwordStrengthContainer}>
                    <View style={styles.passwordStrengthBar}>
                      <View
                        style={[
                          styles.passwordStrengthFill,
                          {
                            width: `${password.length >= 8 ? 100 : (password.length / 8) * 100}%`,
                            backgroundColor: passwordStrength.color,
                          },
                        ]}
                      />
                    </View>
                    {passwordStrength.label && (
                      <Text
                        style={[styles.passwordStrengthText, { color: passwordStrength.color }]}
                      >
                        {passwordStrength.label}
                      </Text>
                    )}
                  </View>
                )}
                {passwordError && (
                  <Text style={styles.errorText} testID="password-error">
                    {passwordError}
                  </Text>
                )}
              </View>

              {/* Timezone Selector */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Timezone</Text>
                <TouchableOpacity
                  style={[styles.timezoneSelector, timezoneError && styles.inputError]}
                  onPress={() => !isLoading && setShowTimezoneModal(true)}
                  disabled={isLoading}
                  testID="timezone-selector"
                >
                  <Text
                    style={[styles.timezoneText, !timezone && styles.timezonePlaceholder]}
                    numberOfLines={1}
                  >
                    {timezone ? getTimezoneLabel() : 'Select timezone'}
                  </Text>
                  <Text style={styles.timezoneArrow}>▼</Text>
                </TouchableOpacity>
                {timezoneError && (
                  <Text style={styles.errorText} testID="timezone-error">
                    {timezoneError}
                  </Text>
                )}
              </View>

              {/* Error Message */}
              {displayError && (
                <View style={styles.errorContainer} testID="register-error">
                  <Text style={styles.errorMessage}>{displayError}</Text>
                </View>
              )}

              {/* Register Button */}
              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={isLoading}
                activeOpacity={0.8}
                testID="register-button"
              >
                {isLoading ? (
                  <View style={styles.buttonContent}>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text style={styles.buttonText}>Creating account...</Text>
                  </View>
                ) : (
                  <Text style={styles.buttonText}>Register</Text>
                )}
              </TouchableOpacity>

              {/* Login Link */}
              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <TouchableOpacity
                  onPress={handleNavigateToLogin}
                  disabled={isLoading}
                  activeOpacity={0.7}
                  testID="login-link"
                >
                  <Text style={styles.loginLink}>Login</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Timezone Modal */}
      <Modal
        visible={showTimezoneModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTimezoneModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Timezone</Text>
              <TouchableOpacity
                onPress={() => setShowTimezoneModal(false)}
                style={styles.modalCloseButton}
                testID="timezone-modal-close"
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={TIMEZONES}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.timezoneOption,
                    timezone === item.value && styles.timezoneOptionSelected,
                  ]}
                  onPress={() => handleSelectTimezone(item.value)}
                  testID={`timezone-option-${item.value}`}
                >
                  <Text
                    style={[
                      styles.timezoneOptionText,
                      timezone === item.value && styles.timezoneOptionTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {timezone === item.value && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoText: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  form: {
    flex: 1,
    justifyContent: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1A1A1A',
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
    marginLeft: 4,
  },
  passwordStrengthContainer: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  passwordStrengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  passwordStrengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  passwordStrengthText: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 50,
  },
  timezoneSelector: {
    height: 52,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  timezoneText: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
  },
  timezonePlaceholder: {
    color: '#999',
  },
  timezoneArrow: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  errorMessage: {
    fontSize: 14,
    color: '#FF3B30',
    lineHeight: 20,
  },
  button: {
    height: 52,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#666',
  },
  loginLink: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 24,
    color: '#666',
  },
  timezoneOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  timezoneOptionSelected: {
    backgroundColor: '#F0F8FF',
  },
  timezoneOptionText: {
    fontSize: 16,
    color: '#1A1A1A',
    flex: 1,
  },
  timezoneOptionTextSelected: {
    fontWeight: '600',
    color: '#007AFF',
  },
  checkmark: {
    fontSize: 18,
    color: '#007AFF',
    marginLeft: 8,
  },
});

export default RegisterScreen;

