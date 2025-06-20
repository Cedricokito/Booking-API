require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { execSync } = require('child_process');

console.log('Current working directory:', process.cwd());
console.log('Environment variables loaded:');
console.log('AUTH_SECRET_KEY:', process.env.AUTH_SECRET_KEY);
console.log('DATABASE_URL:', process.env.DATABASE_URL);

// Ensure AUTH_SECRET_KEY is set
if (!process.env.AUTH_SECRET_KEY) {
  throw new Error('AUTH_SECRET_KEY must be set in .env file');
}

// Log environment variables for debugging
console.log('Environment variables loaded:');
console.log('AUTH_SECRET_KEY:', process.env.AUTH_SECRET_KEY ? 'Set' : 'Not set');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = 3001;
// process.env.AUTH_SECRET_KEY = 'test-secret-key'; // This was causing the token mismatch
process.env.DATABASE_URL = 'file:./dev.db';

// Set a higher timeout for all tests
jest.setTimeout(30000); // 30 seconds

// Global setup to reset and seed the database before all tests
beforeAll(() => {
  console.log('Jest global setup: Resetting and seeding database...');
  try {
    execSync('npx prisma migrate reset --force', { stdio: 'inherit' });
    execSync('npx prisma db seed', { stdio: 'inherit' });
    console.log('Database reset and seeded successfully.');
  } catch (error) {
    console.error('Failed to reset and seed database:', error);
    process.exit(1);
  }
});

// Global afterAll
afterAll(async () => {
  // Clean up database after all tests
  await prisma.review.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.property.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

// Global beforeEach
beforeEach(async () => {
  // Clean up database before each test
  await prisma.review.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.property.deleteMany();
  await prisma.user.deleteMany();
});

// Global afterEach
afterEach(async () => {
  // Add any test-specific cleanup here
}); 