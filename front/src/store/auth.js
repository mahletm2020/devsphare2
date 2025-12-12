import { create } from 'zustand';
import axiosClient from '../api/axiosClient';

const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('devsphere_token') || null,
  loading: false,

  setUser(user) {
    set({ user });
  },

  setToken(token) {
    if (token) {
      localStorage.setItem('devsphere_token', token);
    } else {
      localStorage.removeItem('devsphere_token');
    }
    set({ token });
  },

  async login(payload) {
    set({ loading: true });
    try {
      const res = await axiosClient.post('/auth/login', payload);
      const data = res.data; // backend returns { user, token }

      get().setUser(data.user);
      get().setToken(data.token);

      return data;
    } finally {
      set({ loading: false });
    }
  },

  async register(payload) {
    set({ loading: true });
    try {
      const res = await axiosClient.post('/auth/register', payload);
      const data = res.data; // backend returns { user, token }

      get().setUser(data.user);
      get().setToken(data.token);

      return data;
    } finally {
      set({ loading: false });
    }
  },

  async fetchMe() {
    if (!get().token) return;
    const { data } = await axiosClient.get('/auth/me');
    set({ user: data });
  },

  async logout() {
    try {
      await axiosClient.post('/auth/logout');
    } catch {
      // ignore
    } finally {
      get().setUser(null);
      get().setToken(null);
    }
  },
}));

export default useAuthStore;
