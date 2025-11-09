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
    const prospectData = JSON.parse(event.body);

    // Validate required fields
    if (!prospectData.name || !prospectData.email || !prospectData.userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Missing required fields: name, email, userId'
        })
      };
    }

    // Check if prospect with this email already exists for this user
    const existingProspect = await prisma.prospect.findFirst({
      where: {
        email: prospectData.email,
        createdBy: prospectData.userId
      }
    });

    if (existingProspect) {
      return {
        statusCode: 409,
        body: JSON.stringify({
          error: 'A prospect with this email already exists'
        })
      };
    }

    // Validate user exists
    const user = await prisma.user.findUnique({
      where: { id: prospectData.userId }
    });

    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'User not found' })
      };
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

    return {
      statusCode: 201,
      body: JSON.stringify({ prospect: newProspect })
    };

  } catch (error) {
    console.error('Error creating prospect:', error);

    // Handle unique constraint error
    if (error.code === 'P2002') {
      return {
        statusCode: 409,
        body: JSON.stringify({
          error: 'A prospect with this email already exists'
        })
      };
    }

    // Handle foreign key constraint error
    if (error.code === 'P2003') {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Invalid user ID provided'
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