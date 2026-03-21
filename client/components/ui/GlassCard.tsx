// 
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  variant?: 'default' | 'strong' | 'accent';
  noPadding?: boolean;
}

export function GlassCard({ children, style, variant = 'default', noPadding = false }: GlassCardProps) {
  return (
    <View
      style={[
        styles.base,
        variant === 'strong' && styles.strong,
        variant === 'accent' && styles.accent,
        noPadding && styles.noPadding,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  strong: {
    backgroundColor: Colors.glassStrong,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  accent: {
    backgroundColor: 'rgba(124,58,237,0.15)',
    borderColor: 'rgba(124,58,237,0.3)',
  },
  noPadding: {
    padding: 0,
  },
});
