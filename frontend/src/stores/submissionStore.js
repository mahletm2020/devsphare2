import { create } from 'zustand';
import { submissionAPI } from '../api';
import { createFormData } from '../utils/fileUpload';
import toast from 'react-hot-toast';

export const useSubmissionStore = create((set, get) => ({
  submissions: [],
  currentSubmission: null,
  isLoading: false,
  error: null,

  // Fetch submissions for hackathon
  fetchSubmissionsByHackathon: async (hackathonId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await submissionAPI.getByHackathon(hackathonId);
      set({ submissions: response.data, isLoading: false });
      return response;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to fetch submissions';
      set({ error: errorMsg, isLoading: false });
      toast.error(errorMsg);
      throw error;
    }
  },

  // Fetch single submission
  fetchSubmission: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await submissionAPI.getById(id);
      set({ currentSubmission: response.data, isLoading: false });
      return response;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to fetch submission';
      set({ error: errorMsg, isLoading: false });
      toast.error(errorMsg);
      throw error;
    }
  },

  // Create submission
  createSubmission: async (teamId, data) => {
    set({ isLoading: true, error: null });
    try {
      // Check if we have any file objects
      const hasFiles = data.readme_file instanceof File || data.ppt_file instanceof File;
      
      // Use createFormData utility to properly handle files and other data
      // It handles files, strings, and other types correctly
      const formData = createFormData(data);

      const response = await submissionAPI.create(teamId, formData);
      set({ isLoading: false });
      return response;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to create submission';
      set({ error: errorMsg, isLoading: false });
      throw error;
    }
  },

  // Update submission
  updateSubmission: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      // Use createFormData utility to properly handle files and other data
      const formData = createFormData(data);

      const response = await submissionAPI.update(id, formData);
      set({ currentSubmission: response.data, isLoading: false });
      toast.success('Submission updated successfully!');
      return response;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to update submission';
      set({ error: errorMsg, isLoading: false });
      toast.error(errorMsg);
      throw error;
    }
  },

  // Download submission file
  downloadSubmission: async (submissionId) => {
    set({ isLoading: true, error: null });
    try {
      const blob = await submissionAPI.download(submissionId);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `submission-${submissionId}.${blob.type.split('/')[1] || 'zip'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      set({ isLoading: false });
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to download file';
      set({ error: errorMsg, isLoading: false });
      toast.error(errorMsg);
      throw error;
    }
  },

  // Clear current submission
  clearCurrentSubmission: () => set({ currentSubmission: null }),

  // Clear error
  clearError: () => set({ error: null }),
}));