import axiosInstance from './axiosConfig';

export const sponsorAPI = {
  // Get hackathons sponsored by current user
  getMySponsored: async () => {
    const response = await axiosInstance.get('/sponsors/my-sponsored');
    return response.data;
  },

  // Sponsor a hackathon
  sponsorHackathon: async (hackathonId) => {
    const response = await axiosInstance.post(`/hackathons/${hackathonId}/sponsor`);
    return response.data;
  },

  // Unsponsor a hackathon
  unsponsorHackathon: async (hackathonId) => {
    const response = await axiosInstance.post(`/hackathons/${hackathonId}/unsponsor`);
    return response.data;
  },
};

export default sponsorAPI;














