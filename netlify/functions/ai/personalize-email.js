const { PrismaClient } = require('@prisma/client');
const { personalizeEmail, refactorPersonalizedEmail } = require('../../../services/ai-personalization-service');

const prisma = new PrismaClient();

exports.handler = async (event, context) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Method not allowed' }),
      };
    }

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

    const {
      action,
      campaignProspectId,
      stepEmailActionId,
      templateId,
      customizationPrompt = '',
      storePersonalizedEmail = true
    } = JSON.parse(event.body);

    if (!action) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Action is required (personalize or refactor)' }),
      };
    }

    if (action === 'personalize') {
      return await handlePersonalization(
        userId,
        campaignProspectId,
        stepEmailActionId,
        templateId,
        customizationPrompt,
        storePersonalizedEmail
      );
    } else if (action === 'refactor') {
      return await handleRefactoring(
        userId,
        campaignProspectId,
        stepEmailActionId,
        customizationPrompt
      );
    } else {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Invalid action. Must be "personalize" or "refactor"' }),
      };
    }
  } catch (error) {
    console.error('Email personalization API error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Failed to process email personalization',
        details: error.message
      }),
    };
  }
};

async function handlePersonalization(
  userId,
  campaignProspectId,
  stepEmailActionId,
  templateId,
  customizationPrompt,
  storePersonalizedEmail
) {
  try {
    if (!campaignProspectId || !stepEmailActionId) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Campaign prospect ID and step email action ID are required' }),
      };
    }

    // Get campaign prospect and verify user access
    const campaignProspect = await prisma.campaignProspect.findFirst({
      where: {
        id: campaignProspectId,
        prospect: {
          createdBy: userId,
        },
      },
      include: {
        prospect: true,
        campaign: {
          select: { id: true, name: true },
        },
      },
    });

    if (!campaignProspect) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Campaign prospect not found' }),
      };
    }

    // Get step email action
    const stepEmailAction = await prisma.stepEmailAction.findFirst({
      where: {
        id: stepEmailActionId,
        step: {
          campaign: {
            createdBy: userId,
          },
        },
      },
      include: {
        step: {
          select: {
            stepNumber: true,
            name: true,
            campaign: {
              select: { id: true, name: true },
            },
          },
        },
        template: true,
      },
    });

    if (!stepEmailAction) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Step email action not found' }),
      };
    }

    // Get template (from step action or provided template ID)
    let template;
    if (stepEmailAction.templateId) {
      template = stepEmailAction.template;
    } else if (templateId) {
      template = await prisma.emailTemplate.findFirst({
        where: {
          id: templateId,
          createdBy: userId,
        },
      });
    } else {
      // Use custom email content from step action
      template = {
        subject: stepEmailAction.customSubject,
        body: stepEmailAction.customBody,
        variables: [],
      };
    }

    if (!template || !template.subject || !template.body) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'No valid email template found' }),
      };
    }

    // Check if personalized email already exists
    const existingEmail = await prisma.personalizedEmail.findFirst({
      where: {
        campaignProspectId,
        stepEmailActionId,
      },
    });

    if (existingEmail && storePersonalizedEmail) {
      return {
        statusCode: 409,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'Personalized email already exists',
          existingEmail,
        }),
      };
    }

    // Get research data
    const researchData = campaignProspect.prospect.researchData || {};

    // Personalize the email
    const personalizedEmail = await personalizeEmail(
      template,
      campaignProspect.prospect,
      researchData,
      customizationPrompt
    );

    if (storePersonalizedEmail) {
      // Store the personalized email
      const storedEmail = await prisma.personalizedEmail.create({
        data: {
          campaignProspectId,
          stepEmailActionId,
          subject: personalizedEmail.subject,
          body: personalizedEmail.body,
          status: 'PENDING',
        },
        include: {
          campaignProspect: {
            include: {
              prospect: {
                select: { id: true, name: true, email: true },
              },
            },
          },
          stepEmailAction: {
            include: {
              step: {
                select: {
                  stepNumber: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      return {
        statusCode: 201,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizedEmail: storedEmail,
          personalizationData: personalizedEmail,
          stored: true,
        }),
      };
    } else {
      // Return without storing
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizationData: personalizedEmail,
          stored: false,
        }),
      };
    }
  } catch (error) {
    console.error('Email personalization error:', error);
    throw error;
  }
}

async function handleRefactoring(
  userId,
  campaignProspectId,
  stepEmailActionId,
  customizationPrompt
) {
  try {
    if (!campaignProspectId || !stepEmailActionId || !customizationPrompt) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'Campaign prospect ID, step email action ID, and customization prompt are required'
        }),
      };
    }

    // Get existing personalized email
    const existingEmail = await prisma.personalizedEmail.findFirst({
      where: {
        campaignProspectId,
        stepEmailActionId,
      },
      include: {
        campaignProspect: {
          include: {
            prospect: true,
          },
        },
        stepEmailAction: {
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
      },
    });

    if (!existingEmail) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Personalized email not found' }),
      };
    }

    // Verify user access
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: existingEmail.stepEmailAction.step.campaignId,
        createdBy: userId,
      },
    });

    if (!campaign) {
      return {
        statusCode: 403,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Access denied' }),
      };
    }

    // Refactor the personalized email
    const refactoredEmail = await refactorPersonalizedEmail(
      {
        subject: existingEmail.subject,
        body: existingEmail.body,
      },
      customizationPrompt,
      existingEmail.campaignProspect.prospect,
      existingEmail.campaignProspect.prospect.researchData || {}
    );

    // Update the existing personalized email
    const updatedEmail = await prisma.personalizedEmail.update({
      where: { id: existingEmail.id },
      data: {
        subject: refactoredEmail.subject,
        body: refactoredEmail.body,
        updatedAt: new Date(),
      },
      include: {
        campaignProspect: {
          include: {
            prospect: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        stepEmailAction: {
          include: {
            step: {
              select: {
                stepNumber: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizedEmail: updatedEmail,
        refactoringData: refactoredEmail,
      }),
    };
  } catch (error) {
    console.error('Email refactoring error:', error);
    throw error;
  }
}