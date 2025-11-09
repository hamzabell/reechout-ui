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
    return createErrorResponse('Method not allowed', 405);
  }

  try {
    const { userId, limit = 5 } = JSON.parse(event.body);

    if (!userId) {
      return createErrorResponse('User ID is required', 400);
    }

    console.log('Fetching recent campaigns for userId:', userId);

    // Parse limit as integer
    const parsedLimit = parseInt(limit, 10);

    // Get recent campaigns with minimal data for performance
    const campaigns = await prisma.sequence.findMany({
      where: {
        createdBy: userId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: parsedLimit,
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        createdAt: true,
        startedAt: true,
        pausedAt: true,
        completedAt: true,
        campaignProspects: {
          select: {
            personalizedEmails: {
              where: {
                status: 'SENT'
              },
              select: {
                openedAt: true,
                repliedAt: true
              }
            }
          }
        }
      }
    });

    console.log('Found campaigns:', campaigns.length);

    // Transform campaigns to match frontend expectations
    const transformedCampaigns = campaigns.map(campaign => {
      // Collect all emails from all campaign prospects
      const allEmails = campaign.campaignProspects ? 
        campaign.campaignProspects.flatMap(cp => cp.personalizedEmails || []) : 
        [];
      
      const sent = allEmails.length;
      const opens = allEmails.filter(email => email && email.openedAt).length;
      const replies = allEmails.filter(email => email && email.repliedAt).length;
      const replyRate = sent > 0 ? Math.round((replies / sent) * 100 * 10) / 10 : 0;

      // Map database status to frontend status
      const statusMap = {
        'DRAFT': 'draft',
        'ACTIVE': 'sending',
        'PAUSED': 'paused',
        'COMPLETED': 'completed',
        'CANCELLED': 'completed'
      };

      return {
        id: campaign.id,
        name: campaign.name || 'Untitled Campaign',
        description: campaign.description,
        status: statusMap[campaign.status] || 'draft',
        sent,
        opens,
        replies,
        replyRate,
        startDate: campaign.startedAt?.toISOString(),
        scheduledDate: campaign.pausedAt?.toISOString(),
        completedDate: campaign.completedAt?.toISOString(),
        prospects: [], // Simplified for now
        templateId: null,
        settings: {},
        createdAt: campaign.createdAt.toISOString(),
        updatedAt: campaign.createdAt.toISOString(), // Using createdAt as fallback
        createdBy: userId,
        approvedBy: null,
        approvedAt: null,
        rejectionReason: null,
        totalProspects: campaign.campaignProspects?.length || 0,
        openRate: sent > 0 ? Math.round((opens / sent) * 100 * 10) / 10 : 0,
        clickRate: 0,
        deliveredRate: sent > 0 ? Math.round((sent / (campaign.campaignProspects?.length || 1)) * 100 * 10) / 10 : 0
      };
    });

    console.log('Transformed campaigns:', transformedCampaigns.length);

    return createSuccessResponse({
      campaigns: transformedCampaigns,
      total: transformedCampaigns.length
    });

  } catch (error) {
    console.error('Error fetching recent campaigns:', error);
    return createErrorResponse('Internal server error', 500);
  } finally {
    // Disconnect Prisma client in serverless environment
    await prisma.$disconnect();
  }
};
