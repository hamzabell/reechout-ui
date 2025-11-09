const { createCorsResponse, createSuccessResponse, createErrorResponse } = require('./utils/cors');
const prisma = require('./utils/prisma');

exports.handler = async (event, context) => {
  // Handle CORS preflight request
  if (event.httpMethod === 'OPTIONS') {
    return createCorsResponse();
  }

  try {
    console.log('=== DEBUGGING CAMPAIGNS ===');
    console.log('HTTP Method:', event.httpMethod);
    console.log('Headers:', event.headers);
    console.log('Query Params:', event.queryStringParameters);
    console.log('Body:', event.body);

    // Get userId from headers
    const userId = event.headers['x-user-id'] || event.headers['X-User-ID'];
    console.log('User ID from headers:', userId);

    if (!userId) {
      console.log('❌ No user ID found');
      return createErrorResponse('User ID is required', 400);
    }

    console.log('✅ User ID found:', userId);

    // Test database connection
    console.log('Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected');

    // Test user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      console.log('❌ User not found:', userId);
      return createErrorResponse('User not found', 404);
    }

    console.log('✅ User found:', { id: user.id, email: user.email, name: user.name });

    // Test sequence query
    console.log('Querying sequences for user...');
    const sequences = await prisma.sequence.findMany({
      where: { createdBy: userId },
      include: {
        _count: {
          select: { campaignProspects: true }
        }
      }
    });

    console.log(`✅ Found ${sequences.length} sequences:`);
    sequences.forEach((seq, index) => {
      console.log(`  ${index + 1}. ${seq.name} (${seq.status}) - ${seq._count.campaignProspects} prospects`);
    });

    // Test full campaigns-advanced query
    console.log('Testing full campaigns-advanced query...');
    const where = { createdBy: userId };
    const total = await prisma.sequence.count({ where });
    
    const campaigns = await prisma.sequence.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      skip: 0,
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        campaignProspects: {
          include: {
            prospect: {
              select: { id: true, name: true, email: true, status: true }
            },
            personalizedEmails: {
              where: { status: 'SENT' },
              select: { id: true, openedAt: true, repliedAt: true }
            }
          }
        },
        _count: {
          select: { campaignProspects: true, steps: true }
        }
      }
    });

    console.log(`✅ Full query completed: ${campaigns.length} campaigns`);

    // Test transformation
    const transformedCampaigns = campaigns.map(campaign => {
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
        totalProspects: campaign._count.campaignProspects,
        createdAt: campaign.createdAt.toISOString(),
        updatedAt: campaign.updatedAt.toISOString()
      };
    });

    const debugData = {
      userId: userId,
      user: { id: user.id, email: user.email, name: user.name },
      databaseStats: {
        totalSequences: total,
        sequencesFound: sequences.length,
        campaignsFound: campaigns.length
      },
      campaigns: transformedCampaigns,
      requestInfo: {
        httpMethod: event.httpMethod,
        headers: {
          'x-user-id': event.headers['x-user-id'],
          'X-User-ID': event.headers['X-User-ID'],
          'authorization': event.headers['authorization'] ? 'Present' : 'Missing'
        },
        queryParameters: event.queryStringParameters,
        body: event.body
      }
    };

    console.log('✅ Debug data prepared');
    
    return createSuccessResponse(debugData);

  } catch (error) {
    console.error('❌ Debug error:', error);
    console.error('Error stack:', error.stack);
    return createErrorResponse(`Debug error: ${error.message}`, 500);
  } finally {
    await prisma.$disconnect();
  }
};
