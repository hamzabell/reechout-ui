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
    const { email, password, name, company, title } = JSON.parse(event.body);

    // Simple validation
    if (!email || !password || !name) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Email, password, and name are required' })
      };
    }

    // Mock user creation
    const mockUser = {
      id: 'mock-user-' + Date.now(),
      email: email.toLowerCase(),
      name: name.trim(),
      company: company?.trim() || null,
      title: title?.trim() || null,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    // Mock token
    const mockToken = 'mock-jwt-token-' + Date.now();

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Account created successfully (MOCK)',
        user: mockUser,
        token: mockToken,
        sessionToken: 'mock-session-token-' + Date.now(),
        expiresIn: '7d'
      })
    };

  } catch (error) {
    console.error('Mock registration error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Mock registration failed',
        details: error.message
      })
    };
  }
};