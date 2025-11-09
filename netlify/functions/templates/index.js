const { PrismaClient } = require('@prisma/client');
const { handleCors, addCorsHeaders } = require('../cors-helper');

// Initialize Prisma Client for serverless environment
const prisma = new PrismaClient();

exports.handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return handleCors();
  }

  try {
    if (event.httpMethod === 'GET') {
      // Handle GET request - fetch all templates for a user
      const userId = event.queryStringParameters?.userId;

      if (!userId) {
        return addCorsHeaders({
          statusCode: 400,
          body: JSON.stringify({ error: 'userId is required' })
        });
      }

      // Validate user exists
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return addCorsHeaders({
          statusCode: 404,
          body: JSON.stringify({ error: 'User not found' })
        });
      }

      const templates = await prisma.emailTemplate.findMany({
        where: {
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
        },
        orderBy: {
          updatedAt: 'desc'
        }
      });

      return addCorsHeaders({
        statusCode: 200,
        body: JSON.stringify({ templates })
      });

    } else if (event.httpMethod === 'POST') {
      // Handle POST request - create a new template
      const templateData = JSON.parse(event.body);

      // Validate required fields
      if (!templateData.name || !templateData.subject || !templateData.body || !templateData.userId) {
        return addCorsHeaders({
          statusCode: 400,
          body: JSON.stringify({
            error: 'Missing required fields: name, subject, body, userId'
          })
        });
      }

      // Validate user exists
      const user = await prisma.user.findUnique({
        where: { id: templateData.userId }
      });

      if (!user) {
        return addCorsHeaders({
          statusCode: 404,
          body: JSON.stringify({ error: 'User not found' })
        });
      }

      // Create the template
      const newTemplate = await prisma.emailTemplate.create({
        data: {
          name: templateData.name,
          subject: templateData.subject,
          body: templateData.body,
          variables: templateData.variables || [],
          createdBy: templateData.userId
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
        statusCode: 201,
        body: JSON.stringify({ template: newTemplate })
      });

    } else if (event.httpMethod === 'PUT') {
      // Handle PUT request - update an existing template
      const templateData = JSON.parse(event.body);

      // Validate required fields
      if (!templateData.id || !templateData.name || !templateData.subject || !templateData.body) {
        return addCorsHeaders({
          statusCode: 400,
          body: JSON.stringify({
            error: 'Missing required fields: id, name, subject, body'
          })
        });
      }

      // Check if template exists
      const existingTemplate = await prisma.emailTemplate.findUnique({
        where: { id: templateData.id }
      });

      if (!existingTemplate) {
        return addCorsHeaders({
          statusCode: 404,
          body: JSON.stringify({ error: 'Template not found' })
        });
      }

      // Update the template
      const updatedTemplate = await prisma.emailTemplate.update({
        where: { id: templateData.id },
        data: {
          name: templateData.name,
          subject: templateData.subject,
          body: templateData.body,
          variables: templateData.variables || existingTemplate.variables
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
        body: JSON.stringify({ template: updatedTemplate })
      });

    } else if (event.httpMethod === 'DELETE') {
      // Handle DELETE request - delete a template
      const templateData = JSON.parse(event.body);

      // Validate required fields
      if (!templateData.id || !templateData.userId) {
        return addCorsHeaders({
          statusCode: 400,
          body: JSON.stringify({
            error: 'Missing required fields: id, userId'
          })
        });
      }

      // Check if template exists and belongs to the user
      const existingTemplate = await prisma.emailTemplate.findFirst({
        where: {
          id: templateData.id,
          createdBy: templateData.userId
        }
      });

      if (!existingTemplate) {
        return addCorsHeaders({
          statusCode: 404,
          body: JSON.stringify({
            error: 'Template not found or you do not have permission to delete it'
          })
        });
      }

      // Check if template is being used by any email actions
      const emailActionsUsingTemplate = await prisma.stepEmailAction.findMany({
        where: { templateId: templateData.id }
      });

      if (emailActionsUsingTemplate.length > 0) {
        return addCorsHeaders({
          statusCode: 400,
          body: JSON.stringify({
            error: 'Cannot delete template as it is being used by campaign steps'
          })
        });
      }

      // Delete the template
      await prisma.emailTemplate.delete({
        where: { id: templateData.id }
      });

      return addCorsHeaders({
        statusCode: 200,
        body: JSON.stringify({
          message: 'Template deleted successfully',
          deletedTemplateId: templateData.id
        })
      });

    } else {
      return addCorsHeaders({
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' })
      });
    }

  } catch (error) {
    console.error('Error in templates endpoint:', error);

    return addCorsHeaders({
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    });
  } finally {
    // Disconnect Prisma client in serverless environment
    await prisma.$disconnect();
  }
};