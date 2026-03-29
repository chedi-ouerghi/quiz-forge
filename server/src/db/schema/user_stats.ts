import { mysqlTable, varchar, int, float, timestamp } from 'drizzle-orm/mysql-core';
import { users } from './users.js';

export const userStats = mysqlTable('user_stats', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  correct: int('correct').notNull().default(0),
  total: int('total').notNull().default(0),
  accuracy: float('accuracy').notNull().default(0),
  avgTime: float('avg_time').notNull().default(0), // Average time per question or quiz completed
  currentStreak: int('current_streak').notNull().default(0),
  bestStreak: int('best_streak').notNull().default(0),
  rating: int('rating').notNull().default(1000), // ELO rating
  totalXp: int('total_xp').notNull().default(0), // Total XP earned
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});
