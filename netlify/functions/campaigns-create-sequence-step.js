const { PrismaClient } = require('@prisma/client');
const { createCorsResponse, createSuccessResponse, createErrorResponse } = require('./utils/cors');

// Initialize Prisma Client for serverless environment
const prisma = new PrismaClient();

/**
 * Generate UUID v4 for step ID
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

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
    const { sequenceId, userId, stepData } = JSON.parse(event.body);

    if (!sequenceId || !userId) {
      return createErrorResponse('Sequence ID and User ID are required', 400, event);
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
      return createErrorResponse('You do not have permission to add steps to this sequence', 403, event);
    }

    // Check if this is the first step in the sequence
    const existingStepsCount = await prisma.sequenceStep.count({
      where: { sequenceId }
    });

    // Validate day requirements
    const stepDay = stepData.day;

    // First step must be day 1
    if (existingStepsCount === 0 && stepDay !== 1) {
      return createErrorResponse('The first step in a sequence must be on day 1', 400, event);
    }

    // Subsequent steps must be > 1
    if (existingStepsCount > 0 && stepDay === 1) {
      return createErrorResponse('Subsequent steps cannot be on day 1', 400, event);
    }

    // Check for day conflicts
    const existingStepOnSameDay = await prisma.sequenceStep.findFirst({
      where: {
        sequenceId,
        day: stepDay
      }
    });

    if (existingStepOnSameDay) {
      return createErrorResponse(`A step already exists on day ${stepDay}. Please choose a different day.`, 409, event);
    }

    // Get the next step number (highest day + 1)
    const lastStep = await prisma.sequenceStep.findFirst({
      where: { sequenceId },
      orderBy: { day: 'desc' }
    });

    const nextDay = lastStep ? lastStep.day + 1 : 1;

    // Generate step ID
    const stepId = generateUUID();

    // Prepare step creation data
    const stepCreateData = {
      id: stepId,
      sequenceId,
      day: stepData.day || nextDay
    };

    // Include email action if provided
    if (stepData.emailAction) {
      stepCreateData.emailAction = {
        create: {
          id: generateUUID(),
          templateId: stepData.emailAction.templateId || null,
          customSubject: stepData.emailAction.customSubject || null,
          customBody: stepData.emailAction.customBody || null,
          enablePersonalization: stepData.emailAction.enablePersonalization || false
        }
      };
    }

    // Include task action if provided
    if (stepData.taskAction) {
      stepCreateData.taskAction = {
        create: {
          id: generateUUID(),
          taskTitle: getTaskTitle(stepData.taskAction),
          taskDescription: getTaskDescription(stepData.taskAction),
          enableEmailNotification: stepData.taskAction.enableEmailNotification || false
        }
      };
    }

    // Create the step with its actions
    const createdStep = await prisma.sequenceStep.create({
      data: stepCreateData,
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
      id: createdStep.id,
      day: createdStep.day,
      name: stepData.name || `Day ${createdStep.day}`,
      description: stepData.description || null,
      emailAction: createdStep.emailAction ? {
        id: createdStep.emailAction.id,
        templateId: createdStep.emailAction.templateId,
        customSubject: createdStep.emailAction.customSubject,
        customBody: createdStep.emailAction.customBody,
        enablePersonalization: createdStep.emailAction.enablePersonalization,
        template: createdStep.emailAction.template
      } : null,
      taskAction: createdStep.taskAction ? {
        id: createdStep.taskAction.id,
        taskType: inferTaskType(createdStep.taskAction.taskTitle),
        customTitle: createdStep.taskAction.taskTitle,
        linkedinDescription: createdStep.taskAction.taskDescription,
        whatsappDescription: createdStep.taskAction.taskDescription,
        callDescription: createdStep.taskAction.taskDescription,
        customDescription: createdStep.taskAction.taskDescription,
        enableEmailNotification: createdStep.taskAction.enableEmailNotification
      } : null
    };

    return createSuccessResponse({
      step: transformedStep,
      message: 'Step created successfully'
    }, 201, event);

  } catch (error) {
    console.error('Error creating sequence step:', error);

    // Handle specific database errors
    if (error.code === 'P2002') {
      return createErrorResponse('A step with this identifier already exists', 409, event);
    }

    if (error.code === 'P2025') {
      return createErrorResponse('Sequence or template not found', 404, event);
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