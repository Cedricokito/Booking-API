import express from 'express';
import { createProperty, getProperty, updateProperty, deleteProperty, getProperties } from '../controllers/propertyController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', createProperty);

router.get('/:propertyId', getProperty);

router.put('/:propertyId', updateProperty);

router.delete('/:propertyId', deleteProperty);

router.get("", getProperties)

export default router;
