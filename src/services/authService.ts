// This service is now deprecated. Use the NeonProvider and useNeon hook instead.
// Keeping this file for backward compatibility during migration.

import { User, LoginCredentials, SignupCredentials } from '../types';

// Re-export types for backward compatibility
export type { User, LoginCredentials, SignupCredentials };

// Legacy AuthService - delegates to Neon Auth
class AuthService {
  // This service should not be used directly anymore
  // Use the useNeon hook instead
  async login(credentials: LoginCredentials): Promise<User> {
    throw new Error('AuthService.login is deprecated. Use useNeon hook instead.');
  }

  async signup(credentials: SignupCredentials): Promise<User> {
    throw new Error('AuthService.signup is deprecated. Use useNeon hook instead.');
  }

  async logout(): Promise<void> {
    throw new Error('AuthService.logout is deprecated. Use useNeon hook instead.');
  }

  async refreshToken(): Promise<User | null> {
    throw new Error('AuthService.refreshToken is deprecated. Use useNeon hook instead.');
  }

  checkSession(): User | null {
    throw new Error('AuthService.checkSession is deprecated. Use useNeon hook instead.');
  }

  isAuthenticated(): boolean {
    throw new Error('AuthService.isAuthenticated is deprecated. Use useNeon hook instead.');
  }

  getCurrentUser(): User | null {
    throw new Error('AuthService.getCurrentUser is deprecated. Use useNeon hook instead.');
  }

  async requestPasswordReset(email: string): Promise<void> {
    throw new Error('AuthService.requestPasswordReset is deprecated. Use useNeon hook instead.');
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    throw new Error('AuthService.resetPassword is deprecated. Use useNeon hook instead.');
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    throw new Error('AuthService.changePassword is deprecated. Use useNeon hook instead.');
  }
}

export const authService = new AuthService();

// Export a deprecation warning
export const DEPRECATION_WARNING = 'AuthService is deprecated. Please use the useNeon hook from providers/NeonProvider.tsx instead.';
