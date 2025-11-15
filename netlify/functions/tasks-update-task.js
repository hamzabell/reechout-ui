const { PrismaClient } = require('@prisma/client');
const { createCorsResponse, createSuccessResponse, createErrorResponse } = require('./utils/cors');

const prisma = new PrismaClient();

exports.handler = async (event, context) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return createCorsResponse(event);
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return createErrorResponse('Method not allowed', 405, event);
  }

  try {
    const { userId, taskId, status } = JSON.parse(event.body);

    if (!userId || !taskId || !status) {
      return createErrorResponse('Missing required fields: userId, taskId, status', 400, event);
    }

    // Validate status
    const validStatuses = ['PENDING', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return createErrorResponse('Invalid status. Must be one of: ' + validStatuses.join(', '), 400, event);
    }

    // Get the task with assignments to verify ownership
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                neonUserId: true
              }
            }
          }
        }
      }
    });

    if (!task) {
      return createErrorResponse('Task not found', 404, event);
    }

    // Verify user is assigned to this task
    const isAssigned = task.assignments.some(assignment =>
      assignment.userId === userId || assignment.user.neonUserId === userId
    );

    if (!isAssigned) {
      return createErrorResponse('Not authorized to update this task', 403, event);
    }

    // Prepare update data
    const updateData = {
      status,
      updatedAt: new Date()
    };

    // Add completedAt timestamp if status is COMPLETED
    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
    } else {
      // Clear completedAt if status is not COMPLETED
      updateData.completedAt = null;
    }

    // Update the task
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        stepTaskAction: {
          include: {
            step: {
              include: {
                sequence: {
                  select: {
                    id: true,
                    name: true,
                    status: true,
                    startedAt: true
                  }
                }
              }
            }
          }
        },
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    // Transform the response
    const now = new Date();
    const dueDate = updatedTask.dueDate ? new Date(updatedTask.dueDate) : null;
    const isOverdue = dueDate && dueDate < now && updatedTask.status === 'PENDING';
    const daysUntilDue = dueDate ? Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24)) : null;

    const transformedTask = {
      id: updatedTask.id,
      title: updatedTask.stepTaskAction?.taskTitle || 'Untitled Task',
      description: updatedTask.stepTaskAction?.taskDescription,
      status: updatedTask.status,
      dueDate: updatedTask.dueDate?.toISOString(),
      completedAt: updatedTask.completedAt?.toISOString(),
      createdAt: updatedTask.createdAt.toISOString(),
      updatedAt: updatedTask.updatedAt.toISOString(),
      campaignName: updatedTask.stepTaskAction?.step?.sequence?.name || 'Unknown Campaign',
      campaignId: updatedTask.campaignId,
      day: updatedTask.stepTaskAction?.step?.day,
      stepName: updatedTask.stepTaskAction?.step ? `Day ${updatedTask.stepTaskAction.step.day}` : 'Unknown Step',
      taskType: updatedTask.stepTaskAction?.taskType || 'CUSTOM',
      isOverdue,
      daysUntilDue,
      assignments: updatedTask.assignments.map(assignment => ({
        id: assignment.id,
        userId: assignment.userId,
        assignedAt: assignment.assignedAt.toISOString(),
        user: assignment.user
      })),
      stepTaskActionId: updatedTask.stepTaskActionId
    };

    return createSuccessResponse({
      success: true,
      message: `Task ${status.toLowerCase()} successfully`,
      task: transformedTask
    }, 200, event);

  } catch (error) {
    console.error('Task update error:', error);
    return createErrorResponse('Internal server error', 500, event);
  } finally {
    await prisma.$disconnect();
  }
};