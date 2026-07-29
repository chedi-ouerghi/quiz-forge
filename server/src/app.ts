import express, { Application, Request } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';

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
const allowedOrigins = (process.env.CORS_ORIGIN || '*')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowAnyOrigin = allowedOrigins.includes('*');

const corsOptions: cors.CorsOptions = {
  origin(origin, callback) {
    if (!origin || allowAnyOrigin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    const corsError = new Error('Origine CORS non autorisée') as Error & { statusCode?: number };
    corsError.statusCode = 403;
    return callback(corsError);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  exposedHeaders: ['X-Request-Id'],
  optionsSuccessStatus: 204,
};

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.API_RATE_LIMIT_MAX || 300),
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/api/health',
  message: {
    success: false,
    message: 'Trop de requêtes envoyées, veuillez patienter avant de réessayer.',
  },
});

morgan.token('request-id', (req) => (req as Request).requestId || '-');
morgan.token('real-ip', (req) => (req as Request).ip || '-');

app.disable('x-powered-by');
app.set('trust proxy', 1);

// Middlewares de sécurité et basiques
app.use(helmet());
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use((req, res, next) => {
  req.requestId = req.header('X-Request-Id') || crypto.randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  next();
});
app.use(globalLimiter);

// Parsers
app.use(express.json({ limit: process.env.REQUEST_BODY_LIMIT || '1mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.REQUEST_BODY_LIMIT || '1mb' }));
app.use(cookieParser());

// Logging de chaque requête HTTP via Morgan et Winston
app.use(
  morgan(':method :url :status :response-time ms - :res[content-length] reqId=:request-id ip=:real-ip', {
    stream: { write: (message) => logger.info(message.trim()) },
  }),
);

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
