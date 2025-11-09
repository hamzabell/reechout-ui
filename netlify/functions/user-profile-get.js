const { PrismaClient } = require('@prisma/client');
const { handleCors, addCorsHeaders } = require('./cors-helper');

// Initialize Prisma Client for serverless environment
const prisma = new PrismaClient();

exports.handler = async (event, context) => {
  // Handle CORS preflight requests
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
    const { neonUserId } = JSON.parse(event.body);

    if (!neonUserId) {
      return addCorsHeaders({
        statusCode: 400,
        body: JSON.stringify({ error: 'neonUserId is required' })
      });
    }

    // Get user profile from database
    const userProfile = await prisma.user.findUnique({
      where: { neonUserId: neonUserId }
    });

    if (!userProfile) {
      return addCorsHeaders({
        statusCode: 404,
        body: JSON.stringify({ error: 'User profile not found' })
      });
    }

    return addCorsHeaders({
      statusCode: 200,
      body: JSON.stringify({ userProfile })
    });

  } catch (error) {
    console.error('Error getting user profile:', error);
    return addCorsHeaders({
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    });
  } finally {
    // Disconnect Prisma client in serverless environment
    await prisma.$disconnect();
  }
};
