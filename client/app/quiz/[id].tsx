// 
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useQuiz } from '@/hooks/useQuiz';
import { getQuizById, calculateScore, submitQuizApi } from '@/services/quizService';
import { calculateLevel } from '@/services/authService';
import { MOCK_COMMENTS, Quiz } from '@/constants/quizData';
import { Colors, BorderRadius, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { NeonButton } from '@/components/ui/NeonButton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { CommentSection } from '@/components/feature/CommentSection';
import { Badge } from '@/components/ui/Badge';

const QUESTION_TIME = 30;

type GamePhase = 'info' | 'playing' | 'finished';

export default function QuizScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuth();
  const { setQuizResult } = useQuiz();

  const [quiz, setQuiz] = useState<Quiz | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuiz = async () => {
      setLoading(true);
      if (id) {
        const data = await getQuizById(Array.isArray(id) ? id[0] : id);
        setQuiz(data);
      }
      setLoading(false);
    };
    fetchQuiz();
  }, [id]);

  const [phase, setPhase] = useState<GamePhase>('info');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [showFeedback, setShowFeedback] = useState(false);
  const [totalTimeBonus, setTotalTimeBonus] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handleTimeUp = useCallback(() => {
    if (showFeedback) return;
    clearInterval(timerRef.current!);
    setSelectedAnswer(-1);
    setShowFeedback(true);

    setTimeout(() => nextQuestion(), 1800);
  }, [showFeedback]);

  useEffect(() => {
    if (phase !== 'playing' || showFeedback) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current!);
  }, [phase, currentQuestion, showFeedback]);

  const nextQuestion = useCallback(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    setShowFeedback(false);
    setSelectedAnswer(null);
    setTimeLeft(QUESTION_TIME);

    if (currentQuestion + 1 >= quiz!.questions.length) {
      setPhase('finished');
    } else {
      setCurrentQuestion((prev) => prev + 1);
    }
  }, [currentQuestion, quiz, fadeAnim]);

  const handleSelectAnswer = (index: number) => {
    if (showFeedback || selectedAnswer !== null) return;
    clearInterval(timerRef.current!);

    const isCorrect = index === quiz!.questions[currentQuestion].correctIndex;
    const bonus = isCorrect ? Math.round(timeLeft * 0.5) : 0;

    setTotalTimeBonus((prev) => prev + bonus);
    setSelectedAnswer(index);
    setShowFeedback(true);
    setAnswers((prev) => [...prev, index]);

    if (!isCorrect) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 8, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
      ]).start();
    }

    setTimeout(() => nextQuestion(), 2000);
  };

  useEffect(() => {
    if (phase === 'finished' && user && quiz) {
      (async () => {
        const allAnswers = [...answers];
        const result = calculateScore(allAnswers, quiz, totalTimeBonus);

        const mappedAnswers = quiz.questions.map((q: any, index: number) => ({
          questionId: q.id,
          selectedOption: allAnswers[index]
        })).filter((a: any) => a.selectedOption !== undefined && a.selectedOption !== -1);

        try {
           await submitQuizApi(quiz.id, mappedAnswers, 30);
           if (refreshUser) {
             await refreshUser();
           }
        } catch (e) {
           console.log("Submit error", e);
        }

        setQuizResult({ quiz, answers: allAnswers, ...result, timeBonus: totalTimeBonus });
        router.replace('/quiz/results');
      })();
    }
  }, [phase]);

  if (loading) {
    return (
      <View style={styles.screen}>
        <Text style={{ color: Colors.text, textAlign: 'center', marginTop: 100 }}>Loading...</Text>
      </View>
    );
  }

  if (!quiz) {
    return (
      <View style={styles.screen}>
        <Text style={{ color: Colors.text, textAlign: 'center', marginTop: 100 }}>Quiz not found</Text>
      </View>
    );
  }

  const question = quiz.questions[currentQuestion];
  const timerColor = timeLeft <= 10 ? Colors.error : timeLeft <= 20 ? '#F59E0B' : Colors.accentGreen;

  // Info Phase
  if (phase === 'info') {
    return (
      <View style={styles.screen}>
        <LinearGradient colors={['#0D0821', '#080818']} style={StyleSheet.absoluteFill} />
        <View style={styles.orb} />

        <ScrollView
          contentContainerStyle={[styles.infoContent, { paddingTop: insets.top + 16, paddingBottom: 32 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.screenHeader}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
            >
              <MaterialIcons name="arrow-back" size={22} color={Colors.text} />
            </Pressable>
            <Text style={styles.headerTitle}>Quiz Details</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Quiz hero card */}
          <LinearGradient
            colors={[quiz.color + '30', quiz.color + '08']}
            style={styles.quizHeroCard}
          >
            <View style={[styles.quizIcon, { backgroundColor: quiz.color + '22', borderColor: quiz.color + '44' }]}>
              <MaterialIcons name={quiz.icon as any} size={40} color={quiz.color} />
            </View>
            <Badge label={quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)} color={quiz.color} />
            <Text style={styles.quizHeroTitle}>{quiz.title}</Text>
            <Text style={styles.quizHeroDesc}>{quiz.description}</Text>

            <View style={styles.quizMeta}>
              {[
                { icon: 'quiz', value: `${quiz.questions.length} Q`, label: 'Questions' },
                { icon: 'timer', value: '30s', label: 'Per Question' },
                { icon: 'bolt', value: `+${quiz.xpReward}`, label: 'Max XP' },
              ].map((m) => (
                <View key={m.label} style={styles.metaItem}>
                  <MaterialIcons name={m.icon as any} size={18} color={quiz.color} />
                  <Text style={styles.metaValue}>{m.value}</Text>
                  <Text style={styles.metaLabel}>{m.label}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>

          {/* Rules */}
          <GlassCard>
            <Text style={styles.rulesTitle}>How to Play</Text>
            {[
              { icon: 'timer', text: 'You have 30 seconds per question.' },
              { icon: 'speed', text: 'Answer faster to earn time bonuses.' },
              { icon: 'check-circle', text: 'Choose the correct option from 4 choices.' },
              { icon: 'bolt', text: `Earn up to ${quiz.xpReward} XP on completion.` },
            ].map((rule, i) => (
              <View key={i} style={styles.ruleItem}>
                <MaterialIcons name={rule.icon as any} size={16} color={Colors.primaryLight} />
                <Text style={styles.ruleText}>{rule.text}</Text>
              </View>
            ))}
          </GlassCard>

          <NeonButton title="Start Quiz" onPress={() => setPhase('playing')} fullWidth size="lg" />

          {/* Comments */}
          <CommentSection
            quizId={quiz.id}
            currentUsername={user?.username ?? 'Player'}
          />
        </ScrollView>
      </View>
    );
  }

  // Playing Phase
  const getOptionStyle = (index: number) => {
    if (!showFeedback) return styles.option;
    if (index === quiz.questions[currentQuestion].correctIndex) return [styles.option, styles.optionCorrect];
    if (index === selectedAnswer && selectedAnswer !== quiz.questions[currentQuestion].correctIndex) {
      return [styles.option, styles.optionWrong];
    }
    return [styles.option, styles.optionDimmed];
  };

  const getOptionTextStyle = (index: number) => {
    if (!showFeedback) return styles.optionText;
    if (index === quiz.questions[currentQuestion].correctIndex) return [styles.optionText, styles.optionTextCorrect];
    if (index === selectedAnswer && selectedAnswer !== quiz.questions[currentQuestion].correctIndex) {
      return [styles.optionText, styles.optionTextWrong];
    }
    return [styles.optionText, styles.optionTextDimmed];
  };

  return (
    <View style={styles.screen}>
      <LinearGradient colors={['#0D0821', '#080818']} style={StyleSheet.absoluteFill} />

      <View style={[styles.playContainer, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          >
            <MaterialIcons name="close" size={20} color={Colors.textMuted} />
          </Pressable>
          <View style={styles.topCenter}>
            <Text style={styles.questionCount}>
              {currentQuestion + 1} / {quiz.questions.length}
            </Text>
            <ProgressBar
              progress={(currentQuestion) / quiz.questions.length}
              height={4}
              colors={['#7C3AED', '#2563EB']}
            />
          </View>
          <View style={[styles.timerBadge, { borderColor: timerColor + '66' }]}>
            <Text style={[styles.timerText, { color: timerColor }]}>{timeLeft}</Text>
          </View>
        </View>

        {/* Timer arc visual */}
        <View style={styles.timerBar}>
          <View
            style={[
              styles.timerFill,
              {
                width: `${(timeLeft / QUESTION_TIME) * 100}%`,
                backgroundColor: timerColor,
              },
            ]}
          />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.questionContent}>
          {/* Question */}
          <Animated.View style={[styles.questionCard, { opacity: fadeAnim, transform: [{ translateX: shakeAnim }] }]}>
            <LinearGradient
              colors={['rgba(124,58,237,0.15)', 'rgba(37,99,235,0.08)']}
              style={styles.questionGradient}
            >
              <Text style={styles.categoryTag}>{quiz.category}</Text>
              <Text style={styles.questionText}>{question.question}</Text>
            </LinearGradient>
          </Animated.View>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {question.options.map((option, index) => (
              <Pressable
                key={index}
                onPress={() => handleSelectAnswer(index)}
                disabled={showFeedback}
                style={({ pressed }) => [
                  getOptionStyle(index),
                  pressed && !showFeedback && { opacity: 0.85, transform: [{ scale: 0.99 }] }
                ]}
              >
                <View style={styles.optionLetter}>
                  <Text style={styles.optionLetterText}>
                    {String.fromCharCode(65 + index)}
                  </Text>
                </View>
                <Text style={getOptionTextStyle(index)}>{option}</Text>
                {showFeedback && index === question.correctIndex && (
                  <MaterialIcons name="check-circle" size={20} color={Colors.accentGreen} style={{ marginLeft: 'auto' }} />
                )}
                {showFeedback && index === selectedAnswer && index !== question.correctIndex && (
                  <MaterialIcons name="cancel" size={20} color={Colors.error} style={{ marginLeft: 'auto' }} />
                )}
              </Pressable>
            ))}
          </View>

          {/* Explanation */}
          {showFeedback && (
            <GlassCard
              style={[
                styles.explanationCard,
                selectedAnswer === question.correctIndex ? styles.explanationCorrect : styles.explanationWrong,
              ]}
            >
              <View style={styles.explanationHeader}>
                <MaterialIcons
                  name={selectedAnswer === question.correctIndex ? 'check-circle' : 'info'}
                  size={18}
                  color={selectedAnswer === question.correctIndex ? Colors.accentGreen : Colors.error}
                />
                <Text
                  style={[
                    styles.explanationTitle,
                    { color: selectedAnswer === question.correctIndex ? Colors.accentGreen : Colors.error },
                  ]}
                >
                  {selectedAnswer === question.correctIndex ? 'Correct!' : selectedAnswer === -1 ? 'Time\'s up!' : 'Incorrect'}
                </Text>
              </View>
              <Text style={styles.explanationText}>{question.explanation}</Text>
            </GlassCard>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  orb: {
    position: 'absolute',
    top: -40,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(124,58,237,0.1)',
  },
  infoContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FontSize.lg,
    color: Colors.text,
    fontWeight: FontWeight.semibold,
  },
  quizHeroCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  quizIcon: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quizHeroTitle: {
    fontSize: FontSize.xxl,
    color: Colors.text,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
  },
  quizHeroDesc: {
    fontSize: FontSize.base,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  quizMeta: {
    flexDirection: 'row',
    gap: Spacing.xl,
    marginTop: Spacing.sm,
  },
  metaItem: {
    alignItems: 'center',
    gap: 4,
  },
  metaValue: {
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: FontWeight.bold,
  },
  metaLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSubtle,
  },
  rulesTitle: {
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.sm,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  ruleText: {
    fontSize: FontSize.base,
    color: Colors.textMuted,
    flex: 1,
    lineHeight: 22,
  },
  // Playing Phase
  playContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  topCenter: {
    flex: 1,
    gap: 6,
  },
  questionCount: {
    fontSize: FontSize.sm,
    color: Colors.textSubtle,
    fontWeight: FontWeight.semibold,
    textAlign: 'center',
  },
  timerBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.glass,
  },
  timerText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  timerBar: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  timerFill: {
    height: '100%',
    borderRadius: 2,
  },
  questionContent: {
    gap: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  questionCard: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  questionGradient: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.2)',
    gap: Spacing.sm,
  },
  categoryTag: {
    fontSize: FontSize.xs,
    color: Colors.primaryLight,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  questionText: {
    fontSize: FontSize.lg,
    color: Colors.text,
    fontWeight: FontWeight.semibold,
    lineHeight: 28,
  },
  optionsContainer: {
    gap: Spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  optionCorrect: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderColor: Colors.accentGreen,
  },
  optionWrong: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderColor: Colors.error,
  },
  optionDimmed: {
    opacity: 0.4,
  },
  optionLetter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  optionLetterText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: FontWeight.bold,
  },
  optionText: {
    fontSize: FontSize.base,
    color: Colors.textMuted,
    flex: 1,
    lineHeight: 22,
  },
  optionTextCorrect: {
    color: Colors.accentGreen,
    fontWeight: FontWeight.semibold,
  },
  optionTextWrong: {
    color: Colors.error,
  },
  optionTextDimmed: {
    color: Colors.textDisabled,
  },
  explanationCard: {
    gap: Spacing.sm,
  },
  explanationCorrect: {
    backgroundColor: 'rgba(16,185,129,0.08)',
    borderColor: 'rgba(16,185,129,0.3)',
  },
  explanationWrong: {
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderColor: 'rgba(239,68,68,0.3)',
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  explanationTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  explanationText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    lineHeight: 20,
  },
});
