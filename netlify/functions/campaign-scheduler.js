const { PrismaClient } = require('@prisma/client');
const { createCorsResponse, createSuccessResponse, createErrorResponse } = require('./utils/cors');

const prisma = new PrismaClient();

exports.handler = async (event, context) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return createCorsResponse(event);
  }

  // Only allow POST requests for this scheduler service
  if (event.httpMethod !== 'POST') {
    return createErrorResponse('Method not allowed', 405, event);
  }

  try {
    console.log('🚀 Campaign scheduler running...');
    const now = new Date();
    console.log(`Current time: ${now.toISOString()}`);

    // Find all scheduled campaigns that should be activated
    const scheduledCampaigns = await prisma.sequence.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: {
          lte: now // Campaigns scheduled for now or in the past
        }
      },
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

    console.log(`📅 Found ${scheduledCampaigns.length} campaigns to activate`);

    let activatedCount = 0;
    let generatedTasksCount = 0;

    // Process each scheduled campaign
    for (const campaign of scheduledCampaigns) {
      try {
        console.log(`🔄 Activating campaign: ${campaign.name} (${campaign.id})`);

        // Update campaign status to ACTIVE and set startedAt
        const updatedCampaign = await prisma.sequence.update({
          where: { id: campaign.id },
          data: {
            status: 'ACTIVE',
            startedAt: now,
            updatedAt: now,
            scheduledAt: null // Clear scheduledAt after activation
          }
        });

        console.log(`✅ Campaign ${campaign.name} activated successfully`);

        // Generate tasks for the newly activated campaign
        const stepsWithTasks = await prisma.sequenceStep.findMany({
          where: {
            sequenceId: campaign.id,
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

        if (stepsWithTasks.length > 0) {
          // Prepare task data for bulk creation
          const taskCreateData = [];

          for (const step of stepsWithTasks) {
            if (step.taskAction) {
              // Calculate due date based on campaign start date + step day offset
              const dueDate = new Date(now);
              dueDate.setDate(dueDate.getDate() + (step.day - 1));

              taskCreateData.push({
                id: require('crypto').randomUUID(),
                stepTaskActionId: step.taskAction.id,
                campaignId: campaign.id,
                dueDate: dueDate,
                status: 'PENDING',
                createdAt: new Date(),
                updatedAt: new Date()
              });
            }
          }

          // Create tasks in bulk
          if (taskCreateData.length > 0) {
            const createdTasks = await prisma.task.createMany({
              data: taskCreateData,
              skipDuplicates: true
            });

            generatedTasksCount += createdTasks.count;

            // Create task assignments for the campaign creator
            const createdTasksForAssignment = await prisma.task.findMany({
              where: {
                campaignId: campaign.id,
                createdAt: {
                  gte: new Date(now.getTime() - 10000) // Tasks created in the last 10 seconds
                }
              },
              select: {
                id: true
              }
            });

            if (createdTasksForAssignment.length > 0) {
              const assignments = createdTasksForAssignment.map(task => ({
                id: require('crypto').randomUUID(),
                taskId: task.id,
                userId: campaign.createdBy,
                assignedAt: new Date()
              }));

              await prisma.taskAssignment.createMany({
                data: assignments,
                skipDuplicates: true
              });
            }

            console.log(`📋 Generated ${createdTasks.count} tasks for campaign ${campaign.name}`);
          }
        }

        activatedCount++;
      } catch (campaignError) {
        console.error(`❌ Failed to activate campaign ${campaign.name}:`, campaignError);
        // Continue processing other campaigns even if one fails
      }
    }

    // Clean up old scheduled campaigns that might be stuck
    const staleCampaigns = await prisma.sequence.updateMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: {
          lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) // More than 24 hours overdue
        }
      },
      data: {
        status: 'CANCELLED',
        scheduledAt: null,
        updatedAt: now
      }
    });

    if (staleCampaigns.count > 0) {
      console.log(`🧹 Cancelled ${staleCampaigns.count} stale scheduled campaigns (over 24h overdue)`);
    }

    const response = {
      success: true,
      message: 'Campaign scheduler completed successfully',
      stats: {
        processedAt: now.toISOString(),
        campaignsActivated: activatedCount,
        tasksGenerated: generatedTasksCount,
        staleCampaignsCleaned: staleCampaigns.count,
        totalProcessed: scheduledCampaigns.length
      },
      activatedCampaigns: scheduledCampaigns.map(campaign => ({
        id: campaign.id,
        name: campaign.name,
        scheduledAt: campaign.scheduledAt?.toISOString(),
        activatedAt: now.toISOString(),
        prospectsCount: campaign._count.campaignProspects,
        stepsCount: campaign._count.steps
      }))
    };

    console.log(`🎉 Scheduler completed: ${activatedCount} campaigns activated, ${generatedTasksCount} tasks generated`);

    return createSuccessResponse(response, 200, event);

  } catch (error) {
    console.error('❌ Campaign scheduler error:', error);

    return createErrorResponse(
      `Campaign scheduler failed: ${error.message}`,
      500,
      event
    );
  } finally {
    await prisma.$disconnect();
  }
};

// Helper endpoint to check scheduler status
exports.checkStatus = async () => {
  try {
    const now = new Date();

    const stats = await prisma.sequence.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    });

    const scheduledCount = await prisma.sequence.count({
      where: {
        status: 'SCHEDULED'
      }
    });

    const overdueCount = await prisma.sequence.count({
      where: {
        status: 'SCHEDULED',
        scheduledAt: {
          lte: now
        }
      }
    });

    return createSuccessResponse({
      timestamp: now.toISOString(),
      campaignStats: stats,
      scheduledCampaigns: scheduledCount,
      overdueCampaigns: overdueCount,
      schedulerStatus: 'running'
    }, 200);
  } catch (error) {
    console.error('❌ Scheduler status check error:', error);
    return createErrorResponse(
      `Scheduler status check failed: ${error.message}`,
      500
    );
  } finally {
    await prisma.$disconnect();
  }
};