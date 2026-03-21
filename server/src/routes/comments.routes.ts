import { Router } from 'express';
import { getComments, addComment, updateComment, deleteComment } from '../controllers/comments.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = Router();

// Routes
router.get('/:quizId', getComments);
router.post('/', protect, addComment);
router.put('/:commentId', protect, updateComment);
router.delete('/:commentId', protect, deleteComment);

export default router;
