// import axios from 'axios';

// const API_BASE_URL = 'http://localhost:8000/api/v1';  

// const axiosInstance = axios.create({
//   baseURL: API_BASE_URL,
//   headers: {
//     'Content-Type': 'application/json',
//     'Accept': 'application/json',
//   },
// });

// // Request interceptor to add token
// axiosInstance.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('auth_token');
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
    
//     // Don't override Content-Type for FormData (multipart/form-data)
//     // Let axios set it automatically with the boundary
//     if (config.data instanceof FormData) {
//       delete config.headers['Content-Type'];
//     }
    
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );
  
// // Response interceptor for error handling
// axiosInstance.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response?.status === 401) {
//       localStorage.removeItem('auth_token');
//       localStorage.removeItem('user');
//       window.location.href = '/login';
//     }
//     return Promise.reject(error);
//   }
// );

// export default axiosInstance;




import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  headers: {
    Accept: 'application/json',
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Add authentication token
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // CRITICAL: For FormData (file uploads), let axios automatically set Content-Type
    // with the boundary parameter. Manually setting it breaks file uploads.
    if (config.data instanceof FormData) {
      // Remove any manually set Content-Type - axios will add it with boundary
      delete config.headers['Content-Type'];
      console.log('FormData detected - letting axios set Content-Type with boundary');
    }

    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't log 503 errors for chat endpoints (chat is not configured yet)
    const isChatEndpoint = error.config?.url?.includes('/chat/');
    const is503Error = error.response?.status === 503;
    
    if (!(isChatEndpoint && is503Error)) {
      // Only log non-chat errors or non-503 errors
      console.error('Response error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
