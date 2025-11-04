const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.handler = async (event, context) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      },
      body: '',
    };
  }

  try {
    const { httpMethod } = event;
    const userId = event.headers.authorization?.replace('Bearer ', '');

    // Verify user authentication
    if (!userId) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    // Parse the path for task ID and query parameters
    const pathParts = event.path.split('/').filter(part => part);
    const taskId = pathParts[pathParts.length - 1];
    const queryParams = event.queryStringParameters || {};

    switch (httpMethod) {
      case 'GET':
        // If taskId is numeric and not equal to 'tasks', it's a specific task
        if (taskId && taskId !== 'tasks' && !isNaN(taskId)) {
          return await getTask(userId, taskId);
        }
        return await getTasks(userId, queryParams);
      case 'POST':
        // Handle task actions (complete, uncomplete, cancel)
        if (taskId && taskId !== 'tasks' && queryParams.action) {
          return await updateTaskStatus(userId, taskId, queryParams.action);
        }
        return await createTask(userId, JSON.parse(event.body));
      case 'PUT':
        if (taskId && taskId !== 'tasks') {
          return await updateTask(userId, taskId, JSON.parse(event.body));
        }
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ error: 'Task ID is required for PUT requests' }),
        };
      case 'DELETE':
        if (taskId && taskId !== 'tasks') {
          return await deleteTask(userId, taskId);
        }
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ error: 'Task ID is required for DELETE requests' }),
        };
      default:
        return {
          statusCode: 405,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }
  } catch (error) {
    console.error('Tasks API error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

async function getTasks(userId, queryParams) {
  try {
    const {
      page = 1,
      limit = 50,
      status,
      campaignId,
      dueDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = queryParams;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = {
      assignments: {
        some: {
          userId: userId,
        },
      },
    };

    if (status) {
      where.status = status;
    }

    if (campaignId) {
      where.campaignId = campaignId;
    }

    if (dueDate) {
      if (dueDate === 'today') {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        where.dueDate = {
          gte: startOfDay,
          lt: endOfDay,
        };
      } else if (dueDate === 'overdue') {
        where.dueDate = {
          lt: new Date(),
        };
        where.status = {
          not: 'COMPLETED',
        };
      } else if (dueDate === 'upcoming') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 7);

        where.dueDate = {
          gte: new Date(),
          lte: tomorrow,
        };
        where.status = {
          not: 'COMPLETED',
        };
      }
    }

    // Build order by clause
    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        orderBy,
        skip,
        take: parseInt(limit),
        include: {
          stepTaskAction: {
            include: {
              step: {
                include: {
                  campaign: {
                    select: { id: true, name: true, status: true },
                  },
                },
              },
            },
          },
          assignments: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
      }),
      prisma.task.count({ where }),
    ]);

    // Add computed fields
    const enrichedTasks = tasks.map(task => {
      const campaign = task.stepTaskAction.step.campaign;
      return {
        ...task,
        campaignName: campaign.name,
        campaignStatus: campaign.status,
        stepNumber: task.stepTaskAction.step.stepNumber,
        stepName: task.stepTaskAction.step.name,
        isOverdue: task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED',
        daysUntilDue: task.dueDate ? Math.ceil((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24)) : null,
      };
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tasks: enrichedTasks,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      }),
    };
  } catch (error) {
    console.error('Get tasks error:', error);
    throw error;
  }
}

async function createTask(userId, taskData) {
  try {
    const {
      title,
      description,
      dueDate,
      campaignId,
      stepTaskActionId,
      assignToCurrentUser = true,
    } = taskData;

    if (!title) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Task title is required' }),
      };
    }

    // If stepTaskActionId is provided, verify it exists and user has access
    if (stepTaskActionId) {
      const stepTaskAction = await prisma.stepTaskAction.findFirst({
        where: {
          id: stepTaskActionId,
          step: {
            campaign: {
              createdBy: userId,
            },
          },
        },
      });

      if (!stepTaskAction) {
        return {
          statusCode: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ error: 'Step task action not found or access denied' }),
        };
      }
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        campaignId,
        stepTaskActionId,
        assignments: assignToCurrentUser ? {
          create: {
            userId: userId,
          },
        } : undefined,
      },
      include: {
        stepTaskAction: {
          include: {
            step: {
              include: {
                campaign: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
        assignments: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    // TODO: Send email notification if enabled
    // This would integrate with your email service

    return {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(task),
    };
  } catch (error) {
    console.error('Create task error:', error);
    throw error;
  }
}

async function getTask(userId, taskId) {
  try {
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        assignments: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        stepTaskAction: {
          include: {
            step: {
              include: {
                campaign: {
                  select: { id: true, name: true, status: true },
                },
              },
            },
          },
        },
        assignments: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!task) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Task not found' }),
      };
    }

    // Add computed fields
    const campaign = task.stepTaskAction?.step?.campaign;
    const enrichedTask = {
      ...task,
      campaignName: campaign?.name || 'Unknown',
      campaignStatus: campaign?.status || 'UNKNOWN',
      stepNumber: task.stepTaskAction?.step?.stepNumber || 0,
      stepName: task.stepTaskAction?.step?.name || 'Unknown',
      isOverdue: task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED',
      daysUntilDue: task.dueDate ? Math.ceil((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24)) : null,
    };

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(enrichedTask),
    };
  } catch (error) {
    console.error('Get task error:', error);
    throw error;
  }
}

