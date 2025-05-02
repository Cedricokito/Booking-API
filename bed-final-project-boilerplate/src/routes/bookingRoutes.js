import express from 'express';
import { createBooking, getBooking, updateBooking, deleteBooking, getBookings } from '../controllers/bookingController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('', createBooking);

router.get('/:bookingId' ,  getBooking);

router.put('/:bookingId', updateBooking);

router.delete('/:bookingId', deleteBooking);

router.get("", getBookings)

export default router;
