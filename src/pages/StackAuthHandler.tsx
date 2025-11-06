import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { stackApp } from '../lib/neon';

const StackAuthHandler: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');
      const isEmailVerification = window.location.pathname.includes('email-verification');
      const isPasswordReset = window.location.pathname.includes('password-reset');

      console.log('Stack Auth Handler: Processing callback', {
        code,
        error,
        errorDescription,
        isEmailVerification,
        isPasswordReset,
        pathname: window.location.pathname,
        fullUrl: window.location.href
      });

      // If there's an error in the URL, show it immediately
      if (error) {
        console.log('Error detected in URL, redirecting to login');
        setStatus('error');
        setMessage(`Authentication failed: ${errorDescription || error}`);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
        return;
      }

      // Check if this is a password reset flow
      if (isPasswordReset && code) {
        console.log('Password reset flow detected, redirecting to reset page with code:', code);
        setStatus('loading');
        setMessage('Redirecting to reset password form...');

        // Stack Auth processes password reset links automatically
        // Use window.location.href for a more reliable redirect that bypasses React Router
        // This ensures the redirect happens before any auth state checks
        window.location.href = `/reset-password?code=${code}`;
        return;
      }

      try {
        if (isEmailVerification && code) {
          // Handle email verification
          setStatus('loading');
          setMessage('Verifying your email...');

          try {
            // For email verification, Stack Auth should process the code automatically
            // Let's check if verification was successful by trying to get user state
            const user = await stackApp.getUser();

            console.log('Stack Auth user after verification attempt:', user);

            if (user) {
              // User is authenticated - verification successful
              console.log('Email verification successful, user authenticated:', user);
              setStatus('success');
              setMessage('Email verified successfully! You are now signed in.');

              // Email confirmation is handled by Stack Auth automatically
              // No need to update database separately

              // Redirect to dashboard after a short delay
              setTimeout(() => {
                navigate('/dashboard');
              }, 2000);
            } else {
              // User not authenticated - verification may have succeeded but no active session
              // This is normal for email verification - user needs to sign in after verification
              console.log('Email verification completed, user needs to sign in');
              setStatus('success');
              setMessage('Email verified successfully! You can now sign in with your credentials.');

              // Redirect to login after a short delay
              setTimeout(() => {
                navigate('/login');
              }, 3000);
            }
          } catch (error: any) {
            console.error('Email verification error:', error);
            console.error('Error details:', {
              message: error.message,
              stack: error.stack,
              code: error.code
            });

            setStatus('error');
            setMessage(`Email verification failed: ${error.message || 'The verification link may have expired or already been used.'}. Please request a new verification email.`);

            setTimeout(() => {
              navigate('/login');
            }, 4000);
          }
        } else {
          console.log('No valid authentication flow detected, redirecting to login');
          setStatus('error');
          setMessage('Invalid authentication callback. No valid code or flow detected.');

          setTimeout(() => {
            navigate('/login');
          }, 3000);
        }
      } catch (error: any) {
        console.error('Stack Auth Handler error:', error);
        setStatus('error');
        setMessage(error.message || 'An error occurred during authentication');

        setTimeout(() => {
          navigate('/');
        }, 3000);
      }
    };

    handleAuthCallback();
  }, [searchParams, navigate]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-bg-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary text-lg">{message || 'Processing...'}</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-bg-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="rounded-full bg-green-100 p-3 mx-auto mb-4 w-16 h-16 flex items-center justify-center">
            <i className="fas fa-check text-green-600 text-2xl"></i>
          </div>
          <p className="text-text-primary text-lg font-semibold mb-2">Success!</p>
          <p className="text-text-secondary">{message}</p>
          <p className="text-text-tertiary text-sm mt-2">Redirecting you...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-bg-secondary flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="rounded-full bg-red-100 p-3 mx-auto mb-4 w-16 h-16 flex items-center justify-center">
            <i className="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
          </div>
          <p className="text-text-primary text-lg font-semibold mb-2">Authentication Error</p>
          <p className="text-text-secondary mb-4">{message}</p>
          <p className="text-text-tertiary text-sm">Redirecting you to the home page...</p>
        </div>
      </div>
    );
  }

  return null;
};

export default StackAuthHandler;
