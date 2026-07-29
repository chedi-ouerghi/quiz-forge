import type { InferSelectModel } from 'drizzle-orm';
import type { users } from '../db/schema/users.js';

type UserRecord = InferSelectModel<typeof users>;
type SafeRequestUser = Omit<UserRecord, 'password' | 'refreshToken' | 'resetToken' | 'resetTokenExpiry'>;

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: SafeRequestUser;
    }
  }
}

export {};
