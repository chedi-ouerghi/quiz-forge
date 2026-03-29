import { Request, Response } from 'express';
import { db } from '../config/database.js';
import { users } from '../db/schema/users.js';
import { eq, desc } from 'drizzle-orm';
import { quizResults } from '../db/schema/results.js';

// @desc    Obtenir le profil
// @route   GET /api/users/profile
// @access  Private
export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;

    const userProfile = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: {
        badges: {
          with: {
            badge: true
          }
        },
        results: {
          limit: 10,
          orderBy: [desc(quizResults.completedAt)]
        }
      }
    });

    if (!userProfile) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const { password, ...safeProfile } = userProfile;
    res.json(safeProfile);
  } catch (error: any) {
    res.status(500).json({ message: 'Erreur lors de la récupération du profil', error: error.message });
  }
};

// @desc    Mettre à jour le profil
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { username, avatar, country } = req.body;

    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    if (user.lastProfileUpdate) {
      const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
      const timeSinceLastUpdate = new Date().getTime() - new Date(user.lastProfileUpdate).getTime();
      
      if (timeSinceLastUpdate < thirtyDaysInMs) {
        const remainingDays = Math.ceil((thirtyDaysInMs - timeSinceLastUpdate) / (1000 * 60 * 60 * 24));
        return res.status(403).json({ message: `Veuillez attendre encore ${remainingDays} jours avant de modifier votre profil.` });
      }
    }

    // Check username taken if changed
    if (username && username !== user.username) {
      const existingUser = await db.query.users.findFirst({
        where: eq(users.username, username)
      });
      if (existingUser) {
        return res.status(400).json({ message: 'Ce nom d utilisateur est déjà pris' });
      }
    }

    await db.update(users)
      .set({
        username: username || user.username,
        avatar: avatar || user.avatar,
        country: country || user.country,
        lastProfileUpdate: new Date()
      })
      .where(eq(users.id, userId));

    const updatedUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    const { password, ...safeRecord } = updatedUser!;

    res.json(safeRecord);
  } catch (error: any) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour du profil', error: error.message });
  }
};

// @desc    Obtenir un profil public
// @route   GET /api/users/:userId
// @access  Public
export const getPublicProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;

    const userProfile = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: {
        badges: {
          with: { badge: true }
        }
      }
    });

    if (!userProfile) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json({
      id: userProfile.id,
      username: userProfile.username,
      avatar: userProfile.avatar,
      level: userProfile.level,
      xp: userProfile.xp,
      quizzesCompleted: userProfile.quizzesCompleted,
      country: userProfile.country,
      badges: userProfile.badges
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// @desc    Statistiques détaillées
// @route   GET /api/users/stats
// @access  Private
export const getUserStats = async (req: Request, res: Response) => {
  // Optionnel : Ajouter ici les calculs pour les stats (par categories, par difficulté etc)
  res.status(200).json({ message: 'Statistiques utilisateur en cours d implémentation' });
};

// @desc    Historique des activités
// @route   GET /api/users/activity
// @access  Private
export const getUserActivity = async (req: Request, res: Response) => {
  // Optionnel : historique centralisé
  res.status(200).json({ message: 'Historique d activité en cours d implémentation' });
};
