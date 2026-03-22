import { mysqlTable, varchar, int, text, timestamp } from 'drizzle-orm/mysql-core';
import { Difficulty } from '../../types/index.js';

export const quizzes = mysqlTable('quizzes', {
  id: varchar('id', { length: 36 }).primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  difficulty: varchar('difficulty', { length: 20 }).$type<Difficulty>().notNull(),
  icon: varchar('icon', { length: 50 }).notNull(),
  color: varchar('color', { length: 20 }).notNull(),
  xpReward: int('xp_reward').notNull(),
  order: int('order').notNull().default(1),
  description: text('description').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});