// api/adminAPI.js
import axiosInstance from './axiosConfig';

const adminAPI = {
  // Get all hackathons (admin can see all)
  getAllHackathons(params = {}) {
    return axiosInstance.get('/hackathons', { params });
  },

  // Get all users (if endpoint exists)
  getAllUsers(params = {}) {
    return axiosInstance.get('/users', { params });
  },

  // Get system stats
  getSystemStats() {
    return axiosInstance.get('/auth/stats');
  },

  // Get all teams
  getAllTeams(params = {}) {
    return axiosInstance.get('/teams', { params });
  },

  // Get all submissions
  getAllSubmissions(params = {}) {
    return axiosInstance.get('/submissions', { params });
  },

  // Get all organizations
  getAllOrganizations(params = {}) {
    return axiosInstance.get('/organizations', { params });
  },

  // Delete organization (admin can delete any organization)
  deleteOrganization(orgId) {
    return axiosInstance.delete(`/organizations/${orgId}`);
  },

  // Update user (admin can update any user)
  updateUser(userId, data) {
    return axiosInstance.put(`/users/${userId}`, data);
  },

  // Delete user (admin can delete any user)
  deleteUser(userId) {
    return axiosInstance.delete(`/users/${userId}`);
  },

  // Update hackathon (admin can update any hackathon)
  updateHackathon(hackathonId, data) {
    return axiosInstance.put(`/hackathons/${hackathonId}`, data);
  },

  // Delete hackathon (admin can delete any hackathon)
  deleteHackathon(hackathonId) {
    return axiosInstance.delete(`/hackathons/${hackathonId}`);
  },

  // Get all users by role (super admin only)
  getUsersByRole(role, params = {}) {
    return axiosInstance.get('/admin/users/by-role', { 
      params: { role, ...params } 
    });
  },
};

export default adminAPI;




