/**
 * Token and Auth Storage Manager for QueueLess
 * Handles access token, user profile, and session persistence in browser storage.
 */

const ACCESS_TOKEN_KEY = 'ql_access_token';
const USER_KEY = 'ql_user_data';
const USER_ROLE_KEY = 'userRole'; // kept for backward compatibility

export const tokenStorage = {
  getAccessToken: () => {
    try {
      return localStorage.getItem(ACCESS_TOKEN_KEY) || null;
    } catch {
      return null;
    }
  },

  setAccessToken: (token) => {
    try {
      if (token) {
        localStorage.setItem(ACCESS_TOKEN_KEY, token);
      } else {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
      }
    } catch (e) {
      console.error('Failed to store access token:', e);
    }
  },

  getUser: () => {
    try {
      const data = localStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setUser: (user) => {
    try {
      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        if (user.role) {
          localStorage.setItem(USER_ROLE_KEY, user.role.toUpperCase());
        }
      } else {
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(USER_ROLE_KEY);
      }
    } catch (e) {
      console.error('Failed to store user:', e);
    }
  },

  getDecodedToken: () => {
    try {
      const token = tokenStorage.getAccessToken();
      if (!token || typeof token !== 'string' || !token.includes('.')) return null;
      const payloadBase64 = token.split('.')[1];
      if (!payloadBase64) return null;
      const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(payloadJson);
    } catch {
      return null;
    }
  },

  isTokenExpired: (bufferSeconds = 30) => {
    try {
      const decoded = tokenStorage.getDecodedToken();
      if (!decoded || !decoded.exp) return false;
      const now = Math.floor(Date.now() / 1000);
      return now >= (decoded.exp - bufferSeconds);
    } catch {
      return false;
    }
  },

  getUserRole: () => {
    try {
      const user = tokenStorage.getUser();
      if (user?.role) return user.role.toUpperCase();
      const storedRole = localStorage.getItem(USER_ROLE_KEY);
      if (storedRole) return storedRole.toUpperCase();

      // Fallback: decode role directly from JWT accessToken if available
      const decoded = tokenStorage.getDecodedToken();
      if (decoded?.role) {
        return decoded.role.toUpperCase();
      }
      return null;
    } catch {
      return null;
    }
  },

  isAuthenticated: () => {
    const token = tokenStorage.getAccessToken();
    return Boolean(token && token.trim().length > 0);
  },

  clearAuth: () => {
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(USER_ROLE_KEY);
      localStorage.removeItem('currentUser');
    } catch (e) {
      console.error('Failed to clear auth:', e);
    }
  },
};

export default tokenStorage;
