import axiosInstance from './axiosConfig';
import { createFormData } from '../utils/fileUpload';

export const submissionAPI = {
  // Get submissions for a hackathon
  getByHackathon: async (hackathonId) => {
    try {
      const response = await axiosInstance.get(`/hackathons/${hackathonId}/submissions`);
      return response.data;
    } catch (error) {
      console.error('[SubmissionAPI] Error fetching submissions:', error);
      throw error;
    }
  },

  // Get single submission
  getById: async (id) => {
    try {
      const response = await axiosInstance.get(`/submissions/${id}`);
      return response.data;
    } catch (error) {
      console.error('[SubmissionAPI] Error fetching submission:', error);
      throw error;
    }
  },

  // Create submission (supports file uploads)
  create: async (teamId, data) => {
    try {
      // If data is already FormData, use it directly
      // Otherwise, check if we need to convert it to FormData
      let requestData = data;
      
      if (!(data instanceof FormData)) {
        // Check if we have any File objects
        const hasFiles = Object.values(data).some(v => v instanceof File);
        
        if (hasFiles) {
          // Use createFormData utility for proper file handling
          requestData = createFormData(data);
          console.log('[SubmissionAPI] Converted to FormData for file upload');
        } else {
          // No files, but still use FormData for consistency with backend
          requestData = new FormData();
          Object.keys(data).forEach(key => {
            if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
              requestData.append(key, data[key]);
            }
          });
        }
      }

      const response = await axiosInstance.post(`/teams/${teamId}/submissions`, requestData);
      console.log('[SubmissionAPI] Submission created successfully');
      return response.data;
    } catch (error) {
      console.error('[SubmissionAPI] Error creating submission:', error);
      throw error;
    }
  },

  // Update submission (supports file uploads)
  update: async (id, data) => {
    try {
      console.log('[SubmissionAPI] Updating submission', {
        id,
        hasFile: data.file instanceof File,
        fileName: data.file?.name
      });

      // Create FormData if file is present, otherwise send as JSON
      let requestData = data;
      if (data.file instanceof File || Object.values(data).some(v => v instanceof File)) {
        requestData = createFormData(data);
        console.log('[SubmissionAPI] Using FormData for file upload');
      }

      const response = await axiosInstance.put(`/submissions/${id}`, requestData);
      console.log('[SubmissionAPI] Submission updated successfully');
      return response.data;
    } catch (error) {
      console.error('[SubmissionAPI] Error updating submission:', error);
      throw error;
    }
  },

  // Download submission file
  download: async (submissionId) => {
    try {
      const response = await axiosInstance.get(`/submissions/${submissionId}/download`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('[SubmissionAPI] Error downloading submission:', error);
      throw error;
    }
  },
};

export default submissionAPI;