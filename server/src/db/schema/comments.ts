import { mysqlTable, varchar, text, timestamp, AnyMySqlColumn } from 'drizzle-orm/mysql-core';
import { quizzes } from './quizzes';
import { users } from './users';

export const comments = mysqlTable('comments', {
  id: varchar('id', { length: 36 }).primaryKey(),
  quizId: varchar('quiz_id', { length: 36 }).notNull().references(() => quizzes.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 36 }).references(() => users.id, { onDelete: 'set null' }),
  /**
   * Identifiant du commentaire parent (si c'est une réponse)
   */
  parentId: varchar('parent_id', { length: 36 }).references((): AnyMySqlColumn => comments.id, { onDelete: 'cascade' }),
  user: varchar('user', { length: 255 }).notNull(),
  avatar: varchar('avatar', { length: 50 }),
  text: text('text').notNull(),
  time: varchar('time', { length: 50 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});