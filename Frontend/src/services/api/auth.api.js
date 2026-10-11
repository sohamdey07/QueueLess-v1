import apiClient, { refreshAccessToken } from './apiClient.js';
import tokenStorage from '../storage/tokenStorage.js';

export const authApi = {
  /**
   * Log in user with email and password
   * Connects directly to backend POST /api/v1/auth/login
   */
  login: async ({ email, password }) => {
    const response = await apiClient('/auth/login', {
      method: 'POST',
      body: {
        email: email.trim().toLowerCase(),
        password,
      },
    });

    // If login is successful, store accessToken and user profile in storage
    if (response?.success && response?.data) {
      const { accessToken, userId, name, role } = response.data;
      if (accessToken) {
        tokenStorage.setAccessToken(accessToken);
      }
      tokenStorage.setUser({
        userId,
        name,
        email: email.trim().toLowerCase(),
        role,
      });
    }

    return response;
  },

  /**
   * Logout user and invalidate session
   */
  logout: async () => {
    try {
      await apiClient('/auth/logout', {
        method: 'POST',
      });
    } finally {
      tokenStorage.clearAuth();
    }
  },

  /**
   * Refresh/rotate access token
   */
  rotateToken: async () => {
    return refreshAccessToken();
  },
};

export default authApi;
