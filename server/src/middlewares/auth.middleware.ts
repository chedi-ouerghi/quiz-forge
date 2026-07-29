import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';
import { db } from '../config/database.js';
import { users } from '../db/schema/users.js';
import { eq } from 'drizzle-orm';
import logger from '../utils/logger.js';

const extractBearerToken = (req: Request) => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader?.startsWith('Bearer ')) {
    return null;
  }

  const [, token] = authorizationHeader.split(' ');
  return token?.trim() || null;
};

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  const token = extractBearerToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      code: 'AUTH_TOKEN_MISSING',
      message: 'Non autorisé, pas de token fourni',
      requestId: req.requestId,
    });
  }

  const verification = verifyToken(token, 'access');

  if (!verification.valid) {
    const message =
      verification.reason === 'expired'
        ? 'Session expirée, veuillez vous reconnecter'
        : 'Non autorisé, token invalide';

    return res.status(401).json({
      success: false,
      code: verification.reason === 'expired' ? 'AUTH_TOKEN_EXPIRED' : 'AUTH_TOKEN_INVALID',
      message,
      requestId: req.requestId,
    });
  }

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, verification.payload.id),
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        code: 'AUTH_USER_NOT_FOUND',
        message: 'Utilisateur non trouvé',
        requestId: req.requestId,
      });
    }

    const { password, refreshToken, resetToken, resetTokenExpiry, ...safeUser } = user;
    req.user = safeUser;

    return next();
  } catch (error) {
    logger.error(
      `Authentication middleware failed - reqId=${req.requestId} - error=${
        error instanceof Error ? error.message : 'unknown'
      }`,
    );

    return res.status(500).json({
      success: false,
      code: 'AUTH_PROCESSING_ERROR',
      message: 'Erreur interne lors de la validation du token',
      requestId: req.requestId,
    });
  }
};
