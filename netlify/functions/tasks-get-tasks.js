const { PrismaClient } = require('@prisma/client');
const { createCorsResponse, createSuccessResponse, createErrorResponse } = require('./utils/cors');

exports.handler = async (event, context) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return createCorsResponse(event);
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return createErrorResponse('Method not allowed', 405, event);
  }

  let prisma;

  try {
    prisma = new PrismaClient();

    let requestBody;
    try {
      requestBody = JSON.parse(event.body);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return createErrorResponse('Invalid JSON in request body', 400, event);
    }

    const { userId, status, search, campaignId, assignedTo, dueBefore, dueAfter, sortBy = 'createdAt', sortOrder = 'desc', limit = 20, offset = 0 } = requestBody;

    if (!userId) {
      return createErrorResponse('Missing required field: userId', 400, event);
    }

    // Build where clause
    const where = {
      assignments: {
        some: {
          userId: userId
        }
      }
    };

    // Add filters
    if (status) {
      where.status = status;
    }

    if (campaignId) {
      where.campaignId = campaignId;
    }

    if (assignedTo) {
      where.assignments = {
        some: {
          userId: assignedTo
        }
      };
    }

    // Date filters
    if (dueBefore || dueAfter) {
      where.dueDate = {};
      if (dueBefore) {
        where.dueDate.lte = new Date(dueBefore);
      }
      if (dueAfter) {
        where.dueDate.gte = new Date(dueAfter);
      }
    }

    // Search filter
    if (search) {
      where.OR = [
        {
          stepTaskAction: {
            taskTitle: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          stepTaskAction: {
            taskDescription: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          stepTaskAction: {
            step: {
              sequence: {
                name: {
                  contains: search,
                  mode: 'insensitive'
                }
              }
            }
          }
        }
      ];
    }

    // Build order by clause
    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    // Get total count for pagination
    const total = await prisma.task.count({
      where
    });

    // Fetch tasks with relations
    const tasks = await prisma.task.findMany({
      where,
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
      },
      orderBy,
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    // Transform data to match frontend expectations
    const transformedTasks = tasks.map(task => {
      const now = new Date();
      const dueDate = task.dueDate ? new Date(task.dueDate) : null;
      const isOverdue = dueDate && dueDate < now && task.status === 'PENDING';
      const daysUntilDue = dueDate ? Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24)) : null;

      return {
        id: task.id,
        title: task.stepTaskAction?.taskTitle || 'Untitled Task',
        description: task.stepTaskAction?.taskDescription,
        status: task.status,
        dueDate: task.dueDate?.toISOString(),
        completedAt: task.completedAt?.toISOString(),
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
        campaignName: task.stepTaskAction?.step?.sequence?.name || 'Unknown Campaign',
        campaignId: task.campaignId,
        day: task.stepTaskAction?.step?.day,
        stepName: task.stepTaskAction?.step ? `Day ${task.stepTaskAction.step.day}` : 'Unknown Step',
        taskType: task.stepTaskAction?.taskType || 'CUSTOM',
        isOverdue,
        daysUntilDue,
        assignments: task.assignments.map(assignment => ({
          id: assignment.id,
          userId: assignment.userId,
          assignedAt: assignment.assignedAt.toISOString(),
          user: assignment.user
        })),
        stepTaskActionId: task.stepTaskActionId
      };
    });

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const page = Math.floor(offset / limit) + 1;

    return createSuccessResponse({
      tasks: transformedTasks,
      pagination: {
        page,
        limit: parseInt(limit),
        total,
        totalPages
      }
    }, 200, event);

  } catch (error) {
    console.error('Tasks list error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      eventBody: event.body,
      httpMethod: event.httpMethod
    });
    return createErrorResponse('Internal server error', 500, event);
  } finally {
    if (prisma) {
      try {
        await prisma.$disconnect();
      } catch (disconnectError) {
        console.error('Prisma disconnect error:', disconnectError);
      }
    }
  }
};