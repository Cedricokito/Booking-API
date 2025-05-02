import express from 'express';
import dotenv from 'dotenv';
import * as Sentry from '@sentry/node';

import userRoutes from './routes/userRoutes.js';
import hostRoutes from './routes/hostRoutes.js';
import propertyRoutes from './routes/propertyRoutes.js'; // Import property routes
import amenityRoutes from './routes/amenityRoutes.js'; // Import amenity routes
import bookingRoutes from './routes/bookingRoutes.js'; // Import booking routes
import reviewRoutes from './routes/reviewRoutes.js'; // Import review routes


import { loggingMiddleware } from './middleware/loggingMiddleware.js';
import { errorHandlingMiddleware } from './middleware/errorHandlingMiddleware.js';
import { login } from './controllers/userController.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});


// Middleware to parse JSON bodies
app.use(express.json());

// Middleware for logging
app.use(loggingMiddleware);

// Routes
app.use("/login", login)
app.use('/users', userRoutes);
app.use('/hosts', hostRoutes);
app.use('/properties', propertyRoutes); 
app.use('/amenities', amenityRoutes); 
app.use('/bookings', bookingRoutes); 
app.use('/reviews', reviewRoutes);



// Global error handler
app.use(errorHandlingMiddleware);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
