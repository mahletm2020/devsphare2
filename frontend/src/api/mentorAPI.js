import axiosInstance from './axiosConfig';

export const mentorAPI = {
  // Get potential mentors for hackathon
  getPotentialMentors: async (hackathonId, params = {}) => {
    const response = await axiosInstance.get(`/hackathons/${hackathonId}/mentor-assignments/potential-mentors`, { params });
    return response.data;
  },

  // Or use user search endpoint
  searchUsers: async (params = {}) => {
    const response = await axiosInstance.get('/users/search', { params });
    return response.data;
  },

  // Assign mentor to teams
  assignMentor: async (hackathonId, data) => {
    const response = await axiosInstance.post(`/hackathons/${hackathonId}/mentor-assignments`, data);
    return response.data;
  },

  // Assign mentors to category
  assignMentorsToCategory: async (hackathonId, data) => {
    const response = await axiosInstance.post(`/hackathons/${hackathonId}/mentor-assignments/category`, data);
    return response.data;
  },

  // Remove mentors from teams
  removeMentors: async (hackathonId, data) => {
    const response = await axiosInstance.post(`/hackathons/${hackathonId}/mentor-assignments/remove`, data);
    return response.data;
  },

  // List mentors for hackathon
  listMentors: async (hackathonId) => {
    const response = await axiosInstance.get(`/hackathons/${hackathonId}/mentor-assignments/mentors`);
    return response.data;
  },

  // Get assigned teams for mentor dashboard
  getAssignedTeams: async () => {
    const response = await axiosInstance.get('/mentor/assigned-teams');
    return response.data;
  },

  // Get team details
  getTeamDetails: async (teamId) => {
    const response = await axiosInstance.get(`/mentor/teams/${teamId}`);
    return response.data;
  },

  // Remove member from team
  removeMember: async (teamId, userId) => {
    const response = await axiosInstance.post(`/mentor/teams/${teamId}/remove-member`, { user_id: userId });
    return response.data;
  },

  // Transfer team leadership
  transferLeadership: async (teamId, newLeaderId) => {
    const response = await axiosInstance.post(`/mentor/teams/${teamId}/transfer-leadership`, { new_leader_id: newLeaderId });
    return response.data;
  },
};

export default mentorAPI;
