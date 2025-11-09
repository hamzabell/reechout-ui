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
    const { campaignId, prospectIds, userId } = JSON.parse(event.body);

    if (!campaignId || !prospectIds || !Array.isArray(prospectIds) || !userId) {
      return createErrorResponse('Campaign ID, prospect IDs array, and user ID are required', 400);
    }

    if (prospectIds.length === 0) {
      return createErrorResponse('At least one prospect ID is required', 400);
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

    // Check for existing associations to detect duplicates
    const existingAssociations = await prisma.campaignProspect.findMany({
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
            company: true
          }
        }
      }
    });

    // Find duplicates and new prospects
    const existingProspectIds = new Set(existingAssociations.map(cp => cp.prospectId));
    const duplicateProspects = existingAssociations.map(cp => cp.prospect);
    const newProspectIds = prospectIds.filter(id => !existingProspectIds.has(id));

    // If all prospects are duplicates, return error
    if (newProspectIds.length === 0 && duplicateProspects.length > 0) {
      const duplicateNames = duplicateProspects.map(p => `${p.name} (${p.email})`).join(', ');
      return createErrorResponse(
        `All selected prospects are already in this sequence: ${duplicateNames}`,
        409
      );
    }

    // Create campaign prospect associations only for new prospects
    let addedCount = 0;
    let createdCampaignProspects = [];

    if (newProspectIds.length > 0) {
      const campaignProspectsToCreate = newProspectIds.map(prospectId => ({
        campaignId,
        prospectId,
        status: 'NEW'
      }));

      // Create the new associations
      const result = await prisma.campaignProspect.createMany({
        data: campaignProspectsToCreate
        // Note: We don't use skipDuplicates since we've already filtered
      });

      addedCount = result.count;

      // Fetch the newly created campaign prospects with their details
      createdCampaignProspects = await prisma.campaignProspect.findMany({
        where: {
          campaignId,
          prospectId: { in: newProspectIds }
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
    }

    // Construct response based on what happened
    let responseMessage = '';
    let responseStatus = 'success';

    if (addedCount > 0 && duplicateProspects.length === 0) {
      // All prospects added successfully
      responseMessage = `Successfully added ${addedCount} prospect${addedCount > 1 ? 's' : ''} to the sequence`;
    } else if (addedCount > 0 && duplicateProspects.length > 0) {
      // Some added, some duplicates
      const duplicateNames = duplicateProspects.map(p => `${p.name}`).join(', ');
      responseMessage = `Added ${addedCount} prospect${addedCount > 1 ? 's' : ''} to the sequence. ${duplicateProspects.length} prospect${duplicateProspects.length > 1 ? 's were' : ' was'} already added: ${duplicateNames}`;
      responseStatus = 'partial_success';
    } else {
      // This should not happen based on earlier check, but just in case
      responseMessage = 'No prospects were added to the sequence';
    }

    return createSuccessResponse({
      success: addedCount > 0,
      status: responseStatus,
      message: responseMessage,
      added: addedCount,
      duplicates: duplicateProspects.length,
      duplicateProspects: duplicateProspects,
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
