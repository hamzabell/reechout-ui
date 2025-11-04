const { getPrismaClient } = require('../../../lib/prisma');
const jwt = require('jsonwebtoken');
const axios = require('axios');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  let prisma;
  try {
    // Verify JWT token
    const token = event.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Authorization token required' })
      };
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const {
      leadId,
      templateId,
      customTemplate,
      personalizationLevel = 'high',
      tone = 'professional',
      maxLength = 500
    } = JSON.parse(event.body);

    if (!leadId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Lead ID is required' })
      };
    }

    if (!templateId && !customTemplate) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Either templateId or customTemplate is required' })
      };
    }

    prisma = getPrismaClient();

    // Get lead information
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        title: true,
        industry: true,
        website: true,
        researchData: true,
        personalizationData: true,
        notes: true,
        score: true
      }
    });

    if (!lead) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Lead not found' })
      };
    }

    // Get template if provided
    let template = null;
    if (templateId) {
      template = await prisma.template.findFirst({
        where: {
          id: templateId,
          createdBy: userId,
          isActive: true
        }
      });

      if (!template) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Template not found or inactive' })
        };
      }
    }

    // Use custom template or fetched template
    const templateData = customTemplate || {
      subject: template.subject,
      body: template.body
    };

    // Generate personalized email using Lemonfox.ai
    const personalizedEmail = await generatePersonalizedEmail(
      lead,
      templateData,
      personalizationLevel,
      tone,
      maxLength
    );

    // Log the personalization activity
    await prisma.activity.create({
      data: {
        leadId: leadId,
        type: 'EMAIL_SENT',
        description: `Personalized email generated for ${lead.name}`,
        metadata: {
          templateId,
          personalizationLevel,
          tone,
          subjectLength: personalizedEmail.subject.length,
          bodyLength: personalizedEmail.body.length,
          personalizationScore: personalizedEmail.score || 0
        }
      }
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Email personalized successfully',
        personalizedEmail,
        lead: {
          id: lead.id,
          name: lead.name,
          email: lead.email,
          company: lead.company
        }
      })
    };

  } catch (error) {
    console.error('Email personalization error:', error);

    if (error.name === 'JsonWebTokenError') {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to personalize email',
        details: error.message
      })
    };
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
};

