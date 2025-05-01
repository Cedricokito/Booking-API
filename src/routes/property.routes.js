const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/property.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');

// Public routes - only GET operations
router.get('/', propertyController.getProperties);
router.get('/:id', propertyController.getProperty);
router.get('/:id/reviews', propertyController.getPropertyReviews);

// Protected routes - require authentication
router.use(authenticate); // Apply authentication middleware to all routes below

// Property management
router.post('/', propertyController.createProperty);
router.put('/:id', propertyController.updateProperty);
router.delete('/:id', propertyController.deleteProperty);

// Reviews
router.post('/:id/reviews', propertyController.addReview);

// Admin only routes
router.put('/:id/status', requireRole(['ADMIN']), propertyController.updateProperty);

module.exports = router; 