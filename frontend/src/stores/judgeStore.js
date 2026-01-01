import { create } from 'zustand';
import { judgeAPI, ratingAPI } from '../api';
import toast from 'react-hot-toast';

export const useJudgeStore = create((set, get) => ({
  judges: [],
  potentialJudges: [],
  judgeHackathons: [],
  submissionsToRate: [],
  myRatings: [],
  isLoading: false,
  error: null,

  // Assign judges to teams
  assignJudges: async (hackathonId, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await judgeAPI.assignJudges(hackathonId, data);
      toast.success('Judges assigned successfully!');
      return response;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to assign judges';
      set({ error: errorMsg, isLoading: false });
      toast.error(errorMsg);
      throw error;
    }
  },

  // Assign judges to category
  assignJudgesToCategory: async (hackathonId, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await judgeAPI.assignJudgesToCategory(hackathonId, data);
      toast.success('Judges assigned to category successfully!');
      return response;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to assign judges to category';
      set({ error: errorMsg, isLoading: false });
      toast.error(errorMsg);
      throw error;
    }
  },

  // Remove judges from teams
  removeJudges: async (hackathonId, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await judgeAPI.removeJudges(hackathonId, data);
      toast.success('Judges removed successfully!');
      return response;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to remove judges';
      set({ error: errorMsg, isLoading: false });
      toast.error(errorMsg);
      throw error;
    }
  },

  // List judges for hackathon
  listJudges: async (hackathonId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await judgeAPI.listJudges(hackathonId);
      set({ judges: response.judges, isLoading: false });
      return response;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to fetch judges';
      set({ error: errorMsg, isLoading: false });
      toast.error(errorMsg);
      throw error;
    }
  },

  // Get potential judges
  getPotentialJudges: async (hackathonId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await judgeAPI.getPotentialJudges(hackathonId);
      set({ potentialJudges: response.potential_judges?.data || [], isLoading: false });
      return response;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to fetch potential judges';
      set({ error: errorMsg, isLoading: false });
      toast.error(errorMsg);
      throw error;
    }
  },

  // Get judge's hackathons
  getJudgeHackathons: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await ratingAPI.getJudgeHackathons();
      set({ 
        judgeHackathons: response.data?.data || response.data || [], 
        isLoading: false 
      });
      return response;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to fetch judge hackathons';
      set({ error: errorMsg, isLoading: false });
      // Don't show error toast for empty results
      if (error.response?.status !== 404) {
        toast.error(errorMsg);
      }
      set({ judgeHackathons: [], isLoading: false });
      throw error;
    }
  },

  // Get submissions to rate
  getSubmissionsToRate: async (hackathonId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await ratingAPI.getSubmissionsToRate(hackathonId);
      set({ 
        submissionsToRate: response.data?.data || response.data || [], 
        isLoading: false 
      });
      return response;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to fetch submissions to rate';
      set({ error: errorMsg, isLoading: false });
      toast.error(errorMsg);
      throw error;
    }
  },

  // Get judge's ratings
  getMyRatings: async (hackathonId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await ratingAPI.getMyRatings(hackathonId);
      set({ 
        myRatings: response.data?.data || response.data || [], 
        isLoading: false 
      });
      return response;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to fetch ratings';
      set({ error: errorMsg, isLoading: false });
      toast.error(errorMsg);
      throw error;
    }
  },

  // Submit rating
  submitRating: async (submissionId, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await ratingAPI.submitRating(submissionId, data);
      toast.success('Rating submitted successfully!');
      return response;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to submit rating';
      set({ error: errorMsg, isLoading: false });
      toast.error(errorMsg);
      throw error;
    }
  },

  // Clear data
  clearData: () => set({ 
    judges: [], 
    potentialJudges: [], 
    submissionsToRate: [], 
    myRatings: [] 
  }),

  // Clear error
  clearError: () => set({ error: null }),
}));