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
    return createErrorResponse('Method not allowed', 405, event);
  }

  try {
    const { campaignId, userId } = JSON.parse(event.body);

    // Validate required fields
    if (!campaignId) {
      return createErrorResponse('Campaign ID is required', 400, event);
    }

    if (!userId) {
      return createErrorResponse('User ID is required', 400, event);
    }

    // Check if campaign exists and user owns it
    const existingCampaign = await prisma.sequence.findUnique({
      where: { id: campaignId },
      include: {
        _count: {
          select: {
            campaignProspects: true,
            steps: true
          }
        }
      }
    });

    if (!existingCampaign) {
      return createErrorResponse('Campaign not found', 404, event);
    }

    // Check ownership
    if (existingCampaign.createdBy !== userId) {
      return createErrorResponse('Permission denied', 403, event);
    }

    // Check if campaign has active dependencies
    // Allow deletion but warn user - in a real app you might want to prevent this
    const activeProspects = await prisma.campaignProspect.count({
      where: {
        campaignId: campaignId,
        prospect: {
          status: {
            in: ['NEW', 'CONTACTED', 'ENGAGED', 'REPLIED', 'INTERESTED']
          }
        }
      }
    });

    const sentEmails = await prisma.personalizedEmail.count({
      where: {
        campaignProspect: {
          campaignId: campaignId
        },
        status: 'SENT'
      }
    });

    // For safety, don't allow deletion of campaigns with sent emails
    if (sentEmails > 0) {
      return createErrorResponse('Cannot delete campaign that has sent emails', 400, event);
    }

    // Delete campaign (cascade will handle related records)
    const deletedCampaign = await prisma.sequence.delete({
      where: { id: campaignId },
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

    return createSuccessResponse({
      campaign: {
        id: deletedCampaign.id,
        name: deletedCampaign.name,
        deletedAt: new Date().toISOString()
      },
      message: 'Campaign deleted successfully'
    }, 200, event);

  } catch (error) {
    console.error('Error deleting campaign:', error);
    return createErrorResponse('Internal server error', 500, event);
  } finally {
    // Disconnect Prisma client in serverless environment
    await prisma.$disconnect();
  }
};
