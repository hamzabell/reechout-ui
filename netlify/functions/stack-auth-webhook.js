const { PrismaClient } = require('@prisma/client');
const { handleCors, addCorsHeaders } = require('./cors-helper');
const crypto = require('crypto');

// Initialize Prisma Client for serverless environment
const prisma = new PrismaClient();

// Webhook secret from environment (configure this in Stack Auth dashboard)
const WEBHOOK_SECRET = process.env.STACK_AUTH_WEBHOOK_SECRET;

// Verify Svix webhook signature
const verifyWebhookSignature = (payload, signature, secret) => {
  try {
    // Svix signature format: svix=v1,hash1=...,hash2=...
    const svixSignature = signature;

    // Extract the timestamp and signature from the header
    const [timestamp, signatureElements] = svixSignature.split(',');

    if (!timestamp || !signatureElements) {
      return false;
    }

    // Parse timestamp
    const ts = timestamp.split('=')[1];
    const now = Math.floor(Date.now() / 1000);

    // Reject if timestamp is older than 5 minutes
    if (now - parseInt(ts) > 300) {
      return false;
    }

    // Create the signed payload
    const signedPayload = `${ts}.${payload}`;

    // Extract signatures and verify each one
    const signatures = signatureElements.split('=');

    for (let i = 1; i < signatures.length; i += 2) {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(signedPayload, 'utf8')
        .digest('base64');

      if (signatures[i] === expectedSignature) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
};

// Handle user.created event
const handleUserCreated = async (userData) => {
  try {
    const user = userData.data;

    // Check if user already exists in database
    const existingUser = await prisma.user.findUnique({
      where: { neonUserId: user.id }
    });

    if (existingUser) {
      console.log(`User ${user.id} already exists in database`);
      return existingUser;
    }

    // Create user in database
    const newUser = await prisma.user.create({
      data: {
        neonUserId: user.id,
        email: user.primaryEmail || user.email,
        name: user.displayName || user.name || '',
        emailConfirmed: user.emailVerified || false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });

    console.log(`Created user ${user.id} in database`);
    return newUser;

  } catch (error) {
    console.error('Error handling user.created event:', error);
    throw error;
  }
};

// Handle user.verified event
const handleUserVerified = async (userData) => {
  try {
    const user = userData.data;

    // Update user's email confirmation status
    const updatedUser = await prisma.user.update({
      where: { neonUserId: user.id },
      data: {
        emailConfirmed: true,
        updatedAt: new Date(),
      }
    });

    console.log(`Email confirmed for user ${user.id}`);
    return updatedUser;

  } catch (error) {
    console.error('Error handling user.verified event:', error);

    // If user not found, create them
    if (error.code === 'P2025') {
      console.log(`User ${user.id} not found, creating...`);
      return await handleUserCreated(userData);
    }

    throw error;
  }
};

// Handle user.updated event
const handleUserUpdated = async (userData) => {
  try {
    const user = userData.data;

    // Update user profile information
    const updatedUser = await prisma.user.update({
      where: { neonUserId: user.id },
      data: {
        email: user.primaryEmail || user.email,
        name: user.displayName || user.name,
        emailConfirmed: user.emailVerified || false,
        updatedAt: new Date(),
      }
    });

    console.log(`Updated user ${user.id} in database`);
    return updatedUser;

  } catch (error) {
    console.error('Error handling user.updated event:', error);
    throw error;
  }
};

exports.handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return handleCors();
  }

  // Only allow POST requests for webhooks
  if (event.httpMethod !== 'POST') {
    return addCorsHeaders({
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    });
  }

  try {
    // Get the webhook signature from headers
    const signature = event.headers['svix-signature'] || event.headers['webhook-signature'];

    if (!signature) {
      console.error('Missing webhook signature');
      return addCorsHeaders({
        statusCode: 401,
        body: JSON.stringify({ error: 'Missing webhook signature' })
      });
    }

    if (!WEBHOOK_SECRET) {
      console.error('Webhook secret not configured');
      return addCorsHeaders({
        statusCode: 500,
        body: JSON.stringify({ error: 'Webhook secret not configured' })
      });
    }

    // Verify webhook signature
    const isValid = verifyWebhookSignature(event.body, signature, WEBHOOK_SECRET);

    if (!isValid) {
      console.error('Invalid webhook signature');
      return addCorsHeaders({
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid webhook signature' })
      });
    }

    // Parse webhook payload
    const webhookData = JSON.parse(event.body);
    const { type, data } = webhookData;

    console.log(`Processing webhook event: ${type}`);

    let result;

    // Handle different webhook events
    switch (type) {
      case 'user.created':
        result = await handleUserCreated(webhookData);
        break;

      case 'user.verified':
        result = await handleUserVerified(webhookData);
        break;

      case 'user.updated':
        result = await handleUserUpdated(webhookData);
        break;

      default:
        console.log(`Unhandled webhook event type: ${type}`);
        result = { message: 'Event type not handled' };
    }

    return addCorsHeaders({
      statusCode: 200,
      body: JSON.stringify({
        message: `Webhook ${type} processed successfully`,
        data: result
      })
    });

  } catch (error) {
    console.error('Webhook processing error:', error);

    return addCorsHeaders({
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    });
  } finally {
    // Disconnect Prisma client in serverless environment
    await prisma.$disconnect();
  }
};