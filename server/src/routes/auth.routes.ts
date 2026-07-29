import { Router } from 'express';
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAuthToken,
  verifyAuth,
} from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import rateLimit from 'express-rate-limit';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limite de 5 tentatives
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Trop de tentatives de connexion, réessayez dans 15 minutes' }
});

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Trop de tentatives de rafraîchissement, réessayez plus tard' }
});

router.post('/register', registerUser);
router.post('/login', loginLimiter, loginUser);
router.post('/refresh', refreshLimiter, refreshAuthToken);
router.post('/logout', logoutUser);
router.get('/verify', protect, verifyAuth);


export default router;
