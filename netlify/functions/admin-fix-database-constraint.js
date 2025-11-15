const { PrismaClient } = require('@prisma/client');
const { createCorsResponse, createSuccessResponse, createErrorResponse } = require('./utils/cors');

// Initialize Prisma Client for serverless environment
const prisma = new PrismaClient();

exports.handler = async (event, context) => {
  // Handle CORS preflight request
  if (event.httpMethod === 'OPTIONS') {
    return createCorsResponse(event);
  }

  // Only allow POST requests for this admin operation
  if (event.httpMethod !== 'POST') {
    return createErrorResponse('Method not allowed', 405, event);
  }

  try {
    console.log('Starting database constraint fix...');
    
    // Execute the SQL migration
    await prisma.$executeRaw`DROP INDEX IF EXISTS "prospects_email_key"`;
    console.log('✓ Dropped old global unique constraint on email');
    
    await prisma.$executeRaw`CREATE UNIQUE INDEX "prospects_email_createdBy_key" ON "prospects"("email", "createdBy")`;
    console.log('✓ Created new composite unique constraint on (email, createdBy)');
    
    console.log('✅ Database constraint fix completed successfully!');
    
    return createSuccessResponse({ 
      message: 'Database constraint fix completed successfully',
      operations: [
        'Dropped global unique constraint on email',
        'Created composite unique constraint on (email, createdBy)'
      ]
    }, 200, event);
    
  } catch (error) {
    console.error('❌ Error fixing database constraint:', error);
    
    // Handle specific PostgreSQL errors
    if (error.code === '42P07') {
      return createErrorResponse('Index already exists', 409, event);
    }
    
    if (error.code === '42704') {
      console.log('Index does not exist (this is okay for the DROP operation)');
      // Continue with create operation
    }
    
    return createErrorResponse(
      `Database constraint fix failed: ${error.message}`,
      500,
      event
    );
  } finally {
    // Disconnect Prisma client in serverless environment
    await prisma.$disconnect();
  }
};
