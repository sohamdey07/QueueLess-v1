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
      const { accessToken, userId, name, email: respEmail, phone, isVerified, isActive, role } = response.data;
      if (accessToken) {
        tokenStorage.setAccessToken(accessToken);
      }
      tokenStorage.setUser({
        userId,
        name,
        email: respEmail || email.trim().toLowerCase(),
        phone: phone || '',
        isVerified: isVerified !== undefined ? Boolean(isVerified) : false,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
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

  /**
   * Request password reset OTP
   * Calls POST /api/v1/auth/forgot-password
   */
  forgotPassword: async (email) => {
    return apiClient('/auth/forgot-password', {
      method: 'POST',
      body: {
        email: email.trim().toLowerCase(),
      },
    });
  },

  /**
   * Verify password reset OTP
   * Calls POST /api/v1/auth/verify-reset-otp
   */
  verifyResetOtp: async ({ email, otp }) => {
    return apiClient('/auth/verify-reset-otp', {
      method: 'POST',
      body: {
        email: email.trim().toLowerCase(),
        otp,
      },
    });
  },

  /**
   * Verify password reset link token
   * Calls POST /api/v1/auth/verify-reset-link
   */
  verifyResetLink: async (token) => {
    return apiClient('/auth/verify-reset-link', {
      method: 'POST',
      body: {
        token,
      },
    });
  },

  /**
   * Complete password reset with reset authorization token
   * Calls POST /api/v1/auth/reset-password
   */
  resetPassword: async ({ resetToken, newPassword }) => {
    return apiClient('/auth/reset-password', {
      method: 'POST',
      body: {
        resetToken,
        newPassword,
      },
    });
  },
};

export default authApi;
