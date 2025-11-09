const { createCorsResponse, createSuccessResponse, createErrorResponse } = require('./utils/cors');
const prisma = require('./utils/prisma');

exports.handler = async (event, context) => {
  // Handle CORS preflight request
  if (event.httpMethod === 'OPTIONS') {
    return createCorsResponse();
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return createErrorResponse('Method not allowed', 405);
  }

  try {
    // Extract campaignId from path parameters
    const pathSegments = event.path.split('/');
    const campaignId = pathSegments[pathSegments.indexOf('campaigns') + 1];
    
    const { prospectIds } = JSON.parse(event.body);

    if (!campaignId || !prospectIds || !Array.isArray(prospectIds)) {
      return createErrorResponse('Campaign ID and prospect IDs array are required', 400);
    }

    if (prospectIds.length === 0) {
      return createErrorResponse('At least one prospect ID is required', 400);
    }

    // Get user ID from headers or event (depending on your auth setup)
    const userId = event.headers['x-user-id'] || event.requestContext?.authorizer?.claims?.sub;

    if (!userId) {
      return createErrorResponse('User ID is required', 401);
    }

    // Verify the campaign belongs to the user
    const campaign = await prisma.sequence.findFirst({
      where: {
        id: campaignId,
        createdBy: userId
      }
    });

    if (!campaign) {
      return createErrorResponse('Campaign not found or access denied', 404);
    }

    // Verify all prospects belong to the user
    const prospects = await prisma.prospect.findMany({
      where: {
        id: { in: prospectIds },
        createdBy: userId
      }
    });

    if (prospects.length !== prospectIds.length) {
      return createErrorResponse('One or more prospects not found or access denied', 404);
    }

    // Create campaign prospect associations
    const campaignProspectsToCreate = prospectIds.map(prospectId => ({
      campaignId,
      prospectId,
      status: 'NEW'
    }));

    // Use createMany to avoid duplicates and handle conflicts gracefully
    const result = await prisma.campaignProspect.createMany({
      data: campaignProspectsToCreate,
      skipDuplicates: true
    });

    // Fetch the created campaign prospects with their details
    const createdCampaignProspects = await prisma.campaignProspect.findMany({
      where: {
        campaignId,
        prospectId: { in: prospectIds }
      },
      include: {
        prospect: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
            title: true,
            status: true
          }
        }
      }
    });

    return createSuccessResponse({
      success: true,
      message: `Successfully added ${result.count} prospects to the campaign`,
      added: result.count,
      skipped: prospectIds.length - result.count,
      campaignProspects: createdCampaignProspects
    });

  } catch (error) {
    console.error('Error adding prospects to campaign:', error);
    return createErrorResponse('Internal server error', 500);
  } finally {
    // Disconnect Prisma client in serverless environment
    await prisma.$disconnect();
  }
};
