// 
import { createContext, useState, ReactNode } from 'react';
import { Quiz } from '@/constants/quizData';

interface QuizResult {
  quiz: Quiz;
  answers: number[];
  score: number;
  maxScore: number;
  xpEarned: number;
  correctCount: number;
  timeBonus: number;
  isDynamic?: boolean;
  rating?: number;
  ratingChange?: number;
  streak?: number;
}

interface QuizContextType {
  activeQuiz: Quiz | null;
  quizResult: QuizResult | null;
  setActiveQuiz: (quiz: Quiz | null) => void;
  setQuizResult: (result: QuizResult | null) => void;
}

export const QuizContext = createContext<QuizContextType | undefined>(undefined);

export function QuizProvider({ children }: { children: ReactNode }) {
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  return (
    <QuizContext.Provider value={{ activeQuiz, quizResult, setActiveQuiz, setQuizResult }}>
      {children}
    </QuizContext.Provider>
  );
}
