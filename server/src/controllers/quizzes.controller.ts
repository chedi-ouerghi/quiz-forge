import { Request, Response, NextFunction } from 'express';
import { db } from '../config/database.js';
import { quizzes } from '../db/schema/quizzes.js';
import { questions } from '../db/schema/questions.js';
import { users } from '../db/schema/users.js';
import { quizResults, userAnswers } from '../db/schema/results.js';
import { eq, desc, and } from 'drizzle-orm';
import crypto from 'crypto';
import { NotificationService } from '../services/notification.service.js';

// @desc    Créer un quiz (Admin)
// @route   POST /api/quizzes
// @access  Private/Admin
export const createQuiz = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, difficulty, category, xpReward, icon, color, questions: quizQuestions } = req.body;

    const quizId = crypto.randomUUID();
    
    await db.transaction(async (tx) => {
      await tx.insert(quizzes).values({
        id: quizId,
        title,
        description,
        difficulty,
        category,
        icon: icon || 'quiz',
        color: color || '#4F46E5',
        xpReward: parseInt(xpReward) || 50,
      } as any);

      if (quizQuestions && quizQuestions.length > 0) {
        const questionsToInsert = quizQuestions.map((q: any, index: number) => ({
          id: crypto.randomUUID(),
          quizId,
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex,
          explanation: q.explanation,
          order: index,
        }));
        await tx.insert(questions).values(questionsToInsert);
      }
    });

    // --- NOTIFIER TOUS LES UTILISATEURS ---
    await NotificationService.notifyNewQuiz(title, quizId);

    res.status(201).json({ success: true, quizId });
  } catch (error) {
    next(error);
  }
};

// @desc    Liste des quiz
// @route   GET /api/quizzes
// @access  Public
export const getQuizzes = async (req: Request, res: Response) => {
  try {
    // Basic pagination (page, limit) implementation possible
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const allQuizzes = await db.query.quizzes.findMany({
      limit,
      offset,
      with: {
        questions: true
      },
      orderBy: [desc(quizzes.createdAt)]
    });

    res.json(allQuizzes);
  } catch (error: any) {
    res.status(500).json({ message: 'Erreur lors de la récupération des quiz' });
  }
};

// @desc    Détail d'un quiz
// @route   GET /api/quizzes/:quizId
// @access  Public
export const getQuizDetail = async (req: Request, res: Response) => {
  try {
    const quizId = req.params.quizId;
    
    // On ne renvoie pas correctIndex
    const quiz = await db.query.quizzes.findFirst({
      where: eq(quizzes.id, quizId),
      with: {
        questions: {
          columns: {
            id: true,
            quizId: true,
            question: true,
            options: true,
            correctIndex: true,
            explanation: true, // Peut être caché si on veut l'explication qu'à la fin
            order: true
          }
        },
        comments: {
          limit: 5,
        }
      }
    });

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz non trouvé' });
    }

    res.json(quiz);
  } catch (error: any) {
    res.status(500).json({ message: 'Erreur lors de la récupération du quiz' });
  }
};

// @desc    Soumettre des réponses
// @route   POST /api/quizzes/:quizId/submit
// @access  Private
export const submitQuiz = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const quizId = req.params.quizId;
    const { answers, timeSpent } = req.body; // answers = [{ questionId: '...', selectedOption: 0 }]

    if (!answers || answers.length === 0) {
      return res.status(400).json({ message: 'Aucune réponse fournie' });
    }

    const quiz = await db.query.quizzes.findFirst({
      where: eq(quizzes.id, quizId),
      with: {
        questions: true
      }
    });

    if (!quiz) return res.status(404).json({ message: 'Quiz non trouvé' });

    let score = 0;
    let correctAnswersCount = 0;
    const totalQuestions = quiz.questions.length;

    const processedAnswers: any[] = [];
    const resultId = crypto.randomUUID();

    for (const answer of answers) {
      const q = quiz.questions.find(q => q.id === answer.questionId);
      if (q) {
        const isCorrect = q.correctIndex === answer.selectedOption;
        if (isCorrect) correctAnswersCount++;
        
        processedAnswers.push({
          id: crypto.randomUUID(),
          resultId,
          questionId: q.id,
          selectedOption: answer.selectedOption,
          isCorrect
        });
      }
    }

    // Calcul du score et règle des 60%
    score = (correctAnswersCount / totalQuestions) * 100;
    let xpEarned = 0;
    let isNewCompletion = false;

    // Récupérer le meilleur résultat précédent
    const previousBest = await db.query.quizResults.findFirst({
      where: and(eq(quizResults.quizId, quizId), eq(quizResults.userId, userId)),
      orderBy: [desc(quizResults.score)]
    });
    
    const previousMaxXp = previousBest ? previousBest.xpEarned : 0;

    if (score >= 60) {
      const computedXp = Math.floor(quiz.xpReward * (score / 100));
      
      // Assigner seulement la différence d'XP si c'est un nouveau record
      if (computedXp > previousMaxXp) {
        xpEarned = computedXp - previousMaxXp;
      }

      // S'il n'avait jamais eu 60% avant, on le compte comme complété
      if (!previousBest || previousBest.score < 60) {
        isNewCompletion = true;
      }
    }

    // Création du résultat global avec l'XP total gagné sur cette session
    await db.insert(quizResults).values({
      id: resultId,
      userId,
      quizId,
      score,
      correctAnswers: correctAnswersCount,
      totalQuestions,
      xpEarned: score >= 60 ? Math.floor(quiz.xpReward * (score / 100)) : 0, // Enregistre le total pour le résumé
      timeSpent: timeSpent || 0,
    });

    // Envoi des réponses
    if (processedAnswers.length > 0) {
      await db.insert(userAnswers).values(processedAnswers);
    }

    // Mise à jour de l'utilisateur (seulement si de l'XP a été gagné ou une nouvelle complétion)
    if (xpEarned > 0 || isNewCompletion) {
      const currentUser = await db.query.users.findFirst({ where: eq(users.id, userId) });
      if (currentUser) {
        const newXp = currentUser.xp + xpEarned;
        const newLevel = newXp >= 390 ? 'expert' 
                       : newXp >= 180 ? 'advanced' 
                       : newXp >= 60 ? 'intermediate' 
                       : 'beginner';

        await db.update(users).set({
          xp: newXp,
          level: newLevel,
          quizzesCompleted: currentUser.quizzesCompleted + (isNewCompletion ? 1 : 0)
        }).where(eq(users.id, userId));
      }
    }

    res.json({
      resultId,
      score,
      correctAnswers: correctAnswersCount,
      xpEarned,
      message: 'Quiz soumis avec succès'
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Erreur de soumission', error: error.message });
  }
};

// @desc    Résultats complets
// @route   GET /api/quizzes/:quizId/results
// @access  Private
export const getQuizResults = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const quizId = req.params.quizId;

    const result = await db.query.quizResults.findFirst({
      where: and(eq(quizResults.quizId, quizId), eq(quizResults.userId, userId)),
      with: {
        answers: {
          with: {
            question: true
          }
        }
      },
      orderBy: [desc(quizResults.completedAt)]
    });

    if (!result) return res.status(404).json({ message: 'Résultat introuvable' });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: 'Erreur lors de la récupération des résultats' });
  }
};
