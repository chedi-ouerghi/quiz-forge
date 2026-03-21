import { Router } from 'express';
import { getGlobalLeaderboard, getMyPosition } from '../controllers/leaderboard.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = Router();

// Routes publiques
router.get('/', getGlobalLeaderboard);

// Routes privées
router.get('/me', protect, getMyPosition);

export default router;
