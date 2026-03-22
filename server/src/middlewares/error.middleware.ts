import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

/**
 * Interface pour les erreurs personnalisées
 */
export interface ApiError extends Error {
  statusCode?: number;
}

/**
 * Middleware centralisé pour la gestion des erreurs
 */
export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  
  // Log de l'erreur avec contexte de requête
  logger.error(`${err.message} [Code: ${statusCode}] - URL: ${req.originalUrl} - Method: ${req.method} - IP: ${req.ip}`);
  
  // Dans un environnement de dev, inclure le stacktrace
  const response = {
    success: false,
    message: err.message || 'Une erreur système est survenue. Veuillez réessayer plus tard.',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  };

  res.status(statusCode).json(response);
};

/**
 * Middleware pour gérer les ressources introuvables (404)
 */
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error: ApiError = new Error(`Ressource non trouvée - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};
