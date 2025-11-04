import { useState, useEffect, useCallback } from 'react';
import { AuthState } from '../types';
import { authService, LoginCredentials, SignupCredentials } from '../services/authService';

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true
  });

  useEffect(() => {
    const checkAuth = () => {
      const user = authService.checkSession();
      setAuthState({
        isAuthenticated: !!user,
        user,
        loading: false
      });
    };

    checkAuth();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setAuthState(prev => ({ ...prev, loading: true }));
    
    try {
      const user = await authService.login(credentials);
      setAuthState({
        isAuthenticated: true,
        user,
        loading: false
      });
      return user;
    } catch (error) {
      setAuthState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  }, []);

  const signup = useCallback(async (credentials: SignupCredentials) => {
    setAuthState(prev => ({ ...prev, loading: true }));
    
    try {
      const user = await authService.signup(credentials);
      setAuthState({
        isAuthenticated: true,
        user,
        loading: false
      });
      return user;
    } catch (error) {
      setAuthState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setAuthState({
      isAuthenticated: false,
      user: null,
      loading: false
    });
  }, []);

  return {
    ...authState,
    login,
    signup,
    logout
  };
};
