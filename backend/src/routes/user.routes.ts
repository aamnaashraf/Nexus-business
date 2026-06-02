import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getProfile } from '../controllers/auth.controller';
import { getAllUsers, getUserById } from '../controllers/user.controller';

const router = Router();

router.get('/me', authenticate, getProfile);
router.get('/', authenticate, getAllUsers);
router.get('/:id', authenticate, getUserById);

export default router;