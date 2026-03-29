import { mysqlTable, varchar, int, date, timestamp } from 'drizzle-orm/mysql-core';
import { quizzes } from './quizzes.js';

export const dailyChallenges = mysqlTable('daily_challenges', {
  id: varchar('id', { length: 36 }).primaryKey(),
  date: date('date').notNull().unique(),
  quizId: varchar('quiz_id', { length: 36 }).notNull().references(() => quizzes.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
