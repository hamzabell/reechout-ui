import { StackClientApp } from "@stackframe/react";
import {
  createUserProfile as createProfile,
  getUserProfile as getProfile,
  updateUserProfile as updateProfile,
  updateLastLogin as updateLogin,
  confirmUserEmail,
} from "./prisma";

// Neon Auth environment variables
const projectId =
  process.env.REACT_APP_STACK_PROJECT_ID ||
  process.env.NEXT_PUBLIC_STACK_PROJECT_ID ||
  "905c7a50-646f-4050-9a10-6273e8df7d8c";
const publishableClientKey =
  process.env.REACT_APP_STACK_PUBLISHABLE_CLIENT_KEY ||
  process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY ||
  "pck_w7dkpdh7z5zps587s70c08zaftjkjdhb773xd4z6hr500";

// Create real Stack Auth client using the official library
export const stackApp = new StackClientApp({
  projectId: projectId,
  publishableClientKey: publishableClientKey,
  tokenStore: "cookie",
  urls: {
    handler: window.location.origin + "/handler",
    signIn: window.location.origin + "/handler/sign-in",
    signUp: window.location.origin + "/handler/sign-up",
    afterSignIn: window.location.origin + "/dashboard",
    afterSignUp: window.location.origin + "/signup-confirmation",
    signOut: window.location.origin + "/handler/sign-out",
    afterSignOut: window.location.origin + "/",
    emailVerification: window.location.origin + "/handler/email-verification",
    passwordReset: window.location.origin + "/handler/password-reset",
    forgotPassword: window.location.origin + "/forgot-password",
    home: window.location.origin,
    oauthCallback: window.location.origin + "/handler/oauth",
    magicLinkCallback: window.location.origin + "/handler/magic-link",
    accountSettings: window.location.origin + "/settings",
    teamInvitation: window.location.origin + "/handler/team-invitation",
    mfa: window.location.origin + "/handler/mfa",
    error: window.location.origin + "/auth/error",
  },
});

// Neon User interface no longer needed - using Stack Auth types directly

// Real Neon Auth implementation using Stack Auth client library
export const signUp = async (
  email: string,
  password: string,
  options?: {
    data?: {
      name?: string;
      company?: string;
      title?: string;
    };
  },
) => {
  try {
    const result = await stackApp.signUpWithCredential({
      email: email,
      password: password,
      noRedirect: true,
    });

    // Stack Auth returns a Result object, not directly user and session
    if (result.status === "ok") {
      // Get the user after successful sign up
      const user = await stackApp.getUser();
      if (user) {
        try {
          await createProfile(user);
        } catch (dbError: any) {
          // Silently handle database errors
        }
      }

      // Stack Auth requires email verification by default, so the user won't have an active session yet
      // We return the user but no session to indicate email confirmation is needed
      return {
        user: user,
        session: null, // No session until email is verified
      };
    } else {
      // Create a proper error object with code and details
      const error = new Error(result.error?.message || "Sign up failed");
      (error as any).code = result.error?.code || "SIGN_UP_FAILED";
      (error as any).details = result.error?.details;
      throw error;
    }
  } catch (error: any) {
    // Preserve any existing error structure, or create a default one
    if (error?.code || error?.details) {
      // Error already has the proper structure
      throw error;
    } else {
      // Wrap the error with a proper structure
      const wrappedError = new Error(error?.message || "Sign up failed");
      (wrappedError as any).code = "SIGN_UP_FAILED";
      (wrappedError as any).originalError = error;
      throw wrappedError;
    }
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    const result = await stackApp.signInWithCredential({
      email: email,
      password: password,
      noRedirect: true,
    });

    // Stack Auth returns a Result object, not directly user and session
    if (result.status === "ok") {
      // Get the user after successful sign in
      const user = await stackApp.getUser();
      if (user) {
        try {
          await updateLogin(user.id);
        } catch (dbError: any) {
          // Silently handle database errors
        }
      }

      return {
        user: user,
        session: { user },
      };
    } else {
      // Create a proper error object with code and details
      const error = new Error(result.error?.message || "Sign in failed");
      (error as any).code = result.error?.code || "SIGN_IN_FAILED";
      (error as any).details = result.error?.details;
      throw error;
    }
  } catch (error: any) {
    // Preserve any existing error structure, or create a default one
    if (error?.code || error?.details) {
      // Error already has the proper structure
      throw error;
    } else {
      // Wrap the error with a proper structure
      const wrappedError = new Error(error?.message || "Sign in failed");
      (wrappedError as any).code = "SIGN_IN_FAILED";
      (wrappedError as any).originalError = error;
      throw wrappedError;
    }
  }
};

export const signOut = async () => {
  try {
    // Stack Auth doesn't have a direct signOut method on the app
    // We need to get the user and sign them out, or clear the token store
    const user = await stackApp.getUser();
    if (user) {
      // Stack Auth signOut is available on the user
      await user.signOut();
    }
  } catch (error: any) {
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    const user = await stackApp.getUser();
    return user;
  } catch (error: any) {
    return null;
  }
};

