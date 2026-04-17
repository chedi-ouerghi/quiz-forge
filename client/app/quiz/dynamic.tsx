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
import { generateDynamicQuiz, submitDynamicQuiz } from '@/services/quizService';
import { Quiz } from '@/constants/quizData';
import { Colors, BorderRadius, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { NeonButton } from '@/components/ui/NeonButton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { CommentSection } from '@/components/feature/CommentSection';
import { Badge } from '@/components/ui/Badge';

const QUESTION_TIME = 30;

type GamePhase = 'info' | 'playing' | 'finished';

export default function DynamicQuizScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuth();
  const { setQuizResult } = useQuiz();

  const [quiz, setQuiz] = useState<Quiz | undefined>(undefined);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasSubmittedRef = useRef(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      setLoading(true);
      setLoadError(null);
      hasSubmittedRef.current = false;
      try {
        const data = await generateDynamicQuiz(category);
        if (!data?.questions?.length) {
          throw new Error('Aucune question disponible pour ce challenge');
        }

        setSessionId(data.sessionId);
        setQuiz({
          id: 'dynamic',
          title: category ? `Challenge ${category}` : 'Défi Rapide',
          description: category
            ? `Une sélection de 10 questions sur le thème ${category}.`
            : 'Un mélange de 10 questions de notre bibliothèque.',
          difficulty: data.difficulty,
          category: category || 'General',
          icon: 'psychology',
          color: '#7C3AED',
          xpReward: 100,
          questions: data.questions,
        } as Quiz);
      } catch (error: any) {
        setQuiz(undefined);
        setSessionId(null);
        setLoadError(error?.message || 'Impossible de générer le quiz dynamique');
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [category]);

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

    setTimeout(() => {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      setShowFeedback(false);
      setSelectedAnswer(null);
      setTimeLeft(QUESTION_TIME);

      if (!quiz || currentQuestion + 1 >= quiz.questions.length) {
        setPhase('finished');
      } else {
        setCurrentQuestion((prev) => prev + 1);
      }
    }, 1800);
  }, [showFeedback, fadeAnim, quiz, currentQuestion]);

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
  }, [phase, currentQuestion, showFeedback, handleTimeUp]);

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

  const [totalTimeSpent, setTotalTimeSpent] = useState(0);

  const handleSelectAnswer = (index: number) => {
    if (showFeedback || selectedAnswer !== null) return;
    clearInterval(timerRef.current!);

    const timeSpent = QUESTION_TIME - timeLeft;
    setTotalTimeSpent(prev => prev + timeSpent);

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
    if (phase === 'finished' && user && quiz && sessionId) {
      if (hasSubmittedRef.current) return;
      hasSubmittedRef.current = true;
      (async () => {
        const allAnswers = [...answers];
        const mappedAnswers = quiz.questions.map((q: any, index: number) => ({
          questionId: q.id,
          selectedOption: allAnswers[index],
          questionIndex: index
        })).filter((a: any) => a.selectedOption !== undefined && a.selectedOption !== -1);

        try {
           setIsSubmitting(true);
           setSubmitError(null);
           const res = await submitDynamicQuiz(sessionId, mappedAnswers, totalTimeSpent || 30) as any;
           if (refreshUser) {
             await refreshUser();
           }

           setQuizResult({
             quiz,
             answers: allAnswers,
             score: res.score,
             maxScore: 100,
             xpEarned: res.xpGained || (res.ratingChange > 0 ? res.ratingChange : 0),
             correctCount: res.correctCount,
             timeBonus: totalTimeBonus,
             isDynamic: true,
             rating: res.newRating,
             ratingChange: res.ratingChange,
             streak: res.streak
           });
           router.replace('/quiz/results');
        } catch (e: any) {
           setSubmitError(e?.message || 'Erreur lors de la soumission du quiz');
        } finally {
           setIsSubmitting(false);
        }
      })();
    }
  }, [phase, user, quiz, sessionId, answers, totalTimeSpent, totalTimeBonus, refreshUser, router, setQuizResult]);

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
        <Text style={{ color: Colors.error, textAlign: 'center', marginTop: 100 }}>
          {loadError || 'Quiz introuvable'}
        </Text>
        <View style={{ marginTop: 16, paddingHorizontal: 24 }}>
          <NeonButton title="Réessayer" onPress={() => router.replace({ pathname: '/quiz/dynamic', params: { category } })} fullWidth />
        </View>
      </View>
    );
  }

  if (phase === 'finished') {
    return (
      <View style={styles.screen}>
        <LinearGradient colors={['#0D0821', '#080818']} style={StyleSheet.absoluteFill} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 12 }}>
          <MaterialIcons name={submitError ? 'error-outline' : 'sync'} size={30} color={submitError ? Colors.error : Colors.primaryLight} />
          <Text style={{ color: Colors.text, textAlign: 'center', fontSize: FontSize.md }}>
            {submitError ? 'Soumission échouée' : isSubmitting ? 'Soumission en cours...' : 'Finalisation...'}
          </Text>
          {submitError && (
            <>
              <Text style={{ color: Colors.textMuted, textAlign: 'center' }}>{submitError}</Text>
              <NeonButton title="Retour à l'accueil" onPress={() => router.replace('/(tabs)')} />
            </>
          )}
        </View>
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
            <Text style={styles.headerTitle}>Détails du Quiz</Text>
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
                { icon: 'timer', value: '30s', label: 'Par Question' },
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
            <Text style={styles.rulesTitle}>Comment jouer</Text>
            {[
              { icon: 'timer', text: 'Vous avez 30 secondes par question.' },
              { icon: 'speed', text: 'Répondez vite pour des bonus de temps.' },
              { icon: 'check-circle', text: 'Choisissez la bonne réponse parmi 4 choix.' },
              { icon: 'bolt', text: `Gagnez de l'XP et améliorez votre classement.` },
            ].map((rule, i) => (
              <View key={i} style={styles.ruleItem}>
                <MaterialIcons name={rule.icon as any} size={16} color={Colors.primaryLight} />
                <Text style={styles.ruleText}>{rule.text}</Text>
              </View>
            ))}
          </GlassCard>

          <NeonButton title="Commencer" onPress={() => setPhase('playing')} fullWidth size="lg" />

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
    
    const isCorrect = index === question.correctIndex;
    const isSelected = index === selectedAnswer;

    if (isCorrect) return [styles.option, styles.optionCorrect];
    if (isSelected && !isCorrect) return [styles.option, styles.optionWrong];
    return [styles.option, styles.optionDimmed];
  };

  const getOptionTextStyle = (index: number) => {
    if (!showFeedback) return styles.optionText;
    
    const isCorrect = index === question.correctIndex;
    const isSelected = index === selectedAnswer;

    if (isCorrect) return [styles.optionText, styles.optionTextCorrect];
    if (isSelected && !isCorrect) return [styles.optionText, styles.optionTextWrong];
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
              progress={(currentQuestion + 1) / quiz.questions.length}
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
              </Pressable>
            ))}
          </View>
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
