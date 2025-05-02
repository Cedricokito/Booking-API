require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const errorHandler = require('./middleware/errorHandler');
const { defaultLimiter } = require('./middleware/rateLimiter');
const { cacheMiddleware, CACHE_DURATIONS } = require('./middleware/cache');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser with size limits
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Rate limiting
app.use(defaultLimiter);

// Set security HTTP headers
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:', 'https:'],
  },
}));

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  res.json({
    status: 'ok',
    timestamp: new Date(),
    uptime: process.uptime(),
    database: dbStatus
  });
});

// Cache commonly accessed routes
app.use('/api/properties', cacheMiddleware(CACHE_DURATIONS.MEDIUM));
app.use('/api/properties/:id/reviews', cacheMiddleware(CACHE_DURATIONS.SHORT));

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/properties', require('./routes/property.routes'));
app.use('/api/bookings', require('./routes/booking.routes'));
app.use('/api/reviews', require('./routes/review.routes'));

// 404 handler
app.use((req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
});

// Global error handler
app.use(errorHandler);

// Database connection
if (process.env.NODE_ENV !== 'test') {
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/booking-api', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => {
      console.error('MongoDB connection error:', err);
      process.exit(1);
    });

  mongoose.connection.on('error', err => {
    console.error('MongoDB error:', err);
  });
}

module.exports = app; 