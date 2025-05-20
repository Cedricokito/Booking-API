const rateLimit = require('express-rate-limit');
const MongoStore = require('rate-limit-mongo');
const { AppError } = require('./errorHandler');

/**
 * Rate limit configurations for different routes
 */
const RATE_LIMITS = {
  // General API limits
  DEFAULT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later'
  },
  
  // Authentication routes (login, register)
  AUTH: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 attempts per hour
    message: 'Too many authentication attempts, please try again later'
  },
  
  // Property creation/update
  PROPERTY: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // 50 property operations per hour
    message: 'Too many property operations, please try again later'
  },
  
  // Booking operations
  BOOKING: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 30, // 30 booking operations per hour
    message: 'Too many booking operations, please try again later'
  },
  
  // Review operations
  REVIEW: {
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 10, // 10 reviews per day
    message: 'Daily review limit reached, please try again tomorrow'
  }
};

/**
 * Create rate limiter middleware
 * @param {Object} config - Rate limit configuration
 * @returns {Function} Rate limiter middleware
 */
const createRateLimiter = (config) => {
  return rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    message: {
      status: 'error',
      message: config.message
    },
    handler: (req, res) => {
      throw new AppError(config.message, 429);
    },
    skip: (req) => process.env.NODE_ENV === 'test', // Skip in test environment
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    store: new MongoStore({
      uri: process.env.DATABASE_URL,
      collectionName: 'rateLimits',
      expireAfterMs: config.windowMs
    })
  });
};

// Create middleware instances
const defaultLimiter = createRateLimiter(RATE_LIMITS.DEFAULT);
const authLimiter = createRateLimiter(RATE_LIMITS.AUTH);
const propertyLimiter = createRateLimiter(RATE_LIMITS.PROPERTY);
const bookingLimiter = createRateLimiter(RATE_LIMITS.BOOKING);
const reviewLimiter = createRateLimiter(RATE_LIMITS.REVIEW);

module.exports = {
  defaultLimiter,
  authLimiter,
  propertyLimiter,
  bookingLimiter,
  reviewLimiter,
  RATE_LIMITS
}; 