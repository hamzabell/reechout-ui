const { PrismaClient } = require('@prisma/client');

// Initialize Prisma Client for serverless environment
const prisma = new PrismaClient();

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { neonUserId } = JSON.parse(event.body);

    if (!neonUserId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'neonUserId is required' })
      };
    }

    // Get user profile from database
    const userProfile = await prisma.user.findUnique({
      where: { neonUserId: neonUserId }
    });

    if (!userProfile) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'User profile not found' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ userProfile })
    };

  } catch (error) {
    console.error('Error getting user profile:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  } finally {
    // Disconnect Prisma client in serverless environment
    await prisma.$disconnect();
  }
};
