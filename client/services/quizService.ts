import { api } from './api';
import { Quiz, DIFFICULTY_CONFIG } from '@/constants/quizData';

export async function getAllQuizzes(): Promise<Quiz[]> {
  try {
    return await api.get('/quizzes');
  } catch (error) {
    console.error("Erreur getAllQuizzes:", error);
    return [];
  }
}

export async function getQuizById(id: string): Promise<Quiz | undefined> {
  try {
    return await api.get(`/quizzes/${id}`);
  } catch (error) {
    console.error("Erreur getQuizById:", error);
    return undefined;
  }
}

export async function getQuizzesByDifficulty(difficulty: string): Promise<Quiz[]> {
  try {
    const quizzes = await getAllQuizzes();
    return quizzes.filter((q) => q.difficulty === difficulty);
  } catch (error) {
    console.error("Erreur getQuizzesByDifficulty:", error);
    return [];
  }
}

export function calculateScore(
  answers: number[],
  quiz: Quiz,
  timeBonus: number
): { score: number; maxScore: number; xpEarned: number; correctCount: number } {
  let correctCount = 0;
  // Use length of quiz.questions if available, otherwise fallback
  const questionCount = quiz.questions?.length ?? 0;
  const maxScore = questionCount * 100;

  quiz.questions?.forEach((q, i) => {
    if (answers[i] === q.correctIndex) {
      correctCount++;
    }
  });

  const baseScore = correctCount * 100;
  const multiplier = DIFFICULTY_CONFIG[quiz.difficulty]?.multiplier || 1;
  const score = Math.round(baseScore + timeBonus);
  const xpEarned = Math.round((questionCount > 0 ? (correctCount / questionCount) : 0) * quiz.xpReward * multiplier);

  return { score, maxScore, xpEarned, correctCount };
}

export async function submitQuizApi(quizId: string, answers: { questionId: string, selectedOption: number }[], timeSpent: number) {
  return await api.post(`/quizzes/${quizId}/submit`, { answers, timeSpent });
}
