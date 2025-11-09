const { PrismaClient } = require('@prisma/client');
const { handleCors, addCorsHeaders } = require('./cors-helper');

// Initialize Prisma Client for serverless environment
const prisma = new PrismaClient();

exports.handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return handleCors();
  }

  // Only allow PUT requests
  if (event.httpMethod !== 'PUT') {
    return addCorsHeaders({
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    });
  }

  try {
    const { id, userId, ...updateData } = JSON.parse(event.body);

    // Validate required fields
    if (!id || !userId) {
      return addCorsHeaders({
        statusCode: 400,
        body: JSON.stringify({
          error: 'Missing required fields: id, userId'
        })
      });
    }

    // First check if the prospect exists and belongs to the user
    const existingProspect = await prisma.prospect.findFirst({
      where: {
        id,
        createdBy: userId
      }
    });

    if (!existingProspect) {
      return addCorsHeaders({
        statusCode: 404,
        body: JSON.stringify({
          error: 'Prospect not found or you do not have permission to update it'
        })
      });
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
        return addCorsHeaders({
          statusCode: 409,
          body: JSON.stringify({
            error: 'Another prospect with this email already exists'
          })
        });
      }
    }

    // Validate status if provided
    if (updateData.status) {
      const validStatuses = ['NEW', 'CONTACTED', 'ENGAGED', 'REPLIED', 'INTERESTED', 'NOT_INTERESTED', 'OPTED_OUT', 'CONVERTED', 'BOUNCED'];
      if (!validStatuses.includes(updateData.status)) {
        return addCorsHeaders({
          statusCode: 400,
          body: JSON.stringify({
            error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
          })
        });
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

    return addCorsHeaders({
      statusCode: 200,
      body: JSON.stringify({ prospect: updatedProspect })
    });

  } catch (error) {
    console.error('Error updating prospect:', error);

    // Handle unique constraint error
    if (error.code === 'P2002') {
      return addCorsHeaders({
        statusCode: 409,
        body: JSON.stringify({
          error: 'A prospect with this email already exists'
        })
      });
    }

    // Handle record not found error
    if (error.code === 'P2025') {
      return addCorsHeaders({
        statusCode: 404,
        body: JSON.stringify({
          error: 'Prospect not found'
        })
      });
    }

    return addCorsHeaders({
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    });
  } finally {
    // Disconnect Prisma client in serverless environment
    await prisma.$disconnect();
  }
};