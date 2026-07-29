import * as dotenv from 'dotenv';
dotenv.config();

import { db, poolConnection } from '../config/database.js';
import { quizzes } from './schema/quizzes.js';
import { questions } from './schema/questions.js';
import { eq, sql } from 'drizzle-orm';
import { ensureDefaultQuizzesExist } from '../services/quizPopulator.js';
import logger from '../utils/logger.js';

async function refill() {
  try {
    logger.info('🗑 Nettoyage de la base de données...');
    
    // Disable FK checks to allow truncate/delete
    await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0`);
    
    await db.delete(questions);
    await db.delete(quizzes);
    // Optionnel: aussi vider les sessions et résultats pour repartir à zéro
    const { quizSessions } = await import('./schema/quiz_sessions.js');
    const { quizResults, userAnswers } = await import('./schema/results.js');
    await db.delete(userAnswers);
    await db.delete(quizResults);
    await db.delete(quizSessions);
    
    await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1`);
    
    logger.info('🆕 Lancement du seed catalogue quiz (qualité production)...');
    await ensureDefaultQuizzesExist();
    
    logger.info('🎉 Refill terminé avec succès !');
  } catch (error) {
    logger.error('❌ Erreur lors du refill:', error);
  } finally {
    await poolConnection.end();
    process.exit(0);
  }
}

refill();
