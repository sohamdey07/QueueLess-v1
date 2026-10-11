import apiClient from './apiClient.js';

export const counterApi = {
  /**
   * Fetch all counters
   */
  getAllCounters: async () => {
    return apiClient('/counters', {
      method: 'GET',
    });
  },

  /**
   * Create a new counter (Admin)
   * @param {Object} data - { name, code, serviceId, assignedStaffId }
   */
  createCounter: async (data) => {
    return apiClient('/counters/add', {
      method: 'POST',
      body: data,
    });
  },

  /**
   * Update an existing counter (Admin/Staff)
   * @param {string} counterId
   * @param {Object} data
   */
  updateCounter: async (counterId, data) => {
    return apiClient(`/counters/${counterId}`, {
      method: 'PATCH',
      body: data,
    });
  },

  /**
   * Delete a counter (Admin)
   * @param {string} counterId
   */
  deleteCounter: async (counterId) => {
    return apiClient(`/counters/${counterId}`, {
      method: 'DELETE',
    });
  },
};

export default counterApi;
