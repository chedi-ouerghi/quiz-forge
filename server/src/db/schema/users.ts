import { mysqlTable, varchar, int, timestamp, text } from 'drizzle-orm/mysql-core';
import { Difficulty } from '../../types/index.js';

export const users = mysqlTable('users', {
  id: varchar('id', { length: 36 }).primaryKey(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  avatar: varchar('avatar', { length: 255 }),
  xp: int('xp').notNull().default(0),
  level: varchar('level', { length: 20 }).$type<Difficulty>().notNull().default('beginner'),
  quizzesCompleted: int('quizzes_completed').notNull().default(0),
  country: varchar('country', { length: 100 }),
  refreshToken: varchar('refresh_token', { length: 512 }),
  resetToken: varchar('reset_token', { length: 512 }),
  resetTokenExpiry: timestamp('reset_token_expiry'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  lastProfileUpdate: timestamp('last_profile_update'),
});