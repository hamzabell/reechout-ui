const { PrismaClient } = require('@prisma/client');
const { createCorsResponse, createSuccessResponse, createErrorResponse } = require('../utils/cors');

// Initialize Prisma Client for serverless environment
const prisma = new PrismaClient();

exports.handler = async (event, context) => {
  // Handle CORS preflight request
  if (event.httpMethod === 'OPTIONS') {
    return createCorsResponse(event);
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return createErrorResponse('Method not allowed', 405, event);
  }

  try {
    const prospectData = JSON.parse(event.body);

    // Validate required fields
    if (!prospectData.name || !prospectData.email || !prospectData.userId) {
      return createErrorResponse('Missing required fields: name, email, userId', 400, event);
    }

    // Check if prospect with this email already exists for this user
    const existingProspect = await prisma.prospect.findFirst({
      where: {
        email: prospectData.email,
        createdBy: prospectData.userId
      }
    });

  
    if (existingProspect) {
      return createErrorResponse('A prospect with this email already exists for this user', 409, event);
    }

    // Validate user exists
    const user = await prisma.user.findUnique({
      where: { id: prospectData.userId }
    });

    if (!user) {
      return createErrorResponse('User not found', 404, event);
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

    // Add _count for frontend compatibility
    const prospectWithCount = {
      ...newProspect,
      _count: {
        campaignProspects: 0
      }
    };

    return createSuccessResponse({ prospect: prospectWithCount }, 201, event);

  } catch (error) {
    console.error('Error creating prospect:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      meta: error.meta,
      prospectData: {
        email: prospectData.email,
        userId: prospectData.userId,
        name: prospectData.name
      }
    });

    // Handle unique constraint error
    if (error.code === 'P2002') {
      // Check if the constraint violation is for the [email, createdBy] unique constraint
      const target = error.meta?.target;
      if (target && Array.isArray(target) && target.includes('email')) {
        return createErrorResponse('A prospect with this email already exists for this user', 409, event);
      }
      return createErrorResponse('Unique constraint violation', 409, event);
    }

    // Handle foreign key constraint error
    if (error.code === 'P2003') {
      return createErrorResponse('Invalid user ID provided', 400, event);
    }

    return createErrorResponse('Internal server error', 500, event);
  } finally {
    // Disconnect Prisma client in serverless environment
    await prisma.$disconnect();
  }
};
