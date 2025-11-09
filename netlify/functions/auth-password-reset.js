// Use global fetch (Node.js 18+) or import node-fetch for older versions
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { handleCors, addCorsHeaders } = require('./cors-helper');

exports.handler = async (event, context) => {
  // Handle CORS preflight request
  if (event.httpMethod === 'OPTIONS') {
    return handleCors();
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return addCorsHeaders({
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    });
  }

  try {
    const { token, password } = JSON.parse(event.body);

    if (!token || !password) {
      return addCorsHeaders({
        statusCode: 400,
        body: JSON.stringify({ error: 'Token and password are required' })
      });
    }

    console.log('Attempting password reset with Stack Auth token:', token.substring(0, 10) + '...');

    // Call Stack Auth password reset endpoint directly from server
    const stackAuthUrl = 'https://api.stack-auth.com/v1/password-reset';
    const projectId = process.env.REACT_APP_STACK_PROJECT_ID || process.env.NEXT_PUBLIC_STACK_PROJECT_ID;

    if (!projectId) {
      console.error('Stack Auth project ID is not set');
      return addCorsHeaders({
        statusCode: 500,
        body: JSON.stringify({ error: 'Server configuration error' })
      });
    }

    console.log('Calling Stack Auth API with:', {
      url: stackAuthUrl,
      projectId: projectId,
      token: token.substring(0, 10) + '...'
    });

    const fetchFn = await fetch;
    const response = await fetchFn(stackAuthUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Stack-Project-Id': projectId,
      },
      body: JSON.stringify({
        token: token,
        password: password,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Password reset error:', errorData);
      return addCorsHeaders({
        statusCode: response.status,
        body: JSON.stringify({ 
          error: errorData.message || 'Failed to reset password. The reset link may have expired.'
        })
      });
    }

    const result = await response.json();
    console.log('Password reset completed successfully');

    return addCorsHeaders({
      statusCode: 200,
      body: JSON.stringify({ success: true, result })
    });

  } catch (error) {
    console.error('Password reset with token error:', error);
    return addCorsHeaders({
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to reset password. The reset link may have expired.' })
    });
  }
};