import axios from 'axios';

// No baseURL needed — Vite proxies /api to the backend
// This avoids CORS issues in development

// Track whether a refresh is already in flight so we don't fire multiple
// simultaneous refresh requests when several calls expire at the same time.
let isRefreshing = false;
let refreshSubscribers = [];

const onRefreshed = (newToken) => {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (cb) => {
  refreshSubscribers.push(cb);
};

// Request interceptor — attach the current access token to every request
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
  (error) => Promise.reject(error)
);

// Response interceptor — silently refresh the access token on 401, then retry
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh on 401 TOKEN_EXPIRED, and only once per request
    if (
      error.response?.status === 401 &&
      error.response?.data?.error === 'TOKEN_EXPIRED' &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        // No refresh token stored — force logout
        _clearSessionAndRedirect();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Another refresh is already in flight — queue this request
        return new Promise((resolve) => {
          addRefreshSubscriber((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(axios(originalRequest));
          });
        });
      }

      isRefreshing = true;

      try {
        // Use a plain axios call (not the intercepted instance) to avoid loops
        const { data } = await axios.post('/api/auth/refresh', { refreshToken }, {
          _retry: true, // mark so the 401 handler won't re-intercept this
        });

        const newToken = data.token;
        const newRefreshToken = data.refreshToken;

        // Persist the new tokens
        localStorage.setItem('token', newToken);
        if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

        // Notify all queued requests
        onRefreshed(newToken);

        // Retry the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        // Refresh itself failed — session is truly expired
        refreshSubscribers = [];
        _clearSessionAndRedirect();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // For any other 401 (missing token, invalid token) — force logout
    if (error.response?.status === 401 && !originalRequest._retry) {
      _clearSessionAndRedirect();
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.warn('Access forbidden:', error.response.data?.message);
    }

    // Handle network errors
    if (!error.response) {
      console.warn('Network error:', error.message);
      error.message = 'Network error. Please check your connection.';
    }

    return Promise.reject(error);
  }
);

function _clearSessionAndRedirect() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('refreshToken');
  delete axios.defaults.headers.common['Authorization'];

  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

export default axios;
