import { mysqlTable, varchar, int, boolean, timestamp, json } from 'drizzle-orm/mysql-core';
import { users } from './users.js';
import { quizzes } from './quizzes.js';
import { questions } from './questions.js';

export const quizResults = mysqlTable('quiz_results', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  quizId: varchar('quiz_id', { length: 36 }).notNull().references(() => quizzes.id, { onDelete: 'cascade' }),
  score: int('score').notNull(),
  correctAnswers: int('correct_answers').notNull(),
  totalQuestions: int('total_questions').notNull(),
  xpEarned: int('xp_earned').notNull(),
  completedAt: timestamp('completed_at').notNull().defaultNow(),
  timeSpent: int('time_spent'),
});

export const userAnswers = mysqlTable('user_answers', {
  id: varchar('id', { length: 36 }).primaryKey(),
  resultId: varchar('result_id', { length: 36 }).notNull().references(() => quizResults.id, { onDelete: 'cascade' }),
  questionId: varchar('question_id', { length: 36 }).notNull().references(() => questions.id),
  selectedOption: int('selected_option').notNull(),
  isCorrect: boolean('is_correct').notNull(),
});