import apiClient from './apiClient.js';

export const appointmentApi = {
  /**
   * Book an appointment (Customer)
   * Supports either URL params or payload object
   * @param {string} serviceId
   * @param {string} [availabilityId]
   * @param {Object} [payload] - { date, ... }
   */
  bookAppointment: async (serviceId, availabilityId, payload = {}) => {
    if (serviceId && availabilityId) {
      return apiClient(`/appointments/${serviceId}/${availabilityId}`, {
        method: 'POST',
        body: payload,
      });
    }

    return apiClient('/appointments/book', {
      method: 'POST',
      body: { serviceId, availabilityId, ...payload },
    });
  },

  /**
   * Get all appointments for current logged-in customer
   */
  getMyAppointments: async () => {
    return apiClient('/appointments', {
      method: 'GET',
    });
  },

  /**
   * Get single appointment details by appointmentId
   * @param {string} appointmentId
   */
  getAppointmentById: async (appointmentId) => {
    return apiClient(`/appointments/${appointmentId}`, {
      method: 'GET',
    });
  },

  /**
   * Cancel an appointment (Customer)
   * @param {string} appointmentId
   */
  cancelAppointment: async (appointmentId) => {
    return apiClient(`/appointments/${appointmentId}/cancel`, {
      method: 'PATCH',
    });
  },

  /**
   * Check in to an appointment (Customer)
   * @param {string} appointmentId
   */
  checkIn: async (appointmentId) => {
    const cleanId = encodeURIComponent(String(appointmentId || '').trim());
    return apiClient(`/appointments/${cleanId}/check-in`, {
      method: 'POST',
      body: {},
    });
  },

  /**
   * Get today's appointments overview for admin dashboard
   * @param {string} [date] - Optional date string in YYYY-MM-DD format
   */
  getTodayOverview: async (date) => {
    const url = date
      ? `/appointments/today-overview?date=${encodeURIComponent(date)}`
      : '/appointments/today-overview';
    return apiClient(url, {
      method: 'GET',
    });
  },
};

export default appointmentApi;
