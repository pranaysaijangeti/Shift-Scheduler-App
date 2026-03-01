import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { fileService } from '../../services/fileService';
import { useShifts } from '../../context/ShiftContext';
import { validateFileSize } from '../../utils/validators';
import { MainStackParamList } from '../../navigation/Navigation';
import { UploadFileResponse } from '../../types';

type UploadScreenNavigationProp = StackNavigationProp<MainStackParamList, 'Upload'>;

type FileType = 'image' | 'text' | 'excel';

interface SelectedFile {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

/**
 * UploadScreen Component
 * Handles file upload for schedule extraction
 */
const UploadScreen: React.FC = () => {
  const navigation = useNavigation<UploadScreenNavigationProp>();
  const { setUploadedShifts } = useShifts();

  // State management
  const [fileType, setFileType] = useState<FileType>('image');
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  /**
   * Request permissions for image picker
   */
  const requestImagePermissions = async (): Promise<boolean> => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Sorry, we need camera roll permissions to upload images!'
        );
        return false;
      }
    }
    return true;
  };

  /**
   * Request permissions for camera
   */
  const requestCameraPermissions = async (): Promise<boolean> => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Sorry, we need camera permissions to take photos!'
        );
        return false;
      }
    }
    return true;
  };

  /**
   * Handle image file selection
   */
  const handleImagePicker = async (): Promise<void> => {
    try {
      setFileError(null);
      setError(null);

      // Show action sheet for camera or gallery
      Alert.alert(
        'Select Image',
        'Choose an option',
        [
          {
            text: 'Camera',
            onPress: async () => {
              const hasPermission = await requestCameraPermissions();
              if (!hasPermission) return;

              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
              });

              if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                const fileSizeInMB = (asset.fileSize || 0) / (1024 * 1024);

                if (!validateFileSize(fileSizeInMB)) {
                  setFileError('File size must be less than 10MB');
                  return;
                }

                setSelectedFile({
                  uri: asset.uri,
                  name: asset.fileName || `image_${Date.now()}.jpg`,
                  type: 'image/jpeg',
                  size: asset.fileSize,
                });
              }
            },
          },
          {
            text: 'Gallery',
            onPress: async () => {
              const hasPermission = await requestImagePermissions();
              if (!hasPermission) return;

              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
              });

              if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                const fileSizeInMB = (asset.fileSize || 0) / (1024 * 1024);

                if (!validateFileSize(fileSizeInMB)) {
                  setFileError('File size must be less than 10MB');
                  return;
                }

                setSelectedFile({
                  uri: asset.uri,
                  name: asset.fileName || `image_${Date.now()}.jpg`,
                  type: 'image/jpeg',
                  size: asset.fileSize,
                });
              }
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ],
        { cancelable: true }
      );
    } catch (error: any) {
      console.error('Error picking image:', error);
      setFileError('Failed to select image. Please try again.');
    }
  };

  /**
   * Handle document file selection (text or excel)
   */
  const handleDocumentPicker = async (): Promise<void> => {
    try {
      setFileError(null);
      setError(null);

      const allowedTypes =
        fileType === 'text'
          ? ['text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
          : [
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              'application/vnd.ms-excel',
            ];

      const result = await DocumentPicker.getDocumentAsync({
        type: fileType === 'text' ? ['text/plain', '.txt', '.doc', '.docx'] : ['.xlsx', '.xls'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fileSizeInMB = (asset.size || 0) / (1024 * 1024);

        if (!validateFileSize(fileSizeInMB)) {
          setFileError('File size must be less than 10MB');
          return;
        }

        setSelectedFile({
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || (fileType === 'text' ? 'text/plain' : 'application/vnd.ms-excel'),
          size: asset.size,
        });
      }
    } catch (error: any) {
      console.error('Error picking document:', error);
      setFileError('Failed to select file. Please try again.');
    }
  };

  /**
   * Handle file selection based on file type
   */
  const handleFileSelection = async (): Promise<void> => {
    if (fileType === 'image') {
      await handleImagePicker();
    } else {
      await handleDocumentPicker();
    }
  };

  /**
   * Handle file upload and extraction
   */
  const handleExtractShifts = async (): Promise<void> => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setFileError(null);

      // Upload file and extract shifts
      const response: UploadFileResponse = await fileService.uploadFile(
        {
          uri: selectedFile.uri,
          type: selectedFile.type,
          name: selectedFile.name,
        },
        fileType
      );

      if (response.success && response.shifts) {
        // Store extracted shifts in context
        setUploadedShifts(response.shifts);

        // Show success message
        // Navigate to ShiftReview screen
        navigation.navigate('ShiftReview');
        // Reset state
        setSelectedFile(null);
      } else {
        throw new Error('Failed to extract shifts from file');
      }
    } catch (error: any) {
      console.error('Error uploading file:', error);
      const errorMessage =
        error?.message ||
        error?.response?.data?.message ||
        'Failed to extract shifts. Please try again.';
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  /**
   * Clear selected file
   */
  const handleClearFile = (): void => {
    setSelectedFile(null);
    setFileError(null);
    setError(null);
  };

  /**
   * Retry upload after error
   */
  const handleRetry = (): void => {
    setError(null);
    if (selectedFile) {
      handleExtractShifts();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Upload Schedule</Text>
            <Text style={styles.subtitle}>
              Upload an image, text file, or Excel file to extract your shifts
            </Text>
          </View>

          {/* File Type Selector */}
          <View style={styles.fileTypeContainer}>
            <Text style={styles.sectionTitle}>File Type</Text>
            <View style={styles.fileTypeButtons}>
              <TouchableOpacity
                style={[styles.fileTypeButton, fileType === 'image' && styles.fileTypeButtonActive]}
                onPress={() => {
                  setFileType('image');
                  setSelectedFile(null);
                  setFileError(null);
                }}
                disabled={uploading}
                testID="file-type-image"
              >
                <Text
                  style={[
                    styles.fileTypeButtonText,
                    fileType === 'image' && styles.fileTypeButtonTextActive,
                  ]}
                >
                  📷 Image
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.fileTypeButton, fileType === 'text' && styles.fileTypeButtonActive]}
                onPress={() => {
                  setFileType('text');
                  setSelectedFile(null);
                  setFileError(null);
                }}
                disabled={uploading}
                testID="file-type-text"
              >
                <Text
                  style={[
                    styles.fileTypeButtonText,
                    fileType === 'text' && styles.fileTypeButtonTextActive,
                  ]}
                >
                  📄 Text
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.fileTypeButton, fileType === 'excel' && styles.fileTypeButtonActive]}
                onPress={() => {
                  setFileType('excel');
                  setSelectedFile(null);
                  setFileError(null);
                }}
                disabled={uploading}
                testID="file-type-excel"
              >
                <Text
                  style={[
                    styles.fileTypeButtonText,
                    fileType === 'excel' && styles.fileTypeButtonTextActive,
                  ]}
                >
                  📊 Excel
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* File Picker */}
          <View style={styles.filePickerContainer}>
            <Text style={styles.sectionTitle}>Select File</Text>
            <TouchableOpacity
              style={[styles.filePickerButton, selectedFile && styles.filePickerButtonSelected]}
              onPress={handleFileSelection}
              disabled={uploading}
              testID="file-picker-button"
            >
              <Text style={styles.filePickerButtonText}>
                {selectedFile ? '📎 ' + selectedFile.name : 'Choose File'}
              </Text>
              {selectedFile && (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleClearFile();
                  }}
                  style={styles.clearButton}
                  testID="clear-file-button"
                >
                  <Text style={styles.clearButtonText}>✕</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
            {fileError && (
              <Text style={styles.errorText} testID="file-error">
                {fileError}
              </Text>
            )}
          </View>

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer} testID="upload-error">
              <Text style={styles.errorMessage}>{error}</Text>
              <TouchableOpacity
                onPress={handleRetry}
                style={styles.retryButton}
                testID="retry-button"
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Extract Button */}
          <TouchableOpacity
            style={[
              styles.extractButton,
              (!selectedFile || uploading) && styles.extractButtonDisabled,
            ]}
            onPress={handleExtractShifts}
            disabled={!selectedFile || uploading}
            activeOpacity={0.8}
            testID="extract-button"
          >
            {uploading ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.extractButtonText}>Extracting shifts...</Text>
              </View>
            ) : (
              <Text style={styles.extractButtonText}>Extract Shifts</Text>
            )}
          </TouchableOpacity>

          {/* Info Section */}
          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>Supported Formats:</Text>
            <Text style={styles.infoText}>• Image: JPG, PNG (max 10MB)</Text>
            <Text style={styles.infoText}>• Text: TXT, DOC, DOCX (max 10MB)</Text>
            <Text style={styles.infoText}>• Excel: XLSX, XLS (max 10MB)</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 24,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  fileTypeContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  fileTypeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  fileTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  fileTypeButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  fileTypeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  fileTypeButtonTextActive: {
    color: '#007AFF',
  },
  filePickerContainer: {
    marginBottom: 24,
  },
  filePickerButton: {
    height: 56,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  filePickerButtonSelected: {
    borderColor: '#007AFF',
    borderStyle: 'solid',
    backgroundColor: '#F0F8FF',
  },
  filePickerButtonText: {
    fontSize: 16,
    color: '#666',
    flex: 1,
    textAlign: 'center',
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  clearButtonText: {
    fontSize: 18,
    color: '#FF3B30',
    fontWeight: 'bold',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  errorMessage: {
    fontSize: 14,
    color: '#FF3B30',
    marginBottom: 12,
    lineHeight: 20,
  },
  retryButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 8,
    marginLeft: 4,
  },
  extractButton: {
    height: 56,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
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
  extractButtonDisabled: {
    opacity: 0.5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  extractButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginTop: 'auto',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    marginBottom: 4,
  },
});

export default UploadScreen;

