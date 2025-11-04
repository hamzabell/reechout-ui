const { PrismaClient } = require('@prisma/client');
const { researchProspect } = require('../../../services/ai-research-service');

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

    const { prospectId, storeResearch = true } = JSON.parse(event.body);

    if (!prospectId) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Prospect ID is required' }),
      };
    }

    // Get prospect details
    const prospect = await prisma.prospect.findFirst({
      where: {
        id: prospectId,
        createdBy: userId,
      },
    });

    if (!prospect) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Prospect not found' }),
      };
    }

    // Check if research already exists
    if (prospect.researchData && storeResearch) {
      return {
        statusCode: 409,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'Research data already exists for this prospect',
          existingData: prospect.researchData
        }),
      };
    }

    // Conduct AI research
    const researchData = await researchProspect({
      name: prospect.name,
      email: prospect.email,
      company: prospect.company,
      title: prospect.title,
      website: prospect.website,
      linkedinProfile: prospect.linkedinProfile,
      industry: prospect.industry,
    });

    if (storeResearch) {
      // Store research data in prospect
      const updatedProspect = await prisma.prospect.update({
        where: { id: prospectId },
        data: {
          researchData,
        },
      });

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prospect: updatedProspect,
          researchData,
          stored: true,
        }),
      };
    } else {
      // Return research data without storing
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          researchData,
          stored: false,
        }),
      };
    }
  } catch (error) {
    console.error('Prospect research error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Failed to research prospect',
        details: error.message
      }),
    };
  }
};