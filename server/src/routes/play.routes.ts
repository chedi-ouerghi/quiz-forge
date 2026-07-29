import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { generateQuiz, submitDynamicQuiz, getDailyChallenge } from '../controllers/play.controller.js';

const router = Router();

// Routes pour le gameplay dynamique
router.post('/generate', protect, generateQuiz);
router.post('/sessions/:sessionId/submit', protect, submitDynamicQuiz);
router.get('/daily', protect, getDailyChallenge);

export default router;
