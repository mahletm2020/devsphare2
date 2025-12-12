// src/api/hackathon.js
import axiosClient from './axiosClient';

export const getHackathons = (params) => axiosClient.get('/hackathons', { params });
export const getHackathon = (id) => axiosClient.get(`/hackathons/${id}`);
export const createHackathon = (payload) => axiosClient.post('/hackathons', payload);
export const getHackathonTeams = (hackathonId) =>
  axiosClient.get(`/hackathons/${hackathonId}/teams`);
export const assignMentorToTeams = (hackathonId, teamIds, mentorId) =>
  axiosClient.post(`/hackathons/${hackathonId}/assign-mentors`, {
    team_ids: teamIds,
    mentor_id: mentorId,
  });
export const assignJudgesToTeams = (hackathonId, teamIds, judgeIds) =>
  axiosClient.post(`/hackathons/${hackathonId}/assign-judges`, {
    team_ids: teamIds,
    judge_ids: judgeIds,
  });
