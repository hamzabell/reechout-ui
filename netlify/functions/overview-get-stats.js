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
    console.log('Request received:', event.httpMethod);
    console.log('Request body:', event.body);
    
    const requestBody = JSON.parse(event.body);
    const { userId } = requestBody;

    console.log('Parsed userId:', userId);
    console.log('Request headers:', event.headers);

    if (!userId) {
      console.log('No userId found in request');
      return createErrorResponse('User ID is required', 400);
    }

    console.log('Fetching overview stats for userId:', userId);

    // Get basic counts first (simpler queries)
    const [campaignsCount, prospectsCount, activeCampaignsCount] = await Promise.all([
      prisma.sequence.count({
        where: { createdBy: userId }
      }),
      prisma.prospect.count({
        where: { createdBy: userId }
      }),
      prisma.sequence.count({
        where: { 
          createdBy: userId,
          status: 'ACTIVE'
        }
      })
    ]);

    console.log('Basic counts:', { campaignsCount, prospectsCount, activeCampaignsCount });

    // If no campaigns, return basic stats
    if (campaignsCount === 0) {
      const stats = {
        totalEmailsSent: 0,
        totalReplyRate: 0,
        activeCampaigns: 0,
        totalProspects: prospectsCount,
        monthlyChange: {
          emailsSent: 0,
          replyRate: 0,
          campaigns: 0,
          prospects: 0
        },
        period: '30 days'
      };
      console.log('Returning basic stats (no campaigns)');
      return createSuccessResponse(stats);
    }

    // Get campaigns with minimal includes for better performance
    const campaigns = await prisma.sequence.findMany({
      where: {
        createdBy: userId
      },
      select: {
        id: true,
        status: true,
        campaignProspects: {
          select: {
            personalizedEmails: {
              select: {
                openedAt: true,
                repliedAt: true,
                createdAt: true
              }
            }
          }
        }
      }
    });

    console.log('Found campaigns:', campaigns.length);

    // Simple calculations
    let totalEmailsSent = 0;
    let totalReplies = 0;
    let totalOpens = 0;

    campaigns.forEach(campaign => {
      if (campaign.campaignProspects) {
        campaign.campaignProspects.forEach(cp => {
          if (cp.personalizedEmails) {
            totalEmailsSent += cp.personalizedEmails.length;
            totalOpens += cp.personalizedEmails.filter(email => email.openedAt).length;
            totalReplies += cp.personalizedEmails.filter(email => email.repliedAt).length;
          }
        });
      }
    });

    const totalReplyRate = totalEmailsSent > 0 ? Math.round((totalReplies / totalEmailsSent) * 100 * 10) / 10 : 0;

    const stats = {
      totalEmailsSent,
      totalReplyRate,
      activeCampaigns: activeCampaignsCount,
      totalProspects: prospectsCount,
      monthlyChange: {
        emailsSent: 0,
        replyRate: 0,
        campaigns: 0,
        prospects: 0
      },
      period: '30 days'
    };

    console.log('Calculated stats:', stats);
    return createSuccessResponse(stats);

  } catch (error) {
    console.error('Error fetching overview stats:', error);
    return createErrorResponse('Internal server error', 500);
  } finally {
    // Disconnect Prisma client in serverless environment
    await prisma.$disconnect();
  }
};
