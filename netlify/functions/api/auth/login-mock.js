exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { email, password } = JSON.parse(event.body);

    // Simple validation
    if (!email || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Email and password are required' })
      };
    }

    // Mock user login
    const mockUser = {
      id: 'mock-user-123',
      email: email.toLowerCase(),
      name: 'Mock User',
      company: 'Mock Company',
      title: 'Mock Title',
      isActive: true,
      lastLoginAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    // Mock token
    const mockToken = 'mock-jwt-token-' + Date.now();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Login successful (MOCK)',
        user: mockUser,
        token: mockToken,
        sessionToken: 'mock-session-token-' + Date.now(),
        expiresIn: '7d'
      })
    };

  } catch (error) {
    console.error('Mock login error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Mock login failed',
        details: error.message
      })
    };
  }
};