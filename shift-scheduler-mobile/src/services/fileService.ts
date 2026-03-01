import api from './api';
import { UploadFileResponse, Shift, ApiResponse } from '../types';

/**
 * File Service
 * Handles file upload and processing
 */
export const fileService = {
  /**
   * Upload file and extract shifts
   * @param file - File URI or file object
   * @param fileType - Type of file ('image', 'text', 'excel')
   * @returns Promise with extracted shifts and upload info
   */
  async uploadFile(
    file: { uri: string; type: string; name: string },
    fileType: 'image' | 'text' | 'excel'
  ): Promise<UploadFileResponse> {
    // Create FormData for file upload
    const formData = new FormData();
    
    // Append file to FormData
    formData.append('file', {
      uri: file.uri,
      type: file.type,
      name: file.name,
    } as any);

    // Make request with multipart/form-data
    const response = await api.post<UploadFileResponse>('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response;
  },

  /**
   * Get upload history for current user
   * @returns Promise with array of uploaded files
   */
  async getUploadHistory(): Promise<ApiResponse<{ uploads: any[]; count: number }>> {
    const response = await api.get('/files/history');
    return response;
  },

  /**
   * Delete an uploaded file
   * @param uploadId - Upload file ID
   * @returns Promise<void>
   */
  async deleteUpload(uploadId: string): Promise<void> {
    await api.delete(`/files/${uploadId}`);
  },
};

// Export default for convenience
export default fileService;

