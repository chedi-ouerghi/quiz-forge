import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useAlert } from '@/template';
import { calculateLevel, getNextLevelXp } from '@/services/authService';
import { DIFFICULTY_CONFIG, Difficulty } from '@/constants/quizData';
import { Colors, BorderRadius, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import { NeonButton } from '@/components/ui/NeonButton';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';

// Animation constants
const ANIMATION_DURATION = 300;

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { showAlert } = useAlert();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  if (!user) return null;

  // Memoized calculations
  const userStats = useMemo(() => {
    const currentLevel = calculateLevel(user.xp);
    const levelInfo = getNextLevelXp(user.xp);
    const progress = levelInfo.next === 9999 ? 1 : (user.xp - levelInfo.current) / (levelInfo.next - levelInfo.current);
    const accuracy = user.quizHistory.length > 0
      ? Math.round(user.quizHistory.reduce((acc, h) => acc + (h.score / h.maxScore) * 100, 0) / user.quizHistory.length)
      : 0;
    
    return { currentLevel, levelInfo, progress, accuracy };
  }, [user.xp, user.quizHistory]);

  const achievements = useMemo(() => [
    { emoji: '🔥', label: 'First Quiz', unlocked: user.quizzesCompleted >= 1, color: '#F59E0B' },
    { emoji: '⚡', label: '5 Quizzes', unlocked: user.quizzesCompleted >= 5, color: '#10B981' },
    { emoji: '💎', label: '500 XP', unlocked: user.xp >= 500, color: '#8B5CF6' },
    { emoji: '🌟', label: '1500 XP', unlocked: user.xp >= 1500, color: '#3B82F6' },
    { emoji: '👑', label: 'Expert', unlocked: user.xp >= 3500, color: '#EF4444' },
    { emoji: '🎯', label: 'Perfect', unlocked: userStats.accuracy === 100, color: '#06B6D4' },
  ], [user.quizzesCompleted, user.xp, userStats.accuracy]);

  const recentHistory = useMemo(() => 
    user.quizHistory.slice(0, 5),
    [user.quizHistory]
  );

  const handleLogout = useCallback(() => {
    showAlert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/auth/login');
        },
      },
    ]);
  }, [showAlert, signOut, router]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Simulate refresh or fetch fresh user data
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  const joinDate = new Date(user.joinedAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const getLevelBadgeLetter = (level: string) => {
    const map: Record<string, string> = { 'Beginner': 'B', 'Intermediate': 'I', 'Advanced': 'A', 'Expert': 'E' };
    return map[level] || 'L';
  };

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#0D0821', '#080818'] as const}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[styles.orb1, { opacity: fadeAnim }]} />
      <Animated.View style={[styles.orb2, { opacity: fadeAnim }]} />

      <ScrollView
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
        {/* Hero Profile Card */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
          <LinearGradient
            colors={['rgba(124,58,237,0.4)', 'rgba(37,99,235,0.25)', 'rgba(6,182,212,0.15)'] as const}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.avatarWrapper}>
              <LinearGradient
                colors={['#7C3AED', '#2563EB'] as const}
                style={styles.avatarGradient}
              >
                <Text style={styles.avatarEmoji}>{user.avatar}</Text>
              </LinearGradient>
              <View style={styles.levelBadgeAbs}>
                <Text style={styles.levelBadgeText}>
                  {getLevelBadgeLetter(userStats.currentLevel)}
                </Text>
              </View>
            </View>

            <Text style={styles.heroUsername}>{user.username}</Text>
            <Text style={styles.heroEmail}>{user.email}</Text>

            <Badge
              label={userStats.currentLevel}
              color={DIFFICULTY_CONFIG[userStats.currentLevel.toLowerCase() as Difficulty]?.color ?? Colors.primary}
              style={styles.levelBadge}
              variant="glow"
            />

            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>
                  {userStats.levelInfo.next === 9999 ? 'Max Level Reached!' : 'Progress to next level'}
                </Text>
                <Text style={styles.progressXp}>
                  {user.xp.toLocaleString()} / {userStats.levelInfo.next === 9999 ? '∞' : userStats.levelInfo.next.toLocaleString()} XP
                </Text>
              </View>
              <ProgressBar 
                progress={userStats.progress} 
                height={8} 
                colors={['#A855F7', '#3B82F6', '#06B6D4'] as const} 
              />
            </View>

            <View style={styles.joinDateContainer}>
              <MaterialIcons name="calendar-today" size={12} color={Colors.textSubtle} />
              <Text style={styles.joinDate}>Member since {joinDate}</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Stats Grid */}
        <Animated.View style={[styles.statsGrid, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {[
            { icon: 'bolt', label: 'Total XP', value: user.xp.toLocaleString(), color: '#F59E0B', gradient: ['#F59E0B20', '#F59E0B10'] as const },
            { icon: 'quiz', label: 'Quizzes', value: user.quizzesCompleted.toString(), color: Colors.accentGreen, gradient: ['#10B98120', '#10B98110'] as const },
            { icon: 'target', label: 'Accuracy', value: `${userStats.accuracy}%`, color: Colors.neonCyan, gradient: ['#06B6D420', '#06B6D410'] as const },
            { icon: 'emoji-events', label: 'Rank', value: userStats.currentLevel, color: Colors.neonPurple, gradient: ['#A855F720', '#A855F710'] as const },
          ].map((stat) => (
            <GlassCard key={stat.label} style={styles.statCard} variant="elevated">
              <LinearGradient colors={stat.gradient} style={styles.statIconWrapper}>
                <MaterialIcons name={stat.icon as any} size={22} color={stat.color} />
              </LinearGradient>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </GlassCard>
          ))}
        </Animated.View>

        {/* Quiz History Section */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="history" size={20} color={Colors.primaryLight} />
            <Text style={styles.sectionTitle}>Recent Quizzes</Text>
            {user.quizHistory.length > 5 && (
              <Pressable onPress={() => router.push('/history')}>
                <Text style={styles.seeAllText}>See all</Text>
              </Pressable>
            )}
          </View>

          {recentHistory.length === 0 ? (
            <GlassCard style={styles.emptyHistory}>
              <MaterialIcons name="history-edu" size={48} color={Colors.textDisabled} />
              <Text style={styles.emptyTitle}>No quizzes yet</Text>
              <Text style={styles.emptyText}>Complete your first quiz to see your history here.</Text>
              <NeonButton
                title="Start Learning"
                onPress={() => router.push('/')}
                size="sm"
                style={styles.emptyButton}
              />
            </GlassCard>
          ) : (
            <View style={styles.historyList}>
              {recentHistory.map((item, index) => {
                const pct = Math.round((item.score / item.maxScore) * 100);
                const color = pct >= 80 ? Colors.accentGreen : pct >= 50 ? '#F59E0B' : Colors.error;
                return (
                  <GlassCard key={index} style={styles.historyItem}>
                    <View style={styles.historyLeft}>
                      <View style={[styles.historyIcon, { backgroundColor: color + '20' }]}>
                        <MaterialIcons name="quiz" size={18} color={color} />
                      </View>
                      <View style={styles.historyInfo}>
                        <Text style={styles.historyTitle} numberOfLines={1}>{item.quizTitle}</Text>
                        <View style={styles.historyMeta}>
                          <MaterialIcons name="schedule" size={10} color={Colors.textSubtle} />
                          <Text style={styles.historyDate}>
                            {new Date(item.completedAt).toLocaleDateString()}
                          </Text>
                          <Text style={styles.historyXp}>+{item.xpEarned} XP</Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.historyRight}>
                      <Text style={[styles.historyScore, { color }]}>{pct}%</Text>
                      <Badge 
                        label={item.difficulty} 
                        color={DIFFICULTY_CONFIG[item.difficulty as Difficulty]?.color ?? Colors.primary} 
                        size="sm" 
                      />
                    </View>
                  </GlassCard>
                );
              })}
            </View>
          )}
        </Animated.View>

        {/* Achievements Section */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="military-tech" size={20} color={Colors.neonPurple} />
            <Text style={styles.sectionTitle}>Achievements</Text>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.achievementsScroll}
          >
            {achievements.map((achievement) => (
              <LinearGradient
                key={achievement.label}
                colors={achievement.unlocked 
                  ? [achievement.color + '40', achievement.color + '20'] as const
                  : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)'] as const}
                style={[styles.achievement, !achievement.unlocked && styles.achievementLocked]}
              >
                <Text style={styles.achievementEmoji}>{achievement.emoji}</Text>
                <Text style={[styles.achievementLabel, !achievement.unlocked && styles.lockedText]}>
                  {achievement.label}
                </Text>
                {achievement.unlocked && (
                  <MaterialIcons name="check-circle" size={14} color={achievement.color} />
                )}
                {!achievement.unlocked && (
                  <MaterialIcons name="lock" size={12} color={Colors.textDisabled} />
                )}
              </LinearGradient>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Settings Section */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="settings" size={20} color={Colors.textMuted} />
            <Text style={styles.sectionTitle}>Settings</Text>
          </View>
          
          <GlassCard noPadding style={styles.settingsCard}>
            {[
              { icon: 'notifications-none', label: 'Notifications', route: '/settings/notifications' },
              { icon: 'privacy-tip', label: 'Privacy', route: '/settings/privacy' },
              { icon: 'help-outline', label: 'Help & Support', route: '/settings/help' },
              { icon: 'info-outline', label: 'About', route: '/settings/about' },
            ].map((item, index) => (
              <Pressable
                key={item.label}
                onPress={() => router.push(item.route as any)}
                style={({ pressed }) => [
                  styles.settingsItem,
                  index < 3 && styles.settingsItemBorder,
                  pressed && styles.settingsItemPressed,
                ]}
              >
                <MaterialIcons name={item.icon as any} size={20} color={Colors.textMuted} />
                <Text style={styles.settingsLabel}>{item.label}</Text>
                <MaterialIcons name="chevron-right" size={20} color={Colors.textSubtle} />
              </Pressable>
            ))}
          </GlassCard>
        </Animated.View>

        {/* Logout Button */}
        <Animated.View style={{ opacity: fadeAnim, marginTop: Spacing.xs }}>
          <NeonButton
            title="Sign Out"
            onPress={handleLogout}
            variant="danger"
            fullWidth
            size="lg"
            icon="logout"
          />
        </Animated.View>
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
    top: -50,
    right: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(124,58,237,0.12)',
  },
  orb2: {
    position: 'absolute',
    bottom: -100,
    left: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(59,130,246,0.08)',
  },
  content: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  heroCard: {
    borderRadius: BorderRadius.xxl,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.25)',
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: Spacing.xs,
  },
  avatarGradient: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarEmoji: {
    fontSize: 44,
  },
  levelBadgeAbs: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.bg,
  },
  levelBadgeText: {
    fontSize: 12,
    color: 'white',
    fontWeight: FontWeight.bold,
  },
  heroUsername: {
    fontSize: FontSize.xxl,
    color: Colors.text,
    fontWeight: FontWeight.bold,
  },
  heroEmail: {
    fontSize: FontSize.sm,
    color: Colors.textSubtle,
  },
  levelBadge: {
    marginVertical: Spacing.xs,
  },
  progressSection: {
    width: '100%',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  progressXp: {
    fontSize: FontSize.sm,
    color: Colors.primaryLight,
    fontWeight: FontWeight.semibold,
  },
  joinDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.xs,
  },
  joinDate: {
    fontSize: FontSize.xs,
    color: Colors.textSubtle,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  statCard: {
    width: '47.5%',
    alignItems: 'center',
    gap: 8,
    paddingVertical: Spacing.md,
  },
  statIconWrapper: {
    width: 44,
    height: 44,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    flex: 1,
    fontSize: FontSize.lg,
    color: Colors.text,
    fontWeight: FontWeight.bold,
  },
  seeAllText: {
    fontSize: FontSize.sm,
    color: Colors.primaryLight,
    fontWeight: FontWeight.medium,
  },
  emptyHistory: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xl * 1.5,
  },
  emptyTitle: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    fontWeight: FontWeight.semibold,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textSubtle,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.lg,
  },
  emptyButton: {
    marginTop: Spacing.sm,
  },
  historyList: {
    gap: Spacing.sm,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.sm,
  },
  historyIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyInfo: {
    flex: 1,
    gap: 2,
  },
  historyTitle: {
    fontSize: FontSize.base,
    color: Colors.text,
    fontWeight: FontWeight.medium,
  },
  historyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyDate: {
    fontSize: FontSize.xs,
    color: Colors.textSubtle,
  },
  historyXp: {
    fontSize: FontSize.xs,
    color: Colors.accentGreen,
    fontWeight: FontWeight.medium,
  },
  historyRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  historyScore: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  achievementsScroll: {
    gap: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  achievement: {
    width: 88,
    alignItems: 'center',
    gap: 6,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.2)',
  },
  achievementLocked: {
    borderColor: Colors.glassBorder,
  },
  achievementEmoji: {
    fontSize: 32,
  },
  achievementLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    fontWeight: FontWeight.medium,
  },
  lockedText: {
    color: Colors.textDisabled,
  },
  settingsCard: {
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  settingsItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
  },
  settingsItemPressed: {
    opacity: 0.7,
  },
  settingsLabel: {
    flex: 1,
    fontSize: FontSize.base,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
  },
});