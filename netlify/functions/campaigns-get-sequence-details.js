const { PrismaClient } = require('@prisma/client');
const { createCorsResponse, createSuccessResponse, createErrorResponse } = require('./utils/cors');

// Initialize Prisma Client for serverless environment
const prisma = new PrismaClient();

exports.handler = async (event, context) => {
  // Handle CORS preflight request
  if (event.httpMethod === 'OPTIONS') {
    return createCorsResponse();
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return createErrorResponse('Method not allowed', 405);
  }

  try {
    const { userId, sequenceId } = JSON.parse(event.body);

    if (!userId) {
      return createErrorResponse('User ID is required', 400);
    }

    if (!sequenceId) {
      return createErrorResponse('Sequence ID is required', 400);
    }

    // Fetch the sequence with all related data
    const sequence = await prisma.sequence.findFirst({
      where: {
        id: sequenceId,
        createdBy: userId // Ensure user can only access their own sequences
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        campaignProspects: {
          include: {
            prospect: {
              select: {
                id: true,
                name: true,
                email: true,
                company: true,
                title: true,
                location: true,
                industry: true,
                status: true,
                notes: true
              }
            },
            personalizedEmails: {
              include: {
                stepEmailAction: {
                  select: {
                    step: {
                      select: {
                        day: true,
                        id: true
                      }
                    }
                  }
                }
              },
              orderBy: {
                createdAt: 'asc'
              }
            }
          }
        },
        steps: {
          orderBy: {
            day: 'asc'
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

    if (!sequence) {
      return createErrorResponse('Sequence not found', 404);
    }

    // Transform campaign prospects to match frontend expectations
    const transformedCampaignProspects = sequence.campaignProspects.map(cp => {
      // Collect all personalized emails and calculate metrics
      const personalizedEmails = cp.personalizedEmails.map(email => ({
        id: email.id,
        subject: email.subject || 'No Subject',
        body: email.body || '',
        status: email.status.toLowerCase(), // Convert to lowercase for frontend
        stepEmailAction: {
          step: {
            stepNumber: email.stepEmailAction?.step?.day || 1,
            name: `Day ${email.stepEmailAction?.step?.day || 1}`
          }
        },
        createdAt: email.createdAt.toISOString(),
        updatedAt: email.updatedAt.toISOString(),
        sentAt: email.sentAt?.toISOString(),
        openedAt: email.openedAt?.toISOString(),
        repliedAt: email.repliedAt?.toISOString()
      }));

      // Calculate status based on personalized emails
      const hasSentEmails = personalizedEmails.some(email => email.status === 'sent');
      const hasCompletedEmails = personalizedEmails.some(email => email.status === 'completed');
      
      let status = 'PENDING';
      if (hasCompletedEmails) {
        status = 'COMPLETED';
      } else if (hasSentEmails) {
        status = 'ACTIVE';
      }

      return {
        id: cp.id,
        status: status,
        prospect: {
          id: cp.prospect.id,
          name: cp.prospect.name,
          email: cp.prospect.email,
          company: cp.prospect.company,
          title: cp.prospect.title,
          location: cp.prospect.location,
          industry: cp.prospect.industry,
          notes: cp.prospect.notes
        },
        personalizedEmails: personalizedEmails
      };
    });

    // Transform steps to match frontend expectations
    const transformedSteps = sequence.steps.map(step => {
      const transformedStep = {
        id: step.id,
        stepNumber: step.day,
        day: step.day,
        name: `Day ${step.day}`,
        description: `Step for day ${step.day}`
      };

      // Add email action if present
      if (step.emailAction) {
        transformedStep.emailAction = {
          id: step.emailAction.id,
          templateId: step.emailAction.templateId,
          customSubject: step.emailAction.customSubject,
          customBody: step.emailAction.customBody,
          enablePersonalization: step.emailAction.enablePersonalization,
          template: step.emailAction.template ? {
            id: step.emailAction.template.id,
            name: step.emailAction.template.name,
            subject: step.emailAction.template.subject,
            body: step.emailAction.template.body
          } : undefined
        };
      }

      // Add task action if present
      if (step.taskAction) {
        transformedStep.taskAction = {
          id: step.taskAction.id,
          taskType: 'other',
          otherTitle: step.taskAction.taskTitle,
          otherDescription: step.taskAction.taskDescription,
          enableEmailNotification: step.taskAction.enableEmailNotification
        };
      }

      return transformedStep;
    });

    // Calculate statistics
    const totalProspects = transformedCampaignProspects.length;
    const activeProspects = transformedCampaignProspects.filter(cp => cp.status === 'ACTIVE').length;
    const completedProspects = transformedCampaignProspects.filter(cp => cp.status === 'COMPLETED').length;
    const emailSteps = transformedSteps.filter(step => step.emailAction).length;
    const taskSteps = transformedSteps.filter(step => step.taskAction).length;

    // Collect all emails from all campaign prospects for metrics
    const allEmails = transformedCampaignProspects.flatMap(cp => cp.personalizedEmails);
    const sent = allEmails.filter(email => email.status === 'sent').length;
    const opens = allEmails.filter(email => email.openedAt).length;
    const replies = allEmails.filter(email => email.repliedAt).length;
    const replyRate = sent > 0 ? (replies / sent) * 100 : 0;

    // Map database status to frontend status
    const statusMap = {
      'DRAFT': 'DRAFT',
      'ACTIVE': 'ACTIVE',
      'PAUSED': 'PAUSED',
      'COMPLETED': 'COMPLETED',
      'CANCELLED': 'CANCELLED'
    };

    // Transform the sequence to match frontend expectations
    const transformedSequence = {
      id: sequence.id,
      name: sequence.name,
      description: sequence.description,
      status: statusMap[sequence.status] || 'draft',
      sent,
      opens,
      replies,
      replyRate: Math.round(replyRate * 10) / 10, // Round to 1 decimal place
      startDate: sequence.startedAt?.toISOString(),
      scheduledDate: sequence.pausedAt?.toISOString(),
      completedDate: sequence.completedAt?.toISOString(),
      sendTime: sequence.sendTime,
      timezone: sequence.timezone,
      dailyLimit: sequence.dailyLimit,
      prospects: transformedCampaignProspects.map(cp => cp.prospect.id),
      templateId: null,
      settings: {
        dailyLimit: sequence.dailyLimit,
        sendTime: sequence.sendTime,
        timezone: sequence.timezone,
        goals: sequence.goals,
        targetAudience: sequence.targetAudience
      },
      createdAt: sequence.createdAt.toISOString(),
      updatedAt: sequence.updatedAt.toISOString(),
      createdBy: sequence.createdBy,
      approvedBy: null,
      approvedAt: null,
      rejectionReason: null,
      // Additional computed fields
      totalProspects,
      openRate: sent > 0 ? Math.round((opens / sent) * 100 * 10) / 10 : 0,
      clickRate: 0, // Would need to implement click tracking
      deliveredRate: totalProspects > 0 ? Math.round((sent / totalProspects) * 100 * 10) / 10 : 0
    };

    // Add campaign-specific fields for CampaignDetailsPage
    const campaignData = {
      ...transformedSequence,
      steps: transformedSteps,
      campaignProspects: transformedCampaignProspects,
      statistics: {
        totalSteps: transformedSteps.length,
        emailSteps,
        taskSteps,
        totalProspects,
        activeProspects,
        completedProspects
      }
    };

    return createSuccessResponse({
      campaign: campaignData
    });

  } catch (error) {
    console.error('Error fetching sequence details:', error);

    // Provide more detailed error information for debugging
    let errorMessage = 'Internal server error';
    if (error.message.includes('DATABASE_URL')) {
      errorMessage = 'Database configuration error. Please check environment variables.';
    } else if (error.message.includes('prisma')) {
      errorMessage = 'Database connection error. Please try again later.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return createErrorResponse(errorMessage, 500);
  } finally {
    // Disconnect Prisma client in serverless environment
    await prisma.$disconnect();
  }
};
