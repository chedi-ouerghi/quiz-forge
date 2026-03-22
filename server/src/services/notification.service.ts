import { db } from '../config/database.js';
import { notifications, NOTIFICATION_TYPES } from '../db/schema/notifications.js';
import { users } from '../db/schema/users.js';
import { eq, inArray } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';

export class NotificationService {
  /**
   * Crée une notification générique
   */
  static async create({ userId, type, title, message, data }: any) {
    try {
      const id = uuidv4();
      await db.insert(notifications).values({
        id,
        userId,
        type,
        title,
        message,
        data,
      });
      return id;
    } catch (error) {
      logger.error(`Failed to create notification: ${error}`);
    }
  }

  /**
   * Détecte les mentions (@username) dans un texte et notifie les utilisateurs
   */
  static async notifyMentions(text: string, senderUsername: string, contextData: any) {
    const mentionRegex = /@(\w+)/g;
    const matches = [...text.matchAll(mentionRegex)];
    const usernames = matches.map(m => m[1]);

    if (usernames.length === 0) return;

    try {
      // Trouver les IDs des utilisateurs mentionnés
      const mentionedUsers = await db.select({ id: users.id, username: users.username })
        .from(users)
        .where(inArray(users.username, usernames));

      for (const user of mentionedUsers) {
        if (user.username === senderUsername) continue; // Ne pas se notifier soi-même

        await this.create({
          userId: user.id,
          type: NOTIFICATION_TYPES.MENTION,
          title: 'Nouvelle mention',
          message: `${senderUsername} vous a mentionné dans un commentaire.`,
          data: contextData,
        });
      }
    } catch (error) {
      logger.error(`Error in notifyMentions: ${error}`);
    }
  }

  /**
   * Notifie l'auteur d'un commentaire lors d'une réponse
   */
  static async notifyReply(parentAuthorId: string, replierUsername: string, contextData: any) {
    if (!parentAuthorId) return;

    await this.create({
      userId: parentAuthorId,
      type: NOTIFICATION_TYPES.REPLY,
      title: 'Nouvelle réponse',
      message: `${replierUsername} a répondu à votre commentaire.`,
      data: contextData,
    });
  }

  /**
   * Notifie tous les utilisateurs de l'ajout d'un nouveau quiz
   */
  static async notifyNewQuiz(quizTitle: string, quizId: string) {
    try {
      const allUsers = await db.select({ id: users.id }).from(users);
      
      // Note: Pour un très grand nombre d'utilisateurs, il faudrait passer par un worker/job queue
      for (const user of allUsers) {
        await this.create({
          userId: user.id,
          type: NOTIFICATION_TYPES.NEW_QUIZ,
          title: 'Nouveau Quiz !',
          message: `Un nouveau quiz vient d'être publié : ${quizTitle}. Allez le découvrir !`,
          data: { quizId },
        });
      }
    } catch (error) {
      logger.error(`Error in notifyNewQuiz: ${error}`);
    }
  }
}
