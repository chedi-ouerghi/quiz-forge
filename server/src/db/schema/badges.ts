import { mysqlTable, varchar, int, text, timestamp, primaryKey } from 'drizzle-orm/mysql-core';
import { users } from './users';

export const badges = mysqlTable('badges', {
    id: varchar('id', { length: 36 }).primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description').notNull(),
    icon: varchar('icon', { length: 50 }).notNull(),
    xpRequired: int('xp_required'),
    quizzesRequired: int('quizzes_required'),
});

export const userBadges = mysqlTable('user_badges', {
    userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
    badgeId: varchar('badge_id', { length: 36 }).notNull().references(() => badges.id, { onDelete: 'cascade' }),
    earnedAt: timestamp('earned_at').notNull().defaultNow(),
}, (table) => ({
    pk: primaryKey({ columns: [table.userId, table.badgeId] })
}));