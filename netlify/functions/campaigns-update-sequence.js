const { PrismaClient } = require('@prisma/client');
const { createCorsResponse, createSuccessResponse, createErrorResponse } = require('./utils/cors');

// Initialize Prisma Client for serverless environment
const prisma = new PrismaClient();

exports.handler = async (event, context) => {
  // Handle CORS preflight request
  if (event.httpMethod === 'OPTIONS') {
    return createCorsResponse();
  }

  // Only allow PUT requests
  if (event.httpMethod !== 'PUT') {
    return createErrorResponse('Method not allowed', 405);
  }

  try {
    const { userId, sequenceId, name, description, steps, prospects } = JSON.parse(event.body);

    if (!userId) {
      return createErrorResponse('User ID is required', 400);
    }

    if (!sequenceId) {
      return createErrorResponse('Sequence ID is required', 400);
    }

    // Prepare update data
    const updateData = {};
    
    if (name !== undefined) {
      updateData.name = name;
    }
    
    if (description !== undefined) {
      updateData.description = description;
    }

    // Update the sequence with provided data
    const updatedSequence = await prisma.sequence.update({
      where: {
        id: sequenceId,
        createdBy: userId // Ensure user can only update their own sequences
      },
      data: updateData,
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

    if (!updatedSequence) {
      return createErrorResponse('Sequence not found', 404);
    }

    // Transform campaign prospects to match frontend expectations
    const transformedCampaignProspects = updatedSequence.campaignProspects.map(cp => {
      // Collect all personalized emails and calculate metrics
      const personalizedEmails = cp.personalizedEmails.map(email => ({
        id: email.id,
        subject: email.subject || 'No Subject',
        body: email.body || '',
        status: email.status.toLowerCase(), // Convert to lowercase for frontend
        stepEmailAction: {
          step: {
            day: email.stepEmailAction?.step?.day || 1,
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
    const transformedSteps = updatedSequence.steps.map(step => {
      const transformedStep = {
        id: step.id,
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

    // Map database status to frontend status
    const statusMap = {
      'DRAFT': 'draft',
      'ACTIVE': 'sending',
      'PAUSED': 'paused',
      'COMPLETED': 'completed',
      'CANCELLED': 'completed'
    };

    // Transform the sequence to match frontend expectations
    const transformedSequence = {
      id: updatedSequence.id,
      name: updatedSequence.name,
      description: updatedSequence.description,
      status: statusMap[updatedSequence.status] || 'draft',
      createdAt: updatedSequence.createdAt.toISOString(),
      updatedAt: updatedSequence.updatedAt.toISOString(),
      createdBy: updatedSequence.createdBy,
      steps: transformedSteps,
      prospects: transformedCampaignProspects
    };

    return createSuccessResponse({
      campaign: transformedSequence
    });

  } catch (error) {
    console.error('Error updating sequence:', error);

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