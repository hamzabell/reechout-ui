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

    if (httpMethod === 'PUT') {
      return await updateProspect(userId, JSON.parse(event.body));
    } else {
      return {
        statusCode: 405,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Method not allowed' }),
      };
    }
  } catch (error) {
    console.error('Update Prospect API error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

async function updateProspect(userId, prospectData) {
  try {
    const { id, ...updateData } = prospectData;

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

    // Check if prospect exists and belongs to user
    const existingProspect = await prisma.prospect.findFirst({
      where: {
        id: id,
        createdBy: userId,
      },
    });

    if (!existingProspect) {
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

    // Validate required fields if they are being updated
    if (updateData.email) {
      updateData.email = updateData.email.toLowerCase();

      // Check if email is already used by another prospect
      const emailExists = await prisma.prospect.findFirst({
        where: {
          email: updateData.email,
          id: { not: id },
          createdBy: userId,
        },
      });

      if (emailExists) {
        const corsHeaders = {
          'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Content-Type': 'application/json',
        };

        return {
          statusCode: 409,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'A prospect with this email already exists' }),
        };
      }
    }

    // Remove fields that shouldn't be updated directly
    const { createdAt, updatedAt, createdBy, ...validUpdateData } = updateData;

    // Update the prospect
    const updatedProspect = await prisma.prospect.update({
      where: { id: id },
      data: {
        ...validUpdateData,
        updatedAt: new Date(),
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

    // Add campaign count to updated prospect
    const enrichedProspect = {
      ...updatedProspect,
      campaignCount: updatedProspect.campaignProspects.length,
      activeCampaigns: updatedProspect.campaignProspects.filter(cp =>
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
        message: 'Prospect updated successfully',
        data: {
          prospect: enrichedProspect
        }
      }),
    };
  } catch (error) {
    console.error('Update prospect error:', error);

    if (error.code === 'P2002') {
      const corsHeaders = {
        'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Content-Type': 'application/json',
      };

      return {
        statusCode: 409,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'A prospect with this email already exists' }),
      };
    }

    throw error;
  }
}