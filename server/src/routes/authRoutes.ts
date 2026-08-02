import { Router } from 'express';
import { login, register, getProfile, getAllUserAvatars, updateUserAvatar } from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';
import { requireAdmin } from '../middleware/roleCheck';

const router = Router();

// Public routes
router.post('/login', login);

// Protected routes
router.get('/avatars', authenticate, getAllUserAvatars);
router.put('/avatar', authenticate, updateUserAvatar);

// Only ADMIN/SUPERUSER can register new users
router.post('/register', authenticate, requireAdmin, register);
router.get('/profile', authenticate, getProfile);

export default router;
