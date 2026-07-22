import axios from '../utils/axiosConfig.js';

export const vehicleService = {
  // Get all vehicles with filters
  getVehicles: async (filters = {}) => {
    try {
      const response = await axios.get('/api/vehicles', { params: filters });
      return {
        success: true,
        data: response.data  // { success, data: [...], pagination: {...} }
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch vehicles',
        error: error.response?.data
      };
    }
  },

  // Get vehicle by ID
  getVehicleById: async (vehicleId) => {
    try {
      const response = await axios.get(`/api/vehicles/${vehicleId}`);
      return {
        success: true,
        data: response.data  // { success, data: vehicle }
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch vehicle details',
        error: error.response?.data
      };
    }
  },

  // Add new vehicle (dealer only)
  addVehicle: async (vehicleData) => {
    try {
      const response = await axios.post('/api/vehicles', vehicleData);
      return {
        success: true,
        message: 'Vehicle added successfully!',
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to add vehicle',
        error: error.response?.data
      };
    }
  },

  // Update vehicle
  updateVehicle: async (vehicleId, updateData) => {
    try {
      const response = await axios.put(`/api/vehicles/${vehicleId}`, updateData);
      return {
        success: true,
        message: 'Vehicle updated successfully!',
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update vehicle',
        error: error.response?.data
      };
    }
  },

  // Delete vehicle
  deleteVehicle: async (vehicleId) => {
    try {
      const response = await axios.delete(`/api/vehicles/${vehicleId}`);
      return {
        success: true,
        message: 'Vehicle deleted successfully!',
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete vehicle',
        error: error.response?.data
      };
    }
  },

  // Search vehicles (uses main getVehicles with search param)
  searchVehicles: async (searchQuery) => {
    try {
      const response = await axios.get('/api/vehicles', {
        params: { search: searchQuery }
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to search vehicles',
        error: error.response?.data
      };
    }
  }
};

export default vehicleService;