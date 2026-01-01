import axiosInstance from './axiosConfig';

const blogAPI = {
  // Get all published blog posts
  getAll: async (params = {}) => {
    const response = await axiosInstance.get('/blog-posts', { params });
    return response.data;
  },

  // Get single blog post by slug
  getBySlug: async (slug) => {
    const response = await axiosInstance.get(`/blog-posts/${slug}`);
    return response.data;
  },

  // Get user's blog posts
  getMyPosts: async (params = {}) => {
    const response = await axiosInstance.get('/blog-posts/my-posts', { params });
    return response.data;
  },

  // Create new blog post
  create: async (data) => {
    const response = await axiosInstance.post('/blog-posts', data);
    return response.data;
  },

  // Create new blog post with file upload
  createWithFile: async (formData) => {
    const response = await axiosInstance.post('/blog-posts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Update blog post
  update: async (id, data) => {
    const response = await axiosInstance.put(`/blog-posts/${id}`, data);
    return response.data;
  },

  // Update blog post with file upload (using POST with _method=PUT for Laravel)
  updateWithFile: async (id, formData) => {
    // Add _method=PUT for Laravel to recognize as PUT request
    formData.append('_method', 'PUT');
    const response = await axiosInstance.post(`/blog-posts/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete blog post
  delete: async (id) => {
    const response = await axiosInstance.delete(`/blog-posts/${id}`);
    return response.data;
  },

  // Get hackathon winners for winner announcement
  getHackathonWinners: async (hackathonId) => {
    const response = await axiosInstance.get(`/hackathons/${hackathonId}/winners`);
    return response.data;
  },

  // Reactions (Likes/Dislikes)
  toggleReaction: async (slug, reaction) => {
    const response = await axiosInstance.post(`/blog-posts/${slug}/reactions`, { reaction });
    return response.data;
  },

  getReactions: async (slug) => {
    const response = await axiosInstance.get(`/blog-posts/${slug}/reactions`);
    return response.data;
  },

  // Comments
  getComments: async (slug) => {
    const response = await axiosInstance.get(`/blog-posts/${slug}/comments`);
    return response.data;
  },

  addComment: async (slug, content, parentId = null) => {
    const response = await axiosInstance.post(`/blog-posts/${slug}/comments`, {
      content,
      parent_id: parentId,
    });
    return response.data;
  },

  deleteComment: async (slug, commentId) => {
    const response = await axiosInstance.delete(`/blog-posts/${slug}/comments/${commentId}`);
    return response.data;
  },
};

export default blogAPI;

