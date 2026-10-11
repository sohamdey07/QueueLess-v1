import apiClient from './apiClient.js';

export const serviceApi = {
  /**
   * Fetch all services
   * @param {Object} [params] - { isActive, limit }
   */
  getAllServices: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.isActive !== undefined) {
      query.append('isActive', params.isActive);
    }
    if (params.limit !== undefined) {
      query.append('limit', params.limit);
    }
    const queryString = query.toString();
    const endpoint = `/service/all${queryString ? `?${queryString}` : ''}`;
    return apiClient(endpoint, {
      method: 'GET',
    });
  },

  /**
   * Fetch a single service by ID
   * @param {string} serviceId
   */
  getServiceById: async (serviceId) => {
    return apiClient(`/service/${serviceId}`, {
      method: 'GET',
    });
  },

  /**
   * Create a new service (Admin)
   * @param {FormData|Object} data
   */
  createService: async (data) => {
    return apiClient('/service/create', {
      method: 'POST',
      body: data,
    });
  },

  /**
   * Update an existing service (Admin)
   * @param {string} serviceId
   * @param {FormData|Object} data
   */
  updateService: async (serviceId, data) => {
    return apiClient(`/service/update/${serviceId}`, {
      method: 'PATCH',
      body: data,
    });
  },

  /**
   * Delete an existing service (Admin)
   * @param {string} serviceId
   */
  deleteService: async (serviceId) => {
    return apiClient(`/service/delete/${serviceId}`, {
      method: 'DELETE',
    });
  },
};

export default serviceApi;
