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
    const { neonUser } = JSON.parse(event.body);

    if (!neonUser || !neonUser.id) {
      return addCorsHeaders({
        statusCode: 400,
        body: JSON.stringify({ error: 'neonUser with id is required' })
      });
    }

    // Handle different user metadata structures
    const metadata = neonUser.clientMetadata || neonUser.user_metadata || {};

    // Create user profile in database
    const userProfile = await prisma.user.create({
      data: {
        neonUserId: neonUser.id,
        email: neonUser.primaryEmail || neonUser.email,
        name: neonUser.displayName || neonUser.name || '',
        company: metadata.company || null,
        title: metadata.title || null,
        emailConfirmed: neonUser.emailVerified || false,
        isActive: true,
        lastLoginAt: new Date(),
      },
    });

    return addCorsHeaders({
      statusCode: 201,
      body: JSON.stringify({ userProfile })
    });

  } catch (error) {
    console.error('Error creating user profile:', error);

    // Handle unique constraint error (user already exists)
    if (error.code === 'P2002') {
      // User already exists, get existing profile
      try {
        const existingProfile = await prisma.user.findUnique({
          where: { neonUserId: neonUser.id }
        });

        if (existingProfile) {
          return addCorsHeaders({
            statusCode: 200,
            body: JSON.stringify({ userProfile: existingProfile })
          });
        }
      } catch (fetchError) {
        console.error('Error fetching existing profile:', fetchError);
      }
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
