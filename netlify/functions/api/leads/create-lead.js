const { getPrismaClient } = require('../../../lib/prisma');
const jwt = require('jsonwebtoken');

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
      name,
      email,
      company,
      title,
      website,
      industry,
      linkedinProfile,
      tags,
      notes,
      source
    } = JSON.parse(event.body);

    // Validate required fields
    if (!name || !email || !company) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Required fields missing',
          required: ['name', 'email', 'company']
        })
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid email format' })
      };
    }

    prisma = getPrismaClient();

    // Check if lead already exists
    const existingLead = await prisma.lead.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          {
            AND: [
              { name },
              { company }
            ]
          }
        ]
      }
    });

    if (existingLead) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({
          error: 'Lead already exists',
          existingLeadId: existingLead.id
        })
      };
    }

    // Create the lead
    const newLead = await prisma.lead.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase(),
        company: company.trim(),
        title: title?.trim(),
        website: website?.trim(),
        industry: industry?.trim(),
        linkedinProfile: linkedinProfile?.trim(),
        tags: tags || [],
        notes: notes?.trim(),
        source: source || 'manual',
        assignedTo: userId,
        status: 'NEW',
        score: calculateInitialScore({ title, industry, company })
      }
    });

    // Log the activity
    await prisma.activity.create({
      data: {
        leadId: newLead.id,
        type: 'LEAD_CREATED',
        description: `New lead created: ${newLead.name} at ${newLead.company}`,
        metadata: {
          source: source || 'manual',
          createdBy: userId
        }
      }
    });

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Lead created successfully',
        lead: newLead
      })
    };

  } catch (error) {
    console.error('Create lead error:', error);

    if (error.name === 'JsonWebTokenError') {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }

    if (error.code === 'P2002') {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ error: 'Lead with this email already exists' })
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to create lead',
        details: error.message
      })
    };
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
};

function calculateInitialScore(leadData) {
  let score = 30; // Base score

  // Title-based scoring
  if (leadData.title) {
    const title = leadData.title.toLowerCase();
    const highValueTitles = ['ceo', 'cto', 'cfo', 'founder', 'president', 'director', 'vp', 'head'];
    const mediumValueTitles = ['manager', 'lead', 'senior', 'principal'];

    if (highValueTitles.some(t => title.includes(t))) {
      score += 25;
    } else if (mediumValueTitles.some(t => title.includes(t))) {
      score += 15;
    } else if (title.includes('senior') || title.includes('lead')) {
      score += 10;
    }
  }

  // Industry-based scoring
  if (leadData.industry) {
    const highValueIndustries = ['technology', 'software', 'finance', 'banking', 'healthcare', 'manufacturing', 'retail'];
    const industry = leadData.industry.toLowerCase();

    if (highValueIndustries.some(ind => industry.includes(ind))) {
      score += 20;
    }
  }

  // Company size estimation (based on company name patterns)
  if (leadData.company) {
    // This is a basic heuristic - in production you'd use a company data API
    const company = leadData.company.toLowerCase();
    if (company.includes('inc') || company.includes('corp') || company.includes('ltd')) {
      score += 15; // Likely established company
    }
  }

  return Math.min(score, 100);
}