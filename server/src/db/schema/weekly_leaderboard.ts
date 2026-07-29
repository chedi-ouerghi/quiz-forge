import { mysqlTable, varchar, int, timestamp } from 'drizzle-orm/mysql-core';
import { users } from './users.js';

export const weeklyLeaderboard = mysqlTable('weekly_leaderboard', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  xp: int('xp').notNull().default(0),
  week: varchar('week', { length: 10 }).notNull(), // 'YYYY-WW'
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});
