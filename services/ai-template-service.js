// AI Service for Email Template Generation
// This service uses OpenAI's API to generate email templates based on user prompts

const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateEmailTemplate(prompt, context = {}) {
  try {
    const systemPrompt = `You are an expert email copywriter specializing in professional business communication.

Generate an email template based on the user's request. The template should:
1. Be professional and well-structured
2. Include placeholders for personalization (e.g., {{prospectName}}, {{company}}, {{industry}})
3. Have a clear subject line that encourages opens
4. Be concise yet compelling
5. Include appropriate personalization variables

Format your response as JSON with the following structure:
{
  "subject": "Email subject line",
  "body": "Complete email body with personalization placeholders",
  "variables": ["prospectName", "company", "industry", "etc..."]
}

Make sure the body is well-formatted with appropriate paragraphs and line breaks.`;

    const userPrompt = `Generate an email template for: ${prompt}

Additional context:
${Object.entries(context).map(([key, value]) => `${key}: ${value}`).join('\n')}

Please make it professional and effective for business communication.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const response = completion.choices[0].message.content;

    try {
      const generatedTemplate = JSON.parse(response);

      // Validate the structure
      if (!generatedTemplate.subject || !generatedTemplate.body) {
        throw new Error('Generated template missing required fields');
      }

      // Ensure variables is an array
      if (!Array.isArray(generatedTemplate.variables)) {
        // Extract variables from the body if not provided
        const variableMatches = generatedTemplate.body.match(/\{\{([^}]+)\}\}/g);
        generatedTemplate.variables = variableMatches
          ? variableMatches.map(match => match.replace(/[{}]/g, ''))
          : ['prospectName', 'company'];
      }

      return generatedTemplate;
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.log('Raw AI response:', response);

      // Fallback: create a basic template from the text response
      const fallbackTemplate = {
        subject: extractSubjectFromText(response),
        body: extractBodyFromText(response),
        variables: extractVariablesFromText(response)
      };

      return fallbackTemplate;
    }
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error(`Failed to generate email template: ${error.message}`);
  }
}

function extractSubjectFromText(text) {
  const subjectMatch = text.match(/subject[:\s]+([^\n]+)/i);
  return subjectMatch ? subjectMatch[1].trim() : 'AI Generated Subject';
}

function extractBodyFromText(text) {
  // Try to extract body content between various markers
  const bodyPatterns = [
    /body[:\s]+([\s\S]*?)(?:variables:|$)/i,
    /"body":\s*"([^"]+)"/,
    /Body:?\s*\n([\s\S]*?)(?:\n\n|\n[A-Z]|\nVariable|\n$)/i
  ];

  for (const pattern of bodyPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  // Fallback: return a reasonable portion of the text
  return text.length > 500 ? text.substring(0, 500) + '...' : text;
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
  generateEmailTemplate,
};