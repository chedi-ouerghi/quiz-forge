import {
  View,
  Text,
  StyleSheet,
  ScrollView, Animated,
  Dimensions,
  RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { Colors, BorderRadius, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { LeaderboardItem } from '@/components/feature/LeaderboardItem';
import { getGlobalLeaderboard } from '@/services/leaderboardService';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface LeaderboardPlayer {
  id: string;
  username: string;
  avatar: string;
  xp: number;
  level: number;
  quizzesCompleted: number;
  country?: string;
}

// Animation constants
const ANIMATION_DURATION = 400;

export default function LeaderboardScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [leaderboard, setLeaderboard] = useState<LeaderboardPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const podiumAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animations
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
      Animated.spring(podiumAnim, {
        toValue: 1,
        friction: 6,
        tension: 50,
        delay: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getGlobalLeaderboard();
      setLeaderboard(data);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadLeaderboard();
    setRefreshing(false);
  }, [loadLeaderboard]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const topThree = useMemo(() => leaderboard.slice(0, 3), [leaderboard]);
  const rest = useMemo(() => leaderboard.slice(3), [leaderboard]);

  const userRankData = useMemo(() => {
    if (!user) return null;
    return {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      xp: user.xp,
      level: user.level,
      quizzes: user.quizzesCompleted,
      country: '🌍',
    };
  }, [user]);

  const userRank = useMemo(() => {
    if (!user) return null;
    const index = leaderboard.findIndex((p) => p.id === user.id);
    return index !== -1 ? index + 1 : leaderboard.length + 1;
  }, [leaderboard, user]);

  // Podium animations
  const podiumScale = podiumAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1],
  });

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#0D0821', '#080818'] as const}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <Animated.View style={[styles.orb, { opacity: fadeAnim }]} />
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
        {/* Animated Header */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <LinearGradient
            colors={['rgba(245,158,11,0.2)', 'rgba(220,38,38,0.1)'] as const}
            style={styles.trophyContainer}
          >
            <Image
              source={require('@/assets/images/trophy.png')}
              style={styles.trophyImage}
              contentFit="contain"
            />
          </LinearGradient>
          <Text style={styles.title}>🏆 Global Leaderboard</Text>
          <Text style={styles.subtitle}>Top minds around the world</Text>
          <View style={styles.statsBadge}>
            <MaterialIcons name="people" size={14} color={Colors.primaryLight} />
            <Text style={styles.statsBadgeText}>
              {leaderboard.length.toLocaleString()} players competing
            </Text>
          </View>
        </Animated.View>

        {/* Podium Section */}
        {topThree.length >= 3 && !loading && (
          <Animated.View
            style={[
              styles.podiumWrapper,
              {
                opacity: podiumAnim,
                transform: [{ scale: podiumScale }],
              }
            ]}
          >
            <View style={styles.podium}>
              {/* 2nd place */}
              <View style={styles.podiumItem}>
                <LinearGradient
                  colors={['rgba(192,192,192,0.2)', 'rgba(192,192,192,0.05)'] as const}
                  style={[styles.podiumAvatar, styles.silver]}
                >
                  <Text style={styles.podiumEmoji}>{topThree[1]?.avatar || '👤'}</Text>
                </LinearGradient>
                <LinearGradient
                  colors={['rgba(192,192,192,0.15)', 'rgba(192,192,192,0.05)'] as const}
                  style={[styles.podiumBar, styles.silverBar]}
                >
                  <Text style={styles.podiumRank}>2</Text>
                </LinearGradient>
                <Text style={styles.podiumName} numberOfLines={1}>
                  {topThree[1]?.username || 'Player'}
                </Text>
                <Text style={styles.podiumXp}>
                  {topThree[1]?.xp?.toLocaleString() || '0'} XP
                </Text>
              </View>

              {/* 1st place */}
              <View style={[styles.podiumItem, styles.firstPlace]}>
                <View style={styles.crownContainer}>
                  <Text style={styles.crown}>👑</Text>
                </View>
                <LinearGradient
                  colors={['rgba(255,215,0,0.25)', 'rgba(255,215,0,0.1)'] as const}
                  style={[styles.podiumAvatar, styles.gold]}
                >
                  <Text style={styles.podiumEmoji}>{topThree[0]?.avatar || '👑'}</Text>
                </LinearGradient>
                <LinearGradient
                  colors={['rgba(255,215,0,0.2)', 'rgba(255,215,0,0.05)'] as const}
                  style={[styles.podiumBar, styles.goldBar]}
                >
                  <Text style={styles.podiumRank}>1</Text>
                </LinearGradient>
                <Text style={[styles.podiumName, styles.firstName]} numberOfLines={1}>
                  {topThree[0]?.username || 'Champion'}
                </Text>
                <Text style={[styles.podiumXp, styles.goldXp]}>
                  {topThree[0]?.xp?.toLocaleString() || '0'} XP
                </Text>
              </View>

              {/* 3rd place */}
              <View style={styles.podiumItem}>
                <LinearGradient
                  colors={['rgba(205,127,50,0.2)', 'rgba(205,127,50,0.05)'] as const}
                  style={[styles.podiumAvatar, styles.bronze]}
                >
                  <Text style={styles.podiumEmoji}>{topThree[2]?.avatar || '👤'}</Text>
                </LinearGradient>
                <LinearGradient
                  colors={['rgba(205,127,50,0.15)', 'rgba(205,127,50,0.05)'] as const}
                  style={[styles.podiumBar, styles.bronzeBar]}
                >
                  <Text style={styles.podiumRank}>3</Text>
                </LinearGradient>
                <Text style={styles.podiumName} numberOfLines={1}>
                  {topThree[2]?.username || 'Player'}
                </Text>
                <Text style={styles.podiumXp}>
                  {topThree[2]?.xp?.toLocaleString() || '0'} XP
                </Text>
              </View>
            </View>

            {/* Podium stats */}
            <View style={styles.podiumStats}>
              <View style={styles.podiumStatItem}>
                <MaterialIcons name="stars" size={14} color="#FFD700" />
                <Text style={styles.podiumStatText}>
                  Champion: {topThree[0]?.xp?.toLocaleString()} XP
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Your rank card */}
        {userRankData && userRank && (
          <Animated.View style={{ opacity: fadeAnim }}>
            <GlassCard variant="accent" style={styles.yourRankCard}>
              <View style={styles.yourRankHeader}>
                <LinearGradient
                  colors={[Colors.primaryLight, Colors.primary]} as const
                  style={styles.yourRankIcon}
                >
                  <MaterialIcons name="person-pin" size={14} color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.yourRankLabel}>Your Ranking</Text>
                <View style={styles.yourRankBadge}>
                  <Text style={styles.yourRankNumber}>#{userRank}</Text>
                </View>
              </View>
              <LeaderboardItem
                rank={userRank}
                username={userRankData.username}
                avatar={userRankData.avatar}
                xp={userRankData.xp}
                level={userRankData.level}
                quizzes={userRankData.quizzes}
                country={userRankData.country}
                isCurrentUser
              />
              {userRank <= 10 && userRank > 3 && (
                <View style={styles.topTenBadge}>
                  <MaterialIcons name="trending-up" size={12} color={Colors.accentGreen} />
                  <Text style={styles.topTenText}>Top 10 Player!</Text>
                </View>
              )}
            </GlassCard>
          </Animated.View>
        )}

        {/* Full Rankings */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <GlassCard noPadding style={styles.rankingsCard}>
            <LinearGradient
              colors={['rgba(255,255,255,0.05)', 'transparent'] as const}
              style={styles.rankingsHeader}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.rankingsTitleContainer}>
                <MaterialIcons name="format-list-numbered" size={18} color={Colors.primaryLight} />
                <Text style={styles.rankingsTitle}>Global Rankings</Text>
              </View>
              <View style={styles.rankingsMeta}>
                <MaterialIcons name="groups" size={14} color={Colors.textSubtle} />
                <Text style={styles.rankingsMetaText}>
                  {leaderboard.length.toLocaleString()} players
                </Text>
              </View>
            </LinearGradient>

            {loading ? (
              <View style={styles.loadingContainer}>
                <MaterialIcons name="autorenew" size={32} color={Colors.primaryLight} />
                <Text style={styles.loadingText}>Loading rankings...</Text>
              </View>
            ) : rest.length === 0 && topThree.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="emoji-people" size={48} color={Colors.textMuted} />
                <Text style={styles.emptyTitle}>No players yet</Text>
                <Text style={styles.emptyText}>Be the first to appear on the leaderboard!</Text>
              </View>
            ) : (
              <View>
                {rest.map((player, index) => (
                  <LeaderboardItem
                    key={player.id || index}
                    rank={index + 4}
                    username={player.username}
                    avatar={player.avatar || '👤'}
                    xp={player.xp || 0}
                    level={player.level || 1}
                    quizzes={player.quizzesCompleted || 0}
                    country={player.country || '🌍'}
                    isCurrentUser={player.id === user?.id}
                  />
                ))}
              </View>
            )}
          </GlassCard>
        </Animated.View>

        {/* Motivational footer */}
        {!loading && leaderboard.length > 0 && (
          <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
            <GlassCard style={styles.footerCard}>
              <Text style={styles.footerText}>
                🎯 Keep practicing to climb the ranks!
              </Text>
              <Text style={styles.footerSubtext}>
                Complete quizzes and maintain streaks to earn more XP
              </Text>
            </GlassCard>
          </Animated.View>
        )}
      </ScrollView>
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
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(245,158,11,0.08)',
  },
  orb2: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(124,58,237,0.08)',
  },
  content: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  trophyContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  trophyImage: {
    width: 48,
    height: 48,
  },
  title: {
    fontSize: FontSize.xxl,
    color: Colors.text,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSize.base,
    color: Colors.textSubtle,
    textAlign: 'center',
  },
  statsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(124,58,237,0.15)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.xs,
  },
  statsBadgeText: {
    fontSize: FontSize.xs,
    color: Colors.primaryLight,
    fontWeight: FontWeight.medium,
  },
  podiumWrapper: {
    gap: Spacing.sm,
  },
  podium: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  podiumItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  firstPlace: {
    marginBottom: -8,
    transform: [{ scale: 1.02 }],
  },
  crownContainer: {
    marginBottom: -4,
    zIndex: 1,
  },
  crown: {
    fontSize: 28,
    textShadowColor: 'rgba(255,215,0,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  podiumAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 2,
  },
  gold: {
    borderColor: '#FFD700',
  },
  silver: {
    borderColor: '#C0C0C0',
  },
  bronze: {
    borderColor: '#CD7F32',
  },
  podiumEmoji: {
    fontSize: 28,
  },
  podiumBar: {
    width: '100%',
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: Spacing.md,
    minHeight: 50,
    marginBottom: 4,
  },
  goldBar: {
    minHeight: 88,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.4)',
  },
  silverBar: {
    minHeight: 68,
    borderWidth: 1,
    borderColor: 'rgba(192,192,192,0.3)',
  },
  bronzeBar: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: 'rgba(205,127,50,0.3)',
  },
  podiumRank: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    color: Colors.text,
  },
  podiumName: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: FontWeight.semibold,
    textAlign: 'center',
  },
  firstName: {
    color: '#FFD700',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  podiumXp: {
    fontSize: FontSize.xs,
    color: Colors.textSubtle,
    textAlign: 'center',
  },
  goldXp: {
    color: '#FFD700',
    fontWeight: FontWeight.semibold,
  },
  podiumStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },
  podiumStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  podiumStatText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  yourRankCard: {
    gap: Spacing.md,
    position: 'relative',
  },
  yourRankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  yourRankIcon: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yourRankLabel: {
    fontSize: FontSize.sm,
    color: Colors.primaryLight,
    fontWeight: FontWeight.semibold,
    flex: 1,
  },
  yourRankBadge: {
    backgroundColor: 'rgba(124,58,237,0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  yourRankNumber: {
    fontSize: FontSize.sm,
    color: Colors.primaryLight,
    fontWeight: FontWeight.bold,
  },
  topTenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(16,185,129,0.15)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  topTenText: {
    fontSize: FontSize.xs,
    color: Colors.accentGreen,
    fontWeight: FontWeight.medium,
  },
  rankingsCard: {
    overflow: 'hidden',
  },
  rankingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  rankingsTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  rankingsTitle: {
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: FontWeight.bold,
  },
  rankingsMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  rankingsMetaText: {
    fontSize: FontSize.sm,
    color: Colors.textSubtle,
  },
  loadingContainer: {
    padding: Spacing.xl * 2,
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  emptyContainer: {
    padding: Spacing.xl * 2,
    alignItems: 'center',
    gap: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    color: Colors.text,
    fontWeight: FontWeight.semibold,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  footer: {
    marginBottom: Spacing.md,
  },
  footerCard: {
    padding: Spacing.md,
    alignItems: 'center',
  },
  footerText: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.xs,
  },
  footerSubtext: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});