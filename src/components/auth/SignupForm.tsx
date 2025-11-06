import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNeon } from "../../providers/NeonProvider";
import { useToast } from "../../hooks/useToast";
import Button from "../Button";

interface SignupFormProps {
  onSuccess?: () => void;
  onModeToggle?: () => void;
}

const SignupForm: React.FC<SignupFormProps> = ({ onSuccess, onModeToggle }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    company: "",
    title: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string>("");
  const [passwordStrength, setPasswordStrength] = useState<
    "weak" | "medium" | "strong" | null
  >(null);

  const { signup } = useNeon();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Check password strength as user types
  useEffect(() => {
    if (formData.password) {
      // Determine strength based on password characteristics
      const hasUpperCase = /[A-Z]/.test(formData.password);
      const hasLowerCase = /[a-z]/.test(formData.password);
      const hasNumbers = /\d/.test(formData.password);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(formData.password);
      const isLong = formData.password.length >= 8;

      const score = [
        hasUpperCase,
        hasLowerCase,
        hasNumbers,
        hasSpecialChar,
        isLong,
      ].filter(Boolean).length;

      if (score >= 4) {
        setPasswordStrength("strong");
      } else if (score >= 3) {
        setPasswordStrength("medium");
      } else {
        setPasswordStrength("weak");
      }
    } else {
      setPasswordStrength(null);
    }
  }, [formData.password]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Clear general error when user starts typing in any field
    if (generalError) {
      setGeneralError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFormErrors({});
    // Clear general error when submitting
    setGeneralError("");

    try {
      // Client-side validation first
      const errors: Record<string, string> = {};

      if (!formData.name || formData.name.trim().length < 2) {
        errors.name = "Name must be at least 2 characters long.";
      }

      if (
        !formData.email ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())
      ) {
        errors.email = "Please enter a valid email address.";
      }

      if (!formData.password || formData.password.length < 6) {
        errors.password = "Password must be at least 6 characters long.";
      }

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        // Show the first error as a toast for better UX
        const firstError = Object.values(errors)[0];
        showToast(firstError as string, "error");
        setIsLoading(false);
        return;
      }

      // Proceed with authentication
      const result = await signup({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        company: formData.company || undefined,
        title: formData.title || undefined,
      });

      // Clear the form after successful signup
      setFormData({
        name: "",
        email: "",
        password: "",
        company: "",
        title: "",
      });

      if (result.needsConfirmation) {
        showToast(
          "Account created! Please check your email to confirm your account.",
          "success",
        );
        // Navigate to signup confirmation page with email
        navigate("/signup-confirmation", { state: { email: formData.email } });
      } else {
        showToast("Account created successfully!", "success");
        navigate("/dashboard");
      }

      // Call success callback
      onSuccess?.();
    } catch (error: any) {
      console.error("Signup form error:", error);

      // Inline error mapping
      const errorMessage = error?.message || "";
      let userMessage = "An unexpected error occurred. Please try again.";
      let errorField: string | undefined;

      if (errorMessage.includes("already exists")) {
        userMessage = "An account with this email already exists.";
        errorField = "email";
      } else if (errorMessage.includes("Invalid email")) {
        userMessage = "Please enter a valid email address.";
        errorField = "email";
      } else if (errorMessage.includes("Password should be at least")) {
        userMessage = "Password must be at least 6 characters long.";
        errorField = "password";
      } else if (errorMessage.includes("Weak password")) {
        userMessage =
          "Password is too weak. Please include a mix of letters, numbers, and special characters.";
        errorField = "password";
      } else if (
        errorMessage.includes("Failed to fetch") ||
        errorMessage.includes("Network")
      ) {
        userMessage =
          "Network connection error. Please check your internet connection and try again.";
      }

      showToast(userMessage, "error");

      // Set field-specific error if applicable
      if (errorField) {
        setFormErrors({
          [errorField]: userMessage,
        });
      } else {
        // Show general error if not field-specific
        setGeneralError(userMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case "weak":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "strong":
        return "bg-green-500";
      default:
        return "bg-gray-200";
    }
  };

  const getPasswordStrengthText = () => {
    switch (passwordStrength) {
      case "weak":
        return "Weak password";
      case "medium":
        return "Medium strength";
      case "strong":
        return "Strong password";
      default:
        return "";
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-slate-700 mb-2"
          >
            Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            placeholder="Enter your name"
            className={`w-full px-4 py-2.5 bg-white border rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
              formErrors.name
                ? "border-red-500 focus:ring-red-500/20"
                : "border-slate-300"
            }`}
          />
          {formErrors.name && (
            <p className="mt-2 text-sm text-red-600">{formErrors.name}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-700 mb-2"
          >
            Email *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            placeholder="Enter your email"
            className={`w-full px-4 py-2.5 bg-white border rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
              formErrors.email
                ? "border-red-500 focus:ring-red-500/20"
                : "border-slate-300"
            }`}
          />
          {formErrors.email && (
            <p className="mt-2 text-sm text-red-600">{formErrors.email}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-slate-700 mb-2"
          >
            Password *
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            required
            placeholder="Create a password"
            className={`w-full px-4 py-2.5 bg-white border rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
              formErrors.password
                ? "border-red-500 focus:ring-red-500/20"
                : "border-slate-300"
            }`}
          />

          {/* Password Strength Indicator */}
          {formData.password && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-600">
                  Password strength:
                </span>
                <span
                  className={`text-xs font-medium ${
                    passwordStrength === "weak"
                      ? "text-red-600"
                      : passwordStrength === "medium"
                        ? "text-yellow-600"
                        : passwordStrength === "strong"
                          ? "text-green-600"
                          : ""
                  }`}
                >
                  {getPasswordStrengthText()}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div
                  className={`h-1 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                  style={{
                    width:
                      passwordStrength === "weak"
                        ? "33%"
                        : passwordStrength === "medium"
                          ? "66%"
                          : passwordStrength === "strong"
                            ? "100%"
                            : "0%",
                  }}
                ></div>
              </div>
            </div>
          )}

          {formErrors.password && (
            <p className="mt-2 text-sm text-red-600">{formErrors.password}</p>
          )}
        </div>

        {/* General Error Display */}
        {generalError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center">
              <i className="fas fa-exclamation-circle text-red-500 mr-2"></i>
              <p className="text-sm text-red-700">{generalError}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="company"
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              Company
            </label>
            <input
              type="text"
              id="company"
              name="company"
              value={formData.company}
              onChange={handleInputChange}
              placeholder="Company name"
              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              Job Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Job title"
              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <Button
          type="submit"
          loading={isLoading}
          disabled={isLoading}
          className="w-full py-3 text-base font-medium"
          icon={<i className="fas fa-user-plus" />}
        >
          {isLoading ? "Creating Account..." : "Create Account"}
        </Button>
      </form>

      <div className="mt-4 text-center">
        <button
          onClick={onModeToggle}
          className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
        >
          Already have an account? Sign in
        </button>
      </div>
    </div>
  );
};

export default SignupForm;
