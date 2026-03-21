import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';
import { db } from '../config/database.js';
import { users } from '../db/schema/users.js';
import { eq } from 'drizzle-orm';

// Extension de l'interface Request globale pour inclure l'utilisateur
declare global {
  namespace Express {
    interface Request {
      user?: any; // Modifier selon votre type User
    }
  }
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = verifyToken(token);

      if (!decoded) {
        return res.status(401).json({ message: 'Non autorisé, token invalide' });
      }

      // Chercher l'utilisateur dans la base de données
      const user = await db.query.users.findFirst({
        where: eq(users.id, decoded.id),
      });

      if (!user) {
        return res.status(401).json({ message: 'Utilisateur non trouvé' });
      }

      // Attacher l'utilisateur à la requête (sans le mot de passe)
      const { password, ...userWithoutPassword } = user;
      req.user = userWithoutPassword;

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Non autorisé, erreur de token' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Non autorisé, pas de token fourni' });
  }
};
