import axiosInstance from './axiosConfig';

export const authAPI = {
  // Register user
  register: async (userData) => {
    const response = await axiosInstance.post('/register', userData);
    return response.data;
  },

  // Login user
  login: async (credentials) => {
    console.log('Sending login request:', { email: credentials.email, password: '***' });
    try {
      const response = await axiosInstance.post('/login', credentials);
      return response.data;
    } catch (error) {
      console.error('Login API error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await axiosInstance.get('/user'); 
    return response.data;
  },
  // Logout user
  logout: async () => {
    const response = await axiosInstance.post('/logout');
    return response.data;
  },

  // Google OAuth login
  googleLogin: async (credential) => {
    const response = await axiosInstance.post('/auth/google', { credential });
    return response.data;
  },
};

export default authAPI;