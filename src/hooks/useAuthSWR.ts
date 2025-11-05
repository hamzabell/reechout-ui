import useSWR from 'swr';
import { AuthState, LoginCredentials, SignupCredentials } from '../types';
import { authService } from '../services/authService';
import { staticConfig } from '../lib/swr-config';
import { useSWRMutation } from './useSWRMutation';

// Hook for authentication state
export const useAuth = () => {
  // Fetch current user session
  const { data: user, error, isLoading, mutate: authMutate } = useSWR(
    'auth-session',
    () => {
      try {
        return authService.checkSession();
      } catch (error) {
        return null;
      }
    },
    {
      ...staticConfig,
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  const isAuthenticated = !!user && !error;
  const authState: AuthState = {
    isAuthenticated,
    user: user || null,
    loading: isLoading,
  };

  return {
    ...authState,
    error,
    mutate: authMutate,
  };
};

// Hook for login mutation
export const useLogin = () => {
  const { mutate: authMutate } = useAuth();

  return useSWRMutation(
    '/api/auth/login',
    'POST',
    {
      onSuccess: (data) => {
        // Update auth session after successful login
        authMutate();
        // Store token
        if (data.token) {
          localStorage.setItem('auth_token', data.token);
        }
      },
      invalidateQueries: ['auth-session'],
    }
  );
};

// Hook for signup mutation
export const useSignup = () => {
  const { mutate: authMutate } = useAuth();

  return useSWRMutation(
    '/api/auth/register',
    'POST',
    {
      onSuccess: (data) => {
        // Update auth session after successful signup
        authMutate();
        // Store token
        if (data.token) {
          localStorage.setItem('auth_token', data.token);
        }
      },
      invalidateQueries: ['auth-session'],
    }
  );
};

// Hook for logout mutation
export const useLogout = () => {
  const { mutate: authMutate } = useAuth();

  return useSWRMutation(
    '/api/auth/logout',
    'POST',
    {
      onSuccess: () => {
        // Clear auth session
        authMutate(null, false);
        // Clear stored tokens
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        // Redirect to home route
        window.location.href = '/';
      },
      invalidateQueries: ['auth-session'],
    }
  );
};

// Combined auth hook with all auth operations
export const useAuthOperations = () => {
  const auth = useAuth();
  const { trigger: login, isMutating: isLoggingIn } = useLogin();
  const { trigger: signup, isMutating: isSigningUp } = useSignup();
  const { trigger: logout, isMutating: isLoggingOut } = useLogout();

  const handleLogin = async (credentials: LoginCredentials) => {
    try {
      await login(credentials);
    } catch (error) {
      throw error;
    }
  };

  const handleSignup = async (credentials: SignupCredentials) => {
    try {
      await signup(credentials);
    } catch (error) {
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      await logout({});
    } catch (error) {
      // Even if logout API fails, clear local state
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      auth.mutate(null, false);
      window.location.href = '/';
    }
  };

  return {
    ...auth,
    login: handleLogin,
    signup: handleSignup,
    logout: handleLogout,
    isLoggingIn,
    isSigningUp,
    isLoggingOut,
  };
};