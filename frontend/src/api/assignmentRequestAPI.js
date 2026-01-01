import axiosClient from './axiosConfig';

export const assignmentRequestAPI = {
  // Get all pending requests for current user
  getPendingRequests: () => {
    return axiosClient.get('/assignment-requests/pending');
  },

  // Accept mentor request
  acceptMentorRequest: (assignmentId) => {
    return axiosClient.post(`/assignment-requests/mentor/${assignmentId}/accept`);
  },

  // Reject mentor request
  rejectMentorRequest: (assignmentId) => {
    return axiosClient.post(`/assignment-requests/mentor/${assignmentId}/reject`);
  },

  // Accept judge request
  acceptJudgeRequest: (assignmentId) => {
    return axiosClient.post(`/assignment-requests/judge/${assignmentId}/accept`);
  },

  // Reject judge request
  rejectJudgeRequest: (assignmentId) => {
    return axiosClient.post(`/assignment-requests/judge/${assignmentId}/reject`);
  },
};

export default assignmentRequestAPI;

