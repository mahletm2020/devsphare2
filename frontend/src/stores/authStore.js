import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import authAPI from '../api/authAPI';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      // Login action
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authAPI.login({ email, password });
          const user = response.user || response.data?.user;
          const token = response.token || response.data?.token;
          
          if (!token) {
            set({ 
              error: 'No token received from server', 
              isLoading: false 
            });
            throw new Error('No token received from server');
          }
          
          localStorage.setItem('auth_token', token);
          
          // Fetch full user data including roles and assignments
          try {
            const fullUser = await authAPI.getCurrentUser();
            // Ensure all relationships are properly loaded
            const userWithRoles = {
              ...fullUser,
              roles: fullUser?.roles || [],
              judgeHackathons: fullUser?.judgeHackathons || fullUser?.judge_hackathons || [],
              mentorHackathons: fullUser?.mentorHackathons || fullUser?.mentor_hackathons || [],
              teams: fullUser?.teams || [],
            };
            set({ 
              user: userWithRoles, 
              token: token,
              isLoading: false 
            });
            return { ...response, user: userWithRoles };
          } catch (fetchError) {
            // If fetch fails, use the user from login response (if available)
            const userWithRoles = {
              ...(user || {}),
              roles: user?.roles || [],
              judgeHackathons: user?.judgeHackathons || user?.judge_hackathons || [],
              mentorHackathons: user?.mentorHackathons || user?.mentor_hackathons || [],
              teams: user?.teams || [],
            };
            set({ 
              user: userWithRoles, 
              token: token,
              isLoading: false 
            });
            return { ...response, user: userWithRoles };
          }
        } catch (error) {
          console.error('Login error:', error);
          set({ 
            error: error.response?.data?.message || error.message || 'Login failed', 
            isLoading: false 
          });
          throw error;
        }
      },

      // Google OAuth login
      googleLogin: async (credential) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authAPI.googleLogin(credential);
          const user = response.user || response.data?.user;
          const token = response.token || response.data?.token;
          
          if (token) {
            localStorage.setItem('auth_token', token);
          }
          
          // Fetch full user data including roles and assignments
          if (token) {
            try {
              const fullUser = await authAPI.getCurrentUser();
              const userWithRoles = {
                ...fullUser,
                roles: fullUser?.roles || [],
                judgeHackathons: fullUser?.judgeHackathons || fullUser?.judge_hackathons || [],
                mentorHackathons: fullUser?.mentorHackathons || fullUser?.mentor_hackathons || [],
                teams: fullUser?.teams || [],
              };
              set({ 
                user: userWithRoles, 
                token: token,
                isLoading: false 
              });
              return { ...response, user: userWithRoles };
            } catch (fetchError) {
              const userWithRoles = {
                ...user,
                roles: user?.roles || [],
                judgeHackathons: user?.judgeHackathons || user?.judge_hackathons || [],
                mentorHackathons: user?.mentorHackathons || user?.mentor_hackathons || [],
                teams: user?.teams || [],
              };
              set({ 
                user: userWithRoles, 
                token: token,
                isLoading: false 
              });
              return { ...response, user: userWithRoles };
            }
          } else {
            const userWithRoles = {
              ...user,
              roles: user?.roles || [],
              judgeHackathons: user?.judgeHackathons || user?.judge_hackathons || [],
              mentorHackathons: user?.mentorHackathons || user?.mentor_hackathons || [],
              teams: user?.teams || [],
            };
            set({ 
              user: userWithRoles, 
              token: token,
              isLoading: false 
            });
            return { ...response, user: userWithRoles };
          }
        } catch (error) {
          const errorMsg = error.response?.data?.message || 'Google login failed';
          set({ error: errorMsg, isLoading: false });
          toast.error(errorMsg);
          throw error;
        }
      },

      // Register action
      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authAPI.register(userData);
          const user = response.user || response.data?.user;
          const token = response.token || response.data?.token;
          
          if (token) {
            localStorage.setItem('auth_token', token);
          }
          
          // Fetch full user data including roles and assignments
          if (token) {
            try {
              const fullUser = await authAPI.getCurrentUser();
              // Ensure all relationships are properly loaded
              const userWithRoles = {
                ...fullUser,
                roles: fullUser?.roles || [],
                judgeHackathons: fullUser?.judgeHackathons || fullUser?.judge_hackathons || [],
                mentorHackathons: fullUser?.mentorHackathons || fullUser?.mentor_hackathons || [],
                teams: fullUser?.teams || [],
              };
              set({ 
                user: userWithRoles, 
                token: token,
                isLoading: false 
              });
              return { ...response, user: userWithRoles };
            } catch (fetchError) {
              // If fetch fails, use the user from register response
              const userWithRoles = {
                ...user,
                roles: user?.roles || [],
                judgeHackathons: user?.judgeHackathons || user?.judge_hackathons || [],
                mentorHackathons: user?.mentorHackathons || user?.mentor_hackathons || [],
                teams: user?.teams || [],
              };
              set({ 
                user: userWithRoles, 
                token: token,
                isLoading: false 
              });
              return { ...response, user: userWithRoles };
            }
          } else {
            const userWithRoles = {
              ...user,
              roles: user?.roles || [],
              judgeHackathons: user?.judgeHackathons || user?.judge_hackathons || [],
              mentorHackathons: user?.mentorHackathons || user?.mentor_hackathons || [],
              teams: user?.teams || [],
            };
            set({ 
              user: userWithRoles, 
              token: token,
              isLoading: false 
            });
            return { ...response, user: userWithRoles };
          }
        } catch (error) {
          set({ 
            error: error.response?.data?.message || 'Registration failed', 
            isLoading: false 
          });
          throw error;
        }
      },

      // Logout action
      logout: async () => {
        try {
          // Call logout API to invalidate token on server
          await authAPI.logout();
        } catch (error) {
          console.error('Logout error:', error);
          // Continue with logout even if API call fails
        } finally {
          // Clear all auth data
          set({ user: null, token: null, error: null });
          
          // Remove token from localStorage
          localStorage.removeItem('auth_token');
          
          // Clear Zustand persisted storage
          localStorage.removeItem('auth-storage');
          
          // Clear any other auth-related storage
          sessionStorage.removeItem('auth_token');
          sessionStorage.removeItem('auth-storage');
        }
      },

      // Check authentication status
      checkAuth: async () => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          set({ user: null, token: null, isLoading: false });
          return false;
        }

        set({ isLoading: true });
        try {
          const user = await authAPI.getCurrentUser();
          // Ensure all relationships are properly loaded
          const userWithRoles = {
            ...user,
            roles: user?.roles || [],
            judgeHackathons: user?.judgeHackathons || user?.judge_hackathons || [],
            mentorHackathons: user?.mentorHackathons || user?.mentor_hackathons || [],
            teams: user?.teams || [],
          };
          set({ user: userWithRoles, token, isLoading: false });
          return userWithRoles;
        } catch (error) {
          console.error('Auth check failed:', error);
          set({ user: null, token: null, isLoading: false });
          localStorage.removeItem('auth_token');
          return false;
        }
      },

      // Clear error
      clearError: () => set({ error: null }),

      // Check if user has specific role
      hasRole: (role) => {
        const user = get().user;
        if (!user || !user.roles) return false;
        return user.roles.some(r => {
          const roleName = typeof r === 'string' ? r : (r?.name || r);
          return roleName === role;
        });
      },

      // Check if user has any of the roles
      hasAnyRole: (roles) => {
        const user = get().user;
        if (!user || !user.roles) return false;
        return user.roles.some(r => {
          const roleName = typeof r === 'string' ? r : (r?.name || r);
          return roles.includes(roleName);
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token 
      }),
    }
  )
);