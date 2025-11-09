const { PrismaClient } = require('@prisma/client');
const { createCorsResponse, createSuccessResponse, createErrorResponse } = require('../utils/cors');

// Initialize Prisma Client for serverless environment
const prisma = new PrismaClient();

exports.handler = async (event, context) => {
  // Handle CORS preflight request
  if (event.httpMethod === 'OPTIONS') {
    return createCorsResponse(event);
  }

  // Only allow PUT requests
  if (event.httpMethod !== 'PUT') {
    return createErrorResponse('Method not allowed', 405, event);
  }

  try {
    const { id, userId, ...updateData } = JSON.parse(event.body);

    // Validate required fields
    if (!id || !userId) {
      return createErrorResponse('Missing required fields: id, userId', 400, event);
    }

    // First check if the prospect exists and belongs to the user
    const existingProspect = await prisma.prospect.findFirst({
      where: {
        id,
        createdBy: userId
      }
    });

    if (!existingProspect) {
      return createErrorResponse('Prospect not found or you do not have permission to update it', 404, event);
    }

    // If email is being updated, check if it's already taken by another prospect
    if (updateData.email && updateData.email !== existingProspect.email) {
      const emailConflict = await prisma.prospect.findFirst({
        where: {
          email: updateData.email,
          createdBy: userId,
          id: { not: id }
        }
      });

      if (emailConflict) {
        return createErrorResponse('Another prospect with this email already exists', 409, event);
      }
    }

    // Validate status if provided
    if (updateData.status) {
      const validStatuses = ['NEW', 'CONTACTED', 'ENGAGED', 'REPLIED', 'INTERESTED', 'NOT_INTERESTED', 'OPTED_OUT', 'CONVERTED', 'BOUNCED'];
      if (!validStatuses.includes(updateData.status)) {
        return createErrorResponse(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400, event);
      }
    }

    // Update the prospect
    const updatedProspect = await prisma.prospect.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Add _count for frontend compatibility
    const prospectWithCount = {
      ...updatedProspect,
      _count: {
        campaignProspects: 0 // We could query this but for simplicity use 0
      }
    };

    return createSuccessResponse({ prospect: prospectWithCount }, 200, event);

  } catch (error) {
    console.error('Error updating prospect:', error);

    // Handle unique constraint error
    if (error.code === 'P2002') {
      return createErrorResponse('A prospect with this email already exists', 409, event);
    }

    // Handle record not found error
    if (error.code === 'P2025') {
      return createErrorResponse('Prospect not found', 404, event);
    }

    return createErrorResponse('Internal server error', 500, event);
  } finally {
    // Disconnect Prisma client in serverless environment
    await prisma.$disconnect();
  }
};