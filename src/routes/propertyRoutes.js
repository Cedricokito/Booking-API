import express from 'express';
import { createProperty, getProperty, updateProperty, deleteProperty, getProperties } from '../controllers/propertyController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected routes - require authentication
router.post('/', authMiddleware, createProperty);
router.put('/:propertyId', authMiddleware, updateProperty);
router.delete('/:propertyId', authMiddleware, deleteProperty);

// Public routes
router.get('/:propertyId', getProperty);
router.get('', getProperties);

export default router; 