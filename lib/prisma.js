const { PrismaClient } = require('@prisma/client');

// Global variable to cache the Prisma client instance
let prisma;

// Function to get or create the Prisma client
function getPrismaClient() {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
      errorFormat: 'pretty',
    });
  }
  return prisma;
}

// Export a function that returns the Prisma client
module.exports = {
  prisma: getPrismaClient(),
  getPrismaClient
};