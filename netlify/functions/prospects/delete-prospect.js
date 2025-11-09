const { PrismaClient } = require('@prisma/client');

// Initialize Prisma Client for serverless environment
const prisma = new PrismaClient();

exports.handler = async (event, context) => {
  // Only allow DELETE requests
  if (event.httpMethod !== 'DELETE') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { id, userId } = JSON.parse(event.body);

    // Validate required fields
    if (!id || !userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Missing required fields: id, userId'
        })
      };
    }

    // First check if the prospect exists and belongs to the user
    const existingProspect = await prisma.prospect.findFirst({
      where: {
        id,
        createdBy: userId
      }
    });

    if (!existingProspect) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: 'Prospect not found or you do not have permission to delete it'
        })
      };
    }

    // Delete the prospect
    await prisma.prospect.delete({
      where: { id }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Prospect deleted successfully',
        deletedProspectId: id
      })
    };

  } catch (error) {
    console.error('Error deleting prospect:', error);

    // Handle record not found error
    if (error.code === 'P2025') {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: 'Prospect not found'
        })
      };
    }

    // Handle foreign key constraint error (prospect is referenced by other records)
    if (error.code === 'P2003') {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Cannot delete prospect as it is referenced by other records (campaigns, emails, etc.)'
        })
      };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  } finally {
    // Disconnect Prisma client in serverless environment
    await prisma.$disconnect();
  }
};