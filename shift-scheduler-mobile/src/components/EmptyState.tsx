import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

/**
 * EmptyState Props
 */
export interface EmptyStateProps {
  title: string;
  message?: string;
  actionButton?: {
    label: string;
    onPress: () => void;
  };
  icon?: string;
}

/**
 * EmptyState Component
 * Displays an empty state with illustration, title, message, and optional action button
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  actionButton,
  icon = '📭',
}) => {
  return (
    <View style={styles.container} testID="empty-state">
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
      {actionButton && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={actionButton.onPress}
          testID="empty-state-action-button"
        >
          <Text style={styles.actionButtonText}>{actionButton.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    minWidth: 120,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default EmptyState;

