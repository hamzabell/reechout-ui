const { PrismaClient } = require('@prisma/client');
const { createCorsResponse, createSuccessResponse, createErrorResponse } = require('./utils/cors');

const prisma = new PrismaClient();

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
    console.log('🔍 Debug: Checking database state for tasks...');

    // Check total count of tasks
    const totalTasks = await prisma.task.count();
    console.log(`📊 Total tasks in database: ${totalTasks}`);

    // Check total count of task assignments
    const totalAssignments = await prisma.taskAssignment.count();
    console.log(`📊 Total task assignments in database: ${totalAssignments}`);

    // Check sequences with steps and task actions
    const sequencesWithTasks = await prisma.sequence.findMany({
      where: {
        steps: {
          some: {
            taskAction: {
              isNot: null
            }
          }
        }
      },
      include: {
        steps: {
          where: {
            taskAction: {
              isNot: null
            }
          },
          include: {
            taskAction: true
          }
        },
        _count: {
          select: {
            steps: true,
            campaignProspects: true
          }
        }
      }
    });

    console.log(`📊 Sequences with task actions: ${sequencesWithTasks.length}`);

    // Check active sequences
    const activeSequences = await prisma.sequence.count({
      where: {
        status: 'ACTIVE'
      }
    });

    console.log(`📊 Active sequences: ${activeSequences}`);

    // If we have sequences with task actions, check for tasks
    if (sequencesWithTasks.length > 0) {
      // Get tasks for these sequences
      const sequenceIds = sequencesWithTasks.map(s => s.id);
      const tasksForSequences = await prisma.task.findMany({
        where: {
          campaignId: {
            in: sequenceIds
          }
        },
        include: {
          assignments: true,
          stepTaskAction: {
            include: {
              step: {
                include: {
                  sequence: {
                    select: {
                      id: true,
                      name: true,
                      status: true,
                      createdBy: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      console.log(`📊 Tasks for sequences with task actions: ${tasksForSequences.length}`);

      // Group tasks by campaign
      const tasksByCampaign = {};
      tasksForSequences.forEach(task => {
        const campaignId = task.campaignId;
        if (!tasksByCampaign[campaignId]) {
          tasksByCampaign[campaignId] = [];
        }
        tasksByCampaign[campaignId].push(task);
      });

      console.log('📊 Tasks by campaign:');
      Object.entries(tasksByCampaign).forEach(([campaignId, tasks]) => {
        console.log(`  Campaign ${campaignId}: ${tasks.length} tasks`);
        tasks.forEach(task => {
          console.log(`    Task ${task.id}: status=${task.status}, assignments=${task.assignments.length}`);
        });
      });
    }

    // Check user IDs that have assignments
    const usersWithAssignments = await prisma.taskAssignment.groupBy({
      by: ['userId'],
      _count: {
        userId: true
      }
    });

    console.log('📊 Users with task assignments:');
    usersWithAssignments.forEach(user => {
      console.log(`  User ${user.userId}: ${user._count.userId} tasks`);
    });

    // Get some sample data
    const sampleTasks = await prisma.task.findMany({
      take: 5,
      include: {
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                neonUserId: true,
                name: true,
                email: true
              }
            }
          }
        },
        stepTaskAction: {
          include: {
            step: {
              include: {
                sequence: {
                  select: {
                    id: true,
                    name: true,
                    status: true,
                    createdBy: true
                  }
                }
              }
            }
          }
        }
      }
    });

    return createSuccessResponse({
      debug: {
        totalTasks,
        totalAssignments,
        sequencesWithTasks: sequencesWithTasks.length,
        activeSequences,
        usersWithAssignments: usersWithAssignments.length,
        sampleData: {
          sequences: sequencesWithTasks.map(s => ({
            id: s.id,
            name: s.name,
            status: s.status,
            createdBy: s.createdBy,
            stepsCount: s._count.steps,
            stepsWithTasks: s.steps.length
          })),
          tasks: sampleTasks.map(task => ({
            id: task.id,
            status: task.status,
            dueDate: task.dueDate,
            campaignId: task.campaignId,
            assignmentsCount: task.assignments.length,
            assignments: task.assignments.map(a => ({
              userId: a.userId,
              userName: a.user?.name,
              userEmail: a.user?.email
            })),
            taskTitle: task.stepTaskAction?.taskTitle,
            sequenceName: task.stepTaskAction?.step?.sequence?.name,
            sequenceStatus: task.stepTaskAction?.step?.sequence?.status,
            sequenceCreatedBy: task.stepTaskAction?.step?.sequence?.createdBy
          }))
        }
      }
    }, 200, event);

  } catch (error) {
    console.error('❌ Debug database error:', error);
    return createErrorResponse(
      `Database debug failed: ${error.message}`,
      500,
      event
    );
  } finally {
    await prisma.$disconnect();
  }
};