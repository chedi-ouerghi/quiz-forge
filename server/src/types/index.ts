export type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  order?: number;
}

export interface Quiz {
  id: string;
  title: string;
  category: string;
  difficulty: Difficulty;
  icon: string;
  color: string;
  xpReward: number;
  description: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface User {
  id: string;
  username: string;
  avatar: string | null;
  xp: number;
  level: Difficulty;
  quizzesCompleted: number;
  country: string | null;
  createdAt: Date;
}

export interface Comment {
  id: string;
  quizId: string;
  userId: string | null;
  user: string;
  avatar: string | null;
  text: string;
  time: string | null;
  createdAt: Date;
}

export interface QuizResult {
  id: string;
  userId: string;
  quizId: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  xpEarned: number;
  completedAt: Date;
  timeSpent: number | null;
}

export interface UserAnswer {
  id: string;
  resultId: string;
  questionId: string;
  selectedOption: number;
  isCorrect: boolean;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpRequired: number | null;
  quizzesRequired: number | null;
}