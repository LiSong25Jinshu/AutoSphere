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
  create: (data) => axios.post('/api/vehicles', data),
  update: (id, data) => axios.put(`/api/vehicles/${id}`, data),
  delete: (id) => axios.delete(`/api/vehicles/${id}`),
};

// ─── Bookings ─────────────────────────────────────────────────────────────────

export const bookingAPI = {
  getAll: (params = {}) => axios.get('/api/bookings', { params }),
  getById: (id) => axios.get(`/api/bookings/${id}`),
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
