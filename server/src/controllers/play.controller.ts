import { Request, Response, NextFunction } from 'express';
import { db } from '../config/database.js';
import { questions } from '../db/schema/questions.js';
import { users } from '../db/schema/users.js';
import { userStats } from '../db/schema/user_stats.js';
import { quizSessions, StoredQuestion } from '../db/schema/quiz_sessions.js';
import { Difficulty } from '../types/index.js';
import { eq, and, sql } from 'drizzle-orm';
import crypto from 'crypto';
import { generateQuestionsWithGroq } from '../utils/aiGenerator.js';

interface UserStats {
  id: string;
  userId: string;
  total: number;
  correct: number;
  accuracy: number;
  rating: number;
  currentStreak: number;
  bestStreak: number;
  totalXp: number;
}

const LEVEL_THRESHOLDS = {
  beginner: 0,
  intermediate: 200,
  advanced: 600,
  expert: 1200,
};

function getLevelFromXp(xp: number): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
  if (xp >= LEVEL_THRESHOLDS.expert) return 'expert';
  if (xp >= LEVEL_THRESHOLDS.advanced) return 'advanced';
  if (xp >= LEVEL_THRESHOLDS.intermediate) return 'intermediate';
  return 'beginner';
}

function getAdaptiveDifficulty(stats: UserStats | null | undefined): Difficulty {
  if (!stats || stats.total === 0) return 'beginner';
  
  // Use a combination of accuracy and rating for more "solid" logic
  const accuracy = stats.correct / stats.total;
  const rating = stats.rating || 1200;

  if (accuracy > 0.85 || rating > 1800) return 'expert';
  if (accuracy > 0.70 || rating > 1600) return 'advanced';
  if (accuracy > 0.50 || rating > 1400) return 'intermediate';
  return 'beginner';
}

export const generateQuiz = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;
    const { category } = req.body;

    let stats = await db.query.userStats.findFirst({
      where: eq(userStats.userId, userId)
    }) as UserStats | undefined;

    if (!stats) {
      const newStatsId = crypto.randomUUID();
      await db.insert(userStats).values({ 
        id: newStatsId, 
        userId, 
        rating: 1200,
        total: 0,
        correct: 0,
        accuracy: 0,
        currentStreak: 0,
        bestStreak: 0,
        totalXp: 0
      });
      stats = await db.query.userStats.findFirst({ where: eq(userStats.userId, userId) }) as UserStats;
    }

    const difficulty = getAdaptiveDifficulty(stats);
    let selectedQuestions: any[] = [];

    console.log(`📚 Récupération des questions de la BDD - Catégorie: ${category || 'Général'}, Difficulté: ${difficulty}`);

    // Rechercher les questions associées à la catégorie ET à la difficulté demandée
    const conditions = [];
    if (category && category !== 'General') {
      conditions.push(eq(questions.category, category));
    }
    
    // Essayer de trouver des questions correspondant à la difficulté adaptative
    conditions.push(eq(questions.difficulty, difficulty as any));

    const dbQuestions = await db.select()
      .from(questions)
      .where(and(...conditions))
      .orderBy(sql`RAND()`)
      .limit(10);

    if (dbQuestions.length < 5) {
      // Fallback 1: Si pas assez de questions de cette difficulté, prendre n'importe quelle difficulté pour cette catégorie
      console.log(`⚠️ Pas assez de questions pour la difficulté ${difficulty}, élargissement de la recherche...`);
      const fallbackQuestions = category && category !== 'General'
        ? await db.select()
          .from(questions)
          .where(eq(questions.category, category))
          .orderBy(sql`RAND()`)
          .limit(10)
        : await db.select()
          .from(questions)
          .orderBy(sql`RAND()`)
          .limit(10);
      
      selectedQuestions = fallbackQuestions;
    } else {
      selectedQuestions = dbQuestions;
    }

    if (selectedQuestions.length === 0) {
      // Fallback 2: Si toujours rien, prendre n'importe quoi
      selectedQuestions = await db.select()
        .from(questions)
        .orderBy(sql`RAND()`)
        .limit(10);
    }

    if (selectedQuestions.length === 0) {
      return res.status(404).json({ message: 'Aucune question disponible dans la base de données.' });
    }

    // Préparation des questions pour le frontend (shuffle options)
    const processedQuestions = selectedQuestions.map((q: any) => {
      const optionsWithIndex = (q.options as string[]).map((opt, i) => ({ text: opt, originalIndex: i }));
      const shuffled = optionsWithIndex.sort(() => Math.random() - 0.5);
      const newCorrectIndex = shuffled.findIndex(opt => opt.originalIndex === q.correctIndex);

      return {
        id: q.id,
        question: q.question,
        options: shuffled.map(o => o.text),
        correctIndex: newCorrectIndex, // On l'envoie pour l'affichage immédiat
        explanation: q.explanation
      };
    });

    const sessionId = crypto.randomUUID();
    const seed = new Date().toISOString() + Math.random().toString();

    const storedQuestions: StoredQuestion[] = processedQuestions.map(q => ({
      id: q.id,
      correctIndex: q.correctIndex,
      explanation: q.explanation
    }));

    await db.insert(quizSessions).values({
      id: sessionId,
      userId,
      difficulty,
      seed,
      questions: storedQuestions,
      isDaily: false
    });

    res.json({
      success: true,
      sessionId,
      difficulty,
      questions: processedQuestions // On renvoie tout pour une meilleure UX
    });

  } catch (error) {
    console.error('Erreur generateQuiz:', error);
    next(error);
  }
};

