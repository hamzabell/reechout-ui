const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.handler = async (event, context) => {
  // Handle CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  try {
    const { httpMethod } = event;
    const userId = event.headers.authorization?.replace('Bearer ', '');

    // Verify user authentication
    if (!userId) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    switch (httpMethod) {
      case 'GET':
        return await getCampaigns(userId, event.queryStringParameters);
      case 'POST':
        return await createCampaign(userId, JSON.parse(event.body));
      default:
        return {
          statusCode: 405,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }
  } catch (error) {
    console.error('Campaigns API error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

async function getCampaigns(userId, queryParams) {
  try {
    const {
      page = 1,
      limit = 50,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = queryParams;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = {
      createdBy: userId,
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Build order by clause
    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        orderBy,
        skip,
        take: parseInt(limit),
        include: {
          creator: {
            select: { id: true, name: true, email: true },
          },
          steps: {
            orderBy: { stepNumber: 'asc' },
            include: {
              emailAction: {
                include: {
                  template: {
                    select: { id: true, name: true },
                  },
                },
              },
              taskAction: true,
            },
          },
          campaignProspects: {
            include: {
              prospect: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
      }),
      prisma.campaign.count({ where }),
    ]);

    // Add statistics to each campaign
    const enrichedCampaigns = campaigns.map(campaign => ({
      ...campaign,
      statistics: {
        totalSteps: campaign.steps.length,
        emailSteps: campaign.steps.filter(step => step.emailAction).length,
        taskSteps: campaign.steps.filter(step => step.taskAction).length,
        totalProspects: campaign.campaignProspects.length,
        activeProspects: campaign.campaignProspects.filter(cp => cp.status === 'ACTIVE').length,
        completedProspects: campaign.campaignProspects.filter(cp => cp.status === 'COMPLETED').length,
      },
    }));

    const corsHeaders = {
      'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Content-Type': 'application/json',
    };

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        campaigns: enrichedCampaigns,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      }),
    };
  } catch (error) {
    console.error('Get campaigns error:', error);
    throw error;
  }
}

async function createCampaign(userId, campaignData) {
  try {
    const { name, description, steps = [] } = campaignData;

    if (!name) {
      const corsHeaders = {
        'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Content-Type': 'application/json',
      };
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Campaign name is required' }),
      };
    }

    const campaign = await prisma.campaign.create({
      data: {
        name,
        description,
        createdBy: userId,
        steps: {
          create: steps.map((step, index) => ({
            stepNumber: index + 1,
            delayDays: step.delayDays || 1,
            name: step.name,
            description: step.description,
            emailAction: step.emailAction ? {
              create: {
                templateId: step.emailAction.templateId,
                customSubject: step.emailAction.customSubject,
                customBody: step.emailAction.customBody,
                enablePersonalization: step.emailAction.enablePersonalization || false,
              },
            } : undefined,
            taskAction: step.taskAction ? {
              create: {
                taskTitle: step.taskAction.taskTitle,
                taskDescription: step.taskAction.taskDescription,
                enableEmailNotification: step.taskAction.enableEmailNotification || false,
              },
            } : undefined,
          })),
        },
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
        steps: {
          orderBy: { stepNumber: 'asc' },
          include: {
            emailAction: {
              include: {
                template: {
                  select: { id: true, name: true },
                },
              },
            },
            taskAction: true,
          },
        },
      },
    });

    const corsHeaders = {
      'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Content-Type': 'application/json',
    };

    return {
      statusCode: 201,
      headers: corsHeaders,
      body: JSON.stringify(campaign),
    };
  } catch (error) {
    console.error('Create campaign error:', error);
    throw error;
  }
}