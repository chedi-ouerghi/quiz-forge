// 
import { Pressable, Text, StyleSheet, ViewStyle, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius, Spacing, FontSize, FontWeight } from '@/constants/theme';

interface NeonButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export function NeonButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  fullWidth = false,
}: NeonButtonProps) {
  const isDisabled = disabled || loading;

  const sizeStyles = {
    sm: { height: 40, paddingHorizontal: Spacing.md, fontSize: FontSize.sm },
    md: { height: 52, paddingHorizontal: Spacing.lg, fontSize: FontSize.base },
    lg: { height: 60, paddingHorizontal: Spacing.xl, fontSize: FontSize.md },
  };

  if (variant === 'primary') {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        style={({ pressed }) => [
          styles.buttonBase,
          { height: sizeStyles[size].height },
          fullWidth && styles.fullWidth,
          isDisabled && styles.disabled,
          pressed && styles.pressed,
          style,
        ]}
      >
        <LinearGradient
          colors={isDisabled ? ['#444', '#333'] : ['#7C3AED', '#4F46E5', '#2563EB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.gradient, { borderRadius: BorderRadius.full }]}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={[styles.textBase, { fontSize: sizeStyles[size].fontSize }]}>{title}</Text>
          )}
        </LinearGradient>
      </Pressable>
    );
  }

  if (variant === 'secondary') {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        style={({ pressed }) => [
          styles.buttonBase,
          { height: sizeStyles[size].height },
          fullWidth && styles.fullWidth,
          isDisabled && styles.disabled,
          pressed && styles.pressed,
          style,
        ]}
      >
        <LinearGradient
          colors={isDisabled ? ['#444', '#333'] : ['#2563EB', '#06B6D4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.gradient, { borderRadius: BorderRadius.full }]}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={[styles.textBase, { fontSize: sizeStyles[size].fontSize }]}>{title}</Text>
          )}
        </LinearGradient>
      </Pressable>
    );
  }

  if (variant === 'outline') {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        style={({ pressed }) => [
          styles.buttonBase,
          styles.outlineButton,
          { height: sizeStyles[size].height, paddingHorizontal: sizeStyles[size].paddingHorizontal },
          fullWidth && styles.fullWidth,
          isDisabled && styles.disabled,
          pressed && styles.pressed,
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={Colors.primary} size="small" />
        ) : (
          <Text style={[styles.outlineText, { fontSize: sizeStyles[size].fontSize }]}>{title}</Text>
        )}
      </Pressable>
    );
  }

  if (variant === 'danger') {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        style={({ pressed }) => [
          styles.buttonBase,
          { height: sizeStyles[size].height },
          fullWidth && styles.fullWidth,
          isDisabled && styles.disabled,
          pressed && styles.pressed,
          style,
        ]}
      >
        <LinearGradient
          colors={['#EF4444', '#DC2626']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.gradient, { borderRadius: BorderRadius.full }]}
        >
          <Text style={[styles.textBase, { fontSize: sizeStyles[size].fontSize }]}>{title}</Text>
        </LinearGradient>
      </Pressable>
    );
  }

  // Ghost
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.ghostButton,
        { height: sizeStyles[size].height, paddingHorizontal: sizeStyles[size].paddingHorizontal },
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      <Text style={[styles.ghostText, { fontSize: sizeStyles[size].fontSize }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  buttonBase: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBase: {
    color: Colors.text,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
  },
  outlineButton: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(124,58,237,0.08)',
  },
  outlineText: {
    color: Colors.primaryLight,
    fontWeight: FontWeight.semibold,
  },
  ghostButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostText: {
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
