// AI Service for Prospect Research
// This service uses AI to research prospects and gather information for personalization

const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function researchProspect(prospectData) {
  try {
    const { name, email, company, title, website, linkedinProfile, industry } = prospectData;

    const systemPrompt = `You are a professional researcher specializing in business intelligence and lead research.

Research the following prospect and gather comprehensive information that can be used for email personalization and outreach.

Focus on finding:
1. Company information (size, industry, recent news, achievements)
2. Professional background and interests
3. Social media presence and recent activity
4. Personal interests or hobbies (if publicly available)
5. Recent company news or events
6. Industry trends affecting their company/role
7. Potential talking points for personalized outreach

Format your response as structured JSON with the following schema:
{
  "companyInfo": {
    "description": "Brief company description",
    "size": "Company size (approximate)",
    "industry": "Primary industry",
    "recentNews": ["Recent news item 1", "Recent news item 2"],
    "achievements": ["Company achievement 1", "Company achievement 2"]
  },
  "professionalInfo": {
    "background": "Professional background summary",
    "responsibilities": "Key responsibilities",
    "careerHighlights": ["Career highlight 1", "Career highlight 2"],
    "expertise": ["Area of expertise 1", "Area of expertise 2"]
  },
  "personalizationInsights": {
    "interests": ["Interest 1", "Interest 2"],
    "socialActivity": "Recent social media activity insights",
    "talkingPoints": ["Talking point 1", "Talking point 2", "Talking point 3"],
    "personalizationAngle": "Best angle for personalized outreach"
  },
  "industryContext": {
    "trends": ["Industry trend 1", "Industry trend 2"],
    "challenges": ["Industry challenge 1", "Industry challenge 2"],
    "opportunities": ["Opportunity 1", "Opportunity 2"]
  },
  "researchMetadata": {
    "researchDate": "Current date",
    "dataQuality": "High/Medium/Low based on available information",
    "confidence": "High/Medium/Low confidence in research quality"
  }
}

Be thorough but realistic. If information is not publicly available, indicate that clearly. Focus on information that would be genuinely useful for personalized business communication.`;

    const userPrompt = `Please research the following prospect:

Name: ${name}
Email: ${email}
Company: ${company || 'Not specified'}
Title: ${title || 'Not specified'}
Website: ${website || 'Not specified'}
LinkedIn Profile: ${linkedinProfile || 'Not specified'}
Industry: ${industry || 'Not specified'}

Please provide comprehensive research data that can be used for personalized email outreach and campaign management.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3, // Lower temperature for more factual research
      max_tokens: 2000,
    });

    const response = completion.choices[0].message.content;

    try {
      const researchData = JSON.parse(response);

      // Validate the structure
      const requiredSections = ['companyInfo', 'professionalInfo', 'personalizationInsights', 'industryContext', 'researchMetadata'];
      for (const section of requiredSections) {
        if (!researchData[section]) {
          console.warn(`Missing section in research data: ${section}`);
          researchData[section] = {};
        }
      }

      // Add metadata
      researchData.researchMetadata.researchDate = new Date().toISOString();
      researchData.researchMetadata.originalProspectData = {
        name,
        email,
        company,
        title,
        website,
        linkedinProfile,
        industry
      };

      return researchData;
    } catch (parseError) {
      console.error('Failed to parse AI research response as JSON:', parseError);
      console.log('Raw AI response:', response);

      // Fallback: create basic research structure
      const fallbackResearch = {
        companyInfo: {
          description: company ? `Information about ${company}` : 'Company information not available',
          size: 'Unknown',
          industry: industry || 'Unknown',
          recentNews: [],
          achievements: []
        },
        professionalInfo: {
          background: `Professional background for ${name}`,
          responsibilities: title ? `Responsibilities associated with ${title}` : 'Not specified',
          careerHighlights: [],
          expertise: []
        },
        personalizationInsights: {
          interests: [],
          socialActivity: 'No social media activity data available',
          talkingPoints: [
            `Professional inquiry about ${name}'s role`,
            'Business development discussion',
            'Industry-related conversation'
          ],
          personalizationAngle: 'Professional business development outreach'
        },
        industryContext: {
          trends: [],
          challenges: [],
          opportunities: []
        },
        researchMetadata: {
          researchDate: new Date().toISOString(),
          dataQuality: 'Low',
          confidence: 'Low',
          fallbackMode: true
        }
      };

      return fallbackResearch;
    }
  } catch (error) {
    console.error('Prospect research error:', error);
    throw new Error(`Failed to research prospect: ${error.message}`);
  }
}

module.exports = {
  researchProspect,
};