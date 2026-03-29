import { Request, Response, NextFunction } from 'express';
import { db } from '../config/database.js';
import { questions } from '../db/schema/questions.js';
import { userStats } from '../db/schema/user_stats.js';
import { quizSessions, StoredQuestion } from '../db/schema/quiz_sessions.js';
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

function getAdaptiveDifficulty(stats: UserStats | null | undefined) {
  if (!stats || stats.total === 0) return 'beginner';
  const accuracy = stats.correct / stats.total;
  if (accuracy > 0.85) return 'expert';
  if (accuracy > 0.65) return 'advanced';
  if (accuracy > 0.45) return 'intermediate';
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
      await db.insert(userStats).values({ id: crypto.randomUUID(), userId, rating: 1200 });
      stats = await db.query.userStats.findFirst({ where: eq(userStats.userId, userId) }) as UserStats;
    }

    const difficulty = getAdaptiveDifficulty(stats);
    let selectedQuestions: any[] = [];

    console.log(`📚 Récupération des questions de la BDD - Catégorie: ${category || 'Général'}, Difficulté: ${difficulty}`);

    // Rechercher les questions associées à un quiz de la catégorie demandée
    const qQuery = db.select().from(questions);
    let query: any = qQuery;

    if (category) {
      query = query.where(eq(questions.category, category));
    }

    const dbQuestions = await query.orderBy(sql`RAND()`).limit(10);

    if (dbQuestions.length === 0) {
      // Fallback: prendre n'importe quelles questions si la catégorie est vide
      const fallbackQuestions = await db.select().from(questions).orderBy(sql`RAND()`).limit(10);
      selectedQuestions = fallbackQuestions;
    } else {
      selectedQuestions = dbQuestions;
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
        correctIndex: newCorrectIndex,
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

    const safeQuestions = processedQuestions.map(q => ({
      id: q.id,
      question: q.question,
      options: q.options
    }));

    res.json({
      success: true,
      sessionId,
      difficulty,
      questions: safeQuestions
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

    if (session.endedAt) {
      return res.status(400).json({ message: 'Quiz déjà soumis' });
    }

    // 👈 ICI - Cast explicite du type des questions
    const sessionQuestions = session.questions as StoredQuestion[];
    const total = sessionQuestions.length;

    let correctCount = 0;

    // Correction des réponses
    sessionQuestions.forEach((q) => {
      const userAnswer = answers.find((a: any) => a.questionId === q.id);
      if (userAnswer && userAnswer.selectedOption === q.correctIndex) {
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

    await db.update(userStats).set({
      correct: newCorrect,
      total: newTotal,
      accuracy: newAccuracy,
      rating: newRating,
      currentStreak: currentStreak,
      bestStreak: bestStreak,
      totalXp: (stats.totalXp || 0) + totalXP
    }).where(eq(userStats.userId, userId));

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