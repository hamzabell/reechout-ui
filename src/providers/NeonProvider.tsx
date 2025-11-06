import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { User, AuthState, LoginCredentials, SignupCredentials } from "../types";
import {
  signUp,
  signIn,
  signOut,
  getCurrentUser,
  onAuthStateChange,
  resetPassword,
  updatePassword,
  resetPasswordWithToken,
  resendConfirmationEmail,
} from "../lib/neon";
import {
  createUserProfile,
  getUserProfile,
  updateLastLogin,
} from "../lib/prisma";

interface NeonContextType {
  authState: AuthState;
  login: (credentials: LoginCredentials) => Promise<User>;
  signup: (
    credentials: SignupCredentials,
  ) => Promise<{ user: any; needsConfirmation: boolean }>;
  logout: () => Promise<void>;
  resetPasswordRequest: (email: string) => Promise<void>;
  confirmPasswordReset: (newPassword: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  resendConfirmationEmail: (email: string) => Promise<void>;
}

const NeonContext = createContext<NeonContextType | undefined>(undefined);

export const useNeon = () => {
  const context = useContext(NeonContext);
  if (context === undefined) {
    throw new Error("useNeon must be used within a NeonProvider");
  }
  return context;
};

interface NeonProviderProps {
  children: ReactNode;
}

export const NeonProvider: React.FC<NeonProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
  });

  const mapNeonUserToAppUser = async (neonUser: any): Promise<User | null> => {
    if (!neonUser) {
      console.log("No neonUser provided to mapNeonUserToAppUser");
      return null;
    }

    try {
      console.log("Mapping neon user:", neonUser);

      // Try to get user profile from database
      let userProfile = await getUserProfile(neonUser.id);
      console.log("Retrieved user profile:", userProfile);

      // If user profile doesn't exist, create it
      if (!userProfile) {
        console.log("Creating new user profile");
        userProfile = await createUserProfile(neonUser);
        console.log("Created user profile:", userProfile);
      } else {
        // Update last login
        try {
          await updateLastLogin(neonUser.id);
        } catch (error) {
          console.warn("Failed to update last login:", error);
        }
      }

      // Double check that userProfile exists
      if (!userProfile) {
        throw new Error("Failed to create or retrieve user profile");
      }

      const mappedUser: User = {
        id: userProfile.id,
        neonId: neonUser.id,
        name: userProfile.name || neonUser.displayName || "",
        email: userProfile.email || neonUser.primaryEmail || "",
        company: userProfile.company || undefined,
        title: userProfile.title || undefined,
        isActive: userProfile.isActive,
        lastLoginAt: userProfile.lastLoginAt?.toISOString() || undefined,
        createdAt: userProfile.createdAt.toISOString(),
        emailConfirmed: neonUser.emailVerified || false,
      };

      console.log("Successfully mapped user:", mappedUser);
      return mappedUser;
    } catch (error: any) {
      console.error("Error mapping Neon user to app user:", error);

      // Return a minimal user object based on neonUser data if database operations fail
      return {
        id: neonUser.id,
        neonId: neonUser.id,
        name: neonUser.displayName || neonUser.name || "",
        email: neonUser.primaryEmail || neonUser.email || "",
        company: undefined,
        title: undefined,
        isActive: true,
        lastLoginAt: undefined,
        createdAt: new Date().toISOString(),
        emailConfirmed: neonUser.emailVerified || false,
      };
    }
  };

  const initializeAuth = useCallback(async () => {
    try {
      const neonUser = await getCurrentUser();
      console.log("Current user from getCurrentUser:", neonUser);

      if (neonUser) {
        const user = await mapNeonUserToAppUser(neonUser);
        setAuthState({
          isAuthenticated: !!user,
          user,
          loading: false,
        });
      } else {
        console.log("No current user found");
        setAuthState({
          isAuthenticated: false,
          user: null,
          loading: false,
        });
      }
    } catch (error: any) {
      console.error("Error initializing auth:", error);

      // Don't log Auth session missing errors as they're expected
      if (
        error?.message?.includes("Auth session missing") ||
        error?.name === "AuthSessionMissingError"
      ) {
        console.log("No active user session found");
      } else {
        console.error("Unexpected auth error:", error);
      }

      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
      });
    }
  }, []);

  const login = async (credentials: LoginCredentials): Promise<User> => {
    try {
      const result = await signIn(credentials.email, credentials.password);
      console.log("Login result:", result);

      const user = await mapNeonUserToAppUser(result.user);
      console.log("Mapped user after login:", user);

      setAuthState({
        isAuthenticated: !!user,
        user,
        loading: false,
      });

      return user!;
    } catch (error: any) {
      console.error("Login error in NeonProvider:", error);

      // Add more specific error handling for common issues
      if (error?.message?.includes("CLIENT_AUTHENTICATION_REQUIRED")) {
        throw new Error(
          "Authentication service is temporarily unavailable. Please try again in a moment.",
        );
      }

      if (error?.message?.includes("publishable client key must be provided")) {
        throw new Error(
          "Authentication configuration error. Please try again.",
        );
      }

      // For network errors, provide a more user-friendly message
      if (
        error?.message?.includes("Failed to fetch") ||
        error?.message?.includes("Network error")
      ) {
        throw new Error(
          "Network connection error. Please check your internet connection and try again.",
        );
      }

      throw error;
    }
  };

  const signup = async (
    credentials: SignupCredentials,
  ): Promise<{ user: any; needsConfirmation: boolean }> => {
    const originalAuthState = { ...authState };

    try {
      const result = await signUp(credentials.email, credentials.password, {
        data: {
          name: credentials.name,
          company: credentials.company,
          title: credentials.title,
        },
      });
      console.log("Signup result:", result);

      // Create user profile in database (this is handled in the signUp function now)
      if (result.user) {
        try {
          await createUserProfile(result.user);
        } catch (dbError: any) {
          console.error(
            "Database error during signup profile creation:",
            dbError,
          );
          // Don't fail signup if database operations fail
        }
      }

      return {
        user: result.user,
        needsConfirmation: !result.session, // If no session, email confirmation is needed
      };
    } catch (error: any) {
      console.error("Signup error in NeonProvider:", error);

      // Restore original auth state to prevent any temporary auth changes from affecting UI
      setAuthState(originalAuthState);

      // Add better error handling
      if (
        error?.message?.includes("database") ||
        error?.code?.startsWith("P")
      ) {
        throw new Error(
          "Account created but there was an issue setting up your profile. Please sign in to continue.",
        );
      }

      if (
        error?.message?.includes("Network") ||
        error?.message?.includes("fetch")
      ) {
        throw new Error(
          "Network connection error. Please check your internet connection and try again.",
        );
      }

      if (error?.message?.includes("already exists")) {
        throw error; // Pass through the error as-is
      }

      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut();
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
      });
    } catch (error: any) {
      console.error("Logout error:", error);
      // Always set logged out state even if error occurs
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
      });
    }
  };

  const resetPasswordRequest = async (email: string): Promise<void> => {
    await resetPassword(email);
  };

  const confirmPasswordReset = async (newPassword: string, token?: string): Promise<void> => {
    if (token) {
      // Handle password reset with token using Stack Auth
      try {
        console.log('Resetting password with token:', token);
        await resetPasswordWithToken(token, newPassword);
        console.log('Password reset successful');
      } catch (error: any) {
        console.error('Password reset with token failed:', error);
        throw error;
      }
    } else {
      // Handle password reset for authenticated user
      await updatePassword(newPassword);
    }
  };

  const refreshUser = async (): Promise<void> => {
    const neonUser = await getCurrentUser();
    if (neonUser && authState.user) {
      const user = await mapNeonUserToAppUser(neonUser);
      setAuthState((prev) => ({ ...prev, user }));
    }
  };

  const resendConfirmationEmailHandler = async (
    email: string,
  ): Promise<void> => {
    await resendConfirmationEmail(email);
  };

  useEffect(() => {
    initializeAuth();

    // Set up auth state listener - only for critical events
    const unsubscribe = onAuthStateChange(async (event, session) => {
      console.log("Auth state change event:", event, session);

      // Be more conservative about handling auth state changes to avoid interference
      if (event === "SIGNED_IN" && session?.user) {
        const user = await mapNeonUserToAppUser(session.user);
        setAuthState((prev) => ({
          ...prev,
          isAuthenticated: !!user,
          user,
          loading: false,
        }));
      } else if (event === "SIGNED_OUT") {
        // Only sign out if we're not currently on a public auth route to avoid redirect loops
        const currentPath = window.location.pathname;
        const publicAuthRoutes = ['/reset-password', '/forgot-password', '/confirm-email', '/signup-confirmation'];
        const isOnPublicAuthRoute = publicAuthRoutes.some(route => currentPath.startsWith(route));

        if (!isOnPublicAuthRoute) {
          setAuthState((prev) => ({
            ...prev,
            isAuthenticated: false,
            user: null,
            loading: false,
          }));
        } else {
          console.log("Ignoring SIGNED_OUT event on public auth route to prevent interference");
        }
      }
    });

    return () => {
      unsubscribe?.();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const value: NeonContextType = {
    authState,
    login,
    signup,
    logout,
    resetPasswordRequest,
    confirmPasswordReset,
    refreshUser,
    resendConfirmationEmail: resendConfirmationEmailHandler,
  };

  return <NeonContext.Provider value={value}>{children}</NeonContext.Provider>;
};
