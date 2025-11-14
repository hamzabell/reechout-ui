const { PrismaClient } = require('@prisma/client');
const { createCorsResponse, createSuccessResponse, createErrorResponse } = require('./utils/cors');

// Initialize Prisma Client for serverless environment
const prisma = new PrismaClient();

/**
 * Generate UUID v4 for sequence ID
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

exports.handler = async (event, context) => {
  // Handle CORS preflight request
  if (event.httpMethod === 'OPTIONS') {
    return createCorsResponse(event);
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return createErrorResponse('Method not allowed', 405, event);
  }

  try {
    const { userId, sequenceData } = JSON.parse(event.body);

    if (!userId) {
      return createErrorResponse('User ID is required', 400, event);
    }

    // Generate a new UUID for the sequence
    const sequenceId = generateUUID();

    // Create default sequence data
    const defaultSequenceData = {
      name: 'New Sequence',
      description: 'Add a description for your sequence',
      status: 'DRAFT'
    };

    // Merge with any provided sequence data
    const finalSequenceData = { ...defaultSequenceData, ...sequenceData };

    // First verify the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true }
    });

    if (!user) {
      return createErrorResponse('User not found', 404, event);
    }

    // Create the sequence in the database
    const sequence = await prisma.sequence.create({
      data: {
        id: sequenceId,
        name: finalSequenceData.name,
        description: finalSequenceData.description,
        status: finalSequenceData.status,
        createdBy: userId
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        campaignProspects: true,
        steps: true,
        _count: {
          select: {
            campaignProspects: true,
            steps: true
          }
        }
      }
    });

    // Transform the response to match frontend expectations
    const transformedSequence = {
      id: sequence.id,
      name: sequence.name,
      description: sequence.description,
      status: sequence.status.toLowerCase(), // Convert to lowercase for frontend
      sent: 0,
      opens: 0,
      replies: 0,
      replyRate: 0,
      startDate: sequence.startedAt?.toISOString(),
      scheduledDate: sequence.pausedAt?.toISOString(),
      completedDate: sequence.completedAt?.toISOString(),
      prospects: [], // Empty prospects array for new sequence
      templateId: null,
      settings: {
        dailyLimit: 50,
        sendTime: '09:00',
        timezone: 'UTC',
        goals: '',
        targetAudience: ''
      },
      createdAt: sequence.createdAt.toISOString(),
      updatedAt: sequence.updatedAt.toISOString(),
      createdBy: sequence.createdBy,
      approvedBy: null,
      approvedAt: null,
      rejectionReason: null,
      // Additional computed fields
      totalProspects: 0,
      openRate: 0,
      clickRate: 0,
      deliveredRate: 0
    };

    return createSuccessResponse({
      campaign: transformedSequence,
      sequenceId: sequenceId
    }, 200, event);

  } catch (error) {
    console.error('Error creating sequence:', error);
    
    // Handle specific database errors
    if (error.code === 'P2002') {
      return createErrorResponse('A sequence with this ID already exists', 409, event);
    }
    
    if (error.code === 'P2025') {
      return createErrorResponse('User not found', 404, event);
    }
    
    return createErrorResponse('Internal server error', 500, event);
  } finally {
    // Disconnect Prisma client in serverless environment
    await prisma.$disconnect();
  }
};
