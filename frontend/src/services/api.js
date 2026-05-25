/**
 * Centralized API service — all real backend calls go through here.
 * Uses the axios instance from axiosConfig which handles auth tokens.
 */
import axios from '../utils/axiosConfig.js';

// ─── Vehicles ────────────────────────────────────────────────────────────────

export const vehicleAPI = {
  getAll: (params = {}) => axios.get('/api/vehicles', { params }),
  getById: (id) => axios.get(`/api/vehicles/${id}`),
  getByDealer: (dealerId) => axios.get(`/api/vehicles/dealer/${dealerId}`),
  getMyVehicles: (params = {}) => axios.get('/api/vehicles/my', { params }),
  getDealerStats: () => axios.get('/api/vehicles/dealer/stats'),
  create: (data) => axios.post('/api/vehicles', data),
  update: (id, data) => axios.put(`/api/vehicles/${id}`, data),
  delete: (id) => axios.delete(`/api/vehicles/${id}`),
  uploadPhotos: (id, files) => {
    const form = new FormData();
    files.forEach((f) => form.append('photos', f));
    return axios.post(`/api/vehicles/${id}/photos`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deletePhoto: (id, url) => axios.delete(`/api/vehicles/${id}/photos`, { data: { url } }),
};

// ─── Bookings ─────────────────────────────────────────────────────────────────

export const bookingAPI = {
  getAll: (params = {}) => axios.get('/api/bookings', { params }),
  getById: (id) => axios.get(`/api/bookings/${id}`),
  getProviderStats: () => axios.get('/api/bookings/provider/stats'),
  create: (data) => axios.post('/api/bookings', data),
  updateStatus: (id, status, extra = {}) =>
    axios.patch(`/api/bookings/${id}/status`, { status, ...extra }),
  reschedule: (id, scheduledDate, scheduledTime) =>
    axios.patch(`/api/bookings/${id}/reschedule`, { scheduledDate, scheduledTime }),
  addReview: (id, rating, review) =>
    axios.patch(`/api/bookings/${id}/review`, { rating, review }),
};

// ─── Users / Admin ────────────────────────────────────────────────────────────

export const userAPI = {
  getProfile: () => axios.get('/api/users/profile'),
  updateProfile: (data) => axios.put('/api/users/profile', data),
  changePassword: (currentPassword, newPassword) =>
    axios.patch('/api/users/change-password', { currentPassword, newPassword }),
  getStats: () => axios.get('/api/users/stats'),
  // Admin only
  getAll: (params = {}) => axios.get('/api/users', { params }),
  getById: (id) => axios.get(`/api/users/${id}`),
  updateRole: (id, role) => axios.patch(`/api/users/${id}/role`, { role }),
  updateStatus: (id, isActive) => axios.patch(`/api/users/${id}/status`, { isActive }),
  getServiceProviders: () => axios.get('/api/users/service-providers/list'),
};

// ─── Messages ─────────────────────────────────────────────────────────────────

export const messageAPI = {
  getConversations: (params = {}) => axios.get('/api/messages/conversations', { params }),
  getMessages: (conversationId, params = {}) =>
    axios.get(`/api/messages/conversations/${conversationId}/messages`, { params }),
  sendMessage: (conversationId, content, messageType = 'text') =>
    axios.post(`/api/messages/conversations/${conversationId}/messages`, { content, messageType }),
  startConversation: (participantId, initialMessage, extra = {}) =>
    axios.post('/api/messages/conversations', { participantId, initialMessage, ...extra }),
};

// ─── Admin ────────────────────────────────────────────────────────────────────

export const adminAPI = {
  getStats: () => axios.get('/api/admin/stats'),
  getAnalytics: (days = 30) => axios.get('/api/admin/analytics', { params: { days } }),
  getSettings: () => axios.get('/api/admin/settings'),
  saveSettings: (settings) => axios.put('/api/admin/settings', settings),
  clearCache: () => axios.post('/api/admin/cache/clear'),
  purgeLogs: () => axios.post('/api/admin/logs/purge'),
  getModerationItems: (params = {}) => axios.get('/api/admin/moderation', { params }),
  moderateContent: (id, action, reason = '') =>
    axios.post(`/api/admin/moderation/${id}`, { action, reason }),
};

// ─── Services (Service Provider) ─────────────────────────────────────────────

export const serviceAPI = {
  getMyServices: () => axios.get('/api/services'),
  getByProvider: (providerId) => axios.get(`/api/services/provider/${providerId}`),
  getProvidersByType: (serviceType) => axios.get('/api/services/by-type', { params: { serviceType } }),
  create: (data) => axios.post('/api/services', data),
  update: (id, data) => axios.put(`/api/services/${id}`, data),
  delete: (id) => axios.delete(`/api/services/${id}`),
  getSchedule: () => axios.get('/api/services/schedule'),
  saveSchedule: (schedule) => axios.put('/api/services/schedule', { schedule }),
};

// ─── GDPR / Privacy ───────────────────────────────────────────────────────────

export const gdprAPI = {
  exportData: () => axios.get('/api/gdpr/export', { responseType: 'blob' }),
  deleteAccount: (confirmation) =>
    axios.post('/api/gdpr/delete-account', { confirmation }),
  getConsent: () => axios.get('/api/gdpr/consent'),
  saveConsent: (preferences) => axios.post('/api/gdpr/consent', preferences),
};
