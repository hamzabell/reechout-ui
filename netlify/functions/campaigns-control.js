const { PrismaClient } = require('@prisma/client');
const { addCorsHeaders } = require('./utils/cors');

const prisma = new PrismaClient();

// Helper function to validate campaign status transitions
const isValidStatusTransition = (currentStatus, newStatus) => {
  const transitions = {
    'DRAFT': ['ACTIVE', 'SCHEDULED', 'CANCELLED'],
    'SCHEDULED': ['ACTIVE', 'CANCELLED'],
    'ACTIVE': ['PAUSED', 'COMPLETED', 'CANCELLED'],
    'PAUSED': ['ACTIVE', 'CANCELLED'],
    'COMPLETED': [], // No transitions allowed from completed
    'CANCELLED': [], // No transitions allowed from cancelled
    // Also handle lowercase values from database
    'draft': ['ACTIVE', 'SCHEDULED', 'CANCELLED'],
    'scheduled': ['ACTIVE', 'CANCELLED'],
    'sending': ['PAUSED', 'COMPLETED', 'CANCELLED'],
    'paused': ['ACTIVE', 'CANCELLED'],
    'completed': [], // No transitions allowed from completed
    'cancelled': [] // No transitions allowed from cancelled
  };

  return transitions[currentStatus]?.includes(newStatus) || false;
};

// Helper function to get status timestamp field
const getStatusTimestampField = (status) => {
  switch (status) {
    case 'ACTIVE':
    case 'sending':
      return 'startedAt';
    case 'PAUSED':
    case 'paused':
      return 'pausedAt';
    case 'COMPLETED':
    case 'completed':
      return 'completedAt';
    default:
      return null;
  }
};

