import express from 'express';
import { createReview, getReview, updateReview, deleteReview, getAllReviews } from '../controllers/reviewController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('' , createReview);

router.get('/:reviewId', getReview);

router.put('/:reviewId', updateReview);

router.delete('/:reviewId', deleteReview);

router.get("", getAllReviews)

export default router;
