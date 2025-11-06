import { useNeon } from '../providers/NeonProvider';
import { LoginCredentials, SignupCredentials } from '../types';

// This hook now delegates to Neon provider for backward compatibility
// Use useNeon directly for new code
export const useAuth = () => {
  const { authState, login, signup, logout } = useNeon();
  
  return {
    ...authState,
    login: async (credentials: LoginCredentials) => {
      return await login(credentials);
    },
    signup: async (credentials: SignupCredentials) => {
      const result = await signup(credentials);
      // For backward compatibility, if email confirmation is needed, throw an error
      if (result.needsConfirmation) {
        throw new Error('Please check your email to confirm your account.');
      }
      return result.user;
    },
    logout
  };
};
