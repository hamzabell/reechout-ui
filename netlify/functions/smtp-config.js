const nodemailer = require('nodemailer');
const { connect: ensureConnected } = require('./utils/prisma');
const { HashingService } = require('./utils/hashing');
const { createSuccessResponse, createErrorResponse, createCorsResponse } = require('./utils/cors');

exports.handler = async (event, context) => {
  // Handle CORS preflight request
  if (event.httpMethod === 'OPTIONS') {
    return createCorsResponse(event);
  }

  const userId = event.headers['x-user-id'] || event.headers['X-User-ID'];

  if (!userId) {
    return createErrorResponse('User ID is required', 401, event);
  }

  // Ensure database connection
  const prisma = await ensureConnected();

  try {
    const { httpMethod, pathParameters } = event;
    const path = pathParameters?.proxy || '';

    // Route handling
    if (httpMethod === 'GET' && (path === '' || path === '/')) {
      // Get user's SMTP configuration
      return await getSmtpConfig(userId, event, prisma);
    } else if (httpMethod === 'POST' && path === '') {
      // Create or update SMTP configuration
      return await createOrUpdateSmtpConfig(userId, JSON.parse(event.body), event, prisma);
    } else if (httpMethod === 'POST' && path === '/test') {
      // Test SMTP connection
      return await testSmtpConnection(userId, JSON.parse(event.body), event, prisma);
    } else if (httpMethod === 'DELETE' && path === '') {
      // Delete SMTP configuration
      return await deleteSmtpConfig(userId, event, prisma);
    } else {
      return createErrorResponse('Endpoint not found', 404, event);
    }
  } catch (error) {
    console.error('SMTP config error:', error);
    return createErrorResponse('Internal server error', 500, event);
  } finally {
    // Ensure prisma connection is properly handled
    try {
      if (prisma && prisma.$disconnect) {
        await prisma.$disconnect();
      }
    } catch (disconnectError) {
      console.error('Error disconnecting from database:', disconnectError);
    }
  }
};

/**
 * Get user's SMTP configuration
 */
async function getSmtpConfig(userId, event, prisma) {
  try {
    const config = await prisma.smtpConfig.findUnique({
      where: { userid: userId },
      select: {
        id: true,
        host: true,
        port: true,
        secure: true,
        username: true,
        fromemail: true,
        fromname: true,
        isactive: true,
        lasttested: true,
        testresult: true,
        createdat: true,
        updatedat: true
        // Exclude passwordhash for security
      }
    });

    if (!config) {
      return createSuccessResponse({ config: null }, 200, event);
    }

    return createSuccessResponse({ config }, 200, event);
  } catch (error) {
    console.error('Error fetching SMTP config:', error);
    return createErrorResponse('Failed to fetch SMTP configuration', 500, event);
  }
}

/**
 * Create or update SMTP configuration
 */
async function createOrUpdateSmtpConfig(userId, body, event, prisma) {
  const {
    host,
    port,
    secure = true,
    username,
    password,
    fromEmail,
    fromName,
    isActive = true
  } = body;

  // Enhanced Validation
  const errors = [];

  // Required fields validation
  if (!host || typeof host !== 'string' || host.trim().length === 0) {
    errors.push('Host is required and must be a valid string');
  }

  if (!port) {
    errors.push('Port is required');
  } else {
    const portNum = parseInt(port);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      errors.push('Port must be a number between 1 and 65535');
    }
  }

  if (!username || typeof username !== 'string' || username.trim().length === 0) {
    errors.push('Username is required and must be a valid string');
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    errors.push('Password is required');
  }

  if (!fromEmail || typeof fromEmail !== 'string' || fromEmail.trim().length === 0) {
    errors.push('From email is required and must be a valid string');
  }

  // Optional fields validation
  if (fromName && typeof fromName !== 'string') {
    errors.push('From name must be a string if provided');
  }

  if (errors.length > 0) {
    return createErrorResponse(errors.join(', '), 400, event);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(fromEmail.trim())) {
    return createErrorResponse('Invalid from email format', 400, event);
  }

  // Validate host format (basic check)
  const hostRegex = /^[a-zA-Z0-9.-]+$/;
  if (!hostRegex.test(host.trim())) {
    return createErrorResponse('Invalid host format', 400, event);
  }

  // Trim whitespace from inputs
  const trimmedHost = host.trim();
  const trimmedUsername = username.trim();
  const trimmedFromEmail = fromEmail.trim();
  const trimmedFromName = fromName ? fromName.trim() : null;

  try {
    // Hash the password
    const passwordhash = await HashingService.hashPassword(password);

    // Upsert the SMTP configuration
    const config = await prisma.smtpConfig.upsert({
      where: { userid: userId },
      update: {
        host: trimmedHost,
        port: parseInt(port),
        secure: Boolean(secure),
        username: trimmedUsername,
        passwordhash,
        fromemail: trimmedFromEmail,
        fromname: trimmedFromName,
        isactive: Boolean(isActive),
        updatedat: new Date()
      },
      create: {
        userid: userId,
        host: trimmedHost,
        port: parseInt(port),
        secure: Boolean(secure),
        username: trimmedUsername,
        passwordhash,
        fromemail: trimmedFromEmail,
        fromname: trimmedFromName,
        isactive: Boolean(isActive)
      },
      select: {
        id: true,
        host: true,
        port: true,
        secure: true,
        username: true,
        fromemail: true,
        fromname: true,
        isactive: true,
        createdat: true,
        updatedat: true
        // Exclude passwordhash
      }
    });

    return createSuccessResponse({
      config,
      message: 'SMTP configuration saved successfully'
    }, 200, event);
  } catch (error) {
    console.error('Error saving SMTP config:', error);
    return createErrorResponse('Failed to save SMTP configuration', 500, event);
  }
}

