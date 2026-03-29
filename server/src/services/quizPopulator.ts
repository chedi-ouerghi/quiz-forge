import { db } from '../config/database.js';
import { quizzes } from '../db/schema/quizzes.js';
import { questions } from '../db/schema/questions.js';
import { sql } from 'drizzle-orm';
import crypto from 'crypto';
import logger from '../utils/logger.js';
import { generateQuizList, generateQuestionsWithGroq } from '../utils/aiGenerator.js';

export async function ensureDefaultQuizzesExist() {
  try {
    const existingQuizzes = await db.select({ count: sql<number>`count(*)` }).from(quizzes);
    const count = Number(existingQuizzes[0].count);

    if (count === 0 && process.env.GROQ_API_KEY) {
      logger.info('Initializing automated IT quizzes using Groq...');

      const newQuizzes = await generateQuizList(2);

      for (let i = 0; i < newQuizzes.length; i++) {
        const quizData = newQuizzes[i];
        const quizId = crypto.randomUUID();

        logger.info(`Generating content for quiz: ${quizData.title}...`);

        // 1. Insert Quiz Metadata
        await db.insert(quizzes).values({
          id: quizId,
          title: quizData.title,
          category: quizData.category,
          difficulty: quizData.difficulty,
          description: quizData.description,
          icon: quizData.icon || 'code',
          color: quizData.color || '#4F46E5',
          xpReward: 100 * (i + 1),
          order: i + 1
        } as any);

        // 2. Generate 10 Questions for this quiz
        try {
          const aiQuestions = await generateQuestionsWithGroq(quizData.title, quizData.difficulty, 10);
          const questionsToInsert = aiQuestions.map((q: any, idx: number) => ({
            id: crypto.randomUUID(),
            quizId,
            question: q.question,
            options: q.options,
            correctIndex: q.correctIndex,
            explanation: q.explanation,
            order: idx
          }));

          await db.insert(questions).values(questionsToInsert);
          logger.info(`✅ Generated 10 questions for ${quizData.title}`);
        } catch (err) {
          logger.error(`❌ Failed to generate questions for ${quizData.title}:`, err);
        }
      }

      logger.info(`Successfully initialized ${newQuizzes.length} automated quizzes.`);
    } else {
      logger.info(`Database already contains ${count} quizzes or API KEY missing. Skipping initialization.`);
    }
  } catch (error) {
    logger.error('Error during quiz initialization:', error);
  }
}
