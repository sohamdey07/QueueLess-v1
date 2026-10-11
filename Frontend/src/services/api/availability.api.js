import apiClient from './apiClient.js';

export const availabilityApi = {
  /**
   * Fetch all availabilities (Admin)
   * @param {Object} [params] - { serviceId, date, status }
   */
  getAllAvailabilities: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.serviceId) query.append('serviceId', params.serviceId);
    if (params.date) query.append('date', params.date);
    if (params.status) query.append('status', params.status);
    const qs = query.toString();
    const endpoint = `/availability/all${qs ? `?${qs}` : ''}`;
    return apiClient(endpoint, {
      method: 'GET',
    });
  },

  /**
   * Get availability for a specific service
   * @param {string} serviceId
   * @param {string} [date] - YYYY-MM-DD
   */
  getAvailability: async (serviceId, date) => {
    const endpoint = `/availability/${serviceId}${date ? `?date=${date}` : ''}`;
    return apiClient(endpoint, {
      method: 'GET',
    });
  },

  /**
   * Create availability for a service (Admin)
   * @param {string} serviceId
   * @param {Object} data - { date, capacity, status }
   */
  createAvailability: async (serviceId, data) => {
    return apiClient(`/availability/${serviceId}`, {
      method: 'POST',
      body: data,
    });
  },

  /**
   * Update availability (Admin)
   * @param {string} availabilityId
   * @param {Object} data - { capacity, status, date, serviceId }
   */
  updateAvailability: async (availabilityId, data) => {
    return apiClient(`/availability/${availabilityId}`, {
      method: 'PATCH',
      body: data,
    });
  },

  /**
   * Delete availability (Admin)
   * @param {string} availabilityId
   */
  deleteAvailability: async (availabilityId) => {
    return apiClient(`/availability/${availabilityId}`, {
      method: 'DELETE',
    });
  },
};

export default availabilityApi;
