const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

/**
 * Create a test user in the database
 * @param {Object} userData - User data to create
 * @returns {Promise<Object>} Created user object
 */
const createTestUser = async (userData = {}) => {
  const User = mongoose.model('User');
  const defaultUser = {
    email: process.env.TEST_USER_EMAIL || 'test@example.com',
    password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
    name: 'Test User',
    role: 'user',
    ...userData
  };

  return await User.create(defaultUser);
};

/**
 * Generate a JWT token for testing
 * @param {Object} user - User object to generate token for
 * @returns {String} JWT token
 */
const generateTestToken = (user) => {
  return jwt.sign(
    { 
      userId: user._id,
      email: user.email,
      role: user.role 
    },
    process.env.JWT_SECRET || 'test-jwt-secret-key',
    { expiresIn: '1h' }
  );
};

/**
 * Create a test property in the database
 * @param {Object} propertyData - Property data to create
 * @param {Object} owner - Owner user object
 * @returns {Promise<Object>} Created property object
 */
const createTestProperty = async (propertyData = {}, owner) => {
  const Property = mongoose.model('Property');
  const defaultProperty = {
    title: 'Test Property',
    description: 'A test property for testing purposes',
    price: 100,
    location: 'Test Location',
    owner: owner._id,
    ...propertyData
  };

  return await Property.create(defaultProperty);
};

/**
 * Create a test booking in the database
 * @param {Object} bookingData - Booking data to create
 * @param {Object} user - User making the booking
 * @param {Object} property - Property being booked
 * @returns {Promise<Object>} Created booking object
 */
const createTestBooking = async (bookingData = {}, user, property) => {
  const Booking = mongoose.model('Booking');
  const defaultBooking = {
    user: user._id,
    property: property._id,
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    totalPrice: property.price * 7,
    status: 'pending',
    ...bookingData
  };

  return await Booking.create(defaultBooking);
};

/**
 * Clear all test data from the database
 * @returns {Promise<void>}
 */
const clearTestData = async () => {
  const collections = mongoose.connection.collections;
  await Promise.all(
    Object.values(collections).map(collection => collection.deleteMany({}))
  );
};

/**
 * Generate random test data
 * @param {String} type - Type of data to generate (email, name, etc.)
 * @returns {String} Generated test data
 */
const generateTestData = (type) => {
  const timestamp = Date.now();
  switch (type) {
    case 'email':
      return `test-${timestamp}@example.com`;
    case 'name':
      return `Test User ${timestamp}`;
    case 'propertyTitle':
      return `Test Property ${timestamp}`;
    default:
      return `Test ${timestamp}`;
  }
};

module.exports = {
  createTestUser,
  generateTestToken,
  createTestProperty,
  createTestBooking,
  clearTestData,
  generateTestData
}; 