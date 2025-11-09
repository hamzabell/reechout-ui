const fetch = require('node-fetch');
const { createCorsResponse, createSuccessResponse, createErrorResponse } = require('../utils/cors');

exports.handler = async (event, context) => {
  // Handle CORS preflight request
  if (event.httpMethod === 'OPTIONS') {
    return createCorsResponse();
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return createErrorResponse('Method not allowed', 405);
  }

  try {
    const { token, password } = JSON.parse(event.body);

    if (!token || !password) {
      return createErrorResponse('Token and password are required', 400);
    }

    console.log('Attempting password reset with Stack Auth token:', token.substring(0, 10) + '...');

    // Call Stack Auth password reset endpoint directly from server
    const stackAuthUrl = 'https://api.stack-auth.com/v1/password-reset';
    const secretKey = process.env.STACK_SECRET_SERVER_KEY;

    if (!secretKey) {
      console.error('STACK_SECRET_SERVER_KEY environment variable is not set');
      return createErrorResponse('Server configuration error', 500);
    }

    const response = await fetch(stackAuthUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${secretKey}`,
        'X-Stack-Project-Id': process.env.REACT_APP_STACK_PROJECT_ID || process.env.NEXT_PUBLIC_STACK_PROJECT_ID,
      },
      body: JSON.stringify({
        token: token,
        password: password,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Password reset error:', errorData);
      return createErrorResponse(
        errorData.message || 'Failed to reset password. The reset link may have expired.',
        response.status
      );
    }

    const result = await response.json();
    console.log('Password reset completed successfully');

    return createSuccessResponse({ success: true, result });

  } catch (error) {
    console.error('Password reset with token error:', error);
    return createErrorResponse('Failed to reset password. The reset link may have expired.', 500);
  }
};