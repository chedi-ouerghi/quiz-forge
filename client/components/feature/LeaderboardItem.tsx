// 
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, BorderRadius, FontSize, FontWeight, Spacing } from '@/constants/theme';

interface LeaderboardItemProps {
  rank: number | string;
  username: string;
  avatar: string;
  xp: number;
  level: string | number;
  quizzes: number;
  country: string;
  isCurrentUser?: boolean;
}

const RANK_COLORS: Record<number, string[]> = {
  1: ['#FFD700', '#FFA500'],
  2: ['#C0C0C0', '#A8A8A8'],
  3: ['#CD7F32', '#B8693E'],
};

export function LeaderboardItem({
  rank,
  username,
  avatar,
  xp,
  level,
  quizzes,
  country,
  isCurrentUser = false,
}: LeaderboardItemProps) {
  const numericRank = Number(rank);
  const isTop3 = numericRank > 0 && numericRank <= 3;

  return (
    <View style={[styles.container, isCurrentUser && styles.currentUser]}>
      {isCurrentUser && (
        <LinearGradient
          colors={['rgba(124,58,237,0.15)', 'rgba(37,99,235,0.1)']}
          style={styles.currentUserGlow}
        />
      )}

      {/* Rank */}
      <View style={styles.rankContainer}>
        {isTop3 ? (
          <LinearGradient
            colors={RANK_COLORS[numericRank] as [string, string]}
            style={styles.rankBadge}
          >
            <Text style={styles.rankNumber}>{rank}</Text>
          </LinearGradient>
        ) : (
          <View style={styles.rankPlain}>
            <Text style={styles.rankNumberPlain}>{rank}</Text>
          </View>
        )}
      </View>

      {/* Avatar */}
      <View style={[styles.avatar, isTop3 && styles.avatarTop3]}>
        <Text style={styles.avatarText}>{avatar}</Text>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={[styles.username, isCurrentUser && styles.currentUsername]} numberOfLines={1}>
            {username}
          </Text>
          <Text style={styles.country}>{country}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.level}>{level}</Text>
          <View style={styles.dot} />
          <Text style={styles.quizzes}>{quizzes} quizzes</Text>
        </View>
      </View>

      {/* XP */}
      <View style={styles.xpContainer}>
        <MaterialIcons name="bolt" size={14} color="#F59E0B" />
        <Text style={styles.xp}>{xp.toLocaleString()}</Text>
        <Text style={styles.xpLabel}>XP</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
    gap: Spacing.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  currentUser: {
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.3)',
    borderRadius: BorderRadius.md,
    marginVertical: 2,
  },
  currentUserGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  rankContainer: {
    width: 32,
    alignItems: 'center',
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumber: {
    fontSize: FontSize.sm,
    color: '#000',
    fontWeight: FontWeight.bold,
  },
  rankPlain: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumberPlain: {
    fontSize: FontSize.sm,
    color: Colors.textSubtle,
    fontWeight: FontWeight.semibold,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTop3: {
    backgroundColor: 'rgba(124,58,237,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.4)',
  },
  avatarText: {
    fontSize: 20,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  username: {
    fontSize: FontSize.base,
    color: Colors.text,
    fontWeight: FontWeight.semibold,
    flex: 1,
  },
  currentUsername: {
    color: Colors.primaryLight,
  },
  country: {
    fontSize: FontSize.base,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  level: {
    fontSize: FontSize.xs,
    color: Colors.textSubtle,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.textSubtle,
  },
  quizzes: {
    fontSize: FontSize.xs,
    color: Colors.textSubtle,
  },
  xpContainer: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 2,
  },
  xp: {
    fontSize: FontSize.base,
    color: '#F59E0B',
    fontWeight: FontWeight.bold,
  },
  xpLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSubtle,
    marginBottom: 1,
  },
});
