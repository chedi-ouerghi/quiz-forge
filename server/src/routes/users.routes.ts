import { Router } from 'express';
import { 
  getProfile, 
  updateProfile, 
  getPublicProfile, 
  getUserStats, 
  getUserActivity 
} from '../controllers/users.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = Router();

// Routes protégées
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.get('/stats', protect, getUserStats);
router.get('/activity', protect, getUserActivity);

// Route publique
router.get('/:userId', getPublicProfile);

export default router;
