import React, { useState } from "react";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";

interface PasswordResetFormData {
  email: string;
}

interface PasswordResetFormProps {
  onSubmit: (data: PasswordResetFormData) => Promise<void>;
  loading?: boolean;
  error?: string | null;
  onBackToLogin?: () => void;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const PasswordResetForm: React.FC<PasswordResetFormProps> = ({
  onSubmit,
  loading = false,
  error = null,
  onBackToLogin,
  onSuccess,
  onCancel,
}) => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [email, setEmail] = useState("");
  const [formData, setFormData] = useState<PasswordResetFormData>({
    email: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateEmail = (email: string): string | null => {
    if (!email || email.trim() === "") {
      return "Email is required";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return "Please enter a valid email address";
    }
    return null;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const errors: Record<string, string> = {};
    const emailError = validateEmail(formData.email);
    if (emailError) {
      errors.email = emailError;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      setEmail(formData.email);
      setFieldErrors({});
      await onSubmit(formData);
      setIsSubmitted(true);
      onSuccess?.();
    } catch (err: any) {
      // Handle validation errors from API
      if (err.details) {
        setFieldErrors(err.details);
      }
    }
  };

  const handleResetForm = () => {
    setIsSubmitted(false);
    setEmail("");
    setFormData({ email: "" });
    setFieldErrors({});
  };

  if (isSubmitted) {
    return (
      <div className="w-full max-w-md mx-auto text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 rounded-full p-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Check your email
        </h2>

        <p className="text-gray-600 mb-6">
          We've sent a password reset link to{" "}
          <span className="font-medium text-gray-900">{email}</span>
        </p>

        <p className="text-sm text-gray-500 mb-8">
          Didn't receive the email? Check your spam folder or{" "}
          <button
            onClick={handleResetForm}
            className="text-blue-600 hover:text-blue-500 font-medium"
            disabled={loading}
          >
            try again
          </button>
        </p>

        <button
          type="button"
          onClick={onCancel || onBackToLogin}
          className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200"
          disabled={loading}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              name="email"
              type="email"
              id="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                fieldErrors.email
                  ? "border-red-500 text-red-900 placeholder-red-300"
                  : "border-gray-300 text-gray-900 placeholder-gray-500"
              }`}
              placeholder="Enter your email"
              disabled={loading}
            />
          </div>
          {fieldErrors.email && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
        >
          {loading ? (
            <div className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Sending reset link...
            </div>
          ) : (
            "Send Reset Link"
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Remember your password?{" "}
          <button
            type="button"
            onClick={onBackToLogin}
            className="text-blue-600 hover:text-blue-500 font-medium"
            disabled={loading}
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
};

export default PasswordResetForm;
