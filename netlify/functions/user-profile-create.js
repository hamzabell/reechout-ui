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

  let neonUser = null;

  try {
    const requestData = JSON.parse(event.body);
    neonUser = requestData.neonUser;

    if (!neonUser || !neonUser.id) {
      return addCorsHeaders({
        statusCode: 400,
        body: JSON.stringify({ error: 'neonUser with id is required' })
      });
    }

    // Handle different user metadata structures and form data
    const metadata = neonUser.clientMetadata || neonUser.user_metadata || {};
    const formData = neonUser.formData || {};

    // Check if user already exists by neonUserId
    const existingUser = await prisma.user.findUnique({
      where: { neonUserId: neonUser.id }
    });

    if (existingUser) {
      console.log(`User ${neonUser.id} already exists, returning existing profile`);
      return addCorsHeaders({
        statusCode: 200,
        body: JSON.stringify({ userProfile: existingUser })
      });
    }

    // Check if user exists by email (handle unique constraint)
    const userEmail = neonUser.primaryEmail || neonUser.email;
    if (userEmail) {
      const existingEmailUser = await prisma.user.findUnique({
        where: { email: userEmail }
      });

      if (existingEmailUser) {
        console.log(`User with email ${userEmail} already exists, updating neonUserId`);
        // Update existing user with the new neonUserId
        const updatedUser = await prisma.user.update({
          where: { email: userEmail },
          data: {
            neonUserId: neonUser.id,
            name: formData.name || neonUser.displayName || neonUser.name || existingUser?.name,
            company: formData.company || metadata.company || existingUser?.company,
            title: formData.title || metadata.title || existingUser?.title,
            emailConfirmed: neonUser.emailVerified || existingUser?.emailConfirmed,
            isActive: true,
            lastLoginAt: new Date(),
            updatedAt: new Date(),
          }
        });

        return addCorsHeaders({
          statusCode: 200,
          body: JSON.stringify({ userProfile: updatedUser })
        });
      }
    }

    // Create new user profile in database
    const userProfile = await prisma.user.create({
      data: {
        neonUserId: neonUser.id,
        email: userEmail,
        name: formData.name || neonUser.displayName || neonUser.name || '',
        company: formData.company || metadata.company || null,
        title: formData.title || metadata.title || null,
        emailConfirmed: neonUser.emailVerified || false,
        isActive: true,
        lastLoginAt: new Date(),
      },
    });

    console.log(`Successfully created user profile for ${neonUser.id}`);
    return addCorsHeaders({
      statusCode: 201,
      body: JSON.stringify({ userProfile })
    });

  } catch (error) {
    console.error('Error creating user profile:', error);

    // Handle unique constraint error (user already exists)
    if (error.code === 'P2002') {
      console.log('Unique constraint violated, attempting to find existing user');

      if (neonUser && neonUser.id) {
        try {
          // Try to find by neonUserId first
          let existingProfile = await prisma.user.findUnique({
            where: { neonUserId: neonUser.id }
          });

          if (!existingProfile && neonUser.email) {
            // If not found by neonUserId, try by email
            existingProfile = await prisma.user.findUnique({
              where: { email: neonUser.email }
            });
          }

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
    }

    return addCorsHeaders({
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    });
  } finally {
    // Disconnect Prisma client in serverless environment
    await prisma.$disconnect();
  }
};
