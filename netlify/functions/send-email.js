const nodemailer = require('nodemailer');
const prisma = require('./utils/prisma');
const { HashingService } = require('./utils/hashing');
const { createSuccessResponse, createErrorResponse, createCorsResponse } = require('./utils/cors');

exports.handler = async (event, context) => {
  // Handle CORS preflight request
  if (event.httpMethod === 'OPTIONS') {
    return createCorsResponse(event);
  }

  // Only allow POST method
  if (event.httpMethod !== 'POST') {
    return createErrorResponse('Method not allowed', 405, event);
  }

  const userId = event.headers['x-user-id'] || event.headers['X-User-ID'];

  if (!userId) {
    return createErrorResponse('User ID is required', 401, event);
  }

  let smtpConfig;

  try {
    const { userId: requestUserId, to, subject, html, fromEmail, fromName, text, smtpPassword } = JSON.parse(event.body);

    // Validate required fields
    if (!requestUserId || !to || !subject || !html) {
      return createErrorResponse('Missing required fields: userId, to, subject, html', 400, event);
    }

    // Validate userId matches authenticated user
    if (requestUserId !== userId) {
      return createErrorResponse('Unauthorized: User ID mismatch', 403, event);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return createErrorResponse('Invalid recipient email format', 400, event);
    }

    // Get user's SMTP config from database
    smtpConfig = await prisma.smtpConfig.findUnique({
      where: { userId }
    });

    if (!smtpConfig) {
      return createErrorResponse('SMTP configuration not found for user', 404, event);
    }

    if (!smtpConfig.isActive) {
      return createErrorResponse('SMTP configuration is inactive', 400, event);
    }

    // For security, require the SMTP password to be provided in the request
    // This prevents storing plain text passwords or implementing complex encryption
    if (!smtpPassword) {
      return createErrorResponse('SMTP password is required for sending emails', 400, event);
    }

    // Verify the provided password matches the stored hash
    const passwordValid = await HashingService.verifyPassword(smtpPassword, smtpConfig.passwordHash);
    if (!passwordValid) {
      return createErrorResponse('Invalid SMTP password', 401, event);
    }

    // Create transporter with user's SMTP settings
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: {
        user: smtpConfig.username,
        pass: smtpPassword // Use the provided password for authentication
      },
      tls: {
        rejectUnauthorized: false // Allow self-signed certificates
      }
    });

    // Verify transporter connection before sending
    await transporter.verify();

    // Prepare email options
    const mailOptions = {
      from: {
        name: fromName || smtpConfig.fromname || '',
        address: fromEmail || smtpConfig.fromemail
      },
      to: to,
      subject: subject,
      html: html,
      text: text || undefined // Include text version if provided
    };

    // Send email
    const result = await transporter.sendMail(mailOptions);

    // Log successful email
    await prisma.emailLog.create({
      data: {
        to: to,
        from: fromEmail || smtpConfig.fromemail,
        subject: subject,
        status: 'SENT',
        provider: 'SMTP',
        sentAt: new Date()
      }
    });

    return createSuccessResponse({
      success: true,
      messageId: result.messageId,
      provider: 'SMTP',
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      sentAt: new Date().toISOString()
    }, 200, event);

  } catch (error) {
    console.error('Email sending error:', error);

    // Extract request body for logging
    let requestBody;
    try {
      requestBody = JSON.parse(event.body);
    } catch (parseError) {
      requestBody = {};
    }

    // Log failed email if we have user info
    if (smtpConfig && requestBody.userId) {
      try {
        await prisma.emailLog.create({
          data: {
            to: requestBody.to || '',
            from: smtpConfig?.fromemail || '',
            subject: requestBody.subject || '',
            status: 'FAILED',
            provider: 'SMTP',
            errorMessage: error.message
          }
        });
      } catch (logError) {
        console.error('Failed to log email error:', logError);
      }
    }

    // Handle specific SMTP errors
    if (error.code === 'EAUTH') {
      return createErrorResponse('SMTP authentication failed. Check your credentials.', 401, event);
    }

    if (error.code === 'ECONNECTION') {
      return createErrorResponse('SMTP connection failed. Check your host and port settings.', 503, event);
    }

    if (error.code === 'ETIMEDOUT') {
      return createErrorResponse('SMTP connection timeout. Please try again later.', 504, event);
    }

    if (error.code === 'EMESSAGE') {
      return createErrorResponse('Message rejected by SMTP server. Check email content and recipient.', 400, event);
    }

    return createErrorResponse('Failed to send email: ' + error.message, 500, event);
  } finally {
    // Ensure prisma connection is properly handled
    if (prisma.$disconnect) {
      await prisma.$disconnect();
    }
  }
};

