// api/index.js - CORRECT VERSION
import authAPI from './authAPI';
import organizationAPI from './organizationAPI';
import hackathonAPI from './hackathonAPI';
import teamAPI from './teamAPI';
import submissionAPI from './submissionAPI';
import categoryAPI from './categoryAPI';
import judgeAPI from './judgeAPI';
import ratingAPI from './ratingAPI';
import mentorAPI from './mentorAPI';
import statsAPI from './statsAPI';
import { profileAPI } from './profileAPI';
import adminAPI from './adminAPI';
import { adRequestAPI } from './adRequestAPI';
import assignmentRequestAPI from './assignmentRequestAPI';


// Export all APIs as named exports
export {
  statsAPI,
  authAPI,
  organizationAPI,
  hackathonAPI,
  teamAPI,
  submissionAPI,
  categoryAPI,
  judgeAPI,
  ratingAPI,
  mentorAPI,
  profileAPI,
  adminAPI,
  adRequestAPI,
  assignmentRequestAPI
};

// Also export as default object
const api = {
  authAPI,
  organizationAPI,
  hackathonAPI,
  teamAPI,
  submissionAPI,
  categoryAPI,
  judgeAPI,
  ratingAPI,
  mentorAPI,
  profileAPI,
  adminAPI,
  adRequestAPI,
  assignmentRequestAPI
};

export default api;
