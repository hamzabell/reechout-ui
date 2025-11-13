const { PrismaClient } = require('@prisma/client');
const { createCorsResponse, createSuccessResponse, createErrorResponse } = require('./utils/cors');

// Initialize Prisma Client for serverless environment
const prisma = new PrismaClient();

exports.handler = async (event, context) => {
  // Handle CORS preflight request
  if (event.httpMethod === 'OPTIONS') {
    return createCorsResponse(event);
  }

  // Only allow PUT requests
  if (event.httpMethod !== 'PUT') {
    return createErrorResponse('Method not allowed', 405, event);
  }

  try {
    const { sequenceId, userId, stepOrder } = JSON.parse(event.body);

    if (!sequenceId || !userId) {
      return createErrorResponse('Sequence ID and User ID are required', 400, event);
    }

    if (!stepOrder || !Array.isArray(stepOrder)) {
      return createErrorResponse('Step order is required and must be an array', 400, event);
    }

    // Validate that the sequence exists and user has permission
    const sequence = await prisma.sequence.findUnique({
      where: { id: sequenceId }
    });

    if (!sequence) {
      return createErrorResponse('Sequence not found', 404, event);
    }

    if (sequence.createdBy !== userId) {
      return createErrorResponse('You do not have permission to reorder steps in this sequence', 403, event);
    }

    // Validate that all step IDs exist and belong to the sequence
    const existingSteps = await prisma.sequenceStep.findMany({
      where: { sequenceId },
      select: { id: true }
    });

    const existingStepIds = existingSteps.map(step => step.id);
    const providedStepIds = stepOrder.map(item => item.stepId);

    // Check if all provided step IDs exist in the sequence
    const invalidStepIds = providedStepIds.filter(id => !existingStepIds.includes(id));
    if (invalidStepIds.length > 0) {
      return createErrorResponse(`Invalid step IDs: ${invalidStepIds.join(', ')}`, 400, event);
    }

    // Check if all sequence steps are included in the reorder
    const missingStepIds = existingStepIds.filter(id => !providedStepIds.includes(id));
    if (missingStepIds.length > 0) {
      return createErrorResponse(`Missing step IDs in reorder: ${missingStepIds.join(', ')}`, 400, event);
    }

    // Validate no duplicate step IDs
    const duplicateStepIds = providedStepIds.filter((id, index) => providedStepIds.indexOf(id) !== index);
    if (duplicateStepIds.length > 0) {
      return createErrorResponse(`Duplicate step IDs: ${[...new Set(duplicateStepIds)].join(', ')}`, 400, event);
    }

    // Validate day numbers are positive integers and sequential
    const sortedStepOrder = stepOrder
      .map(item => ({ stepId: item.stepId, day: parseInt(item.day) }))
      .sort((a, b) => a.day - b.day);

    // Check for valid day numbers
    for (let i = 0; i < sortedStepOrder.length; i++) {
      const expectedDay = i + 1;
      if (sortedStepOrder[i].day !== expectedDay) {
        return createErrorResponse(`Day numbers must be sequential starting from 1. Expected day ${expectedDay} for step ${sortedStepOrder[i].stepId}, got ${sortedStepOrder[i].day}`, 400, event);
      }
    }

    // Perform the reordering in a transaction to ensure data consistency
    const updatedSteps = await prisma.$transaction(
      stepOrder.map(item =>
        prisma.sequenceStep.update({
          where: { id: item.stepId },
          data: { day: parseInt(item.day) },
          include: {
            emailAction: {
              include: {
                template: {
                  select: {
                    id: true,
                    name: true,
                    subject: true,
                    body: true
                  }
                }
              }
            },
            taskAction: true
          }
        })
      )
    );

    // Sort the updated steps by day number
    updatedSteps.sort((a, b) => a.day - b.day);

    // Transform the response to match frontend expectations
    const transformedSteps = updatedSteps.map(step => ({
      id: step.id,
      day: step.day,
      name: `Day ${step.day}`,
      description: null,
      emailAction: step.emailAction ? {
        id: step.emailAction.id,
        templateId: step.emailAction.templateId,
        customSubject: step.emailAction.customSubject,
        customBody: step.emailAction.customBody,
        enablePersonalization: step.emailAction.enablePersonalization,
        template: step.emailAction.template
      } : null,
      taskAction: step.taskAction ? {
        id: step.taskAction.id,
        taskType: inferTaskType(step.taskAction.taskTitle),
        customTitle: step.taskAction.taskTitle,
        linkedinDescription: step.taskAction.taskDescription,
        whatsappDescription: step.taskAction.taskDescription,
        callDescription: step.taskAction.taskDescription,
        customDescription: step.taskAction.taskDescription,
        enableEmailNotification: step.taskAction.enableEmailNotification
      } : null
    }));

    return createSuccessResponse({
      steps: transformedSteps,
      message: 'Steps reordered successfully'
    }, 200, event);

  } catch (error) {
    console.error('Error reordering sequence steps:', error);

    // Handle specific database errors
    if (error.code === 'P2025') {
      return createErrorResponse('Step or sequence not found', 404, event);
    }

    if (error.code === 'P2002') {
      return createErrorResponse('Duplicate day number detected', 409, event);
    }

    if (error.code === 'P2003') {
      return createErrorResponse('Invalid step reference', 400, event);
    }

    // Handle transaction errors
    if (error.message.includes('transaction')) {
      return createErrorResponse('Failed to complete step reordering', 500, event);
    }

    return createErrorResponse('Internal server error', 500, event);
  } finally {
    // Disconnect Prisma client in serverless environment
    await prisma.$disconnect();
  }
};

/**
 * Infer task type from task title
 */
function inferTaskType(taskTitle) {
  if (!taskTitle) return 'custom';

  const title = taskTitle.toLowerCase();
  if (title.includes('linkedin')) return 'linkedin';
  if (title.includes('whatsapp')) return 'whatsapp';
  if (title.includes('call')) return 'call';

  return 'custom';
}