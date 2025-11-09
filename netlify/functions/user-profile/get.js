const { PrismaClient } = require('@prisma/client');
const { createCorsResponse, createSuccessResponse, createErrorResponse } = require('../utils/cors');

// Initialize Prisma Client for serverless environment
const prisma = new PrismaClient();

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
    const { neonUserId } = JSON.parse(event.body);

    if (!neonUserId) {
      return createErrorResponse('neonUserId is required', 400);
    }

    // Get user profile from database
    const userProfile = await prisma.user.findUnique({
      where: { neonUserId: neonUserId }
    });

    if (!userProfile) {
      return createErrorResponse('User profile not found', 404);
    }

    return createSuccessResponse({ userProfile });

  } catch (error) {
    console.error('Error getting user profile:', error);
    return createErrorResponse('Internal server error', 500);
  } finally {
    // Disconnect Prisma client in serverless environment
    await prisma.$disconnect();
  }
};
