import axios from './axiosConfig';

const hackathonAPI = {
  // Method 1: getAll (used by stores)
  getAll: function(params = {}) {
    return axios.get('/hackathons', { params });
  },

  // Method 2: getHackathon (single hackathon)
  getHackathon: function(id) {
    return axios.get(`/hackathons/${id}`);
  },

  // Method 3: createHackathon
  createHackathon: function(data) {
    return axios.post('/hackathons', data);
  },

  // Method 4: updateHackathon
  updateHackathon: function(id, data) {
    return axios.put(`/hackathons/${id}`, data);
  },

  // Method 5: deleteHackathon
  deleteHackathon: function(id) {
    return axios.delete(`/hackathons/${id}`);
  },

  // Method 6: getForSponsors
  getForSponsors: function() {
    return axios.get('/hackathons/for-sponsors');
  },

  // Method 7: createCategory
  createCategory: function(hackathonId, data) {
    return axios.post(`/hackathons/${hackathonId}/categories`, data);
  },

  // Method 8: getPublicHackathons (alias for getAll)
  getPublicHackathons: function(params = {}) {
    return axios.get('/hackathons', { params });
  },

  // Method 9: getHackathonTeams
  getHackathonTeams: function(hackathonId) {
    return axios.get(`/hackathons/${hackathonId}/teams`);
  },
};

export default hackathonAPI;