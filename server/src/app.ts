import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import logger from './utils/logger.js';
import { notFound, errorHandler } from './middlewares/error.middleware.js';

// Import Routes
import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import quizzesRoutes from './routes/quizzes.routes.js';
import leaderboardRoutes from './routes/leaderboard.routes.js';
import commentsRoutes from './routes/comments.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import playRoutes from './routes/play.routes.js';

const app: Application = express();

// Middlewares de sécurité et basiques
app.use(helmet()); // Sécurisation des headers HTTP
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

// Parsers
app.use(express.json()); // Body parser
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging de chaque requête HTTP via Morgan et Winston
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/quizzes', quizzesRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/play', playRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Middleware pour gérer les ressources introuvables (404)
app.use(notFound);

// Middleware centralisé de gestion d'erreurs
app.use(errorHandler);

export default app;
