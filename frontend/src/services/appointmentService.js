import axios from '../utils/axiosConfig.js';

export const appointmentService = {
  // Request a new appointment (booking)
  requestAppointment: async (appointmentData) => {
    try {
      // Map appointment data to booking format
      const bookingData = {
        serviceProviderId: appointmentData.serviceProviderId,
        serviceType: appointmentData.serviceType,
        title: appointmentData.title || appointmentData.serviceType,
        description: appointmentData.description || appointmentData.notes || '',
        scheduledDate: appointmentData.date,
        scheduledTime: appointmentData.time,
        customerNotes: appointmentData.notes || '',
        priority: appointmentData.priority || 'normal',
      };

      // Only include vehicleId if it's a valid number
      if (appointmentData.vehicleId && typeof appointmentData.vehicleId === 'number') {
        bookingData.vehicleId = appointmentData.vehicleId;
      }

      console.log('=== FRONTEND BOOKING DEBUG ===');
      console.log('Original appointment data:', appointmentData);
      console.log('Mapped booking data:', bookingData);
      
      // Validate the data format before sending
      console.log('=== DATA VALIDATION ===');
      console.log('serviceProviderId type:', typeof bookingData.serviceProviderId, 'value:', bookingData.serviceProviderId);
      console.log('serviceType:', bookingData.serviceType);
      console.log('title length:', bookingData.title?.length, 'value:', bookingData.title);
      console.log('scheduledDate format:', bookingData.scheduledDate);
      console.log('scheduledTime format:', bookingData.scheduledTime);

      const response = await axios.post('/api/bookings', bookingData);
      console.log('=== BOOKING SUCCESS ===');
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);
      
      return {
        success: true,
        message: 'Appointment request submitted successfully!',
        data: response.data.data
      };
    } catch (error) {
      console.error('=== BOOKING ERROR ===');
      console.error('Error:', error);
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
      console.error('Response headers:', error.response?.headers);
      
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to submit appointment request',
        error: error.response?.data
      };
    }
  },

  // Get user appointments
  getUserAppointments: async (status = null) => {
    try {
      const params = status ? { status } : {};
      const response = await axios.get('/api/bookings', { params });
      
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Get appointments error:', error);
      
      return {
        success: false,
        message: 'Failed to fetch appointments',
        error: error.response?.data
      };
    }
  },

  // Get appointment by ID
  getAppointment: async (appointmentId) => {
    try {
      const response = await axios.get(`/api/bookings/${appointmentId}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Get appointment error:', error);
      return {
        success: false,
        message: 'Failed to fetch appointment details',
        error: error.response?.data
      };
    }
  },

  // Update appointment status
  updateAppointmentStatus: async (appointmentId, status, notes = null) => {
    try {
      const updateData = { status };
      if (notes) {
        updateData.providerNotes = notes;
      }
      
      const response = await axios.patch(`/api/bookings/${appointmentId}/status`, updateData);
      return {
        success: true,
        message: 'Appointment updated successfully!',
        data: response.data.data
      };
    } catch (error) {
      console.error('Update appointment error:', error);
      return {
        success: false,
        message: 'Failed to update appointment',
        error: error.response?.data
      };
    }
  },

  // Cancel appointment
  cancelAppointment: async (appointmentId, reason = null) => {
    try {
      const response = await axios.patch(`/api/bookings/${appointmentId}/status`, {
        status: 'cancelled',
        cancellationReason: reason
      });
      return {
        success: true,
        message: 'Appointment cancelled successfully!',
        data: response.data.data
      };
    } catch (error) {
      console.error('Cancel appointment error:', error);
      return {
        success: false,
        message: 'Failed to cancel appointment',
        error: error.response?.data
      };
    }
  },

  // Reschedule appointment
  rescheduleAppointment: async (appointmentId, newDate, newTime) => {
    try {
      const response = await axios.patch(`/api/bookings/${appointmentId}/reschedule`, {
        scheduledDate: newDate,
        scheduledTime: newTime
      });
      return {
        success: true,
        message: 'Appointment rescheduled successfully!',
        data: response.data.data
      };
    } catch (error) {
      console.error('Reschedule appointment error:', error);
      return {
        success: false,
        message: 'Failed to reschedule appointment',
        error: error.response?.data
      };
    }
  },

  // Add review to completed appointment
  addReview: async (appointmentId, rating, review = null) => {
    try {
      const response = await axios.patch(`/api/bookings/${appointmentId}/review`, {
        rating,
        review
      });
      return {
        success: true,
        message: 'Review added successfully!',
        data: response.data.data
      };
    } catch (error) {
      console.error('Add review error:', error);
      return {
        success: false,
        message: 'Failed to add review',
        error: error.response?.data
      };
    }
  }
};

// For backward compatibility
export const requestAppointment = appointmentService.requestAppointment;
export default appointmentService;