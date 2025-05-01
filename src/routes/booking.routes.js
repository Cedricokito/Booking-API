const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');

// Protected routes
router.post('/', authenticate, bookingController.createBooking);
router.get('/', authenticate, bookingController.getUserBookings);
router.get('/:id', authenticate, bookingController.getBooking);
router.put('/:id/status', authenticate, bookingController.updateBookingStatus);

// Admin only routes
router.put('/:id/payment', authenticate, requireRole(['ADMIN']), bookingController.updatePaymentStatus);

module.exports = router; 