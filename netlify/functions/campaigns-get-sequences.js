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
    const { userId, campaignId, ...filters } = JSON.parse(event.body);

    if (!userId) {
      return createErrorResponse('User ID is required', 400);
    }

    // Parse filters
    const {
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      limit = 50,
      offset = 0
    } = filters || {};

    // Build where clause
    let where = {
      campaign: {
        createdBy: userId
      }
    };

    if (campaignId) {
      where.campaign.id = campaignId;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        {
          subject: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          prospect: {
            name: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          prospect: {
            email: {
              contains: search,
              mode: 'insensitive'
            }
          }
        }
      ];
    }

    // Build order by clause
    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    // Parse limit and offset as integers
    const parsedLimit = parseInt(limit, 10);
    const parsedOffset = parseInt(offset, 10);

    // Get total count for pagination
    const total = await prisma.email.count({ where });

    // Query emails with related data
    const emails = await prisma.email.findMany({
      where,
      orderBy,
      take: parsedLimit,
      skip: parsedOffset,
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
            status: true
          }
        },
        prospect: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
            title: true,
            status: true
          }
        },
        template: {
          select: {
            id: true,
            name: true,
            subject: true
          }
        }
      }
    });

    // Transform emails to match frontend expectations
    const transformedEmails = emails.map(email => {
      // Calculate engagement metrics
      const isDelivered = email.status === 'sent' || email.status === 'delivered';
      const isOpened = email.openedAt !== null;
      const isReplied = email.repliedAt !== null;
      const isClicked = email.clickedAt !== null;

      // Calculate time-based metrics
      let openDelay = null;
      let replyDelay = null;
      
      if (email.sentAt && email.openedAt) {
        openDelay = Math.round((new Date(email.openedAt) - new Date(email.sentAt)) / (1000 * 60)); // minutes
      }
      
      if (email.openedAt && email.repliedAt) {
        replyDelay = Math.round((new Date(email.repliedAt) - new Date(email.openedAt)) / (1000 * 60)); // minutes
      }

      // Calculate engagement score
      let engagementScore = 0;
      if (isDelivered) engagementScore += 20;
      if (isOpened) engagementScore += 40;
      if (isClicked) engagementScore += 20;
      if (isReplied) engagementScore += 20;

      // Determine quality score based on personalization and engagement
      const qualityScore = Math.round(
        (email.personalizationScore || 0) * 0.4 + 
        engagementScore * 0.6
      );

      return {
        id: email.id,
        campaignId: email.campaignId,
        campaign: email.campaign,
        prospectId: email.prospectId,
        prospect: email.prospect,
        templateId: email.templateId,
        template: email.template,
        subject: email.subject,
        body: email.body,
        status: email.status,
        personalizationScore: email.personalizationScore || 0,
        qualityScore,
        engagementScore,
        
        // Timestamps
        createdAt: email.createdAt.toISOString(),
        updatedAt: email.updatedAt.toISOString(),
        scheduledAt: email.scheduledAt?.toISOString(),
        sentAt: email.sentAt?.toISOString(),
        deliveredAt: email.deliveredAt?.toISOString(),
        openedAt: email.openedAt?.toISOString(),
        clickedAt: email.clickedAt?.toISOString(),
        repliedAt: email.repliedAt?.toISOString(),
        bouncedAt: email.bouncedAt?.toISOString(),
        
        // Calculated metrics
        openDelay,
        replyDelay,
        isDelivered,
        isOpened,
        isReplied,
        isClicked,
        
        // Error handling
        errorMessage: email.errorMessage,
        bounceReason: email.bounceReason,
        
        // Additional metadata
        metadata: email.metadata || {},
        
        // Legacy fields for compatibility
        to: email.prospect?.email,
        from: email.fromEmail,
        cc: email.cc,
        bcc: email.bcc
      };
    });

    // Calculate if there are more emails
    const hasMore = parsedOffset + emails.length < total;

    // Calculate summary statistics
    const summary = {
      total,
      statusBreakdown: transformedEmails.reduce((acc, email) => {
        acc[email.status] = (acc[email.status] || 0) + 1;
        return acc;
      }, {}),
      engagementStats: {
        totalSent: transformedEmails.filter(e => e.status === 'sent').length,
        totalOpened: transformedEmails.filter(e => e.isOpened).length,
        totalReplied: transformedEmails.filter(e => e.isReplied).length,
        totalClicked: transformedEmails.filter(e => e.isClicked).length,
        averageOpenDelay: transformedEmails
          .filter(e => e.openDelay !== null)
          .reduce((sum, e) => sum + e.openDelay, 0) / transformedEmails.filter(e => e.openDelay !== null).length || 0,
        averageReplyDelay: transformedEmails
          .filter(e => e.replyDelay !== null)
          .reduce((sum, e) => sum + e.replyDelay, 0) / transformedEmails.filter(e => e.replyDelay !== null).length || 0
      },
      qualityStats: {
        averagePersonalizationScore: transformedEmails.reduce((sum, e) => sum + e.personalizationScore, 0) / transformedEmails.length || 0,
        averageQualityScore: transformedEmails.reduce((sum, e) => sum + e.qualityScore, 0) / transformedEmails.length || 0,
        averageEngagementScore: transformedEmails.reduce((sum, e) => sum + e.engagementScore, 0) / transformedEmails.length || 0
      }
    };

    return createSuccessResponse({
      emails: transformedEmails,
      total,
      hasMore,
      limit: parsedLimit,
      offset: parsedOffset,
      summary
    });

  } catch (error) {
    console.error('Error fetching campaign sequences:', error);
    return createErrorResponse('Internal server error', 500);
  } finally {
    // Disconnect Prisma client in serverless environment
    await prisma.$disconnect();
  }
};
