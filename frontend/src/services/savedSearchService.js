import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Create axios instance with auth token
const api = axios.create({
  baseURL: API_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Get all saved searches for the current user
 * @returns {Promise<Array>} Array of saved searches
 */
export const getSavedSearches = async () => {
  try {
    const response = await api.get('/saved-searches');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching saved searches:', error);
    throw error.response?.data || error;
  }
};

/**
 * Create a new saved search
 * @param {string} name - Name of the saved search
 * @param {Object} criteria - Search criteria object
 * @param {boolean} notificationsEnabled - Whether to enable notifications
 * @returns {Promise<Object>} Created saved search
 */
export const createSavedSearch = async (name, criteria, notificationsEnabled = false) => {
  try {
    const response = await api.post('/saved-searches', {
      name,
      searchCriteria: criteria,
      notificationsEnabled,
    });
    return response.data.data;
  } catch (error) {
    console.error('Error creating saved search:', error);
    throw error.response?.data || error;
  }
};

/**
 * Update an existing saved search
 * @param {number} id - ID of the saved search
 * @param {Object} updates - Updates to apply (name, searchCriteria, notificationsEnabled)
 * @returns {Promise<Object>} Updated saved search
 */
export const updateSavedSearch = async (id, updates) => {
  try {
    const response = await api.put(`/saved-searches/${id}`, updates);
    return response.data.data;
  } catch (error) {
    console.error('Error updating saved search:', error);
    throw error.response?.data || error;
  }
};

/**
 * Delete a saved search
 * @param {number} id - ID of the saved search to delete
 * @returns {Promise<void>}
 */
export const deleteSavedSearch = async (id) => {
  try {
    await api.delete(`/saved-searches/${id}`);
  } catch (error) {
    console.error('Error deleting saved search:', error);
    throw error.response?.data || error;
  }
};

export default {
  getSavedSearches,
  createSavedSearch,
  updateSavedSearch,
  deleteSavedSearch,
};
