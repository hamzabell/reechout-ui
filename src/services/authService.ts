import { post, API_ENDPOINTS, authStorage, LoginResponse } from './apiService';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  name: string;
  company?: string;
  title?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  company?: string;
  title?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<User> {
    try {
      const response: LoginResponse = await post(API_ENDPOINTS.LOGIN, credentials);

      if (response.success && response.token) {
        // Store auth token and user data
        authStorage.setToken(response.token);
        authStorage.setUserData(response.user);

        return response.user;
      } else {
        throw new Error(response.error || response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async signup(credentials: SignupCredentials): Promise<User> {
    try {
      const response = await post(API_ENDPOINTS.SIGNUP, credentials);

      if (response.success && response.token) {
        // Store auth token and user data
        authStorage.setToken(response.token);
        authStorage.setUserData(response.user);

        return response.user;
      } else {
        throw new Error(response.error || 'Signup failed');
      }
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      // Call logout endpoint to invalidate session
      await post(API_ENDPOINTS.LOGOUT, {});
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local storage
      authStorage.removeToken();
    }
  }

  async refreshToken(): Promise<User | null> {
    try {
      const response = await post(API_ENDPOINTS.REFRESH_TOKEN, {});

      if (response.success && response.token) {
        authStorage.setToken(response.token);
        authStorage.setUserData(response.user);
        return response.user;
      }

      return null;
    } catch (error) {
      console.error('Token refresh error:', error);
      // If refresh fails, clear the invalid token
      authStorage.removeToken();
      return null;
    }
  }

  checkSession(): User | null {
    const token = authStorage.getToken();
    const userData = authStorage.getUserData();

    if (!token || !userData) {
      return null;
    }

    // You could add token expiration checking here
    // For now, just return the user data if token exists
    return userData;
  }

  isAuthenticated(): boolean {
    return !!authStorage.getToken() && !!authStorage.getUserData();
  }

  getCurrentUser(): User | null {
    return authStorage.getUserData();
  }

  // Password reset functionality
  async requestPasswordReset(email: string): Promise<void> {
    try {
      await post('/api/auth/request-password-reset', { email });
    } catch (error) {
      console.error('Password reset request error:', error);
      throw error;
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      await post('/api/auth/reset-password', { token, newPassword });
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  }

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await post('/api/auth/change-password', { currentPassword, newPassword });
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }
}

export const authService = new AuthService();
