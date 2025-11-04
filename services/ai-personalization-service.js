// AI Service for Email Personalization
// This service uses AI to personalize email templates based on prospect research data

const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function personalizeEmail(template, prospectData, researchData, customizationPrompt = '') {
  try {
    const { subject, body, variables = [] } = template;
    const { name, email, company, title, website, industry } = prospectData;

    const systemPrompt = `You are an expert email copywriter specializing in personalized business communication.

Your task is to personalize an email template based on prospect information and research data.

Guidelines:
1. Keep the email professional and concise
2. Incorporate relevant insights from the research data
3. Maintain the original template's structure and intent
4. Add specific personalization based on the prospect's background and company
5. Make it sound authentic and not overly automated
6. Include appropriate personalization variables in {{variable}} format
7. Keep subject lines compelling but professional

Focus on making the email feel personally written for the recipient while maintaining business professionalism.`;

    let userPrompt = `Please personalize the following email template:

ORIGINAL TEMPLATE:
Subject: ${subject}
Body: ${body}

PROSPECT INFORMATION:
Name: ${name}
Email: ${email}
Company: ${company || 'Not specified'}
Title: ${title || 'Not specified'}
Website: ${website || 'Not specified'}
Industry: ${industry || 'Not specified'}

RESEARCH DATA:
${JSON.stringify(researchData, null, 2)}`;

    if (customizationPrompt) {
      userPrompt += `\n\nADDITIONAL CUSTOMIZATION REQUEST:
${customizationPrompt}`;
    }

    userPrompt += `

Please provide:
1. A personalized subject line
2. A personalized email body
3. A list of personalization variables used

Format your response as JSON:
{
  "subject": "Personalized subject line",
  "body": "Personalized email body with {{variables}}",
  "variables": ["variable1", "variable2", "etc..."],
  "personalizationNotes": "Brief explanation of key personalization changes made"
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const response = completion.choices[0].message.content;

    try {
      const personalizedEmail = JSON.parse(response);

      // Validate the structure
      if (!personalizedEmail.subject || !personalizedEmail.body) {
        throw new Error('Personalized email missing required fields');
      }

      // Ensure variables is an array
      if (!Array.isArray(personalizedEmail.variables)) {
        // Extract variables from the body if not provided
        const variableMatches = personalizedEmail.body.match(/\{\{([^}]+)\}\}/g);
        personalizedEmail.variables = variableMatches
          ? variableMatches.map(match => match.replace(/[{}]/g, ''))
          : ['prospectName', 'company'];
      }

      // Add metadata
      personalizedEmail.personalizationMetadata = {
        originalTemplate: {
          subject,
          body,
          variables,
        },
        prospectInfo: {
          name,
          email,
          company,
          title,
        },
        customizationPrompt,
        personalizedAt: new Date().toISOString(),
      };

      return personalizedEmail;
    } catch (parseError) {
      console.error('Failed to parse AI personalization response as JSON:', parseError);
      console.log('Raw AI response:', response);

      // Fallback: create basic personalization
      const fallbackPersonalization = {
        subject: extractPersonalizedSubject(response, subject, name, company),
        body: extractPersonalizedBody(response, body, name, company),
        variables: extractVariablesFromText(response),
        personalizationNotes: 'AI personalization with fallback parsing',
        personalizationMetadata: {
          originalTemplate: { subject, body, variables },
          prospectInfo: { name, email, company, title },
          customizationPrompt,
          personalizedAt: new Date().toISOString(),
          fallbackMode: true,
        }
      };

      return fallbackPersonalization;
    }
  } catch (error) {
    console.error('Email personalization error:', error);
    throw new Error(`Failed to personalize email: ${error.message}`);
  }
}

async function refactorPersonalizedEmail(currentEmail, refactorPrompt, prospectData, researchData) {
  try {
    const { subject, body } = currentEmail;
    const { name, company, title } = prospectData;

    const systemPrompt = `You are an expert email copywriter. Your task is to refactor an existing personalized email based on user feedback.

Guidelines:
1. Maintain the professional tone and intent of the original email
2. Address the specific refactoring request
3. Keep the email concise and effective
4. Ensure all personalization remains intact
5. Make it feel authentic and personalized
6. Follow email best practices

Your goal is to improve the email while preserving its core message and personalization.`;

    const userPrompt = `Please refactor the following personalized email:

CURRENT EMAIL:
Subject: ${subject}
Body: ${body}

REFACTOR REQUEST:
${refactorPrompt}

PROSPECT CONTEXT:
Name: ${name}
Company: ${company || 'Not specified'}
Title: ${title || 'Not specified'}

RESEARCH DATA:
${JSON.stringify(researchData, null, 2)}

Please provide the refactored email as JSON:
{
  "subject": "Refactored subject line",
  "body": "Refactored email body with {{variables}}",
  "variables": ["variable1", "variable2", "etc..."],
  "changesMade": "Brief description of changes made based on the refactoring request"
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const response = completion.choices[0].message.content;

    try {
      const refactoredEmail = JSON.parse(response);

      // Validate the structure
      if (!refactoredEmail.subject || !refactoredEmail.body) {
        throw new Error('Refactored email missing required fields');
      }

      // Ensure variables is an array
      if (!Array.isArray(refactoredEmail.variables)) {
        const variableMatches = refactoredEmail.body.match(/\{\{([^}]+)\}\}/g);
        refactoredEmail.variables = variableMatches
          ? variableMatches.map(match => match.replace(/[{}]/g, ''))
          : extractVariablesFromText(body);
      }

      // Add metadata
      refactoredEmail.refactoringMetadata = {
        originalEmail: { subject, body },
        refactorPrompt,
        prospectInfo: { name, company, title },
        refactoredAt: new Date().toISOString(),
      };

      return refactoredEmail;
    } catch (parseError) {
      console.error('Failed to parse AI refactoring response as JSON:', parseError);
      console.log('Raw AI response:', response);

      throw new Error('Failed to parse refactored email. Please try again with a more specific request.');
    }
  } catch (error) {
    console.error('Email refactoring error:', error);
    throw new Error(`Failed to refactor email: ${error.message}`);
  }
}

