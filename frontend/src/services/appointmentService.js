import axios from 'axios';

// Mock appointment service - replace with real API calls
export const appointmentService = {
  // Request a new appointment
  requestAppointment: async (appointmentData) => {
    try {
      const response = await axios.post('/api/appointments', appointmentData);
      return {
        success: true,
        message: 'Appointment request submitted successfully!',
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to submit appointment request',
        error: error.response?.data
      };
    }
  },

  // Get user appointments
  getUserAppointments: async (userId) => {
    try {
      const response = await axios.get(`/api/appointments/user/${userId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch appointments',
        error: error.response?.data
      };
    }
  },

  // Update appointment status
  updateAppointment: async (appointmentId, updateData) => {
    try {
      const response = await axios.put(`/api/appointments/${appointmentId}`, updateData);
      return {
        success: true,
        message: 'Appointment updated successfully!',
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update appointment',
        error: error.response?.data
      };
    }
  },

  // Cancel appointment
  cancelAppointment: async (appointmentId, reason) => {
    try {
      const response = await axios.delete(`/api/appointments/${appointmentId}`, {
        data: { reason }
      });
      return {
        success: true,
        message: 'Appointment cancelled successfully!',
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to cancel appointment',
        error: error.response?.data
      };
    }
  }
};

// For backward compatibility
export const requestAppointment = appointmentService.requestAppointment;
export default appointmentService;