export const submitDynamicQuiz = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;
    const { answers, timeSpent } = req.body;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: 'Format de réponses invalide' });
    }

    const session = await db.query.quizSessions.findFirst({
      where: eq(quizSessions.id, sessionId)
    });

    if (!session) {
      return res.status(404).json({ message: 'Session introuvable' });
    }

    if (session.userId !== userId) {
      return res.status(403).json({ message: 'Session non autorisee pour cet utilisateur' });
    }

    if (session.endedAt) {
      return res.status(400).json({ message: 'Quiz déjà soumis' });
    }

    // 👈 ICI - Cast explicite du type des questions
    const sessionQuestions = session.questions as StoredQuestion[];
    const total = sessionQuestions.length;
    if (total === 0) {
      return res.status(400).json({ message: 'Session invalide: aucune question' });
    }

    let correctCount = 0;
    const answerMap = new Map<string, number>();

    for (const answer of answers) {
      if (
        answer &&
        typeof answer.questionId === 'string' &&
        Number.isInteger(answer.selectedOption) &&
        answer.selectedOption >= 0
      ) {
        answerMap.set(answer.questionId, answer.selectedOption);
      }
    }

    // Correction des réponses
    sessionQuestions.forEach((q) => {
      const selected = answerMap.get(q.id);
      if (selected !== undefined && selected === q.correctIndex) {
        correctCount++;
      }
    });

    const score = (correctCount / total) * 100;
    const isPerfect = score === 100;

    // Mettre à jour la session
    await db.update(quizSessions)
      .set({
        endedAt: new Date(),
        score: score,
        answers: answers
      })
      .where(eq(quizSessions.id, sessionId));

    // Mettre à jour les stats utilisateur
    let stats = await db.query.userStats.findFirst({
      where: eq(userStats.userId, userId)
    }) as UserStats | undefined;

    if (!stats) {
      await db.insert(userStats).values({
        id: crypto.randomUUID(),
        userId,
        rating: 1200
      });
      stats = await db.query.userStats.findFirst({
        where: eq(userStats.userId, userId)
      }) as UserStats;
    }

    // Système ELO
    const oldRating = stats.rating;
    const expectedScore = 1 / (1 + Math.pow(10, ((1500 - oldRating) / 400)));
    const K = 32;
    const actualScore = score / 100;
    const newRating = Math.round(oldRating + K * (actualScore - expectedScore));

    const newTotal = stats.total + total;
    const newCorrect = stats.correct + correctCount;
    const newAccuracy = newCorrect / newTotal;

    // Gestion du streak
    let currentStreak = stats.currentStreak;
    if (isPerfect) {
      currentStreak++;
    } else if (score >= 60) {
      currentStreak = currentStreak;
    } else {
      currentStreak = 0;
    }

    const bestStreak = Math.max(stats.bestStreak, currentStreak);

    // Calcul des XP gagnés
    const baseXP = total * 10;
    const streakBonus = currentStreak > 0 ? Math.min(currentStreak * 5, 50) : 0;
    const perfectBonus = isPerfect ? 50 : 0;
    const totalXP = baseXP + streakBonus + perfectBonus;
    const newTotalXp = (stats.totalXp || 0) + totalXP;

    await db.update(userStats).set({
      correct: newCorrect,
      total: newTotal,
      accuracy: newAccuracy,
      rating: newRating,
      currentStreak: currentStreak,
      bestStreak: bestStreak,
      totalXp: newTotalXp
    }).where(eq(userStats.userId, userId));

    // Synchroniser avec la table users
    const newLevel = getLevelFromXp(newTotalXp);
    await db.update(users).set({
      xp: newTotalXp,
      level: newLevel
    }).where(eq(users.id, userId));

    res.json({
      success: true,
      score,
      correctCount,
      total,
      percentage: `${Math.round(score)}%`,
      newRating,
      ratingChange: newRating - oldRating,
      streak: currentStreak,
      xpGained: totalXP,
      breakdown: {
        baseXP,
        streakBonus,
        perfectBonus
      },
      message: score >= 70 ? '🎉 Excellent travail !' : '💪 Continue à t\'entraîner !'
    });

  } catch (error) {
    console.error('Erreur submitDynamicQuiz:', error);
    next(error);
  }
};

