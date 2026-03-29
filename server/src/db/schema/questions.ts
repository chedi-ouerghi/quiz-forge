import { mysqlTable, varchar, int, text, json } from 'drizzle-orm/mysql-core';
import { quizzes } from './quizzes.js';
import { Difficulty } from '../../types/index.js';

export const questions = mysqlTable('questions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  quizId: varchar('quiz_id', { length: 36 }).references(() => quizzes.id, { onDelete: 'cascade' }),
  category: varchar('category', { length: 100 }), // Optional for generic questions
  difficulty: varchar('difficulty', { length: 20 }).$type<Difficulty>(), // Optional for generic questions
  question: text('question').notNull(),
  options: json('options').$type<string[]>().notNull(),
  correctIndex: int('correct_index').notNull(),
  explanation: text('explanation').notNull(),
  order: int('order').notNull().default(0),
});