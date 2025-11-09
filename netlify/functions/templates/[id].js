const { PrismaClient } = require('@prisma/client');

// Initialize Prisma Client for serverless environment
const prisma = new PrismaClient();

exports.handler = async (event, context) => {
  try {
    // Extract template ID from path parameters
    const templateId = event.pathParameters?.id;

    if (!templateId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Template ID is required' })
      };
    }

    if (event.httpMethod === 'GET') {
      // Handle GET request - fetch a single template
      const template = await prisma.emailTemplate.findUnique({
        where: { id: templateId },
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

      if (!template) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Template not found' })
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ template })
      };

    } else if (event.httpMethod === 'PUT') {
      // Handle PUT request - update a template
      const { userId, ...updateData } = JSON.parse(event.body);

      if (!userId) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'userId is required' })
        };
      }

      // First check if the template exists and belongs to the user
      const existingTemplate = await prisma.emailTemplate.findFirst({
        where: {
          id: templateId,
          createdBy: userId
        }
      });

      if (!existingTemplate) {
        return {
          statusCode: 404,
          body: JSON.stringify({
            error: 'Template not found or you do not have permission to update it'
          })
        };
      }

      // Validate required fields if they're being updated
      if (updateData.name !== undefined && !updateData.name) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Template name is required' })
        };
      }

      if (updateData.subject !== undefined && !updateData.subject) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Template subject is required' })
        };
      }

      if (updateData.body !== undefined && !updateData.body) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Template body is required' })
        };
      }

      // Update the template
      const updatedTemplate = await prisma.emailTemplate.update({
        where: { id: templateId },
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

      return {
        statusCode: 200,
        body: JSON.stringify({ template: updatedTemplate })
      };

    } else if (event.httpMethod === 'DELETE') {
      // Handle DELETE request - delete a template
      const { userId } = JSON.parse(event.body);

      if (!userId) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'userId is required' })
        };
      }

      // First check if the template exists and belongs to the user
      const existingTemplate = await prisma.emailTemplate.findFirst({
        where: {
          id: templateId,
          createdBy: userId
        }
      });

      if (!existingTemplate) {
        return {
          statusCode: 404,
          body: JSON.stringify({
            error: 'Template not found or you do not have permission to delete it'
          })
        };
      }

      // Check if template is being used by any email actions
      const emailActionsUsingTemplate = await prisma.stepEmailAction.findMany({
        where: { templateId }
      });

      if (emailActionsUsingTemplate.length > 0) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: 'Cannot delete template as it is being used by campaign steps'
          })
        };
      }

      // Delete the template
      await prisma.emailTemplate.delete({
        where: { id: templateId }
      });

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Template deleted successfully',
          deletedTemplateId: templateId
        })
      };

    } else {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

  } catch (error) {
    console.error('Error in template operations:', error);

    // Handle record not found error
    if (error.code === 'P2025') {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Template not found' })
      };
    }

    // Handle foreign key constraint error
    if (error.code === 'P2003') {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Cannot perform operation due to related records'
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