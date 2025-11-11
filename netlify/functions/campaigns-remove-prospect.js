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
    const { campaignId, prospectId, userId } = JSON.parse(event.body);

    if (!campaignId || !prospectId || !userId) {
      return createErrorResponse('Campaign ID, prospect ID, and user ID are required', 400);
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

    // Verify the prospect belongs to the user
    const prospect = await prisma.prospect.findFirst({
      where: {
        id: prospectId,
        createdBy: userId
      }
    });

    if (!prospect) {
      return createErrorResponse('Prospect not found or access denied', 404);
    }

    // Check if the prospect is actually in the campaign
    const campaignProspect = await prisma.campaignProspect.findFirst({
      where: {
        campaignId,
        prospectId
      }
    });

    if (!campaignProspect) {
      return createErrorResponse('Prospect is not in this campaign', 404);
    }

    // Delete the campaign-prospect association
    await prisma.campaignProspect.delete({
      where: {
        id: campaignProspect.id
      }
    });

    // Also delete any personalized emails for this prospect in this campaign
    await prisma.personalizedEmail.deleteMany({
      where: {
        campaignProspectId: campaignProspect.id
      }
    });

    return createSuccessResponse({
      success: true,
      message: `Successfully removed ${prospect.name} from the campaign`
    });

  } catch (error) {
    console.error('Error removing prospect from campaign:', error);
    return createErrorResponse('Internal server error', 500);
  } finally {
    // Disconnect Prisma client in serverless environment
    await prisma.$disconnect();
  }
};