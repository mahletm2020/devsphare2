import axiosInstance from './axiosConfig';

export const ratingAPI = {
  // Check if user has accepted judge assignments (for sidebar - no timeline filter)
  hasJudgeAssignments: async () => {
    const response = await axiosInstance.get('/ratings/has-judge-assignments');
    return response.data;
  },
  
  // Get judge's hackathons (filtered by timeline)
  getJudgeHackathons: async () => {
    const response = await axiosInstance.get('/ratings/judge-hackathons');
    return response.data;
  },

  // Get submissions to rate
  getSubmissionsToRate: async (hackathonId) => {
    const response = await axiosInstance.get(`/ratings/hackathons/${hackathonId}/submissions`);
    return response.data;
  },

  // Get judge's ratings for hackathon
  getMyRatings: async (hackathonId) => {
    const response = await axiosInstance.get(`/ratings/hackathons/${hackathonId}/my-ratings`);
    return response.data;
  },

  // Submit rating
  submitRating: async (submissionId, data) => {
    const response = await axiosInstance.post(`/submissions/${submissionId}/ratings`, data);
    return response.data;
  },

  // Update rating (same as submit - uses updateOrCreate)
  updateRating: async (submissionId, data) => {
    const response = await axiosInstance.post(`/submissions/${submissionId}/ratings`, data);
    return response.data;
  },
};

export default ratingAPI;