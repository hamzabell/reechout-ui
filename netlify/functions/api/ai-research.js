const { getPrismaClient } = require('../../../lib/prisma');
const axios = require('axios');
const jwt = require('jsonwebtoken');

exports.handler = async (event, context) => {
  // Set CORS headers
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

    // Initialize Prisma client
    prisma = getPrismaClient();

    const { leadId, researchType = 'comprehensive' } = JSON.parse(event.body);

    if (!leadId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Lead ID is required' })
      };
    }

    // Get the lead from database
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        title: true,
        website: true,
        industry: true,
        linkedinProfile: true,
        researchData: true,
        personalizationData: true
      }
    });

    if (!lead) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Lead not found' })
      };
    }

    // Check if research was done recently (within last 7 days)
    if (lead.researchData && lead.researchData.lastResearched) {
      const lastResearched = new Date(lead.researchData.lastResearched);
      const daysSinceResearch = (Date.now() - lastResearched) / (1000 * 60 * 60 * 24);

      if (daysSinceResearch < 7) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: 'Using cached research data',
            researchData: lead.researchData,
            personalizationData: lead.personalizationData,
            cached: true
          })
        };
      }
    }

    // Perform comprehensive research
    const researchResults = await performComprehensiveResearch(lead, researchType);

    // Generate personalization insights
    const personalizationData = await generatePersonalizationInsights(lead, researchResults);

    // Update lead with research findings
    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: {
        researchData: {
          ...researchResults,
          lastResearched: new Date().toISOString(),
          researchType
        },
        personalizationData,
        score: calculateLeadScore(lead, researchResults, personalizationData),
        updatedAt: new Date()
      }
    });

    // Log the research activity
    await prisma.activity.create({
      data: {
        leadId: leadId,
        type: 'RESEARCH_COMPLETED',
        description: `Comprehensive research completed for ${lead.name} at ${lead.company}`,
        metadata: {
          researchType,
          dataPoints: Object.keys(researchResults).length,
          personalizationScore: personalizationData.score || 0
        }
      }
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Research completed successfully',
        researchData: updatedLead.researchData,
        personalizationData: updatedLead.personalizationData,
        leadScore: updatedLead.score,
        cached: false
      })
    };

  } catch (error) {
    console.error('AI research error:', error);

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
        error: 'Failed to complete research',
        details: error.message
      })
    };
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
};

async function performComprehensiveResearch(lead, researchType) {
  const results = {
    company: {},
    person: {},
    industry: {},
    technology: {},
    recentNews: {},
    financial: {},
    competitors: {}
  };

  try {
    // 1. Company Research using Lemonfox.ai
    if (lead.company || lead.website) {
      results.company = await researchCompanyWithLemonfox(lead.company, lead.website, lead.name);
    }

    // 2. Person Research (if LinkedIn profile available)
    if (lead.linkedinProfile) {
      results.person = await researchPersonWithLemonfox(lead.linkedinProfile, lead.name);
    }

    // 3. Industry Analysis
    if (lead.industry || results.company.industry) {
      results.industry = await analyzeIndustry(lead.industry || results.company.industry);
    }

    // 4. Technology Stack Analysis
    if (lead.website) {
      results.technology = await analyzeTechnologyStack(lead.website);
    }

    // 5. Recent News and Events
    if (lead.company) {
      results.recentNews = await getRecentNews(lead.company);
    }

    // 6. Financial Information (if available)
    if (results.company.funding || results.company.revenue) {
      results.financial = await getFinancialInfo(results.company);
    }

    // 7. Competitor Analysis
    if (lead.company && results.company.industry) {
      results.competitors = await analyzeCompetitors(lead.company, results.company.industry);
    }

  } catch (error) {
    console.error('Research error:', error);
    results.error = error.message;
  }

  return results;
}

