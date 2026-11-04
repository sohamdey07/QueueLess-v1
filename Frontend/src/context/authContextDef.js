import { createContext, useContext } from 'react';
import tokenStorage from '../services/storage/tokenStorage.js';
import authApi from '../services/api/auth.api.js';

export const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      isInitializing: false,
      isAuthenticated: tokenStorage.isAuthenticated(),
      user: tokenStorage.getUser(),
      userRole: tokenStorage.getUserRole(),
      logout: () => authApi.logout(),
    };
  }
  return context;
};

export default useAuth;