/**
 * Test SMTP connection
 */
async function testSmtpConnection(userId, body, event, prisma) {
  const { host, port, secure, username, password } = body;

  // Enhanced validation for testing
  const errors = [];

  if (!host || typeof host !== 'string' || host.trim().length === 0) {
    errors.push('Host is required for testing');
  }

  if (!port) {
    errors.push('Port is required for testing');
  } else {
    const portNum = parseInt(port);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      errors.push('Port must be a number between 1 and 65535');
    }
  }

  if (!username || typeof username !== 'string' || username.trim().length === 0) {
    errors.push('Username is required for testing');
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    errors.push('Password is required for testing');
  }

  if (errors.length > 0) {
    return createErrorResponse(errors.join(', '), 400, event);
  }

  // Trim whitespace from inputs
  const trimmedHost = host.trim();
  const trimmedUsername = username.trim();

  let transporter;
  let testResult = '';

  try {
    // Create transporter with provided credentials
    transporter = nodemailer.createTransport({
      host: trimmedHost,
      port: parseInt(port),
      secure: Boolean(secure),
      auth: {
        user: trimmedUsername,
        pass: password // Use plain password for testing
      },
      // Add timeout for connection testing
      connectionTimeout: 30000, // 30 seconds
      greetingTimeout: 15000,   // 15 seconds
      socketTimeout: 15000     // 15 seconds
    });

    // Test connection
    await transporter.verify();
    testResult = 'Connection successful';

    // Update test result in database if config exists
    await prisma.smtpConfig.update({
      where: { userid: userId },
      data: {
        lasttested: new Date(),
        testresult: testResult
      }
    }).catch(() => {
      // Ignore if config doesn't exist - this is just a test
    });

    return createSuccessResponse({
      success: true,
      message: testResult,
      testedAt: new Date().toISOString()
    }, 200, event);

  } catch (error) {
    testResult = `Connection failed: ${error.message}`;
    console.error('SMTP test failed:', error);

    // Update test result in database if config exists
    await prisma.smtpConfig.update({
      where: { userid: userId },
      data: {
        lasttested: new Date(),
        testresult: testResult
      }
    }).catch(() => {
      // Ignore if config doesn't exist - this is just a test
    });

    // Handle specific SMTP errors
    let statusCode = 500;
    let errorMessage = testResult;

    if (error.code === 'EAUTH') {
      statusCode = 401;
      errorMessage = 'Authentication failed. Please check your username and password.';
    } else if (error.code === 'ECONNECTION') {
      statusCode = 503;
      errorMessage = 'Connection failed. Please check your host and port settings.';
    } else if (error.code === 'ETIMEDOUT') {
      statusCode = 504;
      errorMessage = 'Connection timeout. Please check your firewall and network settings.';
    }

    return createErrorResponse(errorMessage, statusCode, event);
  }
}

/**
 * Delete SMTP configuration
 */
async function deleteSmtpConfig(userId, event, prisma) {
  try {
    const deleted = await prisma.smtpConfig.delete({
      where: { userid: userId }
    });

    return createSuccessResponse({
      message: 'SMTP configuration deleted successfully',
      deletedConfig: {
        id: deleted.id,
        fromEmail: deleted.fromemail
      }
    }, 200, event);
  } catch (error) {
    if (error.code === 'P2025') {
      return createErrorResponse('SMTP configuration not found', 404, event);
    }
    console.error('Error deleting SMTP config:', error);
    return createErrorResponse('Failed to delete SMTP configuration', 500, event);
  }
}