const { PrismaClient } = require('@prisma/client');

// Initialize Prisma Client for serverless environment
const prisma = new PrismaClient();

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { templateId, userId, newName } = JSON.parse(event.body);

    // Validate required fields
    if (!templateId || !userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Missing required fields: templateId, userId'
        })
      };
    }

    // Validate user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'User not found' })
      };
    }

    // Find the original template
    const originalTemplate = await prisma.emailTemplate.findUnique({
      where: { id: templateId }
    });

    if (!originalTemplate) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Original template not found' })
      };
    }

    // Check if user has permission to duplicate this template
    if (originalTemplate.createdBy !== userId) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          error: 'You do not have permission to duplicate this template'
        })
      };
    }

    // Create the duplicated template
    const duplicatedTemplate = await prisma.emailTemplate.create({
      data: {
        name: newName || `${originalTemplate.name} (Copy)`,
        subject: originalTemplate.subject,
        body: originalTemplate.body,
        variables: [...originalTemplate.variables],
        createdBy: userId
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

    return {
      statusCode: 201,
      body: JSON.stringify({ template: duplicatedTemplate })
    };

  } catch (error) {
    console.error('Error duplicating template:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  } finally {
    // Disconnect Prisma client in serverless environment
    await prisma.$disconnect();
  }
};