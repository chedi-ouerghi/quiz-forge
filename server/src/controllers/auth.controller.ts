import { Request, Response } from 'express';
import { db } from '../config/database.js';
import { users } from '../db/schema/users.js';
import { eq } from 'drizzle-orm';
import { generateToken, generateRefreshToken } from '../utils/jwt.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

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

    const token = generateToken(id);

    res.status(201).json({
      id,
      username,
      email,
      xp: 0,
      level: 'beginner',
      avatar: null,
      quizzesCompleted: 0,
      token,
      message: 'Inscription réussie',
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
    const { email, password } = req.body;

    // Check for user email
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      const token = generateToken(user.id);
      
      // Enregistrer le refresh token si besoin...
      
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        level: user.level,
        xp: user.xp,
        avatar: user.avatar,
        token,
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
    user: req.user,
    valid: true
  });
};
