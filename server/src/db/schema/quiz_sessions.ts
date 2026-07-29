// Dans ton fichier quiz_sessions.ts
import { mysqlTable, varchar, int, timestamp, json, text, float, boolean } from 'drizzle-orm/mysql-core';
import { users } from './users.js';
import { Difficulty } from '../../types/index.js';

// Définir le type pour les questions stockées
export interface StoredQuestion {
  id: string;
  correctIndex: number;
  explanation: string;
}

export const quizSessions = mysqlTable('quiz_sessions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  startedAt: timestamp('started_at').notNull().defaultNow(),
  endedAt: timestamp('ended_at'),
  seed: varchar('seed', { length: 255 }),
  difficulty: varchar('difficulty', { length: 20 }).$type<Difficulty>().notNull(),
  questions: json('questions').$type<StoredQuestion[]>().notNull(), // 👈 Ajoute le type ici
  score: float('score'),
  answers: json('answers').$type<Array<{ questionId: string; selectedOption: number }>>(),
  isDaily: boolean('is_daily').default(false),
});