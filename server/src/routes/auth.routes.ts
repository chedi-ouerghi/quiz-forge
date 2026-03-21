import { Router } from 'express';
import { registerUser, loginUser, verifyAuth } from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import rateLimit from 'express-rate-limit';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limite de 5 tentatives
  message: { message: 'Trop de tentatives de connexion, réessayez dans 15 minutes' }
});

router.post('/register', registerUser);
router.post('/login', loginLimiter, loginUser);
router.get('/verify', protect, verifyAuth);


export default router;
