// 
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontSize, FontWeight } from '@/constants/theme';

interface ProgressBarProps {
  progress: number; // 0-1
  label?: string;
  showPercent?: boolean;
  height?: number;
  colors?: string[];
}

export function ProgressBar({
  progress,
  label,
  showPercent = false,
  height = 8,
  colors = ['#7C3AED', '#2563EB'],
}: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(1, progress));

  return (
    <View style={styles.container}>
      {(label || showPercent) && (
        <View style={styles.header}>
          {label ? <Text style={styles.label}>{label}</Text> : <View />}
          {showPercent && (
            <Text style={styles.percent}>{Math.round(clampedProgress * 100)}%</Text>
          )}
        </View>
      )}
      <View style={[styles.track, { height }]}>
        <LinearGradient
          colors={colors as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.fill,
            {
              width: `${clampedProgress * 100}%`,
              height,
              borderRadius: height / 2,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
  },
  percent: {
    fontSize: FontSize.sm,
    color: Colors.primaryLight,
    fontWeight: FontWeight.semibold,
  },
  track: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 9999,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 9999,
  },
});
