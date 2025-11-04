const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.handler = async (event, context) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      },
      body: '',
    };
  }

  try {
    const { httpMethod, path } = event;
    const userId = event.headers.authorization?.replace('Bearer ', '');

    // Verify user authentication (simplified - you should implement proper JWT verification)
    if (!userId) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    switch (httpMethod) {
      case 'GET':
        return await getTemplates(userId, event.queryStringParameters);
      case 'POST':
        return await createTemplate(userId, JSON.parse(event.body));
      default:
        return {
          statusCode: 405,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }
  } catch (error) {
    console.error('Templates API error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

async function getTemplates(userId, queryParams) {
  try {
    const { category, page = 1, limit = 50 } = queryParams;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      createdBy: userId,
      isActive: true,
      ...(category && { category }),
    };

    const [templates, total] = await Promise.all([
      prisma.emailTemplate.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
        include: {
          creator: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      prisma.emailTemplate.count({ where }),
    ]);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        templates,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      }),
    };
  } catch (error) {
    console.error('Get templates error:', error);
    throw error;
  }
}

async function createTemplate(userId, templateData) {
  try {
    const { name, subject, body, variables = [], category } = templateData;

    if (!name || !subject || !body) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Name, subject, and body are required' }),
      };
    }

    const template = await prisma.emailTemplate.create({
      data: {
        name,
        subject,
        body,
        variables,
        category,
        createdBy: userId,
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(template),
    };
  } catch (error) {
    console.error('Create template error:', error);
    throw error;
  }
}