import tokenStorage from '../storage/tokenStorage.js';

// Base URL: Fallbacks to relative /api/v1 (vite proxy) or explicit backend URL
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

// Shared in-flight token refresh promise (prevents concurrent duplicate rotations)
let activeRefreshPromise = null;

/**
 * Checks if the endpoint is an auth flow endpoint where 401 should NOT trigger token rotation
 */
function isAuthEndpoint(endpoint) {
  const normalized = (endpoint || '').toLowerCase();
  return (
    normalized.includes('/auth/login') ||
    normalized.includes('/auth/register') ||
    normalized.includes('/auth/verify-account') ||
    normalized.includes('/auth/rotate-token') ||
    normalized.includes('/auth/logout')
  );
}

/**
 * Executes a token refresh request against backend POST /api/v1/auth/rotate-token.
 * Uses HTTP-only refreshToken cookie automatically.
 * Coalesces concurrent calls into a single in-flight promise.
 */
export async function refreshAccessToken() {
  if (activeRefreshPromise) {
    return activeRefreshPromise;
  }

  activeRefreshPromise = (async () => {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 8000) : null;

    try {
      const response = await fetch(`${BASE_URL}/auth/rotate-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // sends/receives httpOnly refreshToken cookie
        signal: controller ? controller.signal : undefined,
      });

      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok || !data?.data?.accessToken) {
        const errorMsg = data?.message || 'Session expired or refresh token invalid';
        const err = new Error(errorMsg);
        err.status = response.status || 401;
        throw err;
      }

      const { accessToken, userId, name, email, role } = data.data;
      tokenStorage.setAccessToken(accessToken);

      const existingUser = tokenStorage.getUser() || {};
      tokenStorage.setUser({
        ...existingUser,
        ...(userId ? { userId } : {}),
        ...(name ? { name } : {}),
        ...(email ? { email } : {}),
        ...(role ? { role: role.toUpperCase() } : {}),
      });

      return accessToken;
    } catch (error) {
      // If server explicitly rejected session (401 Unauthorized or 403 Forbidden)
      if (error.status === 401 || error.status === 403) {
        tokenStorage.clearAuth();

        // In browser environment, if currently on a protected route, redirect to login
        if (typeof window !== 'undefined') {
          const hash = window.location.hash || '';
          const isAuthPage =
            hash.includes('/login') ||
            hash.includes('/register') ||
            hash.includes('/onboarding') ||
            hash.includes('/verify-otp') ||
            hash.includes('/forgot-password') ||
            hash.includes('/reset-password') ||
            hash.includes('/tv-display');
          if (!isAuthPage) {
            window.location.hash = '#/login';
          }
        }
      } else {
        // Transient network or connection abort error
        tokenStorage.setAccessToken(null);
      }

      throw error;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      activeRefreshPromise = null;
    }
  })();

  return activeRefreshPromise;
}

export async function apiClient(endpoint, options = {}) {
  const {
    method = 'GET',
    body = null,
    headers = {},
    _retry = false,
    ...customConfig
  } = options;

  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${BASE_URL}${formattedEndpoint}`;

  // 1. Proactive Token Hydration on Reload:
  // If the user has an existing session hint but in-memory access token is null (e.g. page reload),
  // hydrate it via silent refresh before dispatching the request.
  if (
    !_retry &&
    !isAuthEndpoint(formattedEndpoint) &&
    !tokenStorage.getAccessToken() &&
    tokenStorage.hasSession()
  ) {
    try {
      await refreshAccessToken();
    } catch (e) {
      console.warn('Silent token hydration attempt failed:', e.message);
    }
  }

  // 2. Proactive Token Refresh on Expiry:
  // If the access token is expiring within 30 seconds, rotate it beforehand.
  if (
    !_retry &&
    !isAuthEndpoint(formattedEndpoint) &&
    tokenStorage.isAuthenticated() &&
    tokenStorage.isTokenExpired(30)
  ) {
    try {
      await refreshAccessToken();
    } catch (e) {
      console.warn('Proactive token refresh attempt failed, proceeding with request:', e.message);
    }
  }

  const defaultHeaders = {
    ...headers,
  };

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  if (!isFormData && !defaultHeaders['Content-Type']) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  // Attach in-memory access token if available
  const token = tokenStorage.getAccessToken();
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers: defaultHeaders,
    credentials: 'include', // sends/receives httpOnly cookies such as refreshToken
    ...customConfig,
  };

  if (body) {
    if (isFormData) {
      config.body = body;
    } else if (typeof body === 'object') {
      config.body = JSON.stringify(body);
    } else {
      config.body = body;
    }
  }

  try {
    const response = await fetch(url, config);

    // 3. Reactive Token Refresh:
    // If the server returns 401 Unauthorized, rotate token and retry original request once.
    if (
      response.status === 401 &&
      !_retry &&
      !isAuthEndpoint(formattedEndpoint) &&
      (tokenStorage.isAuthenticated() || tokenStorage.hasSession())
    ) {
      const newAccessToken = await refreshAccessToken();
      if (newAccessToken) {
        // Retry the original request with the fresh token
        return await apiClient(endpoint, {
          ...options,
          _retry: true,
          headers: {
            ...headers,
            Authorization: `Bearer ${newAccessToken}`,
          },
        });
      }
    }

    let responseData = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      const text = await response.text();
      responseData = { message: text };
    }

    if (!response.ok) {
      const errorMsg =
        responseData?.message ||
        responseData?.error ||
        (Array.isArray(responseData?.errors) && responseData.errors[0]?.message) ||
        `Request failed with status ${response.status}`;

      const error = new Error(errorMsg);
      error.status = response.status;
      error.data = responseData;
      throw error;
    }

    return responseData;
  } catch (error) {
    if (!error.status) {
      // Network failure or CORS issue connecting to server
      const networkError = new Error(
        'Unable to connect to server. Please check your backend connection.'
      );
      networkError.status = 0;
      throw networkError;
    }
    throw error;
  }
}

export default apiClient;
