// api/statsAPI.js
import axiosInstance from './axiosConfig';

const statsAPI = {
  getStats() {
    return axiosInstance.get('/auth/stats');
  },
};

export default statsAPI;
