// Load environment variables from .env file
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

// Global prisma instance for serverless environments
let prisma;

// Prevent multiple instances in development
if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });
  }
  prisma = global.__prisma;
}

// Ensure connection is established before using
async function ensureConnected() {
  try {
    await prisma.$connect();
    console.log('Prisma connected successfully');
  } catch (error) {
    console.error('Prisma connection failed:', error);
    console.error('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
    throw error;
  }
  return prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

// Export both the client and the connection function
module.exports = prisma;
module.exports.connect = ensureConnected;
