import axiosInstance from './axiosConfig';

export const searchUsers = (q, role, additionalParams = {}) => {
    const params = { ...additionalParams };
    if (q) params.search = q;
    if (role) params.role = role;
    return axiosInstance.get('/users/search', { params });
};