async function researchCompanyWithLemonfox(company, website, personName) {
  if (!process.env.LEMONFOX_API_KEY) {
    throw new Error('Lemonfox API key not configured');
  }

  const searchQuery = company || website;
  if (!searchQuery) {
    return { error: 'No company or website provided' };
  }

  try {
    const response = await axios.post('https://api.lemonfox.ai/v1/company-research', {
      company_name: company,
      website: website,
      include_data: [
        'overview',
        'description',
        'industry',
        'size',
        'revenue',
        'funding',
        'technologies',
        'locations',
        'recent_news',
        'key_people',
        'competitors'
      ],
      person_name: personName
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.LEMONFOX_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    return response.data;

  } catch (error) {
    console.error('Lemonfox company research failed:', error);

    // Fallback to web research
    return await fallbackCompanyResearch(company, website);
  }
}

async function researchPersonWithLemonfox(linkedinProfile, name) {
  if (!process.env.LEMONFOX_API_KEY) {
    return { error: 'Lemonfox API key not configured' };
  }

  try {
    const response = await axios.post('https://api.lemonfox.ai/v1/person-research', {
      name: name,
      linkedin_profile: linkedinProfile,
      include_data: [
        'current_position',
        'experience',
        'education',
        'skills',
        'recent_activity',
        'interests'
      ]
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.LEMONFOX_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    return response.data;

  } catch (error) {
    console.error('Lemonfox person research failed:', error);
    return { error: 'Person research failed', details: error.message };
  }
}

async function analyzeIndustry(industry) {
  if (!process.env.LEMONFOX_API_KEY) {
    return { error: 'Lemonfox API key not configured' };
  }

  try {
    const response = await axios.post('https://api.lemonfox.ai/v1/industry-analysis', {
      industry: industry,
      include_data: [
        'trends',
        'challenges',
        'opportunities',
        'key_players',
        'market_size',
        'growth_rate'
      ]
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.LEMONFOX_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 20000
    });

    return response.data;

  } catch (error) {
    console.error('Industry analysis failed:', error);
    return { error: 'Industry analysis failed', details: error.message };
  }
}

async function analyzeTechnologyStack(website) {
  if (!process.env.LEMONFOX_API_KEY) {
    return { error: 'Lemonfox API key not configured' };
  }

  try {
    const response = await axios.post('https://api.lemonfox.ai/v1/technology-analysis', {
      website: website,
      include_data: [
        'frontend_technologies',
        'backend_technologies',
        'databases',
        'cloud_services',
        'analytics_tools',
        'marketing_tools'
      ]
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.LEMONFOX_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 20000
    });

    return response.data;

  } catch (error) {
    console.error('Technology analysis failed:', error);
    return { error: 'Technology analysis failed', details: error.message };
  }
}

async function getRecentNews(company) {
  if (!process.env.LEMONFOX_API_KEY) {
    return { error: 'Lemonfox API key not configured' };
  }

  try {
    const response = await axios.post('https://api.lemonfox.ai/v1/news-analysis', {
      company: company,
      timeframe: '30d',
      limit: 10
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.LEMONFOX_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    return response.data;

  } catch (error) {
    console.error('News analysis failed:', error);
    return { error: 'News analysis failed', details: error.message };
  }
}

async function getFinancialInfo(companyData) {
  return {
    funding: companyData.funding || null,
    revenue: companyData.revenue || null,
    valuation: companyData.valuation || null,
    employees: companyData.employees || null,
    growth_stage: determineGrowthStage(companyData)
  };
}

async function analyzeCompetitors(company, industry) {
  if (!process.env.LEMONFOX_API_KEY) {
    return { error: 'Lemonfox API key not configured' };
  }

  try {
    const response = await axios.post('https://api.lemonfox.ai/v1/competitor-analysis', {
      company: company,
      industry: industry,
      limit: 5
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.LEMONFOX_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 20000
    });

    return response.data;

  } catch (error) {
    console.error('Competitor analysis failed:', error);
    return { error: 'Competitor analysis failed', details: error.message };
  }
}

async function generatePersonalizationInsights(lead, researchResults) {
  if (!process.env.LEMONFOX_API_KEY) {
    return { error: 'Lemonfox API key not configured' };
  }

  try {
    const prompt = buildPersonalizationPrompt(lead, researchResults);

    const response = await axios.post('https://api.lemonfox.ai/v1/personalization', {
      prompt: prompt,
      lead_context: {
        name: lead.name,
        company: lead.company,
        title: lead.title,
        industry: lead.industry
      },
      research_data: researchResults,
      output_format: {
        talking_points: 'array',
        pain_points: 'array',
        value_propositions: 'array',
        call_to_action: 'string',
        personalization_score: 'number',
        recommended_approach: 'string'
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
    console.error('Personalization failed:', error);
    return {
      error: 'Personalization failed',
      details: error.message,
      fallback: generateFallbackPersonalization(lead, researchResults)
    };
  }
}

function buildPersonalizationPrompt(lead, researchResults) {
  let prompt = `Generate personalized outreach insights for:\n`;
  prompt += `Name: ${lead.name}\n`;
  prompt += `Company: ${lead.company}\n`;
  prompt += `Title: ${lead.title}\n`;
  prompt += `Industry: ${lead.industry}\n\n`;

  if (researchResults.company?.description) {
    prompt += `Company Description: ${researchResults.company.description}\n\n`;
  }

  if (researchResults.company?.recent_news?.length > 0) {
    prompt += `Recent News: ${researchResults.company.recent_news.slice(0, 3).join(', ')}\n\n`;
  }

  if (researchResults.technology?.technologies?.length > 0) {
    prompt += `Technologies: ${researchResults.technology.technologies.join(', ')}\n\n`;
  }

  prompt += `Provide actionable personalization insights for effective outreach.`;

  return prompt;
}

function generateFallbackPersonalization(lead, researchResults) {
  return {
    talking_points: [
      `Interest in ${lead.company}'s growth and success`,
      `Potential synergy opportunities`,
      lead.industry ? `${lead.industry} industry trends` : 'Business development discussion'
    ],
    pain_points: [
      'Operational efficiency',
      'Scalability challenges',
      'Competitive landscape'
    ],
    value_propositions: [
      'Streamlined processes',
      'Cost optimization',
      'Enhanced productivity'
    ],
    call_to_action: 'Would you be open to a brief discussion next week?',
    personalization_score: 5,
    recommended_approach: 'Professional and value-focused'
  };
}

function calculateLeadScore(lead, researchResults, personalizationData) {
  let score = 30; // Base score

  // Company size and revenue
  if (researchResults.company?.size) {
    if (researchResults.company.size.includes('1000+')) score += 20;
    else if (researchResults.company.size.includes('500-999')) score += 15;
    else if (researchResults.company.size.includes('100-499')) score += 10;
    else if (researchResults.company.size.includes('50-99')) score += 5;
  }

  // Industry relevance
  if (lead.industry) {
    const highValueIndustries = ['technology', 'software', 'finance', 'healthcare', 'manufacturing'];
    if (highValueIndustries.some(ind => lead.industry.toLowerCase().includes(ind))) {
      score += 15;
    }
  }

  // Technology stack
  if (researchResults.technology?.technologies?.length > 0) {
    score += Math.min(researchResults.technology.technologies.length * 2, 15);
  }

  // Personalization data quality
  if (personalizationData.personalization_score) {
    score += personalizationData.personalization_score;
  }

  // Title relevance
  if (lead.title) {
    const decisionMakerTitles = ['ceo', 'cto', 'cfo', 'director', 'manager', 'vp', 'president'];
    if (decisionMakerTitles.some(title => lead.title.toLowerCase().includes(title))) {
      score += 10;
    }
  }

  return Math.min(score, 100); // Cap at 100
}

function determineGrowthStage(companyData) {
  if (!companyData.employees) return 'Unknown';

  const employees = parseInt(companyData.employees) || 0;

  if (employees < 10) return 'Startup';
  if (employees < 50) return 'Early Stage';
  if (employees < 200) return 'Growth Stage';
  if (employees < 1000) return 'Scale-up';
  return 'Enterprise';
}

async function fallbackCompanyResearch(company, website) {
  const research = {
    name: company || 'Unknown',
    website: website || 'Unknown',
    description: '',
    industry: '',
    size: '',
    location: '',
    founded: '',
    technologies: [],
    recent_news: [],
    error: 'Primary research failed, using fallback data'
  };

  if (!website) {
    return research;
  }

  try {
    // Use Jina AI for web scraping fallback
    const response = await axios.get(`https://r.jina.ai/http://${website}`, {
      timeout: 10000
    });
    const content = response.data;

    // Extract basic information
    research.description = extractDescription(content);
    research.technologies = extractTechnologies(content);

  } catch (error) {
    console.error('Fallback research failed:', error);
  }

  return research;
}

function extractDescription(content) {
  // Simple extraction - could be enhanced with NLP
  const sentences = content.split('.').filter(s => s.trim().length > 20);
  return sentences.slice(0, 2).join('. ') + '.';
}

function extractTechnologies(content) {
  const techKeywords = [
    'React', 'Vue', 'Angular', 'Node.js', 'Python', 'Java', 'JavaScript', 'TypeScript',
    'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'MongoDB', 'PostgreSQL',
    'MySQL', 'Redis', 'Elasticsearch', 'Salesforce', 'HubSpot', 'Stripe', 'Twilio'
  ];

  const found = [];
  techKeywords.forEach(tech => {
    if (content.toLowerCase().includes(tech.toLowerCase())) {
      found.push(tech);
    }
  });

  return found;
}