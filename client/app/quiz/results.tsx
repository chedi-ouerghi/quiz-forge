// 
import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuiz } from '@/hooks/useQuiz';
import { DIFFICULTY_CONFIG } from '@/constants/quizData';
import { Colors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { NeonButton } from '@/components/ui/NeonButton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';

export default function ResultsScreen() {
  const { quizResult, setQuizResult } = useQuiz();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!quizResult) {
      router.replace('/(tabs)');
    }
  }, [quizResult]);

  if (!quizResult) {
    return null;
  }

  const { quiz, answers, score, maxScore, xpEarned, correctCount, timeBonus } = quizResult;
  const percentage = Math.round((score / maxScore) * 100);
  const accuracy = Math.round((correctCount / quiz.questions.length) * 100);

  const getGrade = () => {
    if (accuracy >= 90) return { label: 'S', emoji: '🏆', color: '#FFD700', message: 'Incroyable !' };
    if (accuracy >= 75) return { label: 'A', emoji: '⭐', color: '#10B981', message: 'Excellent !' };
    if (accuracy >= 60) return { label: 'B', emoji: '👍', color: '#3B82F6', message: 'Bon travail !' };
    if (accuracy >= 40) return { label: 'C', emoji: '📚', color: '#F59E0B', message: 'Continue de t\'entraîner' };
    return { label: 'D', emoji: '💪', color: '#EF4444', message: 'Ne lâche rien !' };
  };

  const grade = getGrade();
  const diffConfig = DIFFICULTY_CONFIG[quiz.difficulty];

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#0D0821', '#080818']}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.orb1, { backgroundColor: grade.color + '12' }]} />
      <View style={styles.orb2} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero result */}
        <Animated.View style={[styles.heroSection, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <LinearGradient
            colors={[grade.color + '30', grade.color + '08']}
            style={styles.gradeBadgeOuter}
          >
            <LinearGradient
              colors={[grade.color, grade.color + 'BB']}
              style={styles.gradeBadge}
            >
              <Text style={styles.gradeText}>{grade.label}</Text>
            </LinearGradient>
          </LinearGradient>

          <Text style={styles.gradeEmoji}>{grade.emoji}</Text>
          <Text style={styles.heroMessage}>{grade.message}</Text>
          <Text style={styles.heroSub}>{quiz.title}</Text>
          <Badge label={diffConfig.label} color={diffConfig.color} />
        </Animated.View>

        {/* Score card */}
        <GlassCard variant="accent" style={styles.scoreCard}>
          <View style={styles.scoreTop}>
            <View style={styles.scoreLeft}>
              <Text style={styles.scoreValue}>{accuracy}%</Text>
              <Text style={styles.scoreLabel}>Précision</Text>
            </View>
            <View style={styles.scoreDivider} />
            <View style={styles.scoreCenter}>
              <Text style={[styles.scoreValue, { color: Colors.neonCyan }]}>
                {correctCount}/{quiz.questions.length}
              </Text>
              <Text style={styles.scoreLabel}>Correct</Text>
            </View>
            <View style={styles.scoreDivider} />
            <View style={styles.scoreRight}>
              <View style={styles.xpRow}>
                <MaterialIcons name="bolt" size={18} color="#F59E0B" />
                <Text style={[styles.scoreValue, { color: '#F59E0B' }]}>+{xpEarned}</Text>
              </View>
              <Text style={styles.scoreLabel}>XP Gagné</Text>
            </View>
          </View>

          <ProgressBar
            progress={accuracy / 100}
            showPercent
            height={8}
            colors={[grade.color, grade.color + '88']}
          />
        </GlassCard>

        {/* Stats breakdown */}
        <GlassCard>
          <Text style={styles.breakdownTitle}>Détail du Score</Text>
          {[
            { label: 'Score de base', value: correctCount * 100, icon: 'check-circle', color: Colors.accentGreen },
            { label: 'Bonus de temps', value: timeBonus, icon: 'bolt', color: '#F59E0B' },
            { label: 'Score Total', value: score, icon: 'star', color: Colors.primary, bold: true },
          ].map((item) => (
            <View key={item.label} style={styles.breakdownRow}>
              <MaterialIcons name={item.icon as any} size={16} color={item.color} />
              <Text style={styles.breakdownLabel}>{item.label}</Text>
              <Text style={[styles.breakdownValue, { color: item.color }, item.bold && { fontSize: FontSize.md }]}>
                {item.value}
              </Text>
            </View>
          ))}
        </GlassCard>

        {/* Per-question review */}
        <View>
          <Text style={styles.reviewTitle}>Révision des Questions</Text>
          {quiz.questions.map((question, index) => {
            const isCorrect = answers[index] === question.correctIndex;
            const wasTimedOut = answers[index] === undefined || answers[index] === -1;
            return (
              <GlassCard key={question.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View
                    style={[
                      styles.reviewStatus,
                      isCorrect ? styles.statusCorrect : styles.statusWrong,
                    ]}
                  >
                    <MaterialIcons
                      name={isCorrect ? 'check' : 'close'}
                      size={14}
                      color={isCorrect ? Colors.accentGreen : Colors.error}
                    />
                  </View>
                  <Text style={styles.reviewNumber}>Q{index + 1}</Text>
                  {wasTimedOut && !isCorrect && (
                    <Badge label="Temps écoulé" color={Colors.error} size="sm" />
                  )}
                </View>
                <Text style={styles.reviewQuestion} numberOfLines={2}>{question.question}</Text>
                {!isCorrect && (
                  <View style={styles.correctAnswerRow}>
                    <MaterialIcons name="check-circle" size={14} color={Colors.accentGreen} />
                    <Text style={styles.correctAnswerText} numberOfLines={1}>
                      {question.options[question.correctIndex]}
                    </Text>
                  </View>
                )}
              </GlassCard>
            );
          })}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <NeonButton
            title="Rejouer"
            onPress={() => {
              const quizId = quiz.id;
              const isDynamic = quiz.id === 'dynamic';
              const category = quiz.category;
              setQuizResult(null);
              if (isDynamic) {
                router.replace({ pathname: '/quiz/dynamic', params: { category } });
              } else {
                router.replace(`/quiz/${quizId}`);
              }
            }}
            fullWidth
            size="lg"
          />
          <NeonButton
            title="Retour à l'accueil"
            onPress={() => {
              setQuizResult(null);
              router.replace('/(tabs)');
            }}
            variant="outline"
            fullWidth
            size="lg"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  orb1: {
    position: 'absolute',
    top: -60,
    left: '50%',
    marginLeft: -120,
    width: 240,
    height: 240,
    borderRadius: 120,
  },
  orb2: {
    position: 'absolute',
    bottom: 100,
    right: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(37,99,235,0.08)',
  },
  content: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  heroSection: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  gradeBadgeOuter: {
    padding: 6,
    borderRadius: 48,
  },
  gradeBadge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeText: {
    fontSize: 40,
    color: 'white',
    fontWeight: FontWeight.extrabold,
  },
  gradeEmoji: {
    fontSize: 32,
  },
  heroMessage: {
    fontSize: FontSize.xxl,
    color: Colors.text,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
  },
  heroSub: {
    fontSize: FontSize.base,
    color: Colors.textSubtle,
    textAlign: 'center',
  },
  scoreCard: {
    gap: Spacing.md,
  },
  scoreTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  scoreLeft: {
    alignItems: 'center',
    flex: 1,
  },
  scoreCenter: {
    alignItems: 'center',
    flex: 1,
  },
  scoreRight: {
    alignItems: 'center',
    flex: 1,
  },
  scoreDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.glassBorder,
  },
  scoreValue: {
    fontSize: FontSize.xxl,
    color: Colors.text,
    fontWeight: FontWeight.extrabold,
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSubtle,
    marginTop: 2,
  },
  breakdownTitle: {
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.sm,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  breakdownLabel: {
    flex: 1,
    fontSize: FontSize.base,
    color: Colors.textMuted,
  },
  breakdownValue: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
  reviewTitle: {
    fontSize: FontSize.lg,
    color: Colors.text,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
  },
  reviewCard: {
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  reviewStatus: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCorrect: {
    backgroundColor: 'rgba(16,185,129,0.2)',
  },
  statusWrong: {
    backgroundColor: 'rgba(239,68,68,0.2)',
  },
  reviewNumber: {
    fontSize: FontSize.sm,
    color: Colors.textSubtle,
    fontWeight: FontWeight.semibold,
    flex: 1,
  },
  reviewQuestion: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    lineHeight: 20,
  },
  correctAnswerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  correctAnswerText: {
    fontSize: FontSize.xs,
    color: Colors.accentGreen,
    flex: 1,
  },
  actions: {
    gap: Spacing.sm,
  },
});
