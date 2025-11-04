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
      description,
      templateId,
      leadIds,
      sendImmediately = false,
      scheduledDate,
      dailyLimit,
      sendTime = '09:00',
      timezone = 'UTC'
    } = JSON.parse(event.body);

    // Validate required fields
    if (!name || !leadIds || leadIds.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Required fields missing',
          required: ['name', 'leadIds']
        })
      };
    }

    // Validate lead IDs
    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'leadIds must be a non-empty array' })
      };
    }

    prisma = getPrismaClient();

    // Verify template exists if provided
    if (templateId) {
      const template = await prisma.template.findFirst({
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

    // Verify all leads exist
    const leads = await prisma.lead.findMany({
      where: {
        id: { in: leadIds },
        isOptedOut: false
      },
      select: { id: true, name: true, email: true }
    });

    if (leads.length !== leadIds.length) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Some leads not found or opted out',
          foundLeads: leads.length,
          requestedLeads: leadIds.length
        })
      };
    }

    // Check for duplicates (leads already in active campaigns)
    const activeCampaigns = await prisma.campaign.findMany({
      where: {
        status: { in: ['DRAFT', 'SCHEDULED', 'SENDING'] },
        createdBy: userId
      },
      include: {
        leads: {
          select: { leadId: true }
        }
      }
    });

    const existingLeadIds = new Set();
    activeCampaigns.forEach(campaign => {
      campaign.leads.forEach(campaignLead => {
        existingLeadIds.add(campaignLead.leadId);
      });
    });

    const duplicateLeads = leadIds.filter(leadId => existingLeadIds.has(leadId));
    if (duplicateLeads.length > 0) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({
          error: 'Some leads are already in active campaigns',
          duplicateLeads
        })
      };
    }

    // Create the campaign
    const campaignStatus = sendImmediately ? 'SENDING' : 'DRAFT';
    const campaignData = {
      name: name.trim(),
      description: description?.trim(),
      status: campaignStatus,
      templateId,
      sendImmediately,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
      dailyLimit: dailyLimit ? parseInt(dailyLimit) : null,
      sendTime,
      timezone,
      totalLeads: leads.length,
      createdBy: userId
    };

    const newCampaign = await prisma.campaign.create({
      data: campaignData
    });

    // Add leads to campaign
    const campaignLeads = await prisma.campaignLead.createMany({
      data: leadIds.map(leadId => ({
        campaignId: newCampaign.id,
        leadId,
        status: sendImmediately ? 'PENDING' : 'PENDING'
      }))
    });

    // Update template usage count if template provided
    if (templateId) {
      await prisma.template.update({
        where: { id: templateId },
        data: {
          useCount: {
            increment: 1
          }
        }
      });
    }

    // If send immediately, trigger campaign processing
    if (sendImmediately) {
      // In a real implementation, you'd trigger a background job
      // For now, we'll just mark as ready to send
      console.log(`Campaign ${newCampaign.id} ready to send to ${leads.length} leads`);
    }

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Campaign created successfully',
        campaign: {
          ...newCampaign,
          leadsAdded: campaignLeads.count,
          leads: leads.map(lead => ({
            id: lead.id,
            name: lead.name,
            email: lead.email
          }))
        }
      })
    };

  } catch (error) {
    console.error('Create campaign error:', error);

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
        body: JSON.stringify({ error: 'Campaign with this name already exists' })
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to create campaign',
        details: error.message
      })
    };
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
};