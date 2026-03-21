import { Request, Response } from 'express';
import { db } from '../config/database.js';
import { users } from '../db/schema/users.js';
import { desc, eq } from 'drizzle-orm';

// @desc    Classement global
// @route   GET /api/leaderboard
// @access  Public
export const getGlobalLeaderboard = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    
    const leaderboard = await db.query.users.findMany({
      orderBy: [desc(users.xp)],
      limit,
      columns: {
        id: true,
        username: true,
        avatar: true,
        xp: true,
        level: true,
        quizzesCompleted: true,
        country: true
      }
    });

    res.json(leaderboard);
  } catch (error: any) {
    res.status(500).json({ message: 'Erreur Serveur Leaderboard' });
  }
};

// @desc    Avoir la position d'un user
// @route   GET /api/leaderboard/me
// @access  Private
export const getMyPosition = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    
    // Pour une solution basique sans window functions : 
    const allLeaderboardDesc = await db.query.users.findMany({
      orderBy: [desc(users.xp)],
      columns: { id: true, xp: true }
    });

    const index = allLeaderboardDesc.findIndex(u => u.id === userId);
    
    if (index === -1) return res.status(404).json({ message: 'User non trouvé' });

    res.json({
      rank: index + 1,
      totalUsers: allLeaderboardDesc.length,
      xp: allLeaderboardDesc[index].xp
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur Ranking' });
  }
};
