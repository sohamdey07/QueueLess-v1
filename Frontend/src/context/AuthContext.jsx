import React, { useState, useEffect } from 'react';
import tokenStorage from '../services/storage/tokenStorage.js';
import { refreshAccessToken } from '../services/api/apiClient.js';
import authApi from '../services/api/auth.api.js';
import { AuthContext } from './authContextDef.js';

export const AuthLoadingScreen = () => {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0F172A',
        color: '#F8FAFC',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div
        style={{
          width: '42px',
          height: '42px',
          border: '3px solid rgba(99, 102, 241, 0.2)',
          borderTopColor: '#6366F1',
          borderRadius: '50%',
          animation: 'ql-spin 0.8s linear infinite',
        }}
      />
      <p
        style={{
          marginTop: '16px',
          fontSize: '13px',
          fontWeight: 500,
          letterSpacing: '0.02em',
          color: '#94A3B8',
        }}
      >
        Securing session...
      </p>
      <style>{`
        @keyframes ql-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export const AuthProvider = ({ children }) => {
  const [isInitializing, setIsInitializing] = useState(() => {
    // If the browser holds a session indicator but in-memory token is not yet loaded,
    // initialize silently
    return tokenStorage.hasSession() && !tokenStorage.isAuthenticated();
  });

  const [authState, setAuthState] = useState(() => ({
    isAuthenticated: tokenStorage.isAuthenticated(),
    user: tokenStorage.getUser(),
    role: tokenStorage.getUserRole(),
  }));

  useEffect(() => {
    let isMounted = true;

    // Listen to tokenStorage changes (login, logout, token refresh, cross-tab events)
    const unsubscribe = tokenStorage.subscribe((state) => {
      if (isMounted) {
        setAuthState(state);
      }
    });

    async function initializeSession() {
      if (tokenStorage.hasSession() && !tokenStorage.isAuthenticated()) {
        try {
          await refreshAccessToken();
        } catch (err) {
          console.debug('[Auth] Silent session restoration completed without active session:', err.message);
        }
      }

      if (isMounted) {
        setIsInitializing(false);
      }
    }

    initializeSession();

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      tokenStorage.clearAuth();
    }
  };

  const value = {
    isInitializing,
    isAuthenticated: authState.isAuthenticated,
    user: authState.user,
    userRole: authState.role,
    logout,
  };

  if (isInitializing) {
    return <AuthLoadingScreen />;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
