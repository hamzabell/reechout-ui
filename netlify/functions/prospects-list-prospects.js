const { PrismaClient } = require('@prisma/client');
const { createCorsResponse, createSuccessResponse, createErrorResponse } = require('./utils/cors');

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
    const { userId, ...filters } = JSON.parse(event.body);

    if (!userId) {
      return createErrorResponse('User ID is required', 400);
    }

    // Parse filters for filtering and search
    const {
      search,
      status,
      company,
      industry,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      limit = 50,
      offset = 0
    } = filters || {};

    // Build where clause
    const where = {
      createdBy: userId,
      ...(status && { status: status }),
      ...(company && {
        company: {
          contains: company,
          mode: 'insensitive'
        }
      }),
      ...(industry && {
        industry: {
          contains: industry,
          mode: 'insensitive'
        }
      }),
      ...(search && {
        OR: [
          {
            name: {
              contains: search,
              mode: 'insensitive'
            }
          },
          {
            email: {
              contains: search,
              mode: 'insensitive'
            }
          },
          {
            company: {
              contains: search,
              mode: 'insensitive'
            }
          },
          {
            title: {
              contains: search,
              mode: 'insensitive'
            }
          }
        ]
      })
    };

    // Build order by clause
    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    // Parse limit and offset as integers
    const parsedLimit = parseInt(limit, 10);
    const parsedOffset = parseInt(offset, 10);

    // Get total count for pagination
    const total = await prisma.prospect.count({ where });

    // Query prospects with pagination
    const prospects = await prisma.prospect.findMany({
      where,
      orderBy,
      take: parsedLimit,
      skip: parsedOffset,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Transform prospects to match frontend expectations and add _count for compatibility
    const transformedProspects = prospects.map(prospect => ({
      ...prospect,
      // Add missing fields with default values for frontend compatibility
      score: prospect.score || 50,
      lastContacted: prospect.lastContacted || null,
      _count: {
        campaignProspects: 0 // Add this for frontend compatibility
      }
    }));

    // Calculate if there are more prospects
    const hasMore = parsedOffset + prospects.length < total;

    return createSuccessResponse({
      prospects: transformedProspects,
      total,
      hasMore,
      limit: parsedLimit,
      offset: parsedOffset
    });

  } catch (error) {
    console.error('Error fetching prospects:', error);
    return createErrorResponse('Internal server error', 500);
  } finally {
    // Disconnect Prisma client in serverless environment
    await prisma.$disconnect();
  }
};