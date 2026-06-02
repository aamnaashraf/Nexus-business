import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002/api/v1';

// Single shared axios instance used by every service module.
// Centralises auth header injection and global 401 handling.
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach JWT ───────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nexus_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: handle expired / invalid tokens globally ────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url: string = error.config?.url ?? '';
      // Don't redirect on auth endpoints themselves (expected 401 on bad credentials)
      const isAuthCall =
        url.includes('/auth/login') ||
        url.includes('/auth/register') ||
        url.includes('/auth/otp');

      if (!isAuthCall) {
        localStorage.removeItem('nexus_token');
        localStorage.removeItem('nexus_user');
        // Hard redirect so React state is fully reset
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
