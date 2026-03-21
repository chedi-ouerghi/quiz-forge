import { mysqlTable, varchar, int, text, json } from 'drizzle-orm/mysql-core';
import { quizzes } from './quizzes';

export const questions = mysqlTable('questions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  quizId: varchar('quiz_id', { length: 36 }).notNull().references(() => quizzes.id, { onDelete: 'cascade' }),
  question: text('question').notNull(),
  options: json('options').$type<string[]>().notNull(),
  correctIndex: int('correct_index').notNull(),
  explanation: text('explanation').notNull(),
  order: int('order').notNull().default(0),
});