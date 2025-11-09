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
    const { neonUserId, updates } = JSON.parse(event.body);

    if (!neonUserId) {
      return addCorsHeaders({
        statusCode: 400,
        body: JSON.stringify({ error: 'neonUserId is required' })
      });
    }

    if (!updates || typeof updates !== 'object') {
      return addCorsHeaders({
        statusCode: 400,
        body: JSON.stringify({ error: 'updates object is required' })
      });
    }

    // Validate allowed fields
    const allowedFields = ['name', 'company', 'title'];
    const invalidFields = Object.keys(updates).filter(field => !allowedFields.includes(field));
    
    if (invalidFields.length > 0) {
      return addCorsHeaders({
        statusCode: 400,
        body: JSON.stringify({ 
          error: `Invalid fields: ${invalidFields.join(', ')}. Only allowed fields: ${allowedFields.join(', ')}` 
        })
      });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { neonUserId: neonUserId }
    });

    if (!existingUser) {
      return addCorsHeaders({
        statusCode: 404,
        body: JSON.stringify({ error: 'User profile not found' })
      });
    }

    // Prepare update data with only valid, non-empty fields
    const updateData = {};
    allowedFields.forEach(field => {
      if (updates[field] !== undefined && updates[field] !== null && updates[field] !== '') {
        updateData[field] = updates[field];
      }
    });

    // Add updatedAt timestamp
    updateData.updatedAt = new Date();

    // If no valid fields to update, return current user data
    if (Object.keys(updateData).length === 1) { // Only updatedAt
      return addCorsHeaders({
        statusCode: 200,
        body: JSON.stringify({ 
          userProfile: existingUser,
          message: 'No valid fields to update'
        })
      });
    }

    // Update user profile
    const updatedProfile = await prisma.user.update({
      where: { neonUserId: neonUserId },
      data: updateData
    });

    console.log(`Successfully updated profile for user ${neonUserId}:`, {
      updatedFields: Object.keys(updateData).filter(key => key !== 'updatedAt'),
      updatedProfile: {
        id: updatedProfile.id,
        name: updatedProfile.name,
        company: updatedProfile.company,
        title: updatedProfile.title,
        updatedAt: updatedProfile.updatedAt
      }
    });

    return addCorsHeaders({
      statusCode: 200,
      body: JSON.stringify({ 
        userProfile: updatedProfile,
        message: 'Profile updated successfully'
      })
    });

  } catch (error) {
    console.error('Error updating user profile:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2025') {
      return addCorsHeaders({
        statusCode: 404,
        body: JSON.stringify({ error: 'User profile not found' })
      });
    }

    if (error.code === 'P2002') {
      return addCorsHeaders({
        statusCode: 409,
        body: JSON.stringify({ error: 'Unique constraint violation' })
      });
    }

    return addCorsHeaders({
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: 'Failed to update user profile'
      })
    });
  } finally {
    // Disconnect Prisma client in serverless environment
    await prisma.$disconnect();
  }
};
