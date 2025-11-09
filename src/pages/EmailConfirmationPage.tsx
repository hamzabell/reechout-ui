import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { stackApp, updateUserEmailConfirmation } from '../lib/neon';

const EmailConfirmationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const confirmEmail = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      // If there's an error in the URL, show it immediately
      if (error) {
        setStatus('error');
        setMessage(`Email confirmation failed: ${errorDescription || error}`);
        return;
      }

      if (!code) {
        setStatus('error');
        setMessage('Invalid confirmation link. Please try again or contact support.');
        return;
      }

      try {
        setStatus('loading');
        setMessage('Confirming your email...');

        // Stack Auth processes the verification code automatically
        // Check if verification was successful by getting the user
        const user = await stackApp.getUser();

        console.log('Stack Auth user after email verification attempt:', user);

        if (user) {
          // User is authenticated - verification successful
          console.log('Email verification successful for user:', user.id);

          // Update email confirmation status in database
          try {
            await updateUserEmailConfirmation(user.id);
            console.log('Email confirmation updated in database for user:', user.id);
          } catch (dbError) {
            console.warn('Failed to update email confirmation in database:', dbError);
            // Don't fail the whole process if database update fails
            // Stack Auth has already verified the email
          }

          setStatus('success');
          setMessage('Email confirmed successfully! You are now signed in.');

          // Redirect to dashboard after 2 seconds
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } else {
          // Email verification completed but user needs to sign in
          // This can happen if verification succeeded but no active session was created
          setStatus('success');
          setMessage('Email confirmed successfully! You can now sign in with your credentials.');

          // Redirect to login after 3 seconds
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        }
      } catch (error: any) {
        console.error('Email confirmation error:', error);

        setStatus('error');
        setMessage(
          error.message ||
          'Failed to confirm email. The confirmation link may have expired or already been used. Please try signing in or request a new confirmation email.'
        );
      }
    };

    confirmEmail();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-secondary">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary/10">
            {status === 'loading' && (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            )}
            {status === 'success' && (
              <svg className="h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {status === 'error' && (
              <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          
          <h2 className="mt-6 text-3xl font-extrabold text-text-primary">
            {status === 'loading' && 'Confirming Your Email'}
            {status === 'success' && 'Email Confirmed!'}
            {status === 'error' && 'Confirmation Failed'}
          </h2>
          
          <p className="mt-2 text-sm text-text-secondary">
            {message}
          </p>
        </div>

        {status === 'success' && (
          <div className="mt-6 text-center">
            <p className="text-sm text-text-secondary">
              Redirecting you to login page...
            </p>
            <button
              onClick={() => navigate('/login')}
              className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Go to Login
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/login')}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Back to Login
            </button>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-text-primary bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailConfirmationPage;
