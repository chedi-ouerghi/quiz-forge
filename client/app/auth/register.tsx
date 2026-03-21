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

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const { showAlert } = useAlert();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleRegister = async () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      showAlert('Missing Fields', 'Please fill in all fields.');
      return;
    }
    if (username.trim().length < 3) {
      showAlert('Username Too Short', 'Username must be at least 3 characters.');
      return;
    }
    if (password.length < 6) {
      showAlert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      showAlert('Password Mismatch', 'Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await signUp(username.trim(), email.trim(), password);
      router.replace('/(tabs)');
    } catch (err: any) {
      showAlert('Registration Failed', err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#080818', '#0A0820', '#06060F']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.orb1} />
      <View style={styles.orb2} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
            >
              <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
            </Pressable>
            <View style={styles.logoRow}>
              <LinearGradient
                colors={['#7C3AED', '#2563EB']}
                style={styles.logoGradient}
              >
                <MaterialIcons name="psychology" size={26} color="white" />
              </LinearGradient>
              <Text style={styles.appName}>QuizForge</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          {/* Onboarding visual */}
          <View style={styles.heroSection}>
            <Text style={styles.heroTitle}>Begin Your Journey</Text>
            <Text style={styles.heroSubtitle}>Create your account and start mastering skills</Text>
            <View style={styles.levelPreview}>
              {['B', 'I', 'A', 'E'].map((letter, i) => (
                <View
                  key={letter}
                  style={[
                    styles.levelDot,
                    i === 0 && styles.levelDotActive,
                  ]}
                >
                  <Text style={[styles.levelLetter, i === 0 && styles.levelLetterActive]}>{letter}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.formTitle}>Create Account</Text>

            {[
              {
                label: 'Username',
                icon: 'person',
                value: username,
                setter: setUsername,
                placeholder: 'CoolPlayer99',
                keyboardType: 'default' as const,
                autoCapitalize: 'none' as const,
                secure: false,
              },
              {
                label: 'Email',
                icon: 'email',
                value: email,
                setter: setEmail,
                placeholder: 'your@email.com',
                keyboardType: 'email-address' as const,
                autoCapitalize: 'none' as const,
                secure: false,
              },
            ].map((field) => (
              <View key={field.label} style={styles.inputGroup}>
                <Text style={styles.label}>{field.label}</Text>
                <View style={styles.inputContainer}>
                  <MaterialIcons name={field.icon as any} size={18} color={Colors.textSubtle} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder={field.placeholder}
                    placeholderTextColor={Colors.textSubtle}
                    value={field.value}
                    onChangeText={field.setter}
                    keyboardType={field.keyboardType}
                    autoCapitalize={field.autoCapitalize}
                    autoCorrect={false}
                  />
                </View>
              </View>
            ))}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="lock" size={18} color={Colors.textSubtle} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Min. 6 characters"
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

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="lock-outline" size={18} color={Colors.textSubtle} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Repeat your password"
                  placeholderTextColor={Colors.textSubtle}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <NeonButton
              title="Create Account"
              onPress={handleRegister}
              loading={loading}
              fullWidth
              size="lg"
              style={{ marginTop: Spacing.sm }}
            />

            <Pressable
              onPress={() => router.push('/auth/login')}
              style={({ pressed }) => [styles.loginBtn, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.loginText}>
                Already have an account?{' '}
                <Text style={styles.loginLink}>Sign In</Text>
              </Text>
            </Pressable>
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
    top: 80,
    left: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(124,58,237,0.12)',
  },
  orb2: {
    position: 'absolute',
    bottom: 200,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(6,182,212,0.08)',
  },
  scroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.xs,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logoGradient: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: FontSize.lg,
    color: Colors.text,
    fontWeight: FontWeight.bold,
  },
  heroSection: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  heroTitle: {
    fontSize: FontSize.xxl,
    color: Colors.text,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: FontSize.base,
    color: Colors.textSubtle,
    textAlign: 'center',
    lineHeight: 22,
  },
  levelPreview: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  levelDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelDotActive: {
    backgroundColor: 'rgba(124,58,237,0.3)',
    borderColor: Colors.primary,
  },
  levelLetter: {
    fontSize: FontSize.base,
    color: Colors.textSubtle,
    fontWeight: FontWeight.bold,
  },
  levelLetterActive: {
    color: Colors.primaryLight,
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
  loginBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  loginText: {
    fontSize: FontSize.base,
    color: Colors.textMuted,
  },
  loginLink: {
    color: Colors.primaryLight,
    fontWeight: FontWeight.semibold,
  },
});
