const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

// Set test database URL
process.env.DATABASE_URL = 'file:./test.db';
process.env.JWT_SECRET = 'test-secret-key';

const prisma = new PrismaClient();

// Helper function to create a test user and get auth token
async function createTestUserAndToken(userData = {}) {
  const defaultUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'Password123!',
    ...userData
  };

  // Delete existing user if exists
  await prisma.user.deleteMany({
    where: {
      email: defaultUser.email
    }
  });

  const user = await prisma.user.create({
    data: defaultUser
  });
  
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
  
  return { user, token };
}

// Helper function to clear all collections
async function clearDatabase() {
  await prisma.booking.deleteMany();
  await prisma.review.deleteMany();
  await prisma.property.deleteMany();
  await prisma.user.deleteMany();
}

// Helper function to close database connection
async function closeDatabase() {
  await prisma.$disconnect();
}

// Helper function to connect to test database
async function connectDatabase() {
  try {
    // Prisma maakt automatisch verbinding
    await prisma.$connect();
    // Clear database before tests
    await clearDatabase();
  } catch (error) {
    console.error('Error connecting to the test database:', error);
    throw error;
  }
}

module.exports = {
  createTestUserAndToken,
  clearDatabase,
  closeDatabase,
  connectDatabase
}; 