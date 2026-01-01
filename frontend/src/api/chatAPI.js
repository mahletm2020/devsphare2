import axiosInstance from './axiosConfig';

export const chatAPI = {
  // Get Stream Chat token for current user
  getToken: async () => {
    const response = await axiosInstance.get('/chat/token');
    return response.data;
  },

  // Get or create direct message channel with another user
  getDirectChannel: async (userId) => {
    const response = await axiosInstance.get(`/chat/channel/direct/${userId}`);
    return response.data;
  },

  // Get or create team channel
  getTeamChannel: async (teamId) => {
    const response = await axiosInstance.get(`/chat/channel/team/${teamId}`);
    return response.data;
  },

  // Get or create hackathon channel
  getHackathonChannel: async (hackathonId) => {
    const response = await axiosInstance.get(`/chat/channel/hackathon/${hackathonId}`);
    return response.data;
  },
};

export default chatAPI;


