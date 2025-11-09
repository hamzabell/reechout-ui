const { PrismaClient } = require('@prisma/client');
const { createCorsResponse, createSuccessResponse, createErrorResponse } = require('./utils/cors');

// Initialize Prisma Client for serverless environment
const prisma = new PrismaClient();

exports.handler = async (event, context) => {
  // Handle CORS preflight request
  if (event.httpMethod === 'OPTIONS') {
    return createCorsResponse(event);
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return createErrorResponse('Method not allowed', 405);
  }

  try {
    const { userId, limit = 10 } = JSON.parse(event.body);

    if (!userId) {
      return createErrorResponse('User ID is required', 400);
    }

    console.log('Fetching recent prospects for userId:', userId);

    // Parse limit as integer
    const parsedLimit = parseInt(limit, 10);

    // Get recent prospects for the user
    const prospects = await prisma.prospect.findMany({
      where: {
        createdBy: userId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: parsedLimit,
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        title: true,
        status: true,
        createdAt: true,
        source: true,
        tags: true
      }
    });

    console.log('Found prospects:', prospects.length);

    // Transform prospects to match frontend expectations
    const transformedProspects = prospects.map(prospect => ({
      id: prospect.id,
      name: prospect.name || 'Unknown',
      email: prospect.email,
      company: prospect.company,
      title: prospect.title,
      status: prospect.status,
      createdAt: prospect.createdAt.toISOString(),
      source: prospect.source,
      tags: prospect.tags || []
    }));

    console.log('Transformed prospects:', transformedProspects.length);

    return createSuccessResponse({
      prospects: transformedProspects,
      total: transformedProspects.length
    });

  } catch (error) {
    console.error('Error fetching recent prospects:', error);
    return createErrorResponse('Internal server error', 500);
  } finally {
    // Disconnect Prisma client in serverless environment
    await prisma.$disconnect();
  }
};
