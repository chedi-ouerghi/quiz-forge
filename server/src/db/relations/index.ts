import { relations } from 'drizzle-orm';
import { users } from '../schema/users.js';
import { quizzes } from '../schema/quizzes.js';
import { questions } from '../schema/questions.js';
import { comments } from '../schema/comments.js';
import { quizResults, userAnswers } from '../schema/results.js';
import { badges, userBadges } from '../schema/badges.js';

import { notifications } from '../schema/notifications.js';

export const usersRelations = relations(users, ({ many }) => ({
  results: many(quizResults),
  comments: many(comments),
  badges: many(userBadges),
  notifications: many(notifications),
}));

export const quizzesRelations = relations(quizzes, ({ many }) => ({
  questions: many(questions),
  comments: many(comments),
  results: many(quizResults),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  quiz: one(quizzes, {
    fields: [questions.quizId],
    references: [quizzes.id],
  }),
  answers: many(userAnswers),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  quiz: one(quizzes, {
    fields: [comments.quizId],
    references: [quizzes.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));

export const quizResultsRelations = relations(quizResults, ({ one, many }) => ({
  user: one(users, {
    fields: [quizResults.userId],
    references: [users.id],
  }),
  quiz: one(quizzes, {
    fields: [quizResults.quizId],
    references: [quizzes.id],
  }),
  answers: many(userAnswers),
}));

export const userAnswersRelations = relations(userAnswers, ({ one }) => ({
  result: one(quizResults, {
    fields: [userAnswers.resultId],
    references: [quizResults.id],
  }),
  question: one(questions, {
    fields: [userAnswers.questionId],
    references: [questions.id],
  }),
}));

export const badgesRelations = relations(badges, ({ many }) => ({
  users: many(userBadges),
}));

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(users, {
    fields: [userBadges.userId],
    references: [users.id],
  }),
  badge: one(badges, {
    fields: [userBadges.badgeId],
    references: [badges.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));