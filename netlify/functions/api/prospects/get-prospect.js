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

    if (httpMethod === 'GET') {
      return await getProspect(userId, event.queryStringParameters);
    } else {
      return {
        statusCode: 405,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Method not allowed' }),
      };
    }
  } catch (error) {
    console.error('Get Prospect API error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

async function getProspect(userId, queryParams) {
  try {
    const { id } = queryParams;

    if (!id) {
      const corsHeaders = {
        'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Content-Type': 'application/json',
      };

      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Prospect ID is required' }),
      };
    }

    const prospect = await prisma.prospect.findFirst({
      where: {
        id: id,
        createdBy: userId,
      },
      include: {
        campaignProspects: {
          include: {
            campaign: {
              select: { id: true, name: true, status: true },
            },
          },
        },
      },
    });

    if (!prospect) {
      const corsHeaders = {
        'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Content-Type': 'application/json',
      };

      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Prospect not found' }),
      };
    }

    // Add campaign count to prospect
    const enrichedProspect = {
      ...prospect,
      campaignCount: prospect.campaignProspects.length,
      activeCampaigns: prospect.campaignProspects.filter(cp =>
        ['DRAFT', 'ACTIVE', 'PAUSED'].includes(cp.campaign.status)
      ).length,
      campaignProspects: undefined, // Remove detailed data to avoid circular references
    };

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
        success: true,
        data: {
          prospect: enrichedProspect
        }
      }),
    };
  } catch (error) {
    console.error('Get prospect error:', error);
    throw error;
  }
}