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
    console.log('Starting scheduled status migration...');

    // Step 1: Add SCHEDULED to the SequenceStatus enum if it doesn't exist
    try {
      await prisma.$executeRaw`ALTER TYPE "SequenceStatus" ADD VALUE IF NOT EXISTS 'SCHEDULED'`;
      console.log('✓ Added SCHEDULED to SequenceStatus enum');
    } catch (error) {
      if (error.code === '42710') {
        console.log('✓ SCHEDULED already exists in enum');
      } else {
        throw error;
      }
    }

    // Step 2: Add scheduledAt column to campaigns table if it doesn't exist
    try {
      // Check if column exists first
      const columnCheck = await prisma.$queryRaw`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'campaigns'
        AND column_name = 'scheduledAt'
      `;

      if (columnCheck.length === 0) {
        await prisma.$executeRaw`ALTER TABLE "campaigns" ADD COLUMN "scheduledAt" TIMESTAMP NULL`;
        console.log('✓ Added scheduledAt column to campaigns table');
      } else {
        console.log('✓ scheduledAt column already exists');
      }
    } catch (error) {
      console.error('Error adding scheduledAt column:', error);
      throw error;
    }

    console.log('✅ Scheduled status migration completed successfully!');

    return createSuccessResponse({
      message: 'Scheduled status migration completed successfully',
      operations: [
        'Added SCHEDULED to SequenceStatus enum',
        'Added scheduledAt column to campaigns table'
      ]
    }, 200, event);

  } catch (error) {
    console.error('❌ Error in scheduled status migration:', error);

    return createErrorResponse(
      `Scheduled status migration failed: ${error.message}`,
      500,
      event
    );
  } finally {
    // Disconnect Prisma client in serverless environment
    await prisma.$disconnect();
  }
};