async function updateTaskStatus(userId, taskId, action) {
  try {
    // Verify user has access to this task
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        assignments: {
          some: {
            userId: userId,
          },
        },
      },
    });

    if (!task) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Task not found or access denied' }),
      };
    }

    let status;
    switch (action) {
      case 'complete':
        status = 'COMPLETED';
        break;
      case 'uncomplete':
        status = 'PENDING';
        break;
      case 'cancel':
        status = 'CANCELLED';
        break;
      default:
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ error: 'Invalid action. Use: complete, uncomplete, or cancel' }),
        };
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { status },
      include: {
        stepTaskAction: {
          include: {
            step: {
              include: {
                campaign: {
                  select: { id: true, name: true, status: true },
                },
              },
            },
          },
        },
        assignments: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    // Add computed fields
    const campaign = updatedTask.stepTaskAction?.step?.campaign;
    const enrichedTask = {
      ...updatedTask,
      campaignName: campaign?.name || 'Unknown',
      campaignStatus: campaign?.status || 'UNKNOWN',
      stepNumber: updatedTask.stepTaskAction?.step?.stepNumber || 0,
      stepName: updatedTask.stepTaskAction?.step?.name || 'Unknown',
      isOverdue: updatedTask.dueDate && new Date(updatedTask.dueDate) < new Date() && updatedTask.status !== 'COMPLETED',
      daysUntilDue: updatedTask.dueDate ? Math.ceil((new Date(updatedTask.dueDate) - new Date()) / (1000 * 60 * 60 * 24)) : null,
    };

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        message: `Task ${action}d successfully`,
        task: enrichedTask,
      }),
    };
  } catch (error) {
    console.error('Update task status error:', error);
    throw error;
  }
}

async function updateTask(userId, taskId, taskData) {
  try {
    // Verify user has access to this task
    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        assignments: {
          some: {
            userId: userId,
          },
        },
      },
    });

    if (!existingTask) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Task not found or access denied' }),
      };
    }

    const {
      title,
      description,
      dueDate,
      status,
    } = taskData;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (status !== undefined) updateData.status = status;

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        stepTaskAction: {
          include: {
            step: {
              include: {
                campaign: {
                  select: { id: true, name: true, status: true },
                },
              },
            },
          },
        },
        assignments: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    // Add computed fields
    const campaign = updatedTask.stepTaskAction?.step?.campaign;
    const enrichedTask = {
      ...updatedTask,
      campaignName: campaign?.name || 'Unknown',
      campaignStatus: campaign?.status || 'UNKNOWN',
      stepNumber: updatedTask.stepTaskAction?.step?.stepNumber || 0,
      stepName: updatedTask.stepTaskAction?.step?.name || 'Unknown',
      isOverdue: updatedTask.dueDate && new Date(updatedTask.dueDate) < new Date() && updatedTask.status !== 'COMPLETED',
      daysUntilDue: updatedTask.dueDate ? Math.ceil((new Date(updatedTask.dueDate) - new Date()) / (1000 * 60 * 60 * 24)) : null,
    };

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        message: 'Task updated successfully',
        task: enrichedTask,
      }),
    };
  } catch (error) {
    console.error('Update task error:', error);
    throw error;
  }
}

async function deleteTask(userId, taskId) {
  try {
    // Verify user has access to this task
    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        assignments: {
          some: {
            userId: userId,
          },
        },
      },
    });

    if (!existingTask) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Task not found or access denied' }),
      };
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        message: 'Task deleted successfully',
      }),
    };
  } catch (error) {
    console.error('Delete task error:', error);
    throw error;
  }
}