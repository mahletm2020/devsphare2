import axiosInstance from './axiosConfig';

export const adRequestAPI = {
  // Get all ad requests (super admin)
  getAll: async (params = {}) => {
    const response = await axiosInstance.get('/ad-requests', { params });
    return response.data;
  },

  // Get sponsor's own ad requests
  getMyRequests: async () => {
    const response = await axiosInstance.get('/ad-requests/my-requests');
    return response.data;
  },

  // Create new ad request
  create: async (data) => {
    const response = await axiosInstance.post('/ad-requests', data);
    return response.data;
  },

  // Get single ad request
  getById: async (id) => {
    const response = await axiosInstance.get(`/ad-requests/${id}`);
    return response.data;
  },

  // Approve or reject ad request (super admin)
  update: async (id, data) => {
    const response = await axiosInstance.put(`/ad-requests/${id}`, data);
    return response.data;
  },

  // Delete ad request
  delete: async (id) => {
    const response = await axiosInstance.delete(`/ad-requests/${id}`);
    return response.data;
  },

  // Initialize Chapa payment
  initializePayment: async (id, returnUrl = null) => {
    const params = returnUrl ? { return_url: returnUrl } : {};
    const response = await axiosInstance.post(`/ad-requests/${id}/initialize-payment`, null, { params });
    return response.data;
  },

  // Verify payment status
  verifyPayment: async (id) => {
    const response = await axiosInstance.get(`/ad-requests/${id}/verify-payment`);
    return response.data;
  },

  // Pay and post ad (placeholder for payment - kept for backward compatibility)
  payAndPost: async (id) => {
    const response = await axiosInstance.post(`/ad-requests/${id}/pay-and-post`);
    return response.data;
  },

  // Get posted ads (public endpoint, no auth required - axiosInstance works fine as token is optional)
  getPostedAds: async () => {
    const response = await axiosInstance.get('/ad-requests/posted');
    return response.data;
  },
};

export default adRequestAPI;













