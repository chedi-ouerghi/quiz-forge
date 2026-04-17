import { api } from './api';
import { Quiz, DIFFICULTY_CONFIG } from '@/constants/quizData';

interface DynamicQuizResponse {
  success: boolean;
  sessionId: string;
  difficulty: Quiz['difficulty'];
  questions: Quiz['questions'];
}

interface DynamicSubmitResponse {
  success: boolean;
  score: number;
  correctCount: number;
  total: number;
  percentage: string;
  newRating: number;
  ratingChange: number;
  streak: number;
  xpGained: number;
}

function normalizeQuiz(raw: any): Quiz {
  return {
    id: String(raw?.id ?? ''),
    title: String(raw?.title ?? 'Quiz'),
    description: String(raw?.description ?? ''),
    category: String(raw?.category ?? 'General'),
    difficulty: (raw?.difficulty ?? 'beginner') as Quiz['difficulty'],
    icon: String(raw?.icon ?? 'quiz'),
    color: String(raw?.color ?? '#7C3AED'),
    xpReward: Number(raw?.xpReward ?? 0),
    order: Number(raw?.order ?? 1),
    questions: Array.isArray(raw?.questions) ? raw.questions : [],
  };
}

export async function getAllQuizzes(): Promise<Quiz[]> {
  const data = await api.get<any[]>('/quizzes');
  if (!Array.isArray(data)) {
    throw new Error('Format invalide: liste de quiz attendue');
  }

  return data
    .map(normalizeQuiz)
    .filter((q) => q.id)
    .sort((a, b) => {
      if (a.difficulty === b.difficulty) return a.order - b.order;
      return a.difficulty.localeCompare(b.difficulty);
    });
}

export async function getQuizById(id: string): Promise<Quiz | undefined> {
  const data = await api.get<any>(`/quizzes/${id}`);
  if (!data?.id) return undefined;
  return normalizeQuiz(data);
}

export async function getQuizzesByDifficulty(difficulty: string): Promise<Quiz[]> {
  const quizzes = await getAllQuizzes();
  return quizzes.filter((q) => q.difficulty === difficulty);
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
  return api.post(`/quizzes/${quizId}/submit`, { answers, timeSpent });
}

export async function generateDynamicQuiz(category?: string): Promise<DynamicQuizResponse> {
  return api.post<DynamicQuizResponse>('/play/generate', { category });
}

export async function submitDynamicQuiz(
  sessionId: string,
  answers: { questionId: string | number, selectedOption: number }[],
  timeSpent: number
): Promise<DynamicSubmitResponse> {
  return api.post<DynamicSubmitResponse>(`/play/sessions/${sessionId}/submit`, { answers, timeSpent });
}
