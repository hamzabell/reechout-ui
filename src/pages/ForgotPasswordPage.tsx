import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNeon } from '../providers/NeonProvider';
import AuthLayout from '../components/layout/AuthLayout';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const isLoading = status === 'loading';
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<{ email?: string }>({});
  const navigate = useNavigate();
  const { resetPasswordRequest } = useNeon();

  const validateEmail = (email: string): string | null => {
    if (!email || email.trim() === '') {
      return 'Email is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    const emailError = validateEmail(email);
    if (emailError) {
      setErrors({ email: emailError });
      return;
    }

    setMessage('');

    try {
      await resetPasswordRequest(email);
      setStatus('success');
      setMessage(`Password reset link sent to ${email}. Please check your email and click the link to reset your password.`);
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'Failed to send password reset email. Please try again.');
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);

    // Clear error when user starts typing
    if (errors.email) {
      setErrors({ email: undefined });
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  return (
    <AuthLayout
      title={isLoading ? "" : "Reset Your Password"}
      subtitle={isLoading ? "" : "Enter your email address and we'll send you a link to reset your password"}
    >
      <div className="w-full max-w-md mx-auto">
        {status === 'idle' && (
          <>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={handleEmailChange}
                    className="block w-full px-3 py-2 text-gray-900 placeholder-gray-400 border border-gray-300 appearance-none rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter your email"
                  />
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="relative flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent group rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <svg className="w-4 h-4 mr-2 -ml-1 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </div>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  Back to Login
                </button>
              </div>
            </form>
          </>
        )}

        {status === 'loading' && (
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 border-b-2 border-blue-600 rounded-full animate-spin"></div>
            <h2 className="mb-2 text-2xl font-semibold text-gray-900">
              Sending Reset Link...
            </h2>
            <p className="text-gray-600">
              Please wait while we send you a password reset link.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26L22 8m0 0l-7.89-4.26L3 8m0 0l7.89 4.26L22 8" />
              </svg>
            </div>
            <h2 className="mb-2 text-2xl font-semibold text-gray-900">
              Reset Link Sent!
            </h2>
            <p className="mb-6 text-gray-600">
              {message}
            </p>
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                Didn't receive the email? Check your spam folder or
              </p>
              <button
                onClick={() => setStatus('idle')}
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Try Again
              </button>
            </div>
            <div className="pt-6 mt-6 border-t border-gray-200">
              <button
                onClick={handleBackToLogin}
                className="text-sm font-medium text-gray-600 hover:text-gray-500"
              >
                Back to Login
              </button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="mb-2 text-2xl font-semibold text-gray-900">
              Failed to Send Reset Link
            </h2>
            <p className="mb-6 text-gray-600">
              {message}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => setStatus('idle')}
                className="flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Try Again
              </button>
              <button
                onClick={handleBackToLogin}
                className="flex justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back to Login
              </button>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
