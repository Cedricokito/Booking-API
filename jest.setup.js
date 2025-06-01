require('dotenv').config();

console.log('Current working directory:', process.cwd());
console.log('Environment variables loaded:');
console.log('JWT_SECRET:', process.env.JWT_SECRET);
console.log('DATABASE_URL:', process.env.DATABASE_URL);

// Ensure JWT_SECRET is set
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in .env file');
}

// Log environment variables for debugging
console.log('Environment variables loaded:');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = 3001;
process.env.JWT_SECRET = 'test-secret';
process.env.DATABASE_URL = 'file:./prisma/test.db';

// Increase timeout for all tests
jest.setTimeout(10000);

// Global beforeAll
beforeAll(async () => {
  // Add any global setup here
});

// Global afterAll
afterAll(async () => {
  // Add any global cleanup here
});

// Global beforeEach
beforeEach(async () => {
  // Add any test-specific setup here
});

// Global afterEach
afterEach(async () => {
  // Add any test-specific cleanup here
}); 