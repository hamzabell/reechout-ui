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

    // Check for sent emails using a more reliable query
    const campaignProspects = await prisma.campaignProspect.findMany({
      where: { campaignId: campaignId },
      select: { id: true }
    });

    const prospectIds = campaignProspects.map(cp => cp.id);

    const sentEmails = await prisma.personalizedEmail.count({
      where: {
        campaignProspectId: { in: prospectIds },
        status: 'SENT'
      }
    });

    // For safety, don't allow deletion of campaigns with sent emails
    if (sentEmails > 0) {
      return createErrorResponse('Cannot delete campaign that has sent emails', 400, event);
    }

    // Delete associated tasks and task assignments first (explicit cascade)
    console.log(`Deleting tasks for campaign ${campaignId}...`);
    const deletedTasks = await prisma.task.deleteMany({
      where: { campaignId: campaignId }
    });
    console.log(`Deleted ${deletedTasks.count} tasks associated with campaign ${campaignId}`);

    // Delete the campaign (Prisma cascade will handle other related records)
    console.log(`Deleting campaign ${campaignId}...`);
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
      deletedTasksCount: deletedTasks.count,
      message: `Campaign deleted successfully (${deletedTasks.count} tasks deleted)`
    }, 200, event);

  } catch (error) {
    console.error('Error deleting campaign:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta
    });
    return createErrorResponse(`Internal server error: ${error.message}`, 500, event);
  } finally {
    // Disconnect Prisma client in serverless environment
    await prisma.$disconnect();
  }
};
