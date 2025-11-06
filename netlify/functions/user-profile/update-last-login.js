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

    // Update last login time
    const updatedProfile = await prisma.user.update({
      where: { neonUserId: neonUserId },
      data: { lastLoginAt: new Date() }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ userProfile: updatedProfile })
    };

  } catch (error) {
    console.error('Error updating last login:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  } finally {
    // Disconnect Prisma client in serverless environment
    await prisma.$disconnect();
  }
};
