import { Request, Response } from 'express';
import { db } from '../config/database.js';
import { users } from '../db/schema/users.js';
import { eq } from 'drizzle-orm';
import {
  generateToken,
  generateRefreshToken,
  hashToken,
  tokenMatchesHash,
  verifyToken,
} from '../utils/jwt.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import type { InferSelectModel } from 'drizzle-orm';

type UserRecord = InferSelectModel<typeof users>;

const sanitizeUser = (user: UserRecord) => {
  const { password, refreshToken, resetToken, resetTokenExpiry, ...safeUser } = user;
  return safeUser;
};

const persistRefreshToken = async (userId: string, refreshToken: string) => {
  await db
    .update(users)
    .set({ refreshToken: hashToken(refreshToken) })
    .where(eq(users.id, userId));
};

const buildAuthResponse = (user: UserRecord, accessToken: string, refreshToken: string, message?: string) => ({
  ...sanitizeUser(user),
  token: accessToken,
  accessToken,
  refreshToken,
  ...(message ? { message } : {}),
});

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req: Request, res: Response) => {
  try {
    const username = req.body.username?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Veuillez remplir tous les champs' });
    }

    // Checking if user already exists
    const userExists = await db.query.users.findFirst({
      where: (users, { eq, or }) => or(eq(users.email, email), eq(users.username, username))
    });

    if (userExists) {
      return res.status(400).json({ message: 'Cet utilisateur ou email existe déjà' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const id = crypto.randomUUID();
    
    await db.insert(users).values({
      id,
      username,
      email,
      password: hashedPassword,
    });

    const createdUser = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!createdUser) {
      return res.status(500).json({ message: 'Utilisateur créé mais introuvable ensuite' });
    }

    const accessToken = generateToken(id);
    const refreshToken = generateRefreshToken(id);
    await persistRefreshToken(id, refreshToken);

    res.status(201).json({
      ...buildAuthResponse(createdUser, accessToken, refreshToken, 'Inscription réussie'),
      success: true,
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Erreur lors de l inscription', error: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req: Request, res: Response) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    // Check for user email
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      const accessToken = generateToken(user.id);
      const refreshToken = generateRefreshToken(user.id);

      await persistRefreshToken(user.id, refreshToken);

      res.json({
        ...buildAuthResponse(user, accessToken, refreshToken),
        success: true,
      });
    } else {
      res.status(401).json({ message: 'Email ou mot de passe invalide' });
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Erreur serveur lors de la connexion' });
  }
};

// @desc    Get user profile (via token)
// @route   GET /api/auth/verify
// @access  Private
export const verifyAuth = async (req: Request, res: Response) => {
  // L'utilisateur est déjà attaché à req par le middleware protect
  res.json({
    success: true,
    user: req.user,
    valid: true
  });
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public (requires refresh token)
export const refreshAuthToken = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.body.refreshToken?.trim();

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token requis' });
    }

    const verification = verifyToken(refreshToken, 'refresh');
    if (!verification.valid) {
      return res.status(401).json({
        success: false,
        code: verification.reason === 'expired' ? 'REFRESH_TOKEN_EXPIRED' : 'REFRESH_TOKEN_INVALID',
        message:
          verification.reason === 'expired'
            ? 'Session expirée, veuillez vous reconnecter'
            : 'Refresh token invalide',
      });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, verification.payload.id),
    });

    if (!user || !tokenMatchesHash(refreshToken, user.refreshToken)) {
      return res.status(401).json({
        success: false,
        code: 'REFRESH_TOKEN_REVOKED',
        message: 'Session invalide ou révoquée',
      });
    }

    const nextAccessToken = generateToken(user.id);
    const nextRefreshToken = generateRefreshToken(user.id);
    await persistRefreshToken(user.id, nextRefreshToken);

    return res.status(200).json({
      success: true,
      accessToken: nextAccessToken,
      refreshToken: nextRefreshToken,
      user: sanitizeUser(user),
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors du renouvellement de session',
      error: error.message,
    });
  }
};

// @desc    Logout user and revoke refresh token
// @route   POST /api/auth/logout
// @access  Public
export const logoutUser = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.body.refreshToken?.trim();

    if (!refreshToken) {
      return res.status(204).send();
    }

    const verification = verifyToken(refreshToken, 'refresh');
    if (!verification.valid) {
      return res.status(204).send();
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, verification.payload.id),
    });

    if (user?.refreshToken && tokenMatchesHash(refreshToken, user.refreshToken)) {
      await db
        .update(users)
        .set({ refreshToken: null })
        .where(eq(users.id, user.id));
    }

    return res.status(204).send();
  } catch {
    return res.status(204).send();
  }
};
