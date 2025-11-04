const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.handler = async (event, context) => {
  // Handle CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  try {
    const { httpMethod } = event;
    const userId = event.headers.authorization?.replace('Bearer ', '');

    // Verify user authentication
    if (!userId) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    switch (httpMethod) {
      case 'GET':
        return await listProspects(userId, event.queryStringParameters);
      default:
        return {
          statusCode: 405,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }
  } catch (error) {
    console.error('List Prospects API error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

async function listProspects(userId, queryParams) {
  try {
    const {
      page = 1,
      limit = 50,
      search,
      company,
      industry,
      tags,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = queryParams;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = {
      createdBy: userId,
      isOptedOut: false,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (company) {
      where.company = { contains: company, mode: 'insensitive' };
    }

    if (industry) {
      where.industry = { contains: industry, mode: 'insensitive' };
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      where.tags = { hasSome: tagArray };
    }

    // Build order by clause
    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    const [prospects, total] = await Promise.all([
      prisma.prospect.findMany({
        where,
        orderBy,
        skip,
        take: parseInt(limit),
        include: {
          campaignProspects: {
            include: {
              campaign: {
                select: { id: true, name: true, status: true },
              },
            },
          },
        },
      }),
      prisma.prospect.count({ where }),
    ]);

    // Add campaign count to each prospect
    const enrichedProspects = prospects.map(prospect => ({
      ...prospect,
      campaignCount: prospect.campaignProspects.length,
      activeCampaigns: prospect.campaignProspects.filter(cp =>
        ['DRAFT', 'ACTIVE', 'PAUSED'].includes(cp.campaign.status)
      ).length,
      campaignProspects: undefined, // Remove detailed data to avoid circular references
    }));

    const corsHeaders = {
      'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Content-Type': 'application/json',
    };

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        prospects: enrichedProspects,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      }),
    };
  } catch (error) {
    console.error('Get prospects error:', error);
    throw error;
  }
}