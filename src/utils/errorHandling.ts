/**
 * Authentication error handling utilities
 * Maps technical error messages to user-friendly messages
 */

export interface AuthError {
  message: string;
  type: "validation" | "authentication" | "network" | "server" | "general";
  field?: string;
}

/**
 * Maps authentication error messages to user-friendly messages
 */
export const mapAuthError = (error: any): AuthError => {
  const errorMessage = error?.message || "";
  const errorStatus = error?.status;
  const errorCode = error?.code;

  // Handle specific authentication error codes
  if (errorMessage.includes("Invalid login credentials")) {
    return {
      message:
        "Invalid email or password. Please check your credentials and try again.",
      type: "authentication",
      field: "general",
    };
  }

  if (errorMessage.includes("Email not confirmed")) {
    return {
      message:
        "Please confirm your email address before signing in. Check your inbox for the confirmation link.",
      type: "authentication",
      field: "general",
    };
  }

  // Handle specific error codes
  if (errorCode === "USER_EMAIL_ALREADY_EXISTS") {
    return {
      message:
        "An account with this email already exists. Please sign in or use a different email.",
      type: "authentication",
      field: "email",
    };
  }

  // Handle cases where error comes from our pre-check logic
  if (error?.details?.email && error?.message?.includes("already exists")) {
    return {
      message: error.message,
      type: "authentication",
      field: "email",
    };
  }

  if (
    errorMessage.includes("User already registered") ||
    (errorMessage.includes("A user with email") &&
      errorMessage.includes("already exists"))
  ) {
    return {
      message:
        "An account with this email already exists. Please sign in or use a different email.",
      type: "authentication",
      field: "email",
    };
  }

  if (errorMessage.includes("Password should be at least")) {
    return {
      message: "Password must be at least 6 characters long.",
      type: "validation",
      field: "password",
    };
  }

  if (errorMessage.includes("Weak password")) {
    return {
      message:
        "Password is too weak. Please include a mix of letters, numbers, and special characters.",
      type: "validation",
      field: "password",
    };
  }

  if (errorMessage.includes("Invalid email")) {
    return {
      message: "Please enter a valid email address.",
      type: "validation",
      field: "email",
    };
  }

  if (errorMessage.includes("signup_disabled")) {
    return {
      message:
        "Account registration is currently disabled. Please contact support.",
      type: "server",
    };
  }

  if (errorMessage.includes("Email rate limit exceeded")) {
    return {
      message:
        "Too many attempts. Please wait a few minutes before trying again.",
      type: "authentication",
    };
  }

  // Network-related errors
  if (
    errorStatus === 0 ||
    errorMessage.includes("Failed to fetch") ||
    errorMessage.includes("Network Error")
  ) {
    if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
      return {
        message:
          "Network connection error. Please check your internet connection and try again.",
        type: "network",
      };
    }

    // Handle API connectivity issues
    if (
      errorMessage.includes("Failed to fetch") ||
      errorMessage.includes("Network error")
    ) {
      return {
        message:
          "Unable to connect to our servers. Please check your internet connection and try again.",
        type: "network",
      };
    }
  }

  if (errorStatus === 429) {
    return {
      message: "Too many requests. Please wait a moment and try again.",
      type: "authentication",
    };
  }

  if (errorStatus === 500 || errorStatus === 502 || errorStatus === 503) {
    if (errorMessage.includes("Internal server error")) {
      return {
        message: "Server error. Please try again in a few minutes.",
        type: "server",
      };
    }
  }

  // Handle timeout or connectivity issues
  if (errorMessage.includes("timeout") || errorMessage.includes("connection")) {
    return {
      message:
        "Connection timeout. Please check your internet connection and try again.",
      type: "network",
    };
  }

  // Handle auth-specific errors
  if (errorMessage.includes("CLIENT_AUTHENTICATION_REQUIRED")) {
    return {
      message:
        "Authentication service is temporarily unavailable. Please try again in a moment.",
      type: "server",
    };
  }

  // Handle rate limiting
  if (
    errorMessage.includes("rate limit") ||
    errorMessage.includes("too many requests")
  ) {
    return {
      message:
        "Too many attempts. Please wait a few minutes before trying again.",
      type: "authentication",
    };
  }

  // Default fallback
  return {
    message:
      "An unexpected error occurred. Please try again or contact support if the issue persists.",
    type: "general",
  };
};

/**
 * Validates email format
 */
export const validateEmail = (
  email: string,
): { isValid: boolean; message?: string } => {
  if (!email || email.trim() === "") {
    return { isValid: false, message: "Email is required." };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { isValid: false, message: "Please enter a valid email address." };
  }

  return { isValid: true };
};

/**
 * Validates password strength
 */
export const validatePassword = (
  password: string,
): { isValid: boolean; message?: string } => {
  if (!password || password.length === 0) {
    return { isValid: false, message: "Password is required." };
  }

  if (password.length < 6) {
    return {
      isValid: false,
      message: "Password must be at least 6 characters long.",
    };
  }

  // Additional strength requirements (optional)
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const strengthScore = [
    hasUpperCase,
    hasLowerCase,
    hasNumbers,
    hasSpecialChar,
  ].filter(Boolean).length;

  if (strengthScore < 2) {
    return {
      isValid: false,
      message:
        "Password should include a mix of letters, numbers, and special characters for better security.",
    };
  }

  return { isValid: true };
};

/**
 * Validates name field
 */
export const validateName = (
  name: string,
): { isValid: boolean; message?: string } => {
  if (!name || name.trim() === "") {
    return { isValid: false, message: "Full name is required." };
  }

  if (name.trim().length < 2) {
    return {
      isValid: false,
      message: "Name must be at least 2 characters long.",
    };
  }

  return { isValid: true };
};

/**
 * Complete form validation for signup
 */
export const validateSignupForm = (formData: {
  name: string;
  email: string;
  password: string;
  company?: string;
  title?: string;
}): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  // Validate name
  const nameValidation = validateName(formData.name);
  if (!nameValidation.isValid && nameValidation.message) {
    errors.name = nameValidation.message;
  }

  // Validate email
  const emailValidation = validateEmail(formData.email);
  if (!emailValidation.isValid && emailValidation.message) {
    errors.email = emailValidation.message;
  }

  // Validate password
  const passwordValidation = validatePassword(formData.password);
  if (!passwordValidation.isValid && passwordValidation.message) {
    errors.password = passwordValidation.message;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Complete form validation for login
 */
export const validateLoginForm = (formData: {
  email: string;
  password: string;
}): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  // Validate email
  const emailValidation = validateEmail(formData.email);
  if (!emailValidation.isValid && emailValidation.message) {
    errors.email = emailValidation.message;
  }

  // Validate password (just check if it's not empty for login)
  if (!formData.password || formData.password.trim() === "") {
    errors.password = "Password is required.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
