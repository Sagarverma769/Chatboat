/**
 * api-client.ts
 *
 * NOTE: This Axios client is retained for reference but is NOT actively used.
 * All backend API calls go through Next.js API routes using backendRequest()
 * from @/lib/backend-api.ts (server-side) to avoid CORS issues.
 *
 * Use this only if you need to call external APIs directly from the browser.
 */
import axios from 'axios';

const API_URL = '/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token && config.headers) {
        config.headers.Authorization = 'Bearer ' + token;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
