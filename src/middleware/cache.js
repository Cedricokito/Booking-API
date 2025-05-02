const cache = require('memory-cache');
const { AppError } = require('./errorHandler');

/**
 * Cache duration constants in seconds
 */
const CACHE_DURATIONS = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400 // 24 hours
};

/**
 * Generate cache key based on request
 * @param {Object} req - Express request object
 * @returns {String} Cache key
 */
const generateCacheKey = (req) => {
  const userId = req.user ? req.user._id : 'anonymous';
  return `__express__${userId}__${req.originalUrl || req.url}`;
};

/**
 * Cache middleware factory
 * @param {Number} duration - Cache duration in seconds
 * @param {Function} keyGenerator - Optional custom key generator
 * @returns {Function} Express middleware
 */
const cacheMiddleware = (duration, keyGenerator = generateCacheKey) => {
  if (!duration) {
    throw new AppError('Cache duration is required', 500);
  }

  return async (req, res, next) => {
    // Skip caching for non-GET methods
    if (req.method !== 'GET') {
      return next();
    }

    const key = keyGenerator(req);
    const cachedResponse = cache.get(key);

    if (cachedResponse) {
      // Add cache hit header for debugging
      res.set('X-Cache', 'HIT');
      return res.json(cachedResponse);
    }

    // Store original send
    res.originalSend = res.json;

    // Override send
    res.json = (body) => {
      // Add cache miss header for debugging
      res.set('X-Cache', 'MISS');
      
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.put(key, body, duration * 1000);
      }
      
      res.originalSend(body);
    };

    next();
  };
};

/**
 * Clear cache by pattern
 * @param {String} pattern - Pattern to match cache keys
 */
const clearCache = (pattern) => {
  const keys = cache.keys();
  keys.forEach(key => {
    if (key.includes(pattern)) {
      cache.del(key);
    }
  });
};

module.exports = {
  cacheMiddleware,
  clearCache,
  CACHE_DURATIONS
}; 