// import axiosInstance from './axiosConfig';

// export const profileAPI = {
//   // Get current user's profile
//   getProfile: async () => {
//     const response = await axiosInstance.get('/profile');
//     return response.data;
//   },

//   // Update user profile (MUST use multipart/form-data for file uploads)
//   updateProfile: async (data) => {
//     const formData = new FormData();
    
//     // Append all fields to FormData
//     Object.keys(data).forEach(key => {
//       if (key === 'avatar' && data[key] instanceof File) {
//         // Append file with proper name
//         formData.append('avatar', data[key]);
//         console.log('Added avatar file to FormData:', {
//           name: data[key].name,
//           size: data[key].size,
//           type: data[key].type
//         });
//       } else {
//         // For non-file fields, always append (including empty strings for bio)
//         // This ensures bio can be cleared by sending empty string
//         if (data[key] === undefined || data[key] === null) {
//           // Skip undefined/null values (except for bio which we want to send even if empty)
//           if (key !== 'bio') {
//             return;
//           }
//           // For bio, send empty string if null/undefined
//           formData.append(key, '');
//         } else if (typeof data[key] === 'boolean') {
//           formData.append(key, data[key] ? '1' : '0');
//         } else {
//           formData.append(key, String(data[key]));
//         }
//         console.log(`Added ${key} to FormData:`, data[key]);
//       }
//     });

//     // Log FormData contents for debugging
//     console.log('FormData entries:');
//     for (let pair of formData.entries()) {
//       console.log(pair[0] + ': ' + (pair[1] instanceof File ? `[File: ${pair[1].name}]` : pair[1]));
//     }

//     // IMPORTANT: Don't set Content-Type header - axios will automatically
//     // set it to 'multipart/form-data' with the correct boundary
//     // The interceptor will handle this for FormData
//     const response = await axiosInstance.put('/profile', formData);
//     return response.data;
//   },

//   // Delete user's avatar
//   deleteAvatar: async () => {
//     const response = await axiosInstance.delete('/profile/avatar');
//     return response.data;
//   },
// };

// export default profileAPI;


// src/api/profileAPI.js
import axiosInstance from './axiosConfig';
import { createFormData } from '../utils/fileUpload';

export const profileAPI = {
  async getProfile() {
    try {
      const response = await axiosInstance.get('/profile');
      return response.data;
    } catch (error) {
      console.error('[ProfileAPI] Error fetching profile:', error);
      throw error;
    }
  },

  async updateProfile(data) {
    try {
      console.log('[ProfileAPI] Starting profile update', {
        hasName: !!data.name,
        hasBio: data.bio !== undefined,
        hasAvatar: data.avatar instanceof File,
        avatarName: data.avatar?.name
      });

      // Create FormData using utility function
      const formData = createFormData({
        name: data.name || '',
        bio: data.bio !== undefined ? (data.bio || '') : undefined,
        avatar: data.avatar instanceof File ? data.avatar : undefined,
      }, { excludeEmpty: false });

      // IMPORTANT: Use POST for file uploads (Laravel handles multipart/form-data better with POST)
      // Don't use _method=PUT as it can interfere with file upload parsing
      console.log('[ProfileAPI] Sending POST request to /profile');
      const response = await axiosInstance.post('/profile', formData);
      
      console.log('[ProfileAPI] Profile update successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('[ProfileAPI] Profile update failed:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        headers: error.response?.headers,
        request: error.request
      });
      
      // Provide more detailed error information
      if (error.response) {
        // Server responded with error
        const errorData = error.response.data;
        if (errorData?.errors) {
          // Validation errors
          const validationErrors = Object.entries(errorData.errors)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages[0] : messages}`)
            .join(', ');
          error.message = `Validation failed: ${validationErrors}`;
        } else if (errorData?.message) {
          error.message = errorData.message;
        }
      } else if (error.request) {
        // Request made but no response
        error.message = 'No response from server. Please check your connection.';
      }
      
      throw error;
    }
  },

  async deleteAvatar() {
    try {
      const response = await axiosInstance.delete('/profile/avatar');
      return response.data;
    } catch (error) {
      console.error('[ProfileAPI] Error deleting avatar:', error);
      throw error;
    }
  },

  // Get any user's profile by ID
  async getUserProfile(userId) {
    try {
      const response = await axiosInstance.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('[ProfileAPI] Error fetching user profile:', error);
      throw error;
    }
  },
};

export default profileAPI;









