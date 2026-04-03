import axios from 'axios';

// No baseURL needed — Vite proxies /api to the backend
// This avoids CORS issues in development

// Request interceptor to add auth token
axios.interceptors.request.use(
  (config) => {
    // Always add test mode header in development
    if (import.meta.env.DEV) {
      config.headers['x-test-mode'] = 'true';
    }
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized responses
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // In development with test mode, don't redirect to login
      if (import.meta.env.DEV && originalRequest.headers['x-test-mode'] === 'true') {
        console.warn('API request failed in test mode:', error.response?.data?.message);
        return Promise.reject(error);
      }

      // Clear invalid token
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete axios.defaults.headers.common['Authorization'];

      // Redirect to login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // Handle 403 Forbidden responses
    if (error.response?.status === 403) {
      // User doesn't have permission for this resource
      console.warn('Access forbidden:', error.response.data?.message);
    }

    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
      error.message = 'Network error. Please check your connection.';
    }

    return Promise.reject(error);
  }
);

export default axios;