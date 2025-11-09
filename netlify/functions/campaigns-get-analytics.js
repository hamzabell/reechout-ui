const { PrismaClient } = require('@prisma/client');
const { createCorsResponse, createSuccessResponse, createErrorResponse } = require('./utils/cors');

// Initialize Prisma Client for serverless environment
const prisma = new PrismaClient();

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
    const { userId, campaignId, period = '30d' } = JSON.parse(event.body);

    if (!userId) {
      return createErrorResponse('User ID is required', 400);
    }

    if (!campaignId) {
      return createErrorResponse('Campaign ID is required', 400);
    }

    // Verify campaign ownership
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        createdBy: userId
      },
      include: {
        prospects: {
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
        emails: {
          include: {
            prospect: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            prospects: true,
            emails: true
          }
        }
      }
    });

    if (!campaign) {
      return createErrorResponse('Campaign not found or access denied', 404);
    }

    // Calculate date range based on period
    const now = new Date();
    let startDate;
    switch (period) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Calculate overall metrics
    const totalEmails = campaign._count.emails;
    const sentEmails = campaign.emails.filter(email => email.status === 'sent');
    const openedEmails = sentEmails.filter(email => email.openedAt);
    const repliedEmails = sentEmails.filter(email => email.repliedAt);
    const clickedEmails = sentEmails.filter(email => email.clickedAt);

    const basicMetrics = {
      totalEmails,
      sentEmails: sentEmails.length,
      openedEmails: openedEmails.length,
      repliedEmails: repliedEmails.length,
      clickedEmails: clickedEmails.length,
      openRate: sentEmails.length > 0 ? Math.round((openedEmails.length / sentEmails.length) * 100 * 10) / 10 : 0,
      replyRate: sentEmails.length > 0 ? Math.round((repliedEmails.length / sentEmails.length) * 100 * 10) / 10 : 0,
      clickRate: sentEmails.length > 0 ? Math.round((clickedEmails.length / sentEmails.length) * 100 * 10) / 10 : 0,
      totalProspects: campaign._count.prospects,
      prospectsReached: sentEmails.length,
      deliveredRate: campaign._count.prospects > 0 ? Math.round((sentEmails.length / campaign._count.prospects) * 100 * 10) / 10 : 0
    };

    // Calculate prospect status breakdown
    const prospectStatusBreakdown = campaign.prospects.reduce((acc, cp) => {
      const status = cp.prospect.status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    // Calculate daily performance data for the period
    const dailyPerformance = [];
    const dayCount = period === '24h' ? 1 : period === '7d' ? 7 : period === '30d' ? 30 : 90;
    
    for (let i = dayCount - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayEmails = campaign.emails.filter(email => {
        const emailDate = new Date(email.createdAt);
        return emailDate >= date && emailDate < nextDate;
      });

      const daySent = dayEmails.filter(email => email.status === 'sent').length;
      const dayOpened = dayEmails.filter(email => email.openedAt).length;
      const dayReplied = dayEmails.filter(email => email.repliedAt).length;

      dailyPerformance.push({
        date: date.toISOString().split('T')[0],
        sent: daySent,
        opened: dayOpened,
        replied: dayReplied,
        openRate: daySent > 0 ? Math.round((dayOpened / daySent) * 100 * 10) / 10 : 0,
        replyRate: daySent > 0 ? Math.round((dayReplied / daySent) * 100 * 10) / 10 : 0
      });
    }

    // Calculate email performance metrics
    const emailPerformance = campaign.emails.map(email => ({
      id: email.id,
      prospectName: email.prospect?.name || 'Unknown',
      prospectEmail: email.prospect?.email || 'Unknown',
      subject: email.subject || 'No Subject',
      status: email.status,
      sentAt: email.sentAt?.toISOString(),
      openedAt: email.openedAt?.toISOString(),
      repliedAt: email.repliedAt?.toISOString(),
      clickedAt: email.clickedAt?.toISOString(),
      personalizationScore: email.personalizationScore || 0,
      // Calculate engagement score based on interactions
      engagementScore: email.openedAt ? (email.repliedAt ? 100 : 50) : (email.status === 'sent' ? 10 : 0)
    })).sort((a, b) => b.engagementScore - a.engagementScore);

    // Calculate top performing prospects
    const prospectPerformance = campaign.prospects.map(cp => {
      const prospectEmails = campaign.emails.filter(email => email.prospectId === cp.prospect.id);
      const sentCount = prospectEmails.filter(email => email.status === 'sent').length;
      const openedCount = prospectEmails.filter(email => email.openedAt).length;
      const repliedCount = prospectEmails.filter(email => email.repliedAt).length;

      return {
        prospectId: cp.prospect.id,
        name: cp.prospect.name,
        email: cp.prospect.email,
        status: cp.prospect.status,
        emailsSent: sentCount,
        emailsOpened: openedCount,
        emailsReplied: repliedCount,
        engagementRate: sentCount > 0 ? Math.round((openedCount / sentCount) * 100 * 10) / 10 : 0,
        responseRate: sentCount > 0 ? Math.round((repliedCount / sentCount) * 100 * 10) / 10 : 0
      };
    }).sort((a, b) => b.engagementRate - a.engagementRate);

    // Compile comprehensive analytics
    const analytics = {
      campaign: {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        createdAt: campaign.createdAt.toISOString(),
        startDate: campaign.startDate?.toISOString(),
        completedDate: campaign.completedDate?.toISOString()
      },
      basicMetrics,
      prospectStatusBreakdown,
      dailyPerformance,
      emailPerformance: emailPerformance.slice(0, 50), // Top 50 emails
      prospectPerformance: prospectPerformance.slice(0, 20), // Top 20 prospects
      period,
      generatedAt: now.toISOString()
    };

    return createSuccessResponse(analytics);

  } catch (error) {
    console.error('Error fetching campaign analytics:', error);
    return createErrorResponse('Internal server error', 500);
  } finally {
    // Disconnect Prisma client in serverless environment
    await prisma.$disconnect();
  }
};
