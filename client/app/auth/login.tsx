// 
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useAlert } from '@/template';
import { NeonButton } from '@/components/ui/NeonButton';
import { Colors, BorderRadius, FontSize, FontWeight, Spacing } from '@/constants/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const { showAlert } = useAlert();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showAlert('Missing Fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      router.replace('/(tabs)');
    } catch (err: any) {
      showAlert('Login Failed', err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#0D0821', '#080818', '#050510']}
        style={StyleSheet.absoluteFill}
      />

      {/* Purple orb */}
      <View style={styles.orb1} />
      <View style={styles.orb2} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero */}
          <View style={styles.heroSection}>
            <View style={styles.logoRing}>
              <LinearGradient
                colors={['#7C3AED', '#2563EB']}
                style={styles.logoGradient}
              >
                <MaterialIcons name="psychology" size={36} color="white" />
              </LinearGradient>
            </View>
            <Text style={styles.appName}>QuizForge</Text>
            <Text style={styles.tagline}>Level up your knowledge</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.formTitle}>Welcome Back</Text>
            <Text style={styles.formSubtitle}>Sign in to continue your journey</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="email" size={18} color={Colors.textSubtle} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="your@email.com"
                  placeholderTextColor={Colors.textSubtle}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="lock" size={18} color={Colors.textSubtle} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Your password"
                  placeholderTextColor={Colors.textSubtle}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <MaterialIcons
                    name={showPassword ? 'visibility' : 'visibility-off'}
                    size={18}
                    color={Colors.textSubtle}
                  />
                </Pressable>
              </View>
            </View>

            <NeonButton
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              fullWidth
              size="lg"
              style={{ marginTop: Spacing.sm }}
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable
              onPress={() => router.push('/auth/register')}
              style={({ pressed }) => [styles.registerBtn, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.registerText}>
                No account yet?{' '}
                <Text style={styles.registerLink}>Create one</Text>
              </Text>
            </Pressable>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            {[
              { value: '10K+', label: 'Players' },
              { value: '500+', label: 'Questions' },
              { value: '4', label: 'Levels' },
            ].map((stat) => (
              <View key={stat.label} style={styles.statItem}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    top: -100,
    right: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(124,58,237,0.15)',
  },
  orb2: {
    position: 'absolute',
    bottom: 100,
    left: -100,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(37,99,235,0.1)',
  },
  scroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xl,
  },
  heroSection: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: Spacing.lg,
  },
  logoRing: {
    padding: 4,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.4)',
  },
  logoGradient: {
    width: 64,
    height: 64,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: FontSize.xxxl,
    color: Colors.text,
    fontWeight: FontWeight.extrabold,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: FontSize.base,
    color: Colors.textSubtle,
    letterSpacing: 0.5,
  },
  form: {
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  formTitle: {
    fontSize: FontSize.xxl,
    color: Colors.text,
    fontWeight: FontWeight.bold,
  },
  formSubtitle: {
    fontSize: FontSize.base,
    color: Colors.textSubtle,
    marginTop: -Spacing.xs,
    marginBottom: Spacing.xs,
  },
  inputGroup: {
    gap: Spacing.xs,
  },
  label: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
    letterSpacing: 0.3,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.lg,
    height: 52,
    paddingHorizontal: Spacing.md,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSize.base,
  },
  eyeBtn: {
    padding: Spacing.xs,
    hitSlop: { top: 8, bottom: 8, left: 8, right: 8 },
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginVertical: Spacing.xs,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.glassBorder,
  },
  dividerText: {
    fontSize: FontSize.sm,
    color: Colors.textSubtle,
  },
  registerBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  registerText: {
    fontSize: FontSize.base,
    color: Colors.textMuted,
  },
  registerLink: {
    color: Colors.primaryLight,
    fontWeight: FontWeight.semibold,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xxl,
    paddingBottom: Spacing.md,
  },
  statItem: {
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: FontSize.xl,
    color: Colors.text,
    fontWeight: FontWeight.bold,
  },
  statLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSubtle,
  },
});
