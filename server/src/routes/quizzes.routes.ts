import { Router } from 'express';
import { getQuizzes, getQuizDetail, submitQuiz, getQuizResults, createQuiz } from '../controllers/quizzes.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = Router();

// Routes publiques
router.get('/', getQuizzes);
router.get('/:quizId', getQuizDetail);

// Routes privées
router.post('/:quizId/submit', protect, submitQuiz);
router.get('/:quizId/results', protect, getQuizResults);

export default router;