async function generatePersonalizedEmail(lead, template, personalizationLevel, tone, maxLength) {
  if (!process.env.LEMONFOX_API_KEY) {
    throw new Error('Lemonfox API key not configured');
  }

  try {
    const prompt = buildPersonalizationPrompt(lead, template, personalizationLevel, tone, maxLength);

    const response = await axios.post('https://api.lemonfox.ai/v1/email-personalization', {
      prompt,
      lead_context: {
        name: lead.name,
        company: lead.company,
        title: lead.title,
        industry: lead.industry,
        website: lead.website,
        score: lead.score
      },
      research_data: lead.researchData,
      personalization_data: lead.personalizationData,
      template: {
        subject: template.subject,
        body: template.body
      },
      personalization_settings: {
        level: personalizationLevel,
        tone,
        max_length: maxLength,
        include_research: true,
        include_call_to_action: true
      },
      output_format: {
        subject: 'string',
        body: 'string',
        personalization_highlights: 'array',
        call_to_action: 'string',
        score: 'number',
        variables_used: 'array'
      }
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.LEMONFOX_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    return response.data;

  } catch (error) {
    console.error('Lemonfox personalization failed:', error);

    // Fallback to basic personalization
    return generateFallbackPersonalization(lead, template, tone);
  }
}

function buildPersonalizationPrompt(lead, template, personalizationLevel, tone, maxLength) {
  let prompt = `Generate a personalized email with the following parameters:\n\n`;
  prompt += `Lead Information:\n`;
  prompt += `- Name: ${lead.name}\n`;
  prompt += `- Company: ${lead.company}\n`;
  prompt += `- Title: ${lead.title}\n`;
  prompt += `- Industry: ${lead.industry}\n`;
  prompt += `- Lead Score: ${lead.score}\n\n`;

  if (lead.researchData) {
    prompt += `Research Data:\n`;
    prompt += `${JSON.stringify(lead.researchData, null, 2)}\n\n`;
  }

  if (lead.personalizationData) {
    prompt += `Personalization Insights:\n`;
    prompt += `${JSON.stringify(lead.personalizationData, null, 2)}\n\n`;
  }

  prompt += `Template:\n`;
  prompt += `Subject: ${template.subject}\n`;
  prompt += `Body: ${template.body}\n\n`;

  prompt += `Personalization Requirements:\n`;
  prompt += `- Level: ${personalizationLevel}\n`;
  prompt += `- Tone: ${tone}\n`;
  prompt += `- Max Length: ${maxLength} characters\n\n`;

  prompt += `Instructions:\n`;
  prompt += `1. Incorporate relevant research insights naturally\n`;
  prompt += `2. Maintain a ${tone} tone throughout\n`;
  prompt += `3. Include a clear call to action\n`;
  prompt += `4. Keep the email concise and engaging\n`;
  prompt += `5. Personalize the subject line for higher open rates\n\n`;

  prompt += `Provide:\n`;
  prompt += `- Personalized subject line\n`;
  prompt += `- Personalized email body\n`;
  prompt += `- Key personalization highlights used\n`;
  prompt += `- Personalization score (1-10)\n`;

  return prompt;
}

function generateFallbackPersonalization(lead, template, tone) {
  const replacements = {
    '{{name}}': lead.name,
    '{{company}}': lead.company,
    '{{title}}': lead.title || '',
    '{{industry}}': lead.industry || ''
  };

  // Replace variables in template
  let personalizedSubject = template.subject;
  let personalizedBody = template.body;

  Object.entries(replacements).forEach(([placeholder, value]) => {
    personalizedSubject = personalizedSubject.replace(new RegExp(placeholder, 'g'), value);
    personalizedBody = personalizedBody.replace(new RegExp(placeholder, 'g'), value);
  });

  // Add basic personalization based on available data
  const personalizationHighlights = [];

  if (lead.researchData?.company?.description) {
    personalizationHighlights.push('Referenced company research');
  }

  if (lead.personalizationData?.talking_points?.length > 0) {
    personalizationHighlights.push('Incorporated talking points');
  }

  if (lead.title) {
    personalizationHighlights.push('Role-specific content');
  }

  return {
    subject: personalizedSubject || `Hello ${lead.name}`,
    body: personalizedBody || generateBasicEmailBody(lead, tone),
    personalizationHighlights: personalizationHighlights,
    callToAction: 'Would you be available for a brief discussion next week?',
    score: 5,
    variablesUsed: Object.keys(replacements).filter(key => replacements[key]),
    fallback: true
  };
}

function generateBasicEmailBody(lead, tone) {
  const toneStyles = {
    professional: `Dear ${lead.name},

I hope this email finds you well. I'm reaching out regarding your work at ${lead.company}.

Given your role as ${lead.title || 'a key professional'} in the ${lead.industry || 'industry'} sector, I believe there may be opportunities for collaboration.

Would you be open to a brief discussion to explore potential synergies?

Best regards`,
    casual: `Hi ${lead.name},

Hope you're having a great week! I came across your work at ${lead.company} and was really impressed.

As someone in the ${lead.industry || 'industry'} space, I thought you might find value in what we're doing.

Would you have 15 minutes to chat sometime next week?

Cheers`,
    friendly: `Hello ${lead.name}!

I hope this email finds you well. I wanted to reach out personally after learning about your work at ${lead.company}.

Your experience as ${lead.title || 'a professional'} in ${lead.industry || 'your field'} really stands out, and I'd love to learn more about what you're building.

Would you be open to a quick conversation?

Best`
  };

  return toneStyles[tone] || toneStyles.professional;
}