import apiClient from './apiClient.js';

export const queueApi = {
  /**
   * Fetch queue logs for admin
   * @param {Object} [params] - { serviceId, date, status }
   */
  getQueueLogs: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.serviceId && params.serviceId !== 'all') {
      query.append('serviceId', params.serviceId);
    }
    if (params.date && params.date !== 'all') {
      query.append('date', params.date);
    }
    if (params.status && params.status !== 'all') {
      query.append('status', params.status);
    }
    const queryString = query.toString();
    const endpoint = `/queue/logs${queryString ? `?${queryString}` : ''}`;
    return apiClient(endpoint, {
      method: 'GET',
    });
  },

  /**
   * Fetch active queue status for a queue ID (Customer)
   * @param {string} queueId
   * @param {string} [appointmentId]
   */
  getQueueStatus: async (queueId, appointmentId = null) => {
    const q = appointmentId ? `?appointmentId=${encodeURIComponent(appointmentId)}` : '';
    return apiClient(`/queue/${encodeURIComponent(queueId)}${q}`, {
      method: 'GET',
    });
  },

  /**
   * Fetch TV display overview for all counters and their queues
   */
  getTvDisplayOverview: async () => {
    return apiClient('/queue/tv-display', {
      method: 'GET',
    });
  },

  /**
   * Fetch staff queue overview for assigned counter & service
   */
  getStaffOverview: async () => {
    return apiClient('/queue/staff-overview', {
      method: 'GET',
    });
  },

  /**
   * Call the next customer in queue
   * @param {string} queueId
   */
  callNext: async (queueId) => {
    return apiClient(`/queue/${encodeURIComponent(queueId)}/call-next`, {
      method: 'POST',
    });
  },

  /**
   * Start consultation service for a called queue entry
   * @param {string} queueEntryId
   */
  startService: async (queueEntryId) => {
    return apiClient(`/queue/${encodeURIComponent(queueEntryId)}/start`, {
      method: 'POST',
    });
  },

  /**
   * Skip / mark no-show for a called queue entry
   * @param {string} queueEntryId
   */
  skipCustomer: async (queueEntryId) => {
    return apiClient(`/queue/${encodeURIComponent(queueEntryId)}/skip`, {
      method: 'POST',
    });
  },

  /**
   * Complete service for a serving queue entry
   * @param {string} queueEntryId
   */
  completeService: async (queueEntryId) => {
    return apiClient(`/queue/${encodeURIComponent(queueEntryId)}/complete`, {
      method: 'POST',
    });
  },
};

export default queueApi;
