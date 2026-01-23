// services/appointmentService.js

/**
 * This service handles all appointment-related logic.
 * Currently it logs data, but later you can replace with API calls.
 */

/**
 * Request a new appointment
 * @param {Object} appointmentData - The appointment details
 * @param {string} appointmentData.userId - ID of the user requesting
 * @param {string} appointmentData.date - Date of the appointment
 * @param {string} appointmentData.time - Time of the appointment
 * @param {string} appointmentData.serviceType - Type of service
 */
export const requestAppointment = (appointmentData) => {
  console.log("Appointment requested:", appointmentData);

  // This is where you would call your backend API
  // Example (later):
  // return axios.post("/api/appointments", appointmentData);

  // For now, we return a fake success response
  return { success: true, message: "Appointment requested successfully" };
};

/**
 * Get all appointments for a user
 * @param {string} userId - ID of the user
 */
export const getAppointments = (userId) => {
  console.log("Fetching appointments for user:", userId);

  // Placeholder for API call
  // Example (later):
  // return axios.get(`/api/appointments/${userId}`);

  return [
    {
      id: 1,
      date: "2026-01-15",
      time: "10:00 AM",
      serviceType: "Car Maintenance",
    },
    {
      id: 2,
      date: "2026-01-20",
      time: "2:00 PM",
      serviceType: "Car Wash",
    },
  ];
};
