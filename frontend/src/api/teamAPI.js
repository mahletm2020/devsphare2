

import axiosInstance from './axiosConfig';

export const teamAPI = {
  // Get teams for a hackathon
  getByHackathon: async (hackathonId, params = {}) => {
    const response = await axiosInstance.get(`/hackathons/${hackathonId}/teams`, { params });
    return response.data;
  },

  // Get single team
  getById: async (id) => {
    const response = await axiosInstance.get(`/teams/${id}`);
    return response.data;
  },

  // Create team
  create: async (hackathonId, data) => {
    const response = await axiosInstance.post(`/hackathons/${hackathonId}/teams`, data);
    return response.data;
  },

  // Join team
  join: async (teamId) => {
    const response = await axiosInstance.post(`/teams/${teamId}/join`);
    return response.data;
  },

  // Leave team
  leave: async (teamId) => {
    const response = await axiosInstance.post(`/teams/${teamId}/leave`);
    return response.data;
  },

  // Lock team (organizer only)
  lock: async (teamId) => {
    const response = await axiosInstance.post(`/teams/${teamId}/lock`);
    return response.data;
  },

  // Unlock team (organizer only)
  unlock: async (teamId) => {
    const response = await axiosInstance.post(`/teams/${teamId}/unlock`);
    return response.data;
  },

  // Transfer leadership
  transferLeadership: async (teamId, newLeaderId) => {
    const response = await axiosInstance.post(`/teams/${teamId}/transfer-leadership`, {
      new_leader_id: newLeaderId
    });
    return response.data;
  },

  // Kick member
  kickMember: async (teamId, memberId) => {
    const response = await axiosInstance.post(`/teams/${teamId}/kick-member`, {
      member_id: memberId
    });
    return response.data;
  },
};

export default teamAPI;