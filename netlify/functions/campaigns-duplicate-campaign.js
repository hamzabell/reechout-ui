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
    const { campaignId, userId, name } = JSON.parse(event.body);

    // Validate required fields
    if (!campaignId) {
      return createErrorResponse('Campaign ID is required', 400, event);
    }

    if (!userId) {
      return createErrorResponse('User ID is required', 400, event);
    }

    // Check if campaign exists and user owns it
    const originalCampaign = await prisma.sequence.findUnique({
      where: { id: campaignId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        steps: {
          orderBy: { day: 'asc' }
        },
        campaignProspects: {
          include: {
            prospect: true
          }
        }
      }
    });

    if (!originalCampaign) {
      return createErrorResponse('Campaign not found', 404, event);
    }

    // Check ownership
    if (originalCampaign.createdBy !== userId) {
      return createErrorResponse('Permission denied', 403, event);
    }

    // Create the duplicated campaign
    const duplicatedCampaign = await prisma.sequence.create({
      data: {
        name: name || `${originalCampaign.name} (Copy)`,
        description: originalCampaign.description,
        status: 'DRAFT', // Always start as draft
        createdBy: userId,
        // Don't copy performance metrics or dates
      },
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

    // Copy steps if they exist (simplified - just basic fields)
    if (originalCampaign.steps && originalCampaign.steps.length > 0) {
      const stepsToCreate = originalCampaign.steps.map(step => ({
        sequenceId: duplicatedCampaign.id,
        day: step.day
      }));

      await prisma.step.createMany({
        data: stepsToCreate
      });
    }

    // Copy prospects if they exist
    if (originalCampaign.campaignProspects && originalCampaign.campaignProspects.length > 0) {
      const prospectsToCreate = originalCampaign.campaignProspects.map(cp => ({
        campaignId: duplicatedCampaign.id,
        prospectId: cp.prospect.id, // Fix: access the nested prospect id
        status: 'PENDING' // Reset status for new campaign
      }));

      await prisma.campaignProspect.createMany({
        data: prospectsToCreate
      });
    }

    // Fetch the complete duplicated campaign with all relations
    const completeDuplicatedCampaign = await prisma.sequence.findUnique({
      where: { id: duplicatedCampaign.id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        steps: {
          orderBy: { day: 'asc' }
        },
        campaignProspects: {
          include: {
            prospect: {
              select: {
                id: true,
                name: true,
                email: true,
                status: true
              }
            }
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

    // Transform to match frontend expectations
    const transformedCampaign = {
      id: completeDuplicatedCampaign.id,
      name: completeDuplicatedCampaign.name,
      description: completeDuplicatedCampaign.description,
      status: completeDuplicatedCampaign.status.toLowerCase(),
      sent: 0,
      opens: 0,
      replies: 0,
      replyRate: 0,
      prospects: completeDuplicatedCampaign.campaignProspects ? completeDuplicatedCampaign.campaignProspects.map(cp => cp.prospect.id) : [],
      templateId: null,
      settings: {}, // Not in Sequence schema
      createdAt: completeDuplicatedCampaign.createdAt.toISOString(),
      updatedAt: completeDuplicatedCampaign.updatedAt.toISOString(),
      createdBy: completeDuplicatedCampaign.createdBy,
      approvedBy: null,
      approvedAt: null,
      rejectionReason: null,
      totalProspects: completeDuplicatedCampaign._count ? completeDuplicatedCampaign._count.campaignProspects : 0,
      openRate: 0,
      clickRate: 0,
      deliveredRate: 0
    };

    return createSuccessResponse({
      campaign: transformedCampaign,
      message: 'Campaign duplicated successfully'
    }, 200, event);

  } catch (error) {
    console.error('Error duplicating campaign:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return createErrorResponse(`Internal server error: ${error.message}`, 500, event);
  } finally {
    // Disconnect Prisma client in serverless environment
    await prisma.$disconnect();
  }
};
