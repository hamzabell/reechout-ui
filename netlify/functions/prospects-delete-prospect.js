const { PrismaClient } = require('@prisma/client');
const { createCorsResponse, createSuccessResponse, createErrorResponse } = require('./utils/cors');

// Initialize Prisma Client for serverless environment
const prisma = new PrismaClient();

exports.handler = async (event, context) => {
  // Handle CORS preflight request
  if (event.httpMethod === 'OPTIONS') {
    return createCorsResponse(event);
  }

  // Only allow DELETE requests
  if (event.httpMethod !== 'DELETE') {
    return createErrorResponse('Method not allowed', 405, event);
  }

  try {
    const { id, userId } = JSON.parse(event.body);

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
      return createErrorResponse('Prospect not found or you do not have permission to delete it', 404, event);
    }

    // Delete the prospect
    await prisma.prospect.delete({
      where: { id }
    });

    return createSuccessResponse({
      message: 'Prospect deleted successfully',
      deletedProspectId: id
    }, 200, event);

  } catch (error) {
    console.error('Error deleting prospect:', error);

    // Handle record not found error
    if (error.code === 'P2025') {
      return createErrorResponse('Prospect not found', 404, event);
    }

    // Handle foreign key constraint error (prospect is referenced by other records)
    if (error.code === 'P2003') {
      return createErrorResponse('Cannot delete prospect as it is referenced by other records (campaigns, emails, etc.)', 400, event);
    }

    return createErrorResponse('Internal server error', 500, event);
  } finally {
    // Disconnect Prisma client in serverless environment
    await prisma.$disconnect();
  }
};