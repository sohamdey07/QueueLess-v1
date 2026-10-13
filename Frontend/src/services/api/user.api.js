import apiClient from './apiClient.js';

export const userApi = {
  /**
   * Fetch all users with optional query filters (role, status, search)
   * @param {Object} [params]
   */
  getAllUsers: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.role) query.append('role', params.role);
    if (params.status) query.append('status', params.status);
    if (params.search) query.append('search', params.search);

    const queryString = query.toString();
    const endpoint = queryString ? `/users?${queryString}` : '/users';

    return apiClient(endpoint, {
      method: 'GET',
    });
  },

  /**
   * Fetch all registered staff members
   * @param {Object} [params]
   */
  getStaffUsers: async (params = {}) => {
    return userApi.getAllUsers({ ...params, role: 'STAFF' });
  },

  /**
   * Fetch all registered customers
   * @param {Object} [params]
   */
  getCustomerUsers: async (params = {}) => {
    return userApi.getAllUsers({ ...params, role: 'CUSTOMER' });
  },

  /**
   * Fetch single user details by ID
   * @param {string} userId
   */
  getUserById: async (userId) => {
    return apiClient(`/users/${userId}`, {
      method: 'GET',
    });
  },

  /**
   * Get current authenticated user profile
   */
  getProfile: async () => {
    return apiClient('/users/me', {
      method: 'GET',
    });
  },

  /**
   * Update user details (name, phone, password)
   * @param {string} userId
   * @param {Object} data
   */
  updateUser: async (userId, data) => {
    return apiClient(`/users/${userId}`, {
      method: 'PATCH',
      body: data,
    });
  },

  /**
   * Update current authenticated user profile
   * @param {Object} data
   */
  updateProfile: async (data) => {
    return apiClient('/users/me', {
      method: 'PATCH',
      body: data,
    });
  },

  /**
   * Toggle user active/inactive status (Admin only)
   * @param {string} userId
   * @param {boolean} isActive
   */
  toggleUserStatus: async (userId, isActive) => {
    return apiClient(`/users/${userId}/status`, {
      method: 'PATCH',
      body: { isActive },
    });
  },

  /**
   * Permanently delete user account
   * @param {string} userId
   */
  deleteUser: async (userId) => {
    return apiClient(`/users/${userId}`, {
      method: 'DELETE',
    });
  },
};

export default userApi;
