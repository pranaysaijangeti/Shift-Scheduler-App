import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Modal } from 'react-native';

/**
 * LoadingSpinner Props
 */
export interface LoadingSpinnerProps {
  visible: boolean;
  message?: string;
  fullScreen?: boolean;
}

/**
 * LoadingSpinner Component
 * Displays a loading spinner with optional message
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  visible,
  message,
  fullScreen = false,
}) => {
  if (!visible) {
    return null;
  }

  const content = (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#007AFF" testID="loading-spinner" />
      {message && (
        <Text style={styles.message} testID="loading-message">
          {message}
        </Text>
      )}
    </View>
  );

  if (fullScreen) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>{content}</View>
        </View>
      </Modal>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  message: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    minWidth: 120,
    alignItems: 'center',
  },
});

export default LoadingSpinner;

