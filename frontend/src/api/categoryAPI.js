import axiosInstance from './axiosConfig';

export const categoryAPI = {
  // Create category
  create: async (hackathonId, data) => {
    const response = await axiosInstance.post(`/hackathons/${hackathonId}/categories`, data);
    return response.data;
  },

  // Update category
  update: async (id, data) => {
    const response = await axiosInstance.put(`/categories/${id}`, data);
    return response.data;
  },

  // Delete category
  delete: async (id) => {
    const response = await axiosInstance.delete(`/categories/${id}`);
    return response.data;
  },
};

export default categoryAPI;