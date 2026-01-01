import { create } from 'zustand';
import { teamAPI } from '../api';
import toast from 'react-hot-toast';

export const useTeamStore = create((set, get) => ({
  teams: [],
  currentTeam: null,
  isLoading: false,
  error: null,

  // Fetch teams for hackathon
  fetchTeamsByHackathon: async (hackathonId, params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await teamAPI.getByHackathon(hackathonId, params);
      set({ teams: response.data, isLoading: false });
      return response;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to fetch teams';
      set({ error: errorMsg, isLoading: false });
      toast.error(errorMsg);
      throw error;
    }
  },

  // Fetch single team
  fetchTeam: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await teamAPI.getById(id);
      set({ currentTeam: response.data, isLoading: false });
      return response;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to fetch team';
      set({ error: errorMsg, isLoading: false });
      toast.error(errorMsg);
      throw error;
    }
  },

  // Create team
  createTeam: async (hackathonId, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await teamAPI.create(hackathonId, data);
      set((state) => ({
        teams: [response.data, ...state.teams],
        isLoading: false
      }));
      toast.success('Team created successfully!');
      return response;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to create team';
      set({ error: errorMsg, isLoading: false });
      toast.error(errorMsg);
      throw error;
    }
  },

  // Join team
  joinTeam: async (teamId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await teamAPI.join(teamId);
      set((state) => ({
        teams: state.teams.map(team => 
          team.id === teamId ? response.data : team
        ),
        currentTeam: response.data,
        isLoading: false
      }));
      toast.success('Successfully joined the team!');
      return response;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to join team';
      set({ error: errorMsg, isLoading: false });
      toast.error(errorMsg);
      throw error;
    }
  },

  // Leave team
  leaveTeam: async (teamId) => {
    set({ isLoading: true, error: null });
    try {
      await teamAPI.leave(teamId);
      set((state) => ({
        teams: state.teams.filter(team => team.id !== teamId),
        currentTeam: null,
        isLoading: false
      }));
      toast.success('Successfully left the team');
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to leave team';
      set({ error: errorMsg, isLoading: false });
      toast.error(errorMsg);
      throw error;
    }
  },

  // Lock team (organizer)
  lockTeam: async (teamId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await teamAPI.lock(teamId);
      set((state) => ({
        teams: state.teams.map(team => 
          team.id === teamId ? response.data : team
        ),
        currentTeam: response.data,
        isLoading: false
      }));
      toast.success('Team locked successfully');
      return response;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to lock team';
      set({ error: errorMsg, isLoading: false });
      toast.error(errorMsg);
      throw error;
    }
  },

  // Unlock team (organizer)
  unlockTeam: async (teamId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await teamAPI.unlock(teamId);
      set((state) => ({
        teams: state.teams.map(team => 
          team.id === teamId ? response.data : team
        ),
        currentTeam: response.data,
        isLoading: false
      }));
      toast.success('Team unlocked successfully');
      return response;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to unlock team';
      set({ error: errorMsg, isLoading: false });
      toast.error(errorMsg);
      throw error;
    }
  },

  // Transfer leadership
  transferLeadership: async (teamId, newLeaderId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await teamAPI.transferLeadership(teamId, newLeaderId);
      set((state) => ({
        currentTeam: response.data,
        isLoading: false
      }));
      toast.success('Leadership transferred successfully');
      return response;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to transfer leadership';
      set({ error: errorMsg, isLoading: false });
      toast.error(errorMsg);
      throw error;
    }
  },

  // Kick member
  kickMember: async (teamId, memberId) => {
    set({ isLoading: true, error: null });
    try {
      await teamAPI.kickMember(teamId, memberId);
      set((state) => ({
        currentTeam: {
          ...state.currentTeam,
          members: state.currentTeam?.members?.filter(member => member.id !== memberId) || []
        },
        isLoading: false
      }));
      toast.success('Member removed from team');
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to remove member';
      set({ error: errorMsg, isLoading: false });
      toast.error(errorMsg);
      throw error;
    }
  },

  // Clear current team
  clearCurrentTeam: () => set({ currentTeam: null }),

  // Clear error
  clearError: () => set({ error: null }),
}));