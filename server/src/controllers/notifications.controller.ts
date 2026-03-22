import { Request, Response, NextFunction } from 'express';
import { db } from '../config/database.js';
import { notifications } from '../db/schema/notifications.js';
import { eq, desc, and } from 'drizzle-orm';
import logger from '../utils/logger.js';

/**
 * Controller pour la gestion des notifications utilisateur
 */
export const getMyNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;
    const userNotifications = await db.select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));

    res.status(200).json({
      success: true,
      data: userNotifications,
    });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await db.update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));

    res.status(200).json({
      success: true,
      message: 'Notification marquée comme lue.',
    });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;

    await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));

    res.status(200).json({
      success: true,
      message: 'Toutes les notifications marquées comme lues.',
    });
  } catch (error) {
    next(error);
  }
};
