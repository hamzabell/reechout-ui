import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "../components/auth/LoginForm";
import SignupForm from "../components/auth/SignupForm";
import PasswordResetForm from "../components/auth/PasswordResetForm";
import AuthLayout from "../components/layout/AuthLayout";
import { useNeon } from "../providers/NeonProvider";

const LoginPage: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { login, resetPasswordRequest, authState } = useNeon();

  const handleLoginSuccess = () => {
    navigate("/dashboard");
  };

  const handleSignupSuccess = () => {
    // For signup, we'll let the form handle the navigation
    // It will redirect to confirmation page if needed
    if (!showPasswordReset) {
      // If not showing password reset, navigate to confirmation or dashboard
      navigate("/signup-confirmation");
    }
  };

  const handlePasswordResetSuccess = () => {
    setShowPasswordReset(false);
    setError(null);
  };

  const handleModeToggle = () => {
    setIsSignUp(!isSignUp);
    setShowPasswordReset(false);
    setError(null);
  };

  const handlePasswordReset = () => {
    setShowPasswordReset(true);
    setError(null);
  };

  const handlePasswordResetCancel = () => {
    setShowPasswordReset(false);
    setError(null);
  };

  const handlePasswordResetSubmit = async (data: { email: string }) => {
    try {
      setError(null);
      await resetPasswordRequest(data.email);
      handlePasswordResetSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
    }
  };

  const handleLoginSubmit = async (data: {
    email: string;
    password: string;
  }) => {
    try {
      setError(null);
      await login(data);
      handleLoginSuccess();
    } catch (err: any) {
      console.error('Login error:', err);

      // Handle different types of authentication errors
      let errorMessage = "Invalid email or password";

      // Check for common Stack Auth error codes and messages
      if (err.code === 'INVALID_CREDENTIALS' || err.message?.includes('Invalid credentials') || err.message?.includes('Invalid email or password') || err.message?.includes('Wrong e-mail or password')) {
        errorMessage = "Invalid email or password. Please check your credentials and try again.";
      } else if (err.code === 'USER_NOT_FOUND' || err.message?.includes('User not found') || err.message?.includes('No user found')) {
        errorMessage = "No account found with this email address.";
      } else if (err.code === 'EMAIL_NOT_CONFIRMED' || err.message?.includes('email not confirmed') || err.message?.includes('Email verification required')) {
        errorMessage = "Please confirm your email address before signing in. Check your inbox for a confirmation email.";
      } else if (err.code === 'TOO_MANY_ATTEMPTS' || err.message?.includes('too many') || err.message?.includes('rate limit')) {
        errorMessage = "Too many login attempts. Please try again later.";
      } else if (err.code === 'SIGN_IN_FAILED') {
        // Generic sign in failure from our neon.ts wrapper
        errorMessage = err.message || "Sign in failed. Please try again.";
      } else if (err.message) {
        // Fallback to the error message if no specific code matches
        errorMessage = err.message;
      }

      // Set error directly and ensure it persists
      setError(errorMessage);
      throw errorMessage;
    }
  };

  // Clear error only when switching modes
  React.useEffect(() => {
    setError(null);
  }, [isSignUp, showPasswordReset]);

  return (
    <AuthLayout
      title={
        showPasswordReset
          ? "Reset Your Password"
          : isSignUp
            ? "Create Your Account"
            : "Welcome Back"
      }
      subtitle={
        showPasswordReset
          ? "Enter your email address and we'll send you a link to reset your password"
          : isSignUp
            ? "Start personalizing your cold emails with AI"
            : "Sign in to your account to continue"
      }
    >
      {showPasswordReset ? (
        <PasswordResetForm
          onSubmit={handlePasswordResetSubmit}
          onSuccess={handlePasswordResetSuccess}
          onCancel={handlePasswordResetCancel}
        />
      ) : isSignUp ? (
        <SignupForm
          onSuccess={handleSignupSuccess}
          onModeToggle={handleModeToggle}
        />
      ) : (
        <LoginForm
          onSubmit={handleLoginSubmit}
          onSuccess={handleLoginSuccess}
          onModeToggle={handleModeToggle}
          onPasswordReset={handlePasswordReset}
          loading={authState.loading}
          error={error}
          onError={() => setError(null)}
        />
      )}
    </AuthLayout>
  );
};

export default LoginPage;