exports.handler = async (event, context) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return addCorsHeaders({
      statusCode: 200,
      body: ''
    }, event);
  }

  try {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
      return addCorsHeaders({
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' })
      }, event);
    }

    // Parse request body
    const { sequenceId, action, userId } = JSON.parse(event.body);

    if (!sequenceId || !action || !userId) {
      return addCorsHeaders({
        statusCode: 400,
        body: JSON.stringify({
          error: 'Missing required fields: sequenceId, action, userId'
        })
      }, event);
    }

    // Validate action
    const validActions = ['start', 'pause', 'resume', 'stop', 'cancel'];
    if (!validActions.includes(action)) {
      return addCorsHeaders({
        statusCode: 400,
        body: JSON.stringify({
          error: 'Invalid action. Must be one of: ' + validActions.join(', ')
        })
      }, event);
    }

    // Get current campaign
    const campaign = await prisma.sequence.findUnique({
      where: { id: sequenceId },
      include: {
        creator: {
          select: {
            id: true,
            neonUserId: true
          }
        }
      }
    });

    if (!campaign) {
      return addCorsHeaders({
        statusCode: 404,
        body: JSON.stringify({ error: 'Campaign not found' })
      }, event);
    }

    // Verify ownership
    if (campaign.createdBy !== userId && campaign.creator.neonUserId !== userId) {
      return addCorsHeaders({
        statusCode: 403,
        body: JSON.stringify({ error: 'Not authorized to control this campaign' })
      }, event);
    }

    // Map action to new status
    const actionToStatusMap = {
      'start': 'ACTIVE',
      'pause': 'PAUSED', 
      'resume': 'ACTIVE',
      'stop': 'CANCELLED',
      'cancel': 'CANCELLED'
    };

    const newStatus = actionToStatusMap[action];

    // Validate status transition
    if (!isValidStatusTransition(campaign.status, newStatus)) {
      return addCorsHeaders({
        statusCode: 400,
        body: JSON.stringify({
          error: `Cannot transition from ${campaign.status} to ${newStatus}`
        })
      }, event);
    }

    // Prepare update data
    const updateData = {
      status: newStatus,
      updatedAt: new Date()
    };

    // Add timestamp field based on new status
    const timestampField = getStatusTimestampField(newStatus);
    if (timestampField) {
      updateData[timestampField] = new Date();
    }

    // For resume action, clear the pausedAt timestamp
    if (action === 'resume') {
      updateData.pausedAt = null;
    }

    // Update campaign
    const updatedCampaign = await prisma.sequence.update({
      where: { id: sequenceId },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            campaignProspects: true,
            steps: true
          }
        }
      }
    });

    // Generate tasks when campaign starts
    let generatedTasksCount = 0;
    if (newStatus === 'ACTIVE' && action === 'start') {
      console.log(`Starting task generation for campaign ${sequenceId}...`);

      try {
        // Get all steps with task actions for this sequence
        const stepsWithTasks = await prisma.sequenceStep.findMany({
          where: {
            sequenceId: sequenceId,
            taskAction: {
              isNot: null
            }
          },
          include: {
            taskAction: true
          },
          orderBy: {
            day: 'asc'
          }
        });

        console.log(`Found ${stepsWithTasks.length} steps with task actions for campaign ${sequenceId}`);

        if (stepsWithTasks.length > 0) {
          // Validate task actions before proceeding
          const validTaskActions = stepsWithTasks.filter(step => {
            const isValid = step.taskAction &&
                           step.taskAction.taskTitle;
            // taskType has a default value in the schema, so we don't need to validate it strictly
            if (!isValid) {
              console.warn(`Invalid task action found for step ${step.id}:`, JSON.stringify(step.taskAction, null, 2));
            }
            return isValid;
          });

          console.log(`Found ${validTaskActions.length} valid task actions out of ${stepsWithTasks.length} steps`);

          if (validTaskActions.length === 0) {
            console.warn(`No valid task actions found for campaign ${sequenceId}. Skipping task creation.`);
          } else {
            // Prepare task data for bulk creation
            const taskCreateData = [];
            const campaignStartDate = updatedCampaign.startedAt || new Date();

            for (const step of validTaskActions) {
              if (step.taskAction) {
                // Calculate due date based on campaign start date + step day offset
                const dueDate = new Date(campaignStartDate);
                dueDate.setDate(dueDate.getDate() + (step.day - 1));

                taskCreateData.push({
                  id: require('crypto').randomUUID(),
                  stepTaskActionId: step.taskAction.id,
                  campaignId: sequenceId,
                  dueDate: dueDate,
                  status: 'PENDING',
                  createdAt: new Date(),
                  updatedAt: new Date()
                });

                console.log(`Prepared task for step ${step.id} (day ${step.day}): "${step.taskAction.taskTitle}" due ${dueDate.toISOString()}`);
              }
            }

            // Create tasks in bulk
            if (taskCreateData.length > 0) {
              console.log(`Creating ${taskCreateData.length} tasks for campaign ${sequenceId}...`);

              const createdTasks = await prisma.task.createMany({
                data: taskCreateData,
                skipDuplicates: true
              });
              generatedTasksCount = createdTasks.count;

              console.log(`Successfully created ${generatedTasksCount} tasks for campaign ${sequenceId}`);

              // Create task assignments for the campaign creator
              if (generatedTasksCount > 0) {
                const createdTasksList = await prisma.task.findMany({
                  where: {
                    campaignId: sequenceId,
                    stepTaskActionId: {
                      in: validTaskActions.map(step => step.taskAction?.id).filter(Boolean)
                    }
                  }
                });

                console.log(`Found ${createdTasksList.length} created tasks for assignment creation`);

                const assignmentData = createdTasksList.map(task => ({
                  id: require('crypto').randomUUID(),
                  taskId: task.id,
                  userId: updatedCampaign.createdBy,
                  assignedAt: new Date()
                }));

                if (assignmentData.length > 0) {
                  await prisma.taskAssignment.createMany({
                    data: assignmentData,
                    skipDuplicates: true
                  });
                  console.log(`Created ${assignmentData.length} task assignments for user ${updatedCampaign.createdBy}`);
                }
              }
            } else {
              console.warn(`No task data prepared for campaign ${sequenceId}`);
            }
          }
        } else {
          console.log(`No steps with task actions found for campaign ${sequenceId}`);
        }
      } catch (taskError) {
        console.error('Failed to generate tasks for campaign:', taskError);
        console.error('Task generation error details:', {
          message: taskError.message,
          stack: taskError.stack,
          code: taskError.code,
          meta: taskError.meta,
          sequenceId,
          action,
          userId
        });

        // Include task generation error in response for debugging
        return addCorsHeaders({
          statusCode: 500,
          body: JSON.stringify({
            error: 'Task generation failed',
            message: taskError.message,
            details: 'Failed to create tasks for campaign start',
            sequenceId
          })
        }, event);
      }
    }

    // Format response
    let message = `Campaign ${action}d successfully`;
    if (generatedTasksCount > 0) {
      message += ` (${generatedTasksCount} tasks generated)`;
    }

    const response = {
      success: true,
      message,
      campaign: {
        id: updatedCampaign.id,
        name: updatedCampaign.name,
        description: updatedCampaign.description,
        status: updatedCampaign.status,
        createdAt: updatedCampaign.createdAt.toISOString(),
        startedAt: updatedCampaign.startedAt?.toISOString(),
        scheduledAt: updatedCampaign.scheduledAt?.toISOString(),
        pausedAt: updatedCampaign.pausedAt?.toISOString(),
        completedAt: updatedCampaign.completedAt?.toISOString(),
        updatedAt: updatedCampaign.updatedAt.toISOString(),
        createdBy: updatedCampaign.createdBy,
        creator: updatedCampaign.creator,
        prospectsCount: updatedCampaign._count.campaignProspects,
        stepsCount: updatedCampaign._count.steps
      }
    };

    return addCorsHeaders({
      statusCode: 200,
      body: JSON.stringify(response)
    }, event);

  } catch (error) {
    console.error('Campaign control error:', error);
    
    return addCorsHeaders({
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    }, event);
  } finally {
    await prisma.$disconnect();
  }
};