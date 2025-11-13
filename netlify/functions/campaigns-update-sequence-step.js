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
    const { sequenceId, stepId, userId, stepData } = JSON.parse(event.body);

    if (!sequenceId || !stepId || !userId) {
      return createErrorResponse('Sequence ID, Step ID, and User ID are required', 400, event);
    }

    if (!stepData) {
      return createErrorResponse('Step data is required', 400, event);
    }

    // Validate that the sequence exists and user has permission
    const sequence = await prisma.sequence.findUnique({
      where: { id: sequenceId }
    });

    if (!sequence) {
      return createErrorResponse('Sequence not found', 404, event);
    }

    if (sequence.createdBy !== userId) {
      return createErrorResponse('You do not have permission to update steps in this sequence', 403, event);
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

    // Get all steps in the sequence to determine if this is the first step
    const allSteps = await prisma.sequenceStep.findMany({
      where: { sequenceId },
      orderBy: { day: 'asc' }
    });

    const isFirstStep = allSteps.length > 0 && allSteps[0].id === stepId;

    // Validate day changes
    if (stepData.day !== undefined) {
      const newDay = stepData.day;

      // First step must be day 1
      if (isFirstStep && newDay !== 1) {
        return createErrorResponse('The first step in a sequence must be on day 1', 400, event);
      }

      // Subsequent steps must be > 1
      if (!isFirstStep && newDay === 1) {
        return createErrorResponse('Subsequent steps cannot be on day 1', 400, event);
      }

      // Check for day conflicts (excluding current step)
      const existingStepOnSameDay = await prisma.sequenceStep.findFirst({
        where: {
          sequenceId,
          day: newDay,
          id: { not: stepId } // Exclude current step from conflict check
        }
      });

      if (existingStepOnSameDay) {
        return createErrorResponse(`A step already exists on day ${newDay}. Please choose a different day.`, 409, event);
      }
    }

    // Prepare step update data
    const updateData = {};

    // Update basic step properties
    if (stepData.day !== undefined) {
      updateData.day = stepData.day;
    }
    // Note: name and description are not stored in database, handled in response

    // Handle email action updates
    if (stepData.emailAction !== undefined) {
      if (stepData.emailAction === null) {
        // Remove email action if explicitly set to null
        updateData.emailAction = {
          delete: true
        };
      } else {
        // Update or create email action
        const existingEmailAction = await prisma.stepEmailAction.findFirst({
          where: { stepId }
        });

        if (existingEmailAction) {
          // Update existing email action
          updateData.emailAction = {
            update: {
              templateId: stepData.emailAction.templateId,
              customSubject: stepData.emailAction.customSubject,
              customBody: stepData.emailAction.customBody,
              enablePersonalization: stepData.emailAction.enablePersonalization
            }
          };
        } else {
          // Create new email action
          updateData.emailAction = {
            create: {
              id: generateUUID(),
              templateId: stepData.emailAction.templateId,
              customSubject: stepData.emailAction.customSubject,
              customBody: stepData.emailAction.customBody,
              enablePersonalization: stepData.emailAction.enablePersonalization
            }
          };
        }
      }
    }

    // Handle task action updates
    if (stepData.taskAction !== undefined) {
      if (stepData.taskAction === null) {
        // Remove task action if explicitly set to null
        updateData.taskAction = {
          delete: true
        };
      } else {
        // Update or create task action
        const existingTaskAction = await prisma.stepTaskAction.findFirst({
          where: { stepId }
        });

        if (existingTaskAction) {
          // Update existing task action
          updateData.taskAction = {
            update: {
              taskTitle: getTaskTitle(stepData.taskAction),
              taskDescription: getTaskDescription(stepData.taskAction),
              enableEmailNotification: stepData.taskAction.enableEmailNotification
            }
          };
        } else {
          // Create new task action
          updateData.taskAction = {
            create: {
              id: generateUUID(),
              taskTitle: getTaskTitle(stepData.taskAction),
              taskDescription: getTaskDescription(stepData.taskAction),
              enableEmailNotification: stepData.taskAction.enableEmailNotification
            }
          };
        }
      }
    }

    // Update the step with its actions
    const updatedStep = await prisma.sequenceStep.update({
      where: { id: stepId },
      data: updateData,
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
    });

    // Transform the response to match frontend expectations
    const transformedStep = {
      id: updatedStep.id,
      day: updatedStep.day,
      name: stepData.name || `Day ${updatedStep.day}`,
      description: stepData.description || null,
      emailAction: updatedStep.emailAction ? {
        id: updatedStep.emailAction.id,
        templateId: updatedStep.emailAction.templateId,
        customSubject: updatedStep.emailAction.customSubject,
        customBody: updatedStep.emailAction.customBody,
        enablePersonalization: updatedStep.emailAction.enablePersonalization,
        template: updatedStep.emailAction.template
      } : null,
      taskAction: updatedStep.taskAction ? {
        id: updatedStep.taskAction.id,
        taskType: inferTaskType(updatedStep.taskAction.taskTitle),
        customTitle: updatedStep.taskAction.taskTitle,
        linkedinDescription: updatedStep.taskAction.taskDescription,
        whatsappDescription: updatedStep.taskAction.taskDescription,
        callDescription: updatedStep.taskAction.taskDescription,
        customDescription: updatedStep.taskAction.taskDescription,
        enableEmailNotification: updatedStep.taskAction.enableEmailNotification
      } : null
    };

    return createSuccessResponse({
      step: transformedStep,
      message: 'Step updated successfully'
    }, 200, event);

  } catch (error) {
    console.error('Error updating sequence step:', error);

    // Handle specific database errors
    if (error.code === 'P2002') {
      return createErrorResponse('A step with this identifier already exists', 409, event);
    }

    if (error.code === 'P2025') {
      return createErrorResponse('Step, sequence, or template not found', 404, event);
    }

    if (error.code === 'P2003') {
      return createErrorResponse('Invalid foreign key reference', 400, event);
    }

    return createErrorResponse('Internal server error', 500, event);
  } finally {
    // Disconnect Prisma client in serverless environment
    await prisma.$disconnect();
  }
};

/**
 * Generate UUID v4
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Extract task title from task action data
 */
function getTaskTitle(taskAction) {
  switch (taskAction.taskType) {
    case 'linkedin':
      return 'LinkedIn Connection';
    case 'whatsapp':
      return 'WhatsApp Message';
    case 'call':
      return 'Phone Call';
    case 'custom':
      return taskAction.customTitle || 'Custom Task';
    default:
      return 'Task';
  }
}

/**
 * Extract task description based on task type
 */
function getTaskDescription(taskAction) {
  switch (taskAction.taskType) {
    case 'linkedin':
      return taskAction.linkedinDescription || null;
    case 'whatsapp':
      return taskAction.whatsappDescription || null;
    case 'call':
      return taskAction.callDescription || null;
    case 'custom':
      return taskAction.customDescription || null;
    default:
      return null;
  }
}

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