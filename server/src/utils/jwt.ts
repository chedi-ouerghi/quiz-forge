import crypto from 'crypto';
import jwt from 'jsonwebtoken';

type TokenType = 'access' | 'refresh';

export interface TokenPayload extends jwt.JwtPayload {
  id: string;
  type: TokenType;
}

export type TokenVerificationResult =
  | { valid: true; payload: TokenPayload }
  | { valid: false; reason: 'expired' | 'invalid' | 'malformed' };

const JWT_SECRET: jwt.Secret = process.env.JWT_SECRET || 'fallback_secret_key_change_in_production';
const ACCESS_TOKEN_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '15m') as jwt.SignOptions['expiresIn'];
const REFRESH_TOKEN_EXPIRES_IN = (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'];

const signToken = (userId: string, type: TokenType, expiresIn: jwt.SignOptions['expiresIn']) => {
  return jwt.sign({ id: userId, type }, JWT_SECRET, { expiresIn });
};

export const generateToken = (userId: string) => signToken(userId, 'access', ACCESS_TOKEN_EXPIRES_IN);

export const generateRefreshToken = (userId: string) =>
  signToken(userId, 'refresh', REFRESH_TOKEN_EXPIRES_IN);

export const verifyToken = (token: string, expectedType: TokenType = 'access'): TokenVerificationResult => {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;

    if (!payload?.id || payload.type !== expectedType) {
      return { valid: false, reason: 'invalid' };
    }

    return { valid: true, payload };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return { valid: false, reason: 'expired' };
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return { valid: false, reason: 'invalid' };
    }

    return { valid: false, reason: 'malformed' };
  }
};

export const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

export const tokenMatchesHash = (rawToken: string, hashedToken?: string | null) => {
  if (!hashedToken) {
    return false;
  }

  const rawHash = hashToken(rawToken);

  return crypto.timingSafeEqual(Buffer.from(rawHash), Buffer.from(hashedToken));
};