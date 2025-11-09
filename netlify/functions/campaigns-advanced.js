const { PrismaClient } = require('@prisma/client');
const { createCorsResponse, createSuccessResponse, createErrorResponse } = require('./utils/cors');

// Initialize Prisma Client for serverless environment
const prisma = new PrismaClient();

exports.handler = async (event, context) => {
  // Handle CORS preflight request
  if (event.httpMethod === 'OPTIONS') {
    return createCorsResponse();
  }

  // Allow both GET and POST requests for flexibility
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return createErrorResponse('Method not allowed', 405);
  }

  try {
    let userId, filters;

    // Parse request data based on method
    if (event.httpMethod === 'POST') {
      // POST method: get data from request body
      const body = JSON.parse(event.body || '{}');
      userId = body.userId;
      filters = { ...body };
      delete filters.userId; // Remove userId from filters
    } else {
      // GET method: get data from query parameters
      const queryParams = event.queryStringParameters || {};

      // For GET requests, userId should come from authentication context
      // For now, we'll extract it from headers or use a default
      userId = event.headers['x-user-id'] || queryParams.userId;

      filters = {
        search: queryParams.search || '',
        limit: parseInt(queryParams.limit) || 50,
        offset: parseInt(queryParams.offset) || 0,
        status: queryParams.status,
        sortBy: queryParams.sortBy || 'createdAt',
        sortOrder: queryParams.sortOrder || 'desc',
        dateRange: queryParams.dateRange ? JSON.parse(queryParams.dateRange) : undefined
      };
    }

    if (!userId) {
      return createErrorResponse('User ID is required', 400);
    }

    // Parse filters for filtering and search
    const {
      search = '',
      status,
      dateRange,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      limit = 50,
      offset = 0
    } = filters || {};

    // Build where clause
    const where = {
      createdBy: userId,
      ...(status && { status: status }),
      ...(search && {
        OR: [
          {
            name: {
              contains: search,
              mode: 'insensitive'
            }
          },
          {
            description: {
              contains: search,
              mode: 'insensitive'
            }
          }
        ]
      }),
      ...(dateRange && {
        createdAt: {
          gte: new Date(dateRange.start),
          lte: new Date(dateRange.end)
        }
      })
    };

    // Build order by clause
    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    // Parse limit and offset as integers
    const parsedLimit = parseInt(limit, 10);
    const parsedOffset = parseInt(offset, 10);

    // Get total count for pagination
    const total = await prisma.sequence.count({ where }).catch(err => {
      console.error('Error counting campaigns:', err);
      return 0;
    });

    // Query campaigns with analytics
    const campaigns = await prisma.sequence.findMany({
      where,
      orderBy,
      take: parsedLimit,
      skip: parsedOffset,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
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
            },
            personalizedEmails: {
              where: {
                status: 'SENT'
              },
              select: {
                id: true,
                openedAt: true,
                repliedAt: true
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

    // Transform campaigns to match frontend expectations
    const transformedCampaigns = campaigns.map(campaign => {
      // Collect all emails from all campaign prospects
      const allEmails = campaign.campaignProspects.flatMap(cp => cp.personalizedEmails);
      const sent = allEmails.length;
      const opens = allEmails.filter(email => email.openedAt).length;
      const replies = allEmails.filter(email => email.repliedAt).length;
      const replyRate = sent > 0 ? (replies / sent) * 100 : 0;

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
        name: campaign.name,
        description: campaign.description,
        status: statusMap[campaign.status] || 'draft',
        sent,
        opens,
        replies,
        replyRate: Math.round(replyRate * 10) / 10, // Round to 1 decimal place
        startDate: campaign.startedAt?.toISOString(),
        scheduledDate: campaign.pausedAt?.toISOString(),
        completedDate: campaign.completedAt?.toISOString(),
        prospects: campaign.campaignProspects.map(cp => cp.prospect.id),
        templateId: null, // Not in Sequence schema
        settings: {}, // Not in Sequence schema
        createdAt: campaign.createdAt.toISOString(),
        updatedAt: campaign.updatedAt.toISOString(),
        createdBy: campaign.createdBy,
        approvedBy: null, // Not in Sequence schema
        approvedAt: null, // Not in Sequence schema
        rejectionReason: null, // Not in Sequence schema
        // Additional computed fields
        totalProspects: campaign._count.campaignProspects,
        openRate: sent > 0 ? Math.round((opens / sent) * 100 * 10) / 10 : 0,
        clickRate: 0, // Would need to implement click tracking
        deliveredRate: sent > 0 ? Math.round((sent / campaign._count.campaignProspects) * 100 * 10) / 10 : 0
      };
    });

    // Calculate if there are more campaigns
    const hasMore = parsedOffset + campaigns.length < total;

    // Calculate overall analytics
    const analytics = {
      totalCampaigns: total,
      activeCampaigns: campaigns.filter(c => c.status === 'ACTIVE').length,
      completedCampaigns: campaigns.filter(c => c.status === 'COMPLETED').length,
      totalEmailsSent: transformedCampaigns.reduce((sum, c) => sum + c.sent, 0),
      averageReplyRate: total > 0
        ? Math.round((transformedCampaigns.reduce((sum, c) => sum + c.replyRate, 0) / total) * 10) / 10
        : 0,
      averageOpenRate: total > 0
        ? Math.round((transformedCampaigns.reduce((sum, c) => sum + c.openRate, 0) / total) * 10) / 10
        : 0,
      totalProspects: transformedCampaigns.reduce((sum, c) => sum + c.totalProspects, 0)
    };

    return createSuccessResponse({
      campaigns: transformedCampaigns,
      total,
      hasMore,
      limit: parsedLimit,
      offset: parsedOffset,
      analytics
    });

  } catch (error) {
    console.error('Error fetching campaigns:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return createErrorResponse(`Internal server error: ${error.message}`, 500);
  } finally {
    // Disconnect Prisma client in serverless environment
    await prisma.$disconnect();
  }
};