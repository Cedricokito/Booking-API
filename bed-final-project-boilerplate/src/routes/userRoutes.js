import express from 'express';
import { signup, login, getUser, updateUser, deleteUser, getUsers } from '../controllers/userController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('', signup);
router.post('/login', login);
router.get('/:userId', getUser);
router.put('/:userId', updateUser);
router.delete('/:userId', deleteUser);
router.get("", getUsers)

export default router;
