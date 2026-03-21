// 
import { Platform } from 'react-native';
import { Quiz, DIFFICULTY_CONFIG } from '@/constants/quizData';
import { authFetch } from './authService';

// Si le backend est sur le réseau local:
// Android Emulator utilise 10.0.2.2 pour localhost
// iOS Simulator utilise localhost
// Appareil physique a besoin de l'IP du PC (ex: 192.168.1.X)
const API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3001/api' : 'http://localhost:3001/api';

export async function getAllQuizzes(): Promise<Quiz[]> {
  try {
    const response = await fetch(`${API_URL}/quizzes`);
    if (!response.ok) throw new Error('Erreur réseau');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erreur getAllQuizzes:", error);
    return [];
  }
}

export async function getQuizById(id: string): Promise<Quiz | undefined> {
  try {
    const response = await fetch(`${API_URL}/quizzes/${id}`);
    if (!response.ok) throw new Error('Erreur réseau');
    const data = await response.json();
    return data;
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
  const maxScore = quiz.questions.length * 100;

  quiz.questions.forEach((q, i) => {
    if (answers[i] === q.correctIndex) {
      correctCount++;
    }
  });

  const baseScore = correctCount * 100;
  const multiplier = DIFFICULTY_CONFIG[quiz.difficulty]?.multiplier || 1;
  const score = Math.round(baseScore + timeBonus);
  const xpEarned = Math.round((correctCount / quiz.questions.length) * quiz.xpReward * multiplier);

  return { score, maxScore, xpEarned, correctCount };
}

export async function submitQuizApi(quizId: string, answers: { questionId: string, selectedOption: number }[], timeSpent: number) {
  const res = await authFetch(`${API_URL}/quizzes/${quizId}/submit`, {
    method: 'POST',
    body: JSON.stringify({ answers, timeSpent })
  });
  if (!res.ok) throw new Error('Error submitting quiz');
  return res.json();
}
