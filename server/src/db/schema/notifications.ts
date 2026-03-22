import { mysqlTable, varchar, text, timestamp, boolean, json } from 'drizzle-orm/mysql-core';
import { users } from './users.js';

/**
 * Types de notifications supportés
 */
export const NOTIFICATION_TYPES = {
  MENTION: 'MENTION',
  REPLY: 'REPLY',
  NEW_QUIZ: 'NEW_QUIZ',
} as const;

export type NotificationType = keyof typeof NOTIFICATION_TYPES;

/**
 * Table des notifications pour stocker les alertes utilisateurs
 */
export const notifications = mysqlTable('notifications', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(), // 'MENTION', 'REPLY', 'NEW_QUIZ'
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  /**
   * Données arbitraires pour lier la notification à une ressource (ex: quizId, commentId)
   */
  data: json('data'), 
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
