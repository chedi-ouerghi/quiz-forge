// 
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Quiz, DIFFICULTY_CONFIG } from '@/constants/quizData';
import { Colors, BorderRadius, FontSize, FontWeight, Spacing, Shadow } from '@/constants/theme';
import { Badge } from '@/components/ui/Badge';

interface QuizCardProps {
  quiz: Quiz;
  onPress: (quiz: Quiz) => void;
  isLocked?: boolean;
}

export function QuizCard({ quiz, onPress, isLocked = false }: QuizCardProps) {
  const diffConfig = DIFFICULTY_CONFIG[quiz.difficulty];

  return (
    <Pressable
      onPress={() => !isLocked && onPress(quiz)}
      style={({ pressed }) => [styles.container, pressed && !isLocked && styles.pressed]}
    >
      <View style={[styles.card, isLocked && styles.locked]}>
        {/* Glow border gradient */}
        <LinearGradient
          colors={isLocked ? ['#333', '#222'] : [quiz.color + '40', quiz.color + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        />

        <View style={styles.content}>
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: quiz.color + '22', borderColor: quiz.color + '44' }]}>
            <MaterialIcons
              name={quiz.icon as any}
              size={26}
              color={isLocked ? Colors.textDisabled : quiz.color}
            />
          </View>

          {/* Info */}
          <View style={styles.info}>
            <Text style={[styles.title, isLocked && styles.lockedText]} numberOfLines={1}>
              {quiz.title}
            </Text>
            <Text style={styles.category}>{quiz.category}</Text>
            <View style={styles.meta}>
              <Badge
                label={diffConfig.label}
                color={isLocked ? Colors.textDisabled : diffConfig.color}
                size="sm"
              />
              <View style={styles.xpBadge}>
                <MaterialIcons name="bolt" size={12} color={isLocked ? Colors.textDisabled : '#F59E0B'} />
                <Text style={[styles.xpText, isLocked && styles.lockedText]}>+{quiz.xpReward} XP</Text>
              </View>
            </View>
          </View>

          {/* Arrow or Lock */}
          <View style={styles.arrow}>
            {isLocked ? (
              <MaterialIcons name="lock" size={20} color={Colors.textDisabled} />
            ) : (
              <MaterialIcons name="chevron-right" size={24} color={Colors.textSubtle} />
            )}
          </View>
        </View>

        {/* Questions count */}
        <View style={styles.footer}>
          <MaterialIcons name="quiz" size={12} color={Colors.textSubtle} />
          <Text style={styles.footerText}>{quiz.questions?.length || 0} questions</Text>
          <View style={styles.dot} />
          <MaterialIcons name="timer" size={12} color={Colors.textSubtle} />
          <Text style={styles.footerText}>30s each</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.sm + 4,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  card: {
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadow.soft,
  },
  locked: {
    opacity: 0.5,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: FontSize.base,
    color: Colors.text,
    fontWeight: FontWeight.semibold,
  },
  lockedText: {
    color: Colors.textDisabled,
  },
  category: {
    fontSize: FontSize.sm,
    color: Colors.textSubtle,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 2,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  xpText: {
    fontSize: FontSize.xs,
    color: '#F59E0B',
    fontWeight: FontWeight.semibold,
  },
  arrow: {
    width: 28,
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm + 2,
  },
  footerText: {
    fontSize: FontSize.xs,
    color: Colors.textSubtle,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 9999,
    backgroundColor: Colors.textSubtle,
    marginHorizontal: 2,
  },
});
