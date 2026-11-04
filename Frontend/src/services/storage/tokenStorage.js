/**
 * Token and Auth Storage Manager for QueueLess
 * 
 * SECURITY ARCHITECTURE (Zero-Persistence Access Token):
 * - Access tokens are stored STRICTLY IN-MEMORY to prevent client-side XSS token exfiltration.
 * - Under no circumstances is the JWT access token written to localStorage, sessionStorage, or document.cookie.
 * - The refresh token is kept in an httpOnly cookie managed entirely by the browser/server.
 * - A non-secret boolean marker ('ql_has_session') is persisted to indicate that an active session cookie exists,
 *   allowing the application to seamlessly restore the in-memory access token on page reload without user friction.
 */

const HAS_SESSION_KEY = 'ql_has_session';
const USER_KEY = 'ql_user_data';
const USER_ROLE_KEY = 'userRole'; // kept for backward compatibility
const LEGACY_TOKEN_KEY = 'ql_access_token';

// In-memory access token variable (isolated inside module closure)
let inMemoryAccessToken = null;

// Subscribers list for reactive state updates
const subscribers = new Set();

const notifySubscribers = () => {
  subscribers.forEach((cb) => {
    try {
      cb({
        isAuthenticated: Boolean(inMemoryAccessToken && inMemoryAccessToken.trim().length > 0),
        user: tokenStorage.getUser(),
        role: tokenStorage.getUserRole(),
      });
    } catch (err) {
      console.error('Error in auth subscriber:', err);
    }
  });
};

// Immediate cleanup of legacy plaintext tokens from localStorage
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    localStorage.removeItem(LEGACY_TOKEN_KEY);
  } catch {
    // Ignore storage restriction errors
  }
}

// Cross-tab synchronization via BroadcastChannel
let authChannel = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    authChannel = new BroadcastChannel('ql_auth_channel');
    authChannel.onmessage = (event) => {
      const data = event?.data;
      if (!data) return;

      if (data.type === 'TOKEN_UPDATED') {
        inMemoryAccessToken = data.accessToken || null;
        notifySubscribers();
      } else if (data.type === 'LOGOUT') {
        inMemoryAccessToken = null;
        notifySubscribers();
      }
    };
  } catch {
    authChannel = null;
  }
}

// Cross-tab storage listener to sync logout / session revocation
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === HAS_SESSION_KEY && !event.newValue) {
      inMemoryAccessToken = null;
      notifySubscribers();
    } else if (event.key === USER_KEY && !event.newValue) {
      inMemoryAccessToken = null;
      notifySubscribers();
    }
  });
}

export const tokenStorage = {
  /**
   * Returns current access token from memory
   */
  getAccessToken: () => inMemoryAccessToken,

  /**
   * Sets access token in memory and marks session as active
   * NEVER writes the token itself to localStorage
   */
  setAccessToken: (token) => {
    inMemoryAccessToken = token || null;

    try {
      // Purge any legacy token just in case
      localStorage.removeItem(LEGACY_TOKEN_KEY);

      if (token) {
        localStorage.setItem(HAS_SESSION_KEY, 'true');
      }
    } catch (e) {
      console.error('Failed to update session flag:', e);
    }

    if (authChannel && token) {
      try {
        authChannel.postMessage({ type: 'TOKEN_UPDATED', accessToken: token });
      } catch {
        // Broadcast failed, ignore
      }
    }

    notifySubscribers();
  },

  /**
   * Check if an active session cookie should exist on the server
   * Allows the frontend to perform silent refresh on page reload
   */
  hasSession: () => {
    try {
      return (
        localStorage.getItem(HAS_SESSION_KEY) === 'true' ||
        Boolean(localStorage.getItem(USER_KEY))
      );
    } catch {
      return false;
    }
  },

  /**
   * Read stored user profile from localStorage
   */
  getUser: () => {
    try {
      const data = localStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  /**
   * Persist user profile and role metadata
   */
  setUser: (user) => {
    try {
      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        if (user.role) {
          localStorage.setItem(USER_ROLE_KEY, user.role.toUpperCase());
        }
        localStorage.setItem(HAS_SESSION_KEY, 'true');
      } else {
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(USER_ROLE_KEY);
      }
    } catch (e) {
      console.error('Failed to store user profile:', e);
    }
    notifySubscribers();
  },

  /**
   * Decode payload from current in-memory access token
   */
  getDecodedToken: () => {
    try {
      const token = inMemoryAccessToken;
      if (!token || typeof token !== 'string' || !token.includes('.')) return null;
      const payloadBase64 = token.split('.')[1];
      if (!payloadBase64) return null;
      const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(payloadJson);
    } catch {
      return null;
    }
  },

  /**
   * Check if the in-memory access token is expired or about to expire
   */
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

  /**
   * Resolve user role from profile, stored role, or in-memory JWT payload
   */
  getUserRole: () => {
    try {
      const user = tokenStorage.getUser();
      if (user?.role) return user.role.toUpperCase();
      const storedRole = localStorage.getItem(USER_ROLE_KEY);
      if (storedRole) return storedRole.toUpperCase();

      const decoded = tokenStorage.getDecodedToken();
      if (decoded?.role) {
        return decoded.role.toUpperCase();
      }
      return null;
    } catch {
      return null;
    }
  },

  /**
   * Check whether the user currently holds an active, valid in-memory access token
   */
  isAuthenticated: () => {
    return Boolean(inMemoryAccessToken && inMemoryAccessToken.trim().length > 0);
  },

  /**
   * Clear all in-memory credentials and non-sensitive session metadata
   */
  clearAuth: () => {
    inMemoryAccessToken = null;
    try {
      localStorage.removeItem(LEGACY_TOKEN_KEY);
      localStorage.removeItem(HAS_SESSION_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(USER_ROLE_KEY);
      localStorage.removeItem('currentUser');
    } catch (e) {
      console.error('Failed to clear auth storage:', e);
    }

    if (authChannel) {
      try {
        authChannel.postMessage({ type: 'LOGOUT' });
      } catch {
        // Broadcast failed, ignore
      }
    }

    notifySubscribers();
  },

  /**
   * Subscribe to auth changes
   * @param {Function} callback
   * @returns {Function} unsubscribe
   */
  subscribe: (callback) => {
    if (typeof callback === 'function') {
      subscribers.add(callback);
      return () => subscribers.delete(callback);
    }
    return () => {};
  },
};

export default tokenStorage;
