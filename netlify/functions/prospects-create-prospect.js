require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { handleCors, addCorsHeaders } = require('./cors-helper');

// Initialize Prisma Client for serverless environment
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

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

    // Check if prospect with same email already exists for this specific user
    // Use a more robust approach with proper error handling
    let existingProspect = null;

    try {
      console.log('Checking for duplicate prospect:', {
        email: prospectData.email.toLowerCase(),
        userId: prospectData.userId
      });

      // Try to find existing prospect with retry logic
      existingProspect = await prisma.prospect.findFirst({
        where: {
          email: prospectData.email.toLowerCase(),
          createdBy: prospectData.userId
        }
      });

      console.log('Duplicate check result:', {
        email: prospectData.email.toLowerCase(),
        userId: prospectData.userId,
        found: !!existingProspect,
        prospect: existingProspect
      });

      if (existingProspect) {
        return addCorsHeaders({
          statusCode: 409,
          body: JSON.stringify({
            error: `Prospect with email ${prospectData.email} already exists in your account`,
            existingProspectId: existingProspect.id
          })
        });
      }
    } catch (dbError) {
      console.error('Database error during duplicate check:', dbError);
      // If we can't check for duplicates due to database issues,
      // let the database constraint handle it during creation
      console.log('Proceeding with prospect creation - database will handle duplicates via constraint');
    }

    // Create the prospect - filter out unknown fields
    const { score, lastContacted, ...validProspectData } = prospectData;

    const newProspect = await prisma.prospect.create({
      data: {
        name: validProspectData.name,
        email: validProspectData.email,
        company: validProspectData.company || null,
        title: validProspectData.title || null,
        website: validProspectData.website || null,
        industry: validProspectData.industry || null,
        linkedinProfile: validProspectData.linkedinProfile || null,
        phoneNumber: validProspectData.phoneNumber || null,
        location: validProspectData.location || null,
        notes: validProspectData.notes || null,
        researchData: validProspectData.researchData || null,
        source: validProspectData.source || null,
        isOptedOut: validProspectData.isOptedOut || false,
        tags: validProspectData.tags || [],
        status: validProspectData.status || 'NEW',
        createdBy: validProspectData.userId,
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
    // Only log unexpected errors, not duplicate constraint errors
    if (error.code !== 'P2002') {
      console.error('Error creating prospect:', error);
    }

    // Handle unique constraint error (this should be caught by our explicit check above, but as a fallback)
    if (error.code === 'P2002') {
      // Extract field information from the error if available
      const targetField = error.meta?.target?.[0] || 'email';
      return addCorsHeaders({
        statusCode: 409,
        body: JSON.stringify({
          error: `Duplicate prospect detected. A prospect with this ${targetField} already exists for your account.`,
          details: 'This prospect was not added to avoid duplicates in your database.'
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
