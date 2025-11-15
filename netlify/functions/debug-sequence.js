const { PrismaClient } = require('@prisma/client');
const { createSuccessResponse, createErrorResponse } = require('./utils/cors');

exports.handler = async (event, context) => {
  console.log('Debug sequence lookup called');

  if (event.httpMethod !== 'POST') {
    return createErrorResponse('Method not allowed', 405);
  }

  try {
    const { sequenceId, userId } = JSON.parse(event.body || '{}');
    console.log('Looking for sequence:', sequenceId, 'for user:', userId);

    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });

    // Test 1: Find sequence without any filters
    const sequenceWithoutFilter = await prisma.sequence.findFirst({
      where: { id: sequenceId },
      select: { id: true, name: true, createdBy: true }
    });
    console.log('Sequence without filter:', sequenceWithoutFilter);

    // Test 2: Find sequence with createdBy filter
    const sequenceWithFilter = await prisma.sequence.findFirst({
      where: { id: sequenceId, createdBy: userId },
      select: { id: true, name: true, createdBy: true }
    });
    console.log('Sequence with filter:', sequenceWithFilter);

    // Test 3: Check what user sequences exist
    const userSequences = await prisma.sequence.findMany({
      where: { createdBy: userId },
      select: { id: true, name: true }
    });
    console.log('User sequences:', userSequences.map(s => ({ id: s.id, name: s.name })));

    await prisma.$disconnect();

    return createSuccessResponse({
      sequenceWithoutFilter,
      sequenceWithFilter,
      userSequences,
      userId,
      sequenceId
    });

  } catch (error) {
    console.error('Debug error:', error);
    return createErrorResponse(error.message, 500);
  }
};