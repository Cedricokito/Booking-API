import express from 'express';
import { signupHost, loginHost, getHost, updateHost, deleteHost, getHosts } from '../controllers/hostController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('', signupHost);

router.post('/login', loginHost);

router.get('/:hostId', getHost);

router.put('/:hostId', updateHost);

router.delete('/:hostId', deleteHost);

router.get("", getHosts)

export default router;
