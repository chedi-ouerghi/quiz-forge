import { Router } from 'express';
import { getMyNotifications, markAsRead, markAllAsRead } from '../controllers/notifications.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * Routes pour la gestion des notifications utilisateur
 * Toutes les routes nécessitent une authentification
 */
router.use(protect);

router.get('/', getMyNotifications);
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);

export default router;
