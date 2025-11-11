const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

exports.handler = async (event, context) => {
  // Handle CORS preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Max-Age': '86400',
      },
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { campaignId, prospectId, userId, action } = JSON.parse(event.body);

    // Validate required fields
    if (!campaignId || !prospectId || !userId || !action) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ 
        error: 'Missing required fields: campaignId, prospectId, userId, action' 
      })
    };
    }

    // Validate action
    if (!['pause', 'resume'].includes(action)) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({ 
          error: 'Invalid action. Must be either "pause" or "resume"' 
        })
      };
    }

    // Verify the campaign exists and user has access
    const campaign = await prisma.sequence.findFirst({
      where: {
        id: campaignId,
        createdBy: userId
      }
    });

    if (!campaign) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({ error: 'Campaign not found or access denied' })
      };
    }

    // Verify the prospect is part of the campaign
    const campaignProspect = await prisma.campaignProspect.findFirst({
      where: {
        campaignId: campaignId,
        prospectId: prospectId
      },
      include: {
        prospect: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!campaignProspect) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({ error: 'Prospect not found in this campaign' })
      };
    }

    // Update the prospect status based on action
    const updateData = {
      ...(action === 'pause' && {
        pausedAt: new Date(),
        status: 'PAUSED'
      }),
      ...(action === 'resume' && {
        pausedAt: null,
        status: 'RUNNING'
      })
    };

    const updatedCampaignProspect = await prisma.campaignProspect.update({
      where: {
        id: campaignProspect.id
      },
      data: updateData,
      include: {
        prospect: true,
        personalizedEmails: {
          take: 5,
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        success: true,
        message: `Prospect ${action}d successfully`,
        campaignProspect: updatedCampaignProspect,
        action: action
      })
    };

  } catch (error) {
    console.error('Error updating prospect status:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      })
    };
  } finally {
    await prisma.$disconnect();
  }
};