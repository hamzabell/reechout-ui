const { getPrismaClient } = require('../../../../lib/prisma');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

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
    const token = event.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No token provided' })
      };
    }

    prisma = getPrismaClient();

    // Find the session
    const session = await prisma.session.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            company: true,
            title: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true
          }
        }
      }
    });

    if (!session || !session.isActive || session.expiresAt < new Date()) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid or expired session' })
      };
    }

    if (!session.user.isActive) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Account is deactivated' })
      };
    }

    // Generate new JWT token
    const newToken = jwt.sign(
      { userId: session.user.id, email: session.user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Create new session
    const newSessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Deactivate old session
    await prisma.session.update({
      where: { token },
      data: { isActive: false }
    });

    // Create new session
    await prisma.session.create({
      data: {
        userId: session.user.id,
        token: newSessionToken,
        expiresAt: expiresAt,
        isActive: true
      }
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Token refreshed successfully',
        user: session.user,
        token: newToken,
        sessionToken: newSessionToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
      })
    };

  } catch (error) {
    console.error('Token refresh error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Token refresh failed',
        details: error.message
      })
    };
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
};