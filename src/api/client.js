import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// Access the API via relative path. Nginx will route /api to the backend container natively!
const API_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

function extractErrorDetail(detail) {
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object' && typeof item.msg === 'string') return item.msg;
        return '';
      })
      .filter(Boolean)
      .join(' ');
  }
  if (detail && typeof detail === 'object') {
    return detail.summary || detail.message || '';
  }
  return '';
}

function shouldLogoutOn401(error) {
  const originalRequest = error.config;
  const url = originalRequest?.url || '';
  if (url.includes('/auth/me')) return true;

  const hasApiKeyHeader = Boolean(
    originalRequest?.headers?.['X-API-Key'] ||
    originalRequest?.headers?.['x-api-key']
  );
  if (hasApiKeyHeader) return false;

  const detail = extractErrorDetail(error.response?.data?.detail).toLowerCase();
  return [
    'access token expired',
    'invalid access token',
    'invalid bearer token',
    'missing bearer token',
    'not authenticated',
    'token expired',
  ].some((phrase) => detail.includes(phrase));
}
// Interceptor to attach the JWT Token for auth endpoints
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor to handle 401 Unauthorized globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;
    // Don't intercept auth endpoints to let the components handle the errors visually
    if (originalRequest && originalRequest.url && (originalRequest.url.includes('/auth/login') || originalRequest.url.includes('/auth/register'))) {
      return Promise.reject(error);
    }

    if (error.response && error.response.status === 401 && shouldLogoutOn401(error)) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
