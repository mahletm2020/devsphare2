import axiosInstance from './axiosConfig';

export const organizationAPI = {
  // Get all organizations
  getAll: async (params = {}) => {
    const response = await axiosInstance.get('/organizations', { params });
    return response.data;
  },

  // Get single organization
  getById: async (id) => {
    const response = await axiosInstance.get(`/organizations/${id}`);
    return response.data;
  },

  // Create organization
  create: async (data) => {
    const response = await axiosInstance.post('/organizations', data);
    return response.data;
  },

  // Update organization
  update: async (id, data) => {
    const response = await axiosInstance.put(`/organizations/${id}`, data);
    return response.data;
  },

  // Delete organization
  delete: async (id) => {
    const response = await axiosInstance.delete(`/organizations/${id}`);
    return response.data;
  },

  // Get organization hackathons
  getHackathons: async (id) => {
    const response = await axiosInstance.get(`/organizations/${id}/hackathons`);
    return response.data;
  },
};

export default organizationAPI;