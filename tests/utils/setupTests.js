require('dotenv').config({ path: '.env.test' });
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const { connectDB, closeDB, clearDB } = require('../../src/config/database');
const User = require('../../src/models/user.model');
const Property = require('../../src/models/property.model');
const Booking = require('../../src/models/booking.model');

let mongoServer;

// Increase timeout for database operations
jest.setTimeout(30000);

beforeAll(async () => {
  try {
    // Ensure any existing connections are closed
    await closeDB();
    
    // Create new in-memory database
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = await mongoServer.getUri();
    
    // Connect to in-memory database
    await connectDB(mongoUri);
  } catch (error) {
    console.error('Test setup failed:', error);
    // Clean up if setup fails
    if (mongoServer) {
      await mongoServer.stop();
    }
    throw error;
  }
});

afterAll(async () => {
  try {
    // Close database connection
    await closeDB();
    
    // Stop in-memory database
    if (mongoServer) {
      await mongoServer.stop();
    }
  } catch (error) {
    console.error('Test teardown failed:', error);
    throw error;
  }
});

beforeEach(async () => {
  if (!mongoServer) {
    throw new Error('MongoMemoryServer not initialized');
  }
  
  try {
    await clearDB();
  } catch (error) {
    console.error('Database cleanup failed:', error);
    throw error;
  }
});

// Test utilities
async function createTestUser(userData = {}) {
  const defaultUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'Password123!',
    role: 'USER',
    ...userData
  };

  return await User.create(defaultUser);
}

async function generateTestToken(user) {
  const token = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
  return `Bearer ${token}`;
}

async function createTestProperty(propertyData = {}, owner) {
  const defaultProperty = {
    name: 'Test Property',
    description: 'A test property description',
    price: 100,
    location: 'Test Location',
    amenities: ['wifi', 'parking'],
    images: [{ url: 'https://example.com/image.jpg', caption: 'Test Image' }],
    owner: owner._id,
    status: 'AVAILABLE',
    ...propertyData
  };

  const property = await Property.create(defaultProperty);
  return property;
}

async function createTestBooking(bookingData = {}, user, property) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 1);
  
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 3);

  const defaultBooking = {
    property: property._id,
    user: user._id,
    startDate,
    endDate,
    guestCount: 2,
    totalPrice: property.price * 2,
    status: 'PENDING',
    ...bookingData
  };

  return await Booking.create(defaultBooking);
}

// Make test utilities available globally
global.createTestUser = createTestUser;
global.generateTestToken = generateTestToken;
global.createTestProperty = createTestProperty;
global.createTestBooking = createTestBooking;

// Add custom jest matchers
expect.extend({
  toBeValidMongoId(received) {
    const pass = mongoose.Types.ObjectId.isValid(received);
    return {
      message: () => `expected ${received} to be a valid MongoDB ObjectId`,
      pass
    };
  }
}); 