// 
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, FontSize, FontWeight, Spacing } from '@/constants/theme';

interface BadgeProps {
  label: string;
  color?: string;
  style?: ViewStyle;
  size?: 'sm' | 'md';
}

export function Badge({ label, color = Colors.primary, style, size = 'md' }: BadgeProps) {
  return (
    <View
      style={[
        styles.badge,
        size === 'sm' && styles.sm,
        { backgroundColor: `${color}22`, borderColor: `${color}55` },
        style,
      ]}
    >
      <Text style={[styles.text, size === 'sm' && styles.smText, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  text: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.3,
  },
  sm: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  smText: {
    fontSize: FontSize.xs,
  },
});
