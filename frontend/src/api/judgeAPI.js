// import axiosInstance from './axiosConfig';

// export const judgeAPI = {
//   // Assign judges to teams
//   assignJudges: async (hackathonId, data) => {
//     const response = await axiosInstance.post(`/hackathons/${hackathonId}/judge-assignments`, data);
//     return response.data;
//   },

//   // Assign judges to category
//   assignJudgesToCategory: async (hackathonId, data) => {
//     const response = await axiosInstance.post(`/hackathons/${hackathonId}/judge-assignments/category`, data);
//     return response.data;
//   },

//   // Remove judges from teams
//   removeJudges: async (hackathonId, data) => {
//     const response = await axiosInstance.post(`/hackathons/${hackathonId}/judge-assignments/remove`, data);
//     return response.data;
//   },

//   // List judges for hackathon
//   listJudges: async (hackathonId) => {
//     const response = await axiosInstance.get(`/hackathons/${hackathonId}/judge-assignments/judges`);
//     return response.data;
//   },

//   // Get potential judges
//   getPotentialJudges: async (hackathonId) => {
//     const response = await axiosInstance.get(`/users/hackathons/${hackathonId}/potential-judges`);
//     return response.data;
//   },
// };

// export default judgeAPI;





import axiosInstance from './axiosConfig';

export const judgeAPI = {
  // Assign judges to teams
  assignJudges: async (hackathonId, data) => {
    const response = await axiosInstance.post(`/hackathons/${hackathonId}/judge-assignments`, data);
    return response.data;
  },

  // Assign judges to category
  assignJudgesToCategory: async (hackathonId, data) => {
    const response = await axiosInstance.post(`/hackathons/${hackathonId}/judge-assignments/category`, data);
    return response.data;
  },

  // Remove judges from teams
  removeJudges: async (hackathonId, data) => {
    const response = await axiosInstance.post(`/hackathons/${hackathonId}/judge-assignments/remove`, data);
    return response.data;
  },

  // List judges for hackathon
  listJudges: async (hackathonId) => {
    const response = await axiosInstance.get(`/hackathons/${hackathonId}/judge-assignments/judges`);
    return response.data;
  },

  // Get potential judges
  getPotentialJudges: async (hackathonId) => {
    const response = await axiosInstance.get(`/hackathons/${hackathonId}/judge-assignments/potential-judges`);
    return response.data;
  },
};

export default judgeAPI;