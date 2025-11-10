const { PrismaClient } = require('@prisma/client');
const cors = require('./utils/cors');

const prisma = new PrismaClient();

// Helper function to validate campaign status transitions
const isValidStatusTransition = (currentStatus, newStatus) => {
  const transitions = {
    'DRAFT': ['ACTIVE', 'CANCELLED'],
    'ACTIVE': ['PAUSED', 'COMPLETED', 'CANCELLED'],
    'PAUSED': ['ACTIVE', 'CANCELLED'],
    'COMPLETED': [], // No transitions allowed from completed
    'CANCELLED': [], // No transitions allowed from cancelled
    // Also handle lowercase values from database
    'draft': ['ACTIVE', 'CANCELLED'],
    'sending': ['PAUSED', 'COMPLETED', 'CANCELLED'],
    'paused': ['ACTIVE', 'CANCELLED'],
    'completed': [], // No transitions allowed from completed
    'cancelled': [] // No transitions allowed from cancelled
  };
  
  return transitions[currentStatus]?.includes(newStatus) || false;
};

// Helper function to get status timestamp field
const getStatusTimestampField = (status) => {
  switch (status) {
    case 'ACTIVE':
    case 'sending':
      return 'startedAt';
    case 'PAUSED':
    case 'paused':
      return 'pausedAt';
    case 'COMPLETED':
    case 'completed':
      return 'completedAt';
    default:
      return null;
  }
};

exports.handler = async (event, context) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return cors({
      statusCode: 200,
      body: ''
    });
  }

  try {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
      return cors({
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' })
      });
    }

    // Parse request body
    const { sequenceId, action, userId } = JSON.parse(event.body);

    if (!sequenceId || !action || !userId) {
      return cors({
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Missing required fields: sequenceId, action, userId' 
        })
      });
    }

    // Validate action
    const validActions = ['start', 'pause', 'resume', 'stop', 'cancel'];
    if (!validActions.includes(action)) {
      return cors({
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Invalid action. Must be one of: ' + validActions.join(', ') 
        })
      });
    }

    // Get current campaign
    const campaign = await prisma.sequence.findUnique({
      where: { id: sequenceId },
      include: {
        creator: {
          select: {
            id: true,
            neonId: true
          }
        }
      }
    });

    if (!campaign) {
      return cors({
        statusCode: 404,
        body: JSON.stringify({ error: 'Campaign not found' })
      });
    }

    // Verify ownership
    if (campaign.createdBy !== userId && campaign.creator.neonId !== userId) {
      return cors({
        statusCode: 403,
        body: JSON.stringify({ error: 'Not authorized to control this campaign' })
      });
    }

    // Map action to new status
    const actionToStatusMap = {
      'start': 'ACTIVE',
      'pause': 'PAUSED', 
      'resume': 'ACTIVE',
      'stop': 'CANCELLED',
      'cancel': 'CANCELLED'
    };

    const newStatus = actionToStatusMap[action];

    // Validate status transition
    if (!isValidStatusTransition(campaign.status, newStatus)) {
      return cors({
        statusCode: 400,
        body: JSON.stringify({ 
          error: `Cannot transition from ${campaign.status} to ${newStatus}` 
        })
      });
    }

    // Prepare update data
    const updateData = {
      status: newStatus,
      updatedAt: new Date()
    };

    // Add timestamp field based on new status
    const timestampField = getStatusTimestampField(newStatus);
    if (timestampField) {
      updateData[timestampField] = new Date();
    }

    // For resume action, clear the pausedAt timestamp
    if (action === 'resume') {
      updateData.pausedAt = null;
    }

    // Update campaign
    const updatedCampaign = await prisma.sequence.update({
      where: { id: sequenceId },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            campaignProspects: true,
            steps: true
          }
        }
      }
    });

    // Format response
    const response = {
      success: true,
      message: `Campaign ${action}d successfully`,
      campaign: {
        id: updatedCampaign.id,
        name: updatedCampaign.name,
        description: updatedCampaign.description,
        status: updatedCampaign.status,
        createdAt: updatedCampaign.createdAt.toISOString(),
        startedAt: updatedCampaign.startedAt?.toISOString(),
        pausedAt: updatedCampaign.pausedAt?.toISOString(),
        completedAt: updatedCampaign.completedAt?.toISOString(),
        updatedAt: updatedCampaign.updatedAt.toISOString(),
        createdBy: updatedCampaign.createdBy,
        creator: updatedCampaign.creator,
        prospectsCount: updatedCampaign._count.campaignProspects,
        stepsCount: updatedCampaign._count.steps
      }
    };

    return cors({
      statusCode: 200,
      body: JSON.stringify(response)
    });

  } catch (error) {
    console.error('Campaign control error:', error);
    
    return cors({
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    });
  } finally {
    await prisma.$disconnect();
  }
};