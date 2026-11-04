import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/authContextDef.js';

/**
 * Helper to determine target portal based on user role
 */
export const getDestinationForRole = (role) => {
  const normalized = (role || '').toUpperCase();
  if (normalized === 'ADMIN') return '/admin/dashboard';
  if (normalized === 'STAFF') return '/staff/dashboard';
  return '/home'; // CUSTOMER
};

/**
 * Route guard that requires user to have an active access token.
 * Optionally validates role privileges.
 */
export const ProtectedRoute = ({ children, allowedRoles }) => {
  const location = useLocation();
  const { isAuthenticated, userRole, isInitializing } = useAuth();

  // If silent refresh is still running, prevent premature redirection
  if (isInitializing) {
    return null;
  }

  // Without login, no user can go to any portal
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If specific roles are required, ensure user's role matches
  if (allowedRoles && allowedRoles.length > 0) {
    const hasRole = userRole && allowedRoles.map((r) => r.toUpperCase()).includes(userRole);
    if (!hasRole) {
      const targetDestination = userRole ? getDestinationForRole(userRole) : '/login';
      return <Navigate to={targetDestination} replace />;
    }
  }

  return children;
};

/**
 * Route guard for auth pages (login, register, onboarding).
 * If user is already authenticated with an access token, redirects them to their portal.
 */
export const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, userRole, isInitializing } = useAuth();

  if (isInitializing) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to={getDestinationForRole(userRole)} replace />;
  }

  return children;
};

export default ProtectedRoute;
