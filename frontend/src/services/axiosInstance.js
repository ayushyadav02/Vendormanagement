import axios from 'axios';
import toast from 'react-hot-toast';
import store from '../store';
import { logout } from '../store/slices/authSlice';

let baseURL = import.meta.env.VITE_API_URL || '/api';
if (baseURL.endsWith('/')) baseURL = baseURL.slice(0, -1);
if (baseURL.startsWith('http') && !baseURL.endsWith('/api')) {
  baseURL += '/api';
}

const api = axios.create({
  baseURL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request Interceptor — Attach JWT ─────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('vendorlink_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor — Handle Errors ─────────────────
api.interceptors.response.use(
  (response) => {
    // For blob/arraybuffer downloads, return the full response so callers can access response.data
    if (response.config?.responseType === 'blob' || response.config?.responseType === 'arraybuffer') {
      return response;
    }
    return response.data;
  },
  (error) => {
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    const status = error.response?.status;

    // Auto-logout on 401
    if (status === 401) {
      store.dispatch(logout());
      toast.error('Session expired. Please log in again.');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Show error toast for 4xx/5xx (except for expected validation errors)
    if (status >= 400 && status !== 422) {
      // Let individual calls handle specific errors if needed
    }

    return Promise.reject(error);
  }
);

export default api;
