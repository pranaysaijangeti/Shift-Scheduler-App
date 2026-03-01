import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

/**
 * File type options
 */
export type FileType = 'image' | 'text' | 'excel';

/**
 * FileUploadCard Props
 */
export interface FileUploadCardProps {
  onFileTypeSelected: (fileType: FileType) => void;
  selectedType?: FileType;
}

/**
 * FileUploadCard Component
 * Displays file type selection buttons for upload
 */
const FileUploadCard: React.FC<FileUploadCardProps> = ({
  onFileTypeSelected,
  selectedType,
}) => {
  const fileTypes: Array<{ type: FileType; label: string; icon: string }> = [
    { type: 'image', label: 'Image', icon: '📷' },
    { type: 'text', label: 'Text', icon: '📄' },
    { type: 'excel', label: 'Excel', icon: '📊' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select File Type</Text>
      <View style={styles.buttonContainer}>
        {fileTypes.map((fileType) => {
          const isSelected = selectedType === fileType.type;
          return (
            <TouchableOpacity
              key={fileType.type}
              style={[
                styles.fileTypeButton,
                isSelected && styles.fileTypeButtonSelected,
              ]}
              onPress={() => onFileTypeSelected(fileType.type)}
              activeOpacity={0.7}
              testID={`file-type-${fileType.type}`}
            >
              <Text style={styles.fileTypeIcon}>{fileType.icon}</Text>
              <Text
                style={[
                  styles.fileTypeLabel,
                  isSelected && styles.fileTypeLabelSelected,
                ]}
              >
                {fileType.label}
              </Text>
              {isSelected && (
                <View style={styles.selectedIndicator}>
                  <Text style={styles.selectedCheckmark}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  fileTypeButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  fileTypeButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  fileTypeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  fileTypeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  fileTypeLabelSelected: {
    color: '#007AFF',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCheckmark: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default FileUploadCard;

