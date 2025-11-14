const { PrismaClient } = require('@prisma/client');
const { createCorsResponse, createSuccessResponse, createErrorResponse } = require('./utils/cors');

exports.handler = async (event, context) => {
  // Handle CORS preflight request
  if (event.httpMethod === 'OPTIONS') {
    return createCorsResponse(event);
  }

  // Only allow DELETE requests
  if (event.httpMethod !== 'DELETE') {
    return createErrorResponse('Method not allowed', 405, event);
  }

  let prisma;

  try {
    // Initialize Prisma Client for serverless environment
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });

    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('Database connection successful');

    const { sequenceId, stepId, userId } = JSON.parse(event.body);

    // Add test user ID fallback for development
    const effectiveUserId = userId || 'cmhv51b0w0000rq6hx1ho0s6a';

    if (!sequenceId || !stepId) {
      return createErrorResponse('Sequence ID and Step ID are required', 400, event);
    }

    // Validate that the sequence exists and user has permission
    const sequence = await prisma.sequence.findUnique({
      where: { id: sequenceId }
    });

    if (!sequence) {
      return createErrorResponse('Sequence not found', 404, event);
    }

    if (sequence.createdBy !== effectiveUserId) {
      return createErrorResponse('You do not have permission to delete steps from this sequence', 403, event);
    }

    // Validate that the step exists and belongs to the sequence
    const existingStep = await prisma.sequenceStep.findFirst({
      where: {
        id: stepId,
        sequenceId
      }
    });

    if (!existingStep) {
      return createErrorResponse('Step not found or does not belong to this sequence', 404, event);
    }

    // Get the day of the step being deleted
    const deletedStepDay = existingStep.day;

    // Check if there are any personalized emails or tasks generated from this step
    const emailActionsCount = await prisma.personalizedEmail.count({
      where: {
        stepEmailAction: {
          stepId: stepId
        }
      }
    });

    const tasksCount = await prisma.task.count({
      where: {
        stepTaskAction: {
          stepId: stepId
        }
      }
    });

    // If the step has generated emails or tasks, warn the user but proceed with deletion
    if (emailActionsCount > 0 || tasksCount > 0) {
      console.warn(`Deleting step ${stepId} that has ${emailActionsCount} personalized emails and ${tasksCount} tasks`);
    }

    // Delete the step first (cascade delete will handle related actions)
    await prisma.sequenceStep.delete({
      where: { id: stepId }
    });

    // Renumber remaining steps based on the position of the deleted step
    const remainingSteps = await prisma.sequenceStep.findMany({
      where: {
        sequenceId
      },
      orderBy: {
        day: 'asc'
      }
    });

    // Use a transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      for (const step of remainingSteps) {
        let newDay;

        // If we deleted Day 1, only the next sequential day becomes Day 1
        // All other days keep their original numbers
        if (deletedStepDay === 1) {
          // Find the smallest day number among remaining steps (this should be Day 2 in original)
          const smallestDay = Math.min(...remainingSteps.map(s => s.day));

          // Only the smallest day becomes Day 1, all others keep their day numbers
          if (step.day === smallestDay) {
            newDay = 1;
          } else {
            // Keep original day numbers for all other steps
            newDay = step.day;
          }
        }
        // If we deleted any other day, keep existing day numbers for steps before deleted day
        // and shift only steps after the deleted day up by 1
        else {
          if (step.day < deletedStepDay) {
            // Steps before the deleted day keep their original day numbers
            newDay = step.day;
          } else {
            // Steps after the deleted day shift up by 1
            newDay = step.day - 1;
          }
        }

        // Only update if the day actually changed
        if (newDay !== step.day && newDay > 0) {
          await tx.sequenceStep.update({
            where: { id: step.id },
            data: { day: newDay }
          });
        }
      }
    });

    // Get the updated count of remaining steps
    const updatedStepsCount = await prisma.sequenceStep.count({
      where: { sequenceId }
    });

    return createSuccessResponse({
      message: 'Step deleted successfully',
      deletedStepId: stepId,
      deletedStepDay: deletedStepDay,
      remainingStepsCount: updatedStepsCount,
      stepsReordered: remainingSteps.length > 0
    }, 200, event);

  } catch (error) {
    console.error('Error deleting sequence step:', error);

    // Handle specific database errors
    if (error.code === 'P2025') {
      return createErrorResponse('Step or sequence not found', 404, event);
    }

    if (error.code === 'P2003') {
      return createErrorResponse('Cannot delete step due to existing references', 400, event);
    }

    // Handle constraint violations
    if (error.message.includes('Foreign key constraint')) {
      return createErrorResponse('Cannot delete step as it has associated data', 400, event);
    }

    return createErrorResponse('Internal server error', 500, event);
  } finally {
    // Disconnect Prisma client in serverless environment
    if (prisma) {
      await prisma.$disconnect();
    }
  }
};
