require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { handleCors, addCorsHeaders } = require('./cors-helper');

// Initialize Prisma Client for serverless environment
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

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
    const { userId, ...filters } = JSON.parse(event.body);

    if (!userId) {
      return addCorsHeaders({
        statusCode: 400,
        body: JSON.stringify({ error: 'User ID is required' })
      });
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

    return addCorsHeaders({
      statusCode: 200,
      body: JSON.stringify({
        prospects: transformedProspects,
        total,
        hasMore,
        limit: parsedLimit,
        offset: parsedOffset
      })
    });

  } catch (error) {
    console.error('Error fetching prospects:', error);

    // Handle specific error cases
    if (error.code === 'P2002') {
      return addCorsHeaders({
        statusCode: 409,
        body: JSON.stringify({
          error: 'Database constraint violation'
        })
      });
    }

    if (error.code === 'P2003') {
      return addCorsHeaders({
        statusCode: 400,
        body: JSON.stringify({
          error: 'Invalid user ID provided'
        })
      });
    }

    return addCorsHeaders({
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    });
  } finally {
    // Disconnect Prisma client in serverless environment
    await prisma.$disconnect();
  }
};