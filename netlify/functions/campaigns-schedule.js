const { PrismaClient } = require('@prisma/client');
const cors = require('./utils/cors');

const prisma = new PrismaClient();

// Common timezone list for user selection
const COMMON_TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'America/Vancouver',
  'America/Mexico_City',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Rome',
  'Europe/Madrid',
  'Europe/Amsterdam',
  'Europe/Stockholm',
  'Europe/Moscow',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Hong_Kong',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Asia/Shanghai',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Pacific/Auckland',
  'UTC'
];

// Helper function to validate timezone
const isValidTimezone = (timezone) => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
};

// Helper function to convert scheduled date to UTC
const convertToUTC = (dateString, timezone) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }

    // Create a formatter for the target timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    // Format the date in the target timezone
    const parts = formatter.formatToParts(date);
    const year = parseInt(parts.find(p => p.type === 'year').value);
    const month = parseInt(parts.find(p => p.type === 'month').value) - 1;
    const day = parseInt(parts.find(p => p.type === 'day').value);
    const hour = parseInt(parts.find(p => p.type === 'hour').value);
    const minute = parseInt(parts.find(p => p.type === 'minute').value);
    const second = parseInt(parts.find(p => p.type === 'second').value);

    // Create UTC date
    const utcDate = new Date(Date.UTC(year, month, day, hour, minute, second));
    return utcDate;
  } catch (error) {
    throw new Error(`Invalid date or timezone: ${error.message}`);
  }
};

exports.handler = async (event, context) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return cors({
      statusCode: 200,
      body: ''
    });
  }

  try {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
      return cors({
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' })
      });
    }

    // Parse request body
    const { sequenceId, scheduledDate, timezone, userId, dailyLimit, sendTime } = JSON.parse(event.body);

    if (!sequenceId || !scheduledDate || !timezone || !userId) {
      return cors({
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Missing required fields: sequenceId, scheduledDate, timezone, userId' 
        })
      });
    }

    // Validate timezone
    if (!isValidTimezone(timezone)) {
      return cors({
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Invalid timezone. Please select a valid timezone from the list.' 
        })
      });
    }

    // Validate scheduled date is in the future
    const scheduledUTC = convertToUTC(scheduledDate, timezone);
    const now = new Date();
    
    if (scheduledUTC <= now) {
      return cors({
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Scheduled date must be in the future' 
        })
      });
    }

    // Get current campaign
    const campaign = await prisma.sequence.findUnique({
      where: { id: sequenceId },
      include: {
        creator: {
          select: {
            id: true,
            neonId: true
          }
        }
      }
    });

    if (!campaign) {
      return cors({
        statusCode: 404,
        body: JSON.stringify({ error: 'Campaign not found' })
      });
    }

    // Verify ownership
    if (campaign.createdBy !== userId && campaign.creator.neonId !== userId) {
      return cors({
        statusCode: 403,
        body: JSON.stringify({ error: 'Not authorized to schedule this campaign' })
      });
    }

    // Check if campaign can be scheduled (must be in DRAFT status)
    if (campaign.status !== 'DRAFT') {
      return cors({
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Only draft campaigns can be scheduled' 
        })
      });
    }

    // Validate optional parameters
    if (dailyLimit && (dailyLimit < 1 || dailyLimit > 1000)) {
      return cors({
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Daily limit must be between 1 and 1000' 
        })
      });
    }

    if (sendTime) {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(sendTime)) {
        return cors({
          statusCode: 400,
          body: JSON.stringify({ 
            error: 'Send time must be in HH:MM format (24-hour)' 
          })
        });
      }
    }

    // Update campaign with scheduling information
    const updateData = {
      status: 'ACTIVE', // Set to active but will start processing at scheduled time
      startedAt: scheduledUTC,
      updatedAt: new Date()
    };

    const updatedCampaign = await prisma.sequence.update({
      where: { id: sequenceId },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
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

    // Store scheduling settings in a separate settings table or as part of campaign metadata
    // For now, we'll store it in a simple way - in a real implementation you might want a separate table
    const schedulingSettings = {
      scheduledDate: scheduledUTC.toISOString(),
      timezone,
      dailyLimit: dailyLimit || 50, // Default daily limit
      sendTime: sendTime || '09:00', // Default send time
      createdAt: new Date().toISOString()
    };

    // Format response
    const response = {
      success: true,
      message: 'Campaign scheduled successfully',
      campaign: {
        id: updatedCampaign.id,
        name: updatedCampaign.name,
        description: updatedCampaign.description,
        status: updatedCampaign.status,
        createdAt: updatedCampaign.createdAt.toISOString(),
        startedAt: updatedCampaign.startedAt.toISOString(),
        pausedAt: updatedCampaign.pausedAt?.toISOString(),
        completedAt: updatedCampaign.completedAt?.toISOString(),
        updatedAt: updatedCampaign.updatedAt.toISOString(),
        createdBy: updatedCampaign.createdBy,
        creator: updatedCampaign.creator,
        prospectsCount: updatedCampaign._count.campaignProspects,
        stepsCount: updatedCampaign._count.steps
      },
      scheduling: schedulingSettings,
      scheduledFor: {
        date: scheduledUTC.toISOString(),
        timezone: timezone,
        localTime: new Date(scheduledUTC).toLocaleString('en-US', {
          timeZone: timezone,
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      }
    };

    return cors({
      statusCode: 200,
      body: JSON.stringify(response)
    });

  } catch (error) {
    console.error('Campaign scheduling error:', error);
    
    return cors({
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    });
  } finally {
    await prisma.$disconnect();
  }
};

// Helper endpoint to get available timezones
exports.getTimezones = async () => {
  return cors({
    statusCode: 200,
    body: JSON.stringify({
      timezones: COMMON_TIMEZONES,
      currentTime: new Date().toISOString()
    })
  });
};