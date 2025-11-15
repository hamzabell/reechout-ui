const { PrismaClient } = require('@prisma/client');
const { createCorsResponse, createSuccessResponse, createErrorResponse } = require('./utils/cors');

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
    return createCorsResponse(event);
  }

  try {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
      return createErrorResponse('Method not allowed', 405, event);
    }

    // Parse request body
    const { sequenceId, scheduledDate, timezone, userId, dailyLimit, sendTime } = JSON.parse(event.body);

    if (!sequenceId || !scheduledDate || !timezone || !userId) {
      return createErrorResponse('Missing required fields: sequenceId, scheduledDate, timezone, userId', 400, event);
    }

    // Validate timezone
    if (!isValidTimezone(timezone)) {
      return createErrorResponse('Invalid timezone. Please select a valid timezone from the list.', 400, event);
    }

    // Validate scheduled date is in the future
    const scheduledUTC = convertToUTC(scheduledDate, timezone);
    const now = new Date();

    if (scheduledUTC <= now) {
      return createErrorResponse('Scheduled date must be in the future', 400, event);
    }

    // Get current campaign
    const campaign = await prisma.sequence.findUnique({
      where: { id: sequenceId },
      include: {
        creator: {
          select: {
            id: true,
            neonUserId: true
          }
        }
      }
    });

    if (!campaign) {
      return createErrorResponse('Campaign not found', 404, event);
    }

    // Verify ownership
    if (campaign.createdBy !== userId && campaign.creator.neonUserId !== userId) {
      return createErrorResponse('Not authorized to schedule this campaign', 403, event);
    }

    // Check if campaign can be scheduled (must be in DRAFT or SCHEDULED status)
    if (campaign.status !== 'DRAFT' && campaign.status !== 'SCHEDULED') {
      return createErrorResponse('Only draft or scheduled campaigns can be scheduled', 400, event);
    }

    // Validate optional parameters
    if (dailyLimit && (dailyLimit < 1 || dailyLimit > 1000)) {
      return createErrorResponse('Daily limit must be between 1 and 1000', 400, event);
    }

    if (sendTime) {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(sendTime)) {
        return createErrorResponse('Send time must be in HH:MM format (24-hour)', 400, event);
      }
    }

    // Update campaign with scheduling information
    const updateData = {
      status: 'SCHEDULED', // Set to scheduled and will start processing at scheduled time
      scheduledAt: scheduledUTC,
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
        startedAt: updatedCampaign.startedAt?.toISOString(),
        scheduledAt: updatedCampaign.scheduledAt.toISOString(),
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

    return createSuccessResponse(response, 200, event);

  } catch (error) {
    console.error('Campaign scheduling error:', error);

    return createErrorResponse(
      `Internal server error: ${error.message}`,
      500,
      event
    );
  } finally {
    await prisma.$disconnect();
  }
};