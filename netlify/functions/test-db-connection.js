const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

exports.handler = async (event, context) => {
  try {
    // Test the database connection and check what fields are available
    const testProspect = await prisma.campaignProspect.findFirst({
      take: 1
    });

    console.log('Sample campaign prospect:', testProspect);

    // Test the pauseAt field specifically
    const testWithPausedAt = await prisma.campaignProspect.findFirst({
      take: 1,
      select: {
        id: true,
        pausedAt: true,
        status: true
      }
    });

    console.log('Test with pausedAt:', testWithPausedAt);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: JSON.stringify({
        success: true,
        message: 'Database connection test successful',
        data: {
          sampleProspect: testProspect,
          pausedAtTest: testWithPausedAt
        }
      })
    };
  } catch (error) {
    console.error('Database test error:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: JSON.stringify({
        error: 'Database test failed',
        details: error.message
      })
    };
  } finally {
    await prisma.$disconnect();
  }
};