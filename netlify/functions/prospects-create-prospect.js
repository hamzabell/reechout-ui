const { PrismaClient } = require('@prisma/client');
const { handleCors, addCorsHeaders } = require('./cors-helper');

// Initialize Prisma Client for serverless environment
const prisma = new PrismaClient();

exports.handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return handleCors();
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return addCorsHeaders({
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    });
  }

  try {
    const prospectData = JSON.parse(event.body);

    // Validate required fields
    if (!prospectData.name || !prospectData.email || !prospectData.userId) {
      return addCorsHeaders({
        statusCode: 400,
        body: JSON.stringify({
          error: 'Missing required fields: name, email, userId'
        })
      });
    }

    // Check if prospect with this email already exists for this user
    const existingProspect = await prisma.prospect.findFirst({
      where: {
        email: prospectData.email,
        createdBy: prospectData.userId
      }
    });

    if (existingProspect) {
      return addCorsHeaders({
        statusCode: 409,
        body: JSON.stringify({
          error: 'A prospect with this email already exists'
        })
      });
    }

    // Validate user exists
    const user = await prisma.user.findUnique({
      where: { id: prospectData.userId }
    });

    if (!user) {
      return addCorsHeaders({
        statusCode: 404,
        body: JSON.stringify({ error: 'User not found' })
      });
    }

    // Create the prospect
    const newProspect = await prisma.prospect.create({
      data: {
        name: prospectData.name,
        email: prospectData.email,
        company: prospectData.company || null,
        title: prospectData.title || null,
        website: prospectData.website || null,
        industry: prospectData.industry || null,
        linkedinProfile: prospectData.linkedinProfile || null,
        phoneNumber: prospectData.phoneNumber || null,
        location: prospectData.location || null,
        notes: prospectData.notes || null,
        researchData: prospectData.researchData || null,
        source: prospectData.source || null,
        isOptedOut: prospectData.isOptedOut || false,
        tags: prospectData.tags || [],
        status: prospectData.status || 'NEW',
        createdBy: prospectData.userId,
        // Add new fields with defaults if not provided
        score: prospectData.score || 50,
        lastContacted: prospectData.lastContacted || null,
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
      body: JSON.stringify({ prospect: newProspect })
    });

  } catch (error) {
    console.error('Error creating prospect:', error);

    // Handle unique constraint error
    if (error.code === 'P2002') {
      return addCorsHeaders({
        statusCode: 409,
        body: JSON.stringify({
          error: 'A prospect with this email already exists'
        })
      });
    }

    // Handle foreign key constraint error
    if (error.code === 'P2003') {
      return addCorsHeaders({
        statusCode: 400,
        body: JSON.stringify({
          error: 'Invalid user ID provided'
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