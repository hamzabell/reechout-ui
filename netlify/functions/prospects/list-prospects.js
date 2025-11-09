const { PrismaClient } = require('@prisma/client');

// Initialize Prisma Client for serverless environment
const prisma = new PrismaClient();

exports.handler = async (event, context) => {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const userId = event.queryStringParameters?.userId;

    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'userId is required' })
      };
    }

    // Parse query parameters for filtering and search
    const {
      search,
      status,
      company,
      industry,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      limit = 50,
      offset = 0
    } = event.queryStringParameters || {};

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

    // Transform prospects to match frontend expectations
    const transformedProspects = prospects.map(prospect => ({
      ...prospect,
      // Add missing fields with default values for frontend compatibility
      score: prospect.score || 50,
      lastContacted: prospect.lastContacted || null,
    }));

    // Calculate if there are more prospects
    const hasMore = parsedOffset + prospects.length < total;

    return {
      statusCode: 200,
      body: JSON.stringify({
        prospects: transformedProspects,
        total,
        hasMore,
        limit: parsedLimit,
        offset: parsedOffset
      })
    };

  } catch (error) {
    console.error('Error fetching prospects:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  } finally {
    // Disconnect Prisma client in serverless environment
    await prisma.$disconnect();
  }
};