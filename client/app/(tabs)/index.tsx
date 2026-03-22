import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  Dimensions,
  RefreshControl,
  Platform,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { DIFFICULTY_CONFIG, Difficulty, LEVEL_THRESHOLDS, Quiz } from '@/constants/quizData';
import { getAllQuizzes } from '@/services/quizService';
import { calculateLevel, getNextLevelXp } from '@/services/authService';
import { Colors, BorderRadius, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { QuizCard } from '@/components/feature/QuizCard';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DIFFICULTY_TABS: Difficulty[] = ['beginner', 'intermediate', 'advanced', 'expert'];

// Animation constants
const ANIMATION_DURATION = 300;

// Helper functions
const getLevelColor = (level: number): string => {
  if (level <= 10) return '#10B981';
  if (level <= 25) return '#3B82F6';
  if (level <= 50) return '#8B5CF6';
  return '#F59E0B';
};

const formatTimeAgo = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
    }
  }
  return 'just now';
};

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('beginner');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const headerTranslateY = useRef(new Animated.Value(-20)).current;
  const statsScaleAnim = useRef(new Animated.Value(0.9)).current;

  const getLevelLabel = (level: number) => {
    const map: Record<number, string> = { 1: 'Beginner', 2: 'Intermediate', 3: 'Advanced', 4: 'Expert' };
    return map[level] || 'Beginner';
  };

  // User stats with memoization
  const userStats = useMemo(() => {
    if (!user) return null;
    const currentLevelNum = calculateLevel(user.xp);
    const levelInfo = getNextLevelXp(user.xp);
    const progress = levelInfo.next === 9999 ? 1 : (user.xp - levelInfo.current) / (levelInfo.next - levelInfo.current);
    const bestScore = user.quizHistory.length > 0
      ? Math.max(...user.quizHistory.map(h => Math.round((h.score / h.maxScore) * 100)))
      : null;
    const lastQuiz = user.quizHistory.length > 0
      ? new Date(user.quizHistory[user.quizHistory.length - 1].completedAt)
      : null;

    return {
      currentLevel: currentLevelNum,
      levelInfo,
      progress,
      bestScore,
      lastQuiz,
      nextLevelXp: levelInfo.next === 9999 ? 'MAX' : levelInfo.next.toLocaleString(),
      streak: user.streak || 0,
    };
  }, [user]);

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(headerTranslateY, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.spring(statsScaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 50,
        delay: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadQuizzes = useCallback(async () => {
    setLoading(true);
    const data = await getAllQuizzes();
    setQuizzes(data);
    setLoading(false);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadQuizzes();
    setRefreshing(false);
  }, [loadQuizzes]);

  useEffect(() => {
    loadQuizzes();
  }, [loadQuizzes]);

  const handleDifficultyChange = useCallback((difficulty: Difficulty) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedDifficulty(difficulty);
  }, []);

  const filteredQuizzes = useMemo(() =>
    quizzes.filter((q) => q.difficulty === selectedDifficulty),
    [quizzes, selectedDifficulty]
  );

  const isDifficultyLocked = useCallback((difficulty: Difficulty) => {
    const xpRequired = LEVEL_THRESHOLDS[difficulty];
    return (user?.xp || 0) < xpRequired;
  }, [user?.xp]);

  const isQuizLocked = useCallback((quiz: Quiz) => {
    // 1. Global difficulty lock
    const diffLocked = isDifficultyLocked(quiz.difficulty);
    if (diffLocked) return true;

    // 2. Sequential order lock
    // Order 1 is always the entry point for its difficulty
    if (quiz.order <= 1) return false;

    // To unlock quiz order N, user must have completed quiz order N-1 with 60%+ score
    const prevQuiz = quizzes.find(q => q.order === quiz.order - 1);
    if (!prevQuiz) return false;

    const isPrevDone = user?.quizHistory && user.quizHistory.some(h => 
      h.quizId === prevQuiz.id && (h.score / h.maxScore) >= 0.6
    );

    return !isPrevDone;
  }, [user?.quizHistory, isDifficultyLocked, quizzes]);

  if (!user || !userStats) return null;

  const getLevelColor = (level: number) => {
     const label = getLevelLabel(level).toLowerCase() as Difficulty;
     return DIFFICULTY_CONFIG[label]?.color || Colors.primary;
  };

  const levelColor = getLevelColor(userStats.currentLevel);

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#0D1117', '#161B22'] as const}
        style={StyleSheet.absoluteFill}
      />

      {/* Animated decorative elements */}
      <Animated.View style={[styles.orb1, { transform: [{ scale: scaleAnim }] }]} />
      <Animated.View style={[styles.orb2, { transform: [{ scale: fadeAnim }] }]} />
      <Animated.View style={[styles.orb3, { transform: [{ translateY: headerTranslateY }] }]} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: 32 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primaryLight}
            colors={[Colors.primaryLight]}
          />
        }
      >
        {/* Animated Header */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: headerTranslateY }],
            }
          ]}
        >
          <View>
            <Text style={styles.greeting}>✨ Good day,</Text>
            <Text style={styles.username}>
              {user.avatar} {user.username}
            </Text>
            {userStats.lastQuiz && (
              <Text style={styles.lastActive}>
                Last quiz: {formatTimeAgo(userStats.lastQuiz)}
              </Text>
            )}
          </View>
          <Pressable
            onPress={() => router.push('/profile')}
            style={({ pressed }) => [
              styles.xpBadge,
              pressed && styles.xpBadgePressed,
            ]}
          >
            <MaterialIcons name="bolt" size={16} color="#F59E0B" />
            <Text style={styles.xpValue}>{user.xp.toLocaleString()}</Text>
            <Text style={styles.xpLabel}>XP</Text>
            <MaterialIcons name="chevron-right" size={14} color="#F59E0B" />
          </Pressable>
        </Animated.View>

        {/* Animated Level Card */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
          <LinearGradient
            colors={[`${levelColor}40`, `${Colors.primary}20`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.levelCard}
          >
            <View style={styles.levelCardInner}>
              <View style={styles.levelLeft}>
                <View style={styles.levelHeader}>
                  <Badge
                    label={`Level ${userStats.currentLevel}`}
                    color={levelColor}
                  />
                  <Text style={[styles.levelTitle, { color: levelColor }]}>
                    {userStats.currentLevel <= 1 ? 'Rising Star' :
                      userStats.currentLevel <= 2 ? 'Quiz Master' :
                        userStats.currentLevel <= 3 ? 'Knowledge Guru' : 'Legendary Scholar'}
                  </Text>
                </View>
                <ProgressBar
                  progress={userStats.progress}
                  showPercent
                  height={8}
                  colors={[levelColor, Colors.primaryLight]}
                />
                <View style={styles.xpInfo}>
                  <Text style={styles.xpProgress}>
                    {user.xp.toLocaleString()} / {userStats.nextLevelXp} XP
                  </Text>
                  <Text style={styles.xpToNext}>
                    {userStats.levelInfo.next === 9999 ? '🏆 Max Level Achieved!' :
                      `${(userStats.levelInfo.next - user.xp).toLocaleString()} XP to next level`}
                  </Text>
                </View>
              </View>
              <View style={styles.levelRight}>
                <LinearGradient
                  colors={[`${levelColor}40`, `${Colors.primary}20`]}
                  style={styles.levelIcon}
                >
                  <MaterialIcons
                    name={userStats.currentLevel <= 10 ? "school" :
                      userStats.currentLevel <= 25 ? "psychology" :
                        userStats.currentLevel <= 50 ? "auto-awesome" : "star"}
                    size={36}
                    color={levelColor}
                  />
                </LinearGradient>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Animated Stats Row */}
        <Animated.View style={[styles.statsRow, { transform: [{ scale: statsScaleAnim }] }]}>
          {[
            { label: 'Streak', value: `${userStats.streak}d`, icon: 'local-fire-department', color: '#F59E0B', gradient: ['#F59E0B20', '#F59E0B10'] as const },
            { label: 'Completed', value: user.quizzesCompleted, icon: 'check-circle', color: '#10B981', gradient: ['#10B98120', '#10B98110'] as const },
            { label: 'Best Score', value: userStats.bestScore ? `${userStats.bestScore}%` : 'N/A', icon: 'stars', color: '#06B6D4', gradient: ['#06B6D420', '#06B6D410'] as const },
          ].map((stat, i) => (
            <GlassCard 
              key={i} 
              style={styles.statCard} 
              variant="default"
            >
              <LinearGradient
                colors={stat.gradient}
                style={styles.statIconWrapper}
              >
                <MaterialIcons name={stat.icon as any} size={24} color={stat.color} />
              </LinearGradient>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </GlassCard>
          ))}
        </Animated.View>

        {/* Section header with animation */}
        <Animated.View style={[styles.sectionHeader, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>📚 Quizzes</Text>
          <Text style={styles.sectionSub}>Choose your challenge and prove your knowledge</Text>
        </Animated.View>

        {/* Difficulty Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScrollView}
          contentContainerStyle={styles.filterContent}
        >
          {DIFFICULTY_TABS.map((diff, index) => {
            const config = DIFFICULTY_CONFIG[diff];
            const isSelected = selectedDifficulty === diff;
            const locked = isDifficultyLocked(diff);
            const xpRequired = LEVEL_THRESHOLDS[diff];

            return (
              <Pressable
                key={diff}
                onPress={() => !locked && handleDifficultyChange(diff)}
                style={({ pressed }) => [
                  styles.filterTab,
                  isSelected && {
                    backgroundColor: config.color + '22',
                    borderColor: config.color + '66',
                    transform: [{ scale: 1.02 }],
                  },
                  locked && styles.filterTabLocked,
                  pressed && styles.filterTabPressed,
                ]}
              >
                {locked ? (
                  <>
                    <MaterialIcons name="lock" size={12} color={Colors.textDisabled} />
                    <Text style={styles.filterTabTextLocked}>
                      {config.label}
                    </Text>
                    <Text style={styles.xpRequirement}>
                      {xpRequired.toLocaleString()} XP
                    </Text>
                  </>
                ) : (
                  <>
                    <Text
                      style={[
                        styles.filterTabText,
                        isSelected && { color: config.color, fontWeight: FontWeight.bold },
                      ]}
                    >
                      {config.label}
                    </Text>
                    {isSelected && (
                      <View style={[styles.activeIndicator, { backgroundColor: config.color }]} />
                    )}
                  </>
                )}
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Quiz List with empty state */}
        {filteredQuizzes.length === 0 && !loading ? (
          <GlassCard style={styles.emptyState}>
            <MaterialIcons name="quiz" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyStateTitle}>No quizzes available</Text>
            <Text style={styles.emptyStateText}>
              More quizzes coming soon! Check back later.
            </Text>
          </GlassCard>
        ) : (
          <View style={styles.quizList}>
            {filteredQuizzes.map((quiz, index) => (
              <Animated.View
                key={quiz.id}
                style={{
                  opacity: fadeAnim,
                  transform: [{
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20 * (index + 1), 0],
                    })
                  }],
                }}
              >
                <QuizCard
                  quiz={quiz}
                  isLocked={isQuizLocked(quiz)}
                  onPress={(q) => router.push(`/quiz/${q.id}`)}
                />
              </Animated.View>
            ))}
          </View>
        )}

        {/* Dynamic Tip Card based on user progress */}
        <GlassCard variant="accent" style={styles.tipCard}>
          <View style={styles.tipRow}>
            <LinearGradient
              colors={['#A855F7', '#8B5CF6']}
              style={styles.tipIconWrapper}
            >
              <MaterialIcons name="tips-and-updates" size={20} color="#FFFFFF" />
            </LinearGradient>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>
                {userStats.streak >= 7 ? '🔥 On Fire!' :
                  userStats.bestScore && userStats.bestScore >= 90 ? '🎯 Almost Perfect!' : '💡 Pro Tip'}
              </Text>
              <Text style={styles.tipText}>
                {userStats.streak >= 7
                  ? `You're on a ${userStats.streak}-day streak! Keep going to unlock exclusive badges!`
                  : userStats.bestScore && userStats.bestScore >= 90
                    ? 'Amazing performance! Challenge yourself with harder difficulties to earn more XP!'
                    : 'Answer faster to earn time bonuses! Each correct answer gains +10 bonus points.'}
              </Text>
            </View>
          </View>
        </GlassCard>
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
    top: -80,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(124,58,237,0.15)',
  },
  orb2: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(59,130,246,0.1)',
  },
  orb3: {
    position: 'absolute',
    top: '30%',
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(168,85,247,0.08)',
  },
  content: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: FontSize.sm,
    color: Colors.textSubtle,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  username: {
    fontSize: FontSize.xl,
    color: Colors.text,
    fontWeight: FontWeight.bold,
    marginBottom: 4,
  },
  lastActive: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    gap: 6,
  },
  xpBadgePressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.8,
  },
  xpValue: {
    fontSize: FontSize.base,
    color: '#F59E0B',
    fontWeight: FontWeight.bold,
  },
  xpLabel: {
    fontSize: FontSize.xs,
    color: '#D97706',
    fontWeight: FontWeight.semibold,
  },
  levelCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.25)',
    padding: Spacing.lg,
    overflow: 'hidden',
  },
  levelCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  levelLeft: {
    flex: 1,
    gap: Spacing.sm,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  levelTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
  xpInfo: {
    gap: 2,
  },
  xpProgress: {
    fontSize: FontSize.sm,
    color: Colors.textSubtle,
  },
  xpToNext: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  levelRight: {
    alignItems: 'center',
  },
  levelIcon: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    paddingVertical: Spacing.md,
  },
  statIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: FontSize.lg,
    color: Colors.text,
    fontWeight: FontWeight.bold,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSubtle,
    textAlign: 'center',
  },
  sectionHeader: {
    gap: 4,
    marginBottom: -Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.xl,
    color: Colors.text,
    fontWeight: FontWeight.bold,
  },
  sectionSub: {
    fontSize: FontSize.sm,
    color: Colors.textSubtle,
  },
  filterScrollView: {
    marginHorizontal: -Spacing.lg,
  },
  filterContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    gap: 6,
    position: 'relative',
  },
  filterTabLocked: {
    opacity: 0.6,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  filterTabPressed: {
    transform: [{ scale: 0.96 }],
  },
  filterTabText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
  },
  filterTabTextLocked: {
    fontSize: FontSize.sm,
    color: Colors.textDisabled,
    fontWeight: FontWeight.medium,
  },
  xpRequirement: {
    fontSize: FontSize.xs,
    color: Colors.textDisabled,
    marginLeft: 4,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -2,
    left: '20%',
    right: '20%',
    height: 2,
    borderRadius: 2,
  },
  quizList: {
    gap: Spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    padding: Spacing.xl * 2,
    gap: Spacing.md,
  },
  emptyStateTitle: {
    fontSize: FontSize.lg,
    color: Colors.text,
    fontWeight: FontWeight.semibold,
  },
  emptyStateText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  tipCard: {
    marginBottom: Spacing.md,
  },
  tipRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  tipIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipContent: {
    flex: 1,
    gap: 4,
  },
  tipTitle: {
    fontSize: FontSize.base,
    color: Colors.text,
    fontWeight: FontWeight.semibold,
  },
  tipText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    lineHeight: 20,
  },
});