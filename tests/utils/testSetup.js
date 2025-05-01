const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../../src/models/user.model');

let mongoServer;

// Helper function to create a test user and get auth token
async function createTestUserAndToken(userData = {}) {
  const defaultUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'Password123!',
    role: 'USER',
    ...userData
  };

  const user = await User.create(defaultUser);
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'test-secret');
  
  return { user, token };
}

// Helper function to clear all collections
async function clearDatabase() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
}

// Helper function to close database connection
async function closeDatabase() {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (mongoServer) {
    await mongoServer.stop();
  }
}

// Helper function to connect to test database
async function connectDatabase() {
  try {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = await mongoServer.getUri();
    await mongoose.connect(mongoUri);
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