export const getDailyChallenge = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    // Vérifier si le daily challenge a déjà été fait aujourd'hui
    const existingSession = await db.query.quizSessions.findFirst({
      where: and(
        eq(quizSessions.userId, userId),
        eq(quizSessions.isDaily, true),
        sql`DATE(created_at) = ${today}`
      )
    });

    if (existingSession && existingSession.endedAt) {
      return res.json({
        completed: true,
        message: 'Daily challenge déjà complété aujourd\'hui ! Reviens demain.'
      });
    }

    // Générer un daily challenge (même pour tous les users)
    const seed = today;
    let dailyQuestions: any[] = [];

    if (process.env.Groq_API_KEY) {
      try {
        dailyQuestions = await generateQuestionsWithGroq('Daily Challenge', 'intermediate', 10);
      } catch (err) {
        console.error('Erreur génération daily challenge:', err);
      }
    }

    if (dailyQuestions.length === 0) {
      // Fallback: questions de la BDD
      const dbQuestions = await db.select()
        .from(questions)
        .orderBy(sql`RAND()`)
        .limit(10);

      dailyQuestions = dbQuestions.map((q: any) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation
      }));
    }

    const sessionId = crypto.randomUUID();

    const storedQuestions: StoredQuestion[] = dailyQuestions.map(q => ({
      id: q.id,
      correctIndex: q.correctIndex,
      explanation: q.explanation
    }));

    await db.insert(quizSessions).values({
      id: sessionId,
      userId,
      difficulty: 'intermediate',
      seed,
      isDaily: true,
      questions: storedQuestions
    });

    const safeQuestions = dailyQuestions.map(q => ({
      id: q.id,
      question: q.question,
      options: q.options
    }));

    res.json({
      success: true,
      sessionId,
      isDaily: true,
      date: today,
      questions: safeQuestions
    });

  } catch (error) {
    console.error('Erreur getDailyChallenge:', error);
    next(error);
  }
};

// Route pour vérifier le statut de l'IA
export const getAiStatus = async (req: Request, res: Response) => {
  const hasGroq = !!process.env.Groq_API_KEY;

  res.json({
    aiAvailable: hasGroq,
    provider: hasGroq ? 'Google Groq' : null,
    message: hasGroq ? 'IA disponible pour générer des quiz illimités' : 'Configurez Groq_API_KEY pour activer l\'IA'
  });
};  