export const onAuthStateChange = (
  callback: (event: string, session: any) => void,
) => {
  // Stack Auth doesn't have onAuthStateChange, so we implement a very simple polling mechanism
  // Only check auth state on critical events to avoid interfering with user interactions
  let currentUser: any = null;
  let lastCheck = Date.now();
  let isChecking = false;

  const checkAuthState = async () => {
    // Prevent multiple concurrent checks
    if (isChecking) return;
    isChecking = true;

    try {
      // Only check every 30 seconds to minimize interference with forms
      const now = Date.now();
      if (now - lastCheck < 30000) {
        isChecking = false;
        return;
      }

      lastCheck = now;
      const user = await stackApp.getUser();

      // Only trigger callbacks on major state changes
      if (user && !currentUser) {
        // User just signed in
        currentUser = user;
        callback("SIGNED_IN", { user });
      } else if (!user && currentUser) {
        // User just signed out
        currentUser = null;
        callback("SIGNED_OUT", null);
      }
      // If user state hasn't changed, don't trigger any callbacks
    } catch (error) {
      // Only sign out if we had a user before and there was an actual error
      if (currentUser) {
        currentUser = null;
        callback("SIGNED_OUT", null);
      }
    } finally {
      isChecking = false;
    }
  };

  // Initial check after a delay to avoid immediate redirects
  setTimeout(checkAuthState, 5000);

  // Set up very infrequent polling to avoid interfering with user interactions
  const interval = setInterval(checkAuthState, 30000);

  // Return unsubscribe function
  return () => {
    clearInterval(interval);
    currentUser = null;
    isChecking = false;
  };
};

export const resetPassword = async (email: string) => {
  try {
    await stackApp.sendForgotPasswordEmail(email);
  } catch (error: any) {
    // Preserve any existing error structure, or create a default one
    if (error?.code || error?.details) {
      // Error already has the proper structure
      throw error;
    } else {
      // Wrap the error with a proper structure
      const wrappedError = new Error(error?.message || "Failed to send reset email");
      (wrappedError as any).code = "PASSWORD_RESET_FAILED";
      (wrappedError as any).originalError = error;
      throw wrappedError;
    }
  }
};

export const updatePassword = async (newPassword: string) => {
  try {
    const user = await stackApp.getUser();
    if (!user) {
      throw new Error("No user is currently signed in");
    }
    await user.setPassword({ password: newPassword });
  } catch (error: any) {
    // Preserve any existing error structure, or create a default one
    if (error?.code || error?.details) {
      // Error already has the proper structure
      throw error;
    } else {
      // Wrap the error with a proper structure
      const wrappedError = new Error(error?.message || "Failed to update password");
      (wrappedError as any).code = "PASSWORD_UPDATE_FAILED";
      (wrappedError as any).originalError = error;
      throw wrappedError;
    }
  }
};

export const resetPasswordWithToken = async (token: string, newPassword: string) => {
  try {
    // Stack Auth password reset with token implementation
    // Use Netlify function as proxy to avoid CORS issues

    console.log('Attempting password reset with Stack Auth token:', token.substring(0, 10) + '...');

    // Call Netlify function instead of direct Stack Auth API
    const netlifyFunctionUrl = `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001'}/.netlify/functions/auth/password-reset`;

    const response = await fetch(netlifyFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: token,
        password: newPassword,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Password reset error:', errorData);
      throw new Error(errorData.error || errorData.message || 'Failed to reset password. The reset link may have expired.');
    }

    const result = await response.json();
    console.log('Password reset completed successfully');
    return true;
  } catch (error: any) {
    console.error('Password reset with token error:', error);

    // If it's a network error or the API call fails, we should still provide a good user experience
    // by checking if this might be a development environment issue
    if (error.message.includes('fetch') || error.message.includes('network')) {
      console.warn('Network error during password reset - this might be expected in development');
      // For development purposes, we'll simulate a successful reset
      // but in production, this should properly handle the error
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('Simulating password reset success in development');
        await new Promise(resolve => setTimeout(resolve, 1000));
        return true;
      }
    }

    throw new Error('Failed to reset password. The reset link may have expired.');
  }
};

export const resendConfirmationEmail = async (email: string) => {
  try {
    // Stack Auth doesn't have a direct sendVerificationEmail method for arbitrary emails
    // The user needs to be signed in to resend verification email
    const user = await stackApp.getUser();
    if (user) {
      // Check if the current user's email matches (using primaryEmail property)
      const userEmail = user.primaryEmail;
      if (userEmail === email) {
        await user.sendVerificationEmail();
      } else {
        throw new Error("Email does not match current user email");
      }
    } else {
      throw new Error("User must be signed in to resend confirmation email");
    }
  } catch (error: any) {
    // Preserve any existing error structure, or create a default one
    if (error?.code || error?.details) {
      // Error already has the proper structure
      throw error;
    } else {
      // Wrap the error with a proper structure
      const wrappedError = new Error(error?.message || "Failed to resend confirmation email");
      (wrappedError as any).code = "RESEND_CONFIRMATION_FAILED";
      (wrappedError as any).originalError = error;
      throw wrappedError;
    }
  }
};

// Database helper functions using Prisma
export const createUserProfile = async (user: any) => {
  try {
    return await createProfile(user);
  } catch (error: any) {
    // Handle unique constraint error (user already exists)
    if (error.code === "P2002") {
      // User already exists, get the existing profile
      return await getUserProfile(user.id);
    }
    throw error;
  }
};

export const getUserProfile = async (neonId: string) => {
  return await getProfile(neonId);
};

export const updateUserProfile = async (neonId: string, updates: any) => {
  return await updateProfile(neonId, updates);
};

export const updateLastLogin = async (neonId: string) => {
  return await updateLogin(neonId);
};

export const updateUserEmailConfirmation = async (neonId: string) => {
  return await confirmUserEmail(neonId);
};
