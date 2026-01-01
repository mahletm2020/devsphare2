import { create } from 'zustand';
import { hackathonAPI } from '../api';
import toast from 'react-hot-toast';

export const useHackathonStore = create((set, get) => ({
  hackathons: [],
  currentHackathon: null,
  hackathonsForSponsors: [],
  isLoading: false,
  error: null,

  // Fetch all hackathons
  fetchHackathons: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await hackathonAPI.getAll(params);
      set({ hackathons: response.data?.data || response.data || [], isLoading: false });
      return response;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to fetch hackathons';
      set({ error: errorMsg, isLoading: false });
      toast.error(errorMsg);
      throw error;
    }
  },

  // Fetch hackathons for sponsors
  fetchHackathonsForSponsors: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await hackathonAPI.getForSponsors();
      set({ 
        hackathonsForSponsors: response.data?.data || response.data || [], 
        isLoading: false 
      });
      return response;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to fetch hackathons for sponsors';
      set({ error: errorMsg, isLoading: false });
      toast.error(errorMsg);
      throw error;
    }
  },

  // Fetch single hackathon
  fetchHackathon: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await hackathonAPI.getHackathon(id); 
      set({ 
        currentHackathon: response.data?.data || response.data, 
        isLoading: false 
      });
      return response;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to fetch hackathon';
      set({ error: errorMsg, isLoading: false });
      toast.error(errorMsg);
      throw error;
    }
  },

  // Create hackathon
  createHackathon: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await hackathonAPI.createHackathon(data);
      const hackathon = response.data?.data || response.data;
      set((state) => ({
        hackathons: [hackathon, ...state.hackathons],
        currentHackathon: hackathon,
        isLoading: false
      }));
      toast.success('Hackathon created successfully!');
      return response;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to create hackathon';
      set({ error: errorMsg, isLoading: false });
      toast.error(errorMsg);
      throw error;
    }
  },

  // Update hackathon
  updateHackathon: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await hackathonAPI.updateHackathon(id, data);
      set((state) => ({
        hackathons: state.hackathons.map(hackathon => 
          hackathon.id === id ? (response.data?.data || response.data) : hackathon
        ),
        currentHackathon: response.data?.data || response.data,
        isLoading: false
      }));
      toast.success('Hackathon updated successfully!');
      return response;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to update hackathon';
      set({ error: errorMsg, isLoading: false });
      toast.error(errorMsg);
      throw error;
    }
  },

  // Delete hackathon
  deleteHackathon: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await hackathonAPI.deleteHackathon(id);
      set((state) => ({
        hackathons: state.hackathons.filter(hackathon => hackathon.id !== id),
        currentHackathon: null,
        isLoading: false
      }));
      toast.success('Hackathon deleted successfully!');
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to delete hackathon';
      set({ error: errorMsg, isLoading: false });
      toast.error(errorMsg);
      throw error;
    }
  },

  // Create category for hackathon
  createCategory: async (hackathonId, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await hackathonAPI.createCategory(hackathonId, data);
      // Update current hackathon with new category
      set((state) => ({
        currentHackathon: {
          ...state.currentHackathon,
          categories: [...(state.currentHackathon?.categories || []), response.data]
        },
        isLoading: false
      }));
      toast.success('Category created successfully!');
      return response;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to create category';
      set({ error: errorMsg, isLoading: false });
      toast.error(errorMsg);
      throw error;
    }
  },

    getOrganizerHackathons: async (organizerId) => {
      set({ isLoading: true, error: null });
      try {
        const response = await hackathonAPI.getAll({ created_by: organizerId });
        set({ hackathons: response.data?.data || response.data || [], isLoading: false });
        return response;
      } catch (error) {
        const errorMsg = error.response?.data?.message || 'Failed to fetch hackathons';
        set({ error: errorMsg, isLoading: false });
        toast.error(errorMsg);
        throw error;
      }
    },

  // Clear current hackathon
  clearCurrentHackathon: () => set({ currentHackathon: null }),

  // Clear error
  clearError: () => set({ error: null }),
}));