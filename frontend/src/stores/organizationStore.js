import { create } from 'zustand';
import { organizationAPI } from '../api';
import toast from 'react-hot-toast';

export const useOrganizationStore = create((set, get) => ({
  organizations: [],
  currentOrganization: null,
  isLoading: false,
  error: null,

  // Fetch all organizations
  fetchOrganizations: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await organizationAPI.getAll(params);
      set({ organizations: response.data, isLoading: false });
      return response;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to fetch organizations';
      set({ error: errorMsg, isLoading: false });
      toast.error(errorMsg);
      throw error;
    }
  },

  // Fetch single organization
  fetchOrganization: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await organizationAPI.getById(id);
      set({ currentOrganization: response.data, isLoading: false });
      return response;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to fetch organization';
      set({ error: errorMsg, isLoading: false });
      toast.error(errorMsg);
      throw error;
    }
  },

  // Create organization
  createOrganization: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await organizationAPI.create(data);
      set((state) => ({
        organizations: [response.data, ...state.organizations],
        currentOrganization: response.data,
        isLoading: false
      }));
      toast.success('Organization created successfully!');
      return response;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to create organization';
      set({ error: errorMsg, isLoading: false });
      toast.error(errorMsg);
      throw error;
    }
  },

  // Update organization
  updateOrganization: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await organizationAPI.update(id, data);
      set((state) => ({
        organizations: state.organizations.map(org => 
          org.id === id ? response.data : org
        ),
        currentOrganization: response.data,
        isLoading: false
      }));
      toast.success('Organization updated successfully!');
      return response;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to update organization';
      set({ error: errorMsg, isLoading: false });
      toast.error(errorMsg);
      throw error;
    }
  },

  // Delete organization
  deleteOrganization: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await organizationAPI.delete(id);
      set((state) => ({
        organizations: state.organizations.filter(org => org.id !== id),
        currentOrganization: null,
        isLoading: false
      }));
      toast.success('Organization deleted successfully!');
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to delete organization';
      set({ error: errorMsg, isLoading: false });
      toast.error(errorMsg);
      throw error;
    }
  },

  // Fetch organization hackathons
  fetchOrganizationHackathons: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await organizationAPI.getHackathons(id);
      set({ isLoading: false });
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to fetch hackathons';
      set({ error: errorMsg, isLoading: false });
      toast.error(errorMsg);
      throw error;
    }
  },

  // Clear current organization
  clearCurrentOrganization: () => set({ currentOrganization: null }),

  // Clear error
  clearError: () => set({ error: null }),
}));