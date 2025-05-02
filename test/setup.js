require('dotenv').config({ path: '.env.test' });
const { connectDB, closeDB, clearDB } = require('../src/config/database');

// Increase timeout for all tests
jest.setTimeout(30000);

// Custom matchers
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

// Global setup - runs once before all tests
beforeAll(async () => {
  try {
    // Connect to test database
    const testMongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/booking-api-test';
    await connectDB(testMongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    console.log('Connected to test database');
  } catch (error) {
    console.error('Error in test setup:', error);
    throw error;
  }
});

// Runs before each test suite
beforeEach(async () => {
  try {
    // Clear all test data before each test
    await clearDB();
  } catch (error) {
    console.error('Error clearing database:', error);
    throw error;
  }
});

// Cleanup after all tests are done
afterAll(async () => {
  try {
    await clearDB();
    await closeDB();
    console.log('Cleaned up and closed test database connection');
  } catch (error) {
    console.error('Error in test cleanup:', error);
    throw error;
  }
}); 