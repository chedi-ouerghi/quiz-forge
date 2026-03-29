import * as dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import logger from './utils/logger.js';
import { testConnection } from './config/database.js';

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    // Vérification de la connexion à la DB
    const dbConnected = await testConnection();
    if (!dbConnected) {
      logger.error('Database connection failed. Exiting...');
      process.exit(1);
    }

    // Initialisation automatique des quiz par défaut si nécessaire
    const { ensureDefaultQuizzesExist } = await import('./services/quizPopulator.js');
    await ensureDefaultQuizzesExist();

    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}`);
    });

    // Graceful Shutdown
    const gracefullyShutdown = () => {
      logger.info('Shutting down server...');
      server.close(() => {
        logger.info('Server closed. Success.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', gracefullyShutdown);
    process.on('SIGINT', gracefullyShutdown);

  } catch (error: any) {
    logger.error(`Error starting server: ${error.message}`);
    process.exit(1);
  }
}

startServer();