function extractPersonalizedSubject(text, originalSubject, name, company) {
  // Try to find a personalized subject in the AI response
  const subjectMatch = text.match(/subject[:\s]+([^\n]+)/i);
  if (subjectMatch) {
    return subjectMatch[1].trim();
  }

  // Fallback: create basic personalization
  if (company && originalSubject.toLowerCase().includes('company')) {
    return originalSubject.replace(/company/gi, company);
  }
  if (name && originalSubject.toLowerCase().includes('name')) {
    return originalSubject.replace(/name/gi, name);
  }

  return originalSubject;
}

function extractPersonalizedBody(text, originalBody, name, company) {
  // Try to extract body content from the AI response
  const bodyPatterns = [
    /body[:\s]+([\s\S]*?)(?:variables:|$)/i,
    /"body":\s*"([^"]+)"/,
    /Body:?\s*\n([\s\S]*?)(?:\n\n|\n[A-Z]|\nVariable|\n$)/i
  ];

  for (const pattern of bodyPatterns) {
    const match = text.match(pattern);
    if (match) {
      let extractedBody = match[1].trim();

      // Basic personalization fallback
      if (name) {
        extractedBody = extractedBody.replace(/\{\{[^}]*name[^}]*\}\}/gi, name);
      }
      if (company) {
        extractedBody = extractedBody.replace(/\{\{[^}]*company[^}]*\}\}/gi, company);
      }

      return extractedBody;
    }
  }

  // Return original with basic personalization
  let personalizedBody = originalBody;
  if (name) {
    personalizedBody = personalizedBody.replace(/\{\{[^}]*name[^}]*\}\}/gi, name);
  }
  if (company) {
    personalizedBody = personalizedBody.replace(/\{\{[^}]*company[^}]*\}\}/gi, company);
  }

  return personalizedBody;
}

function extractVariablesFromText(text) {
  // Look for variables in the body text
  const variableMatches = text.match(/\{\{([^}]+)\}\}/g);
  const variables = variableMatches
    ? variableMatches.map(match => match.replace(/[{}]/g, ''))
    : ['prospectName', 'company'];

  return [...new Set(variables)]; // Remove duplicates
}

module.exports = {
  personalizeEmail,
  refactorPersonalizedEmail,
};