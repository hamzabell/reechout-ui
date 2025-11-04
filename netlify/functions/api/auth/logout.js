const { getPrismaClient } = require('../../../../lib/prisma');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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

  let prisma;
  try {
    const token = event.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No session token provided' })
      };
    }

    prisma = getPrismaClient();

    // Deactivate the session
    const session = await prisma.session.findUnique({
      where: { token }
    });

    if (session) {
      await prisma.session.update({
        where: { token },
        data: { isActive: false }
      });
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Logged out successfully'
      })
    };

  } catch (error) {
    console.error('Logout error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Logout failed',
        details: error.message
      })
    };
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
};