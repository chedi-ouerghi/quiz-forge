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
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useAlert } from '@/template';
import { NeonButton } from '@/components/ui/NeonButton';
import { Colors, BorderRadius, FontSize, Spacing } from '@/constants/theme';

const { width } = Dimensions.get('window');

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

  const getPasswordStrength = (pwd: string) => {
    if (pwd.length === 0) return 0;
    if (pwd.length < 6) return 1;
    if (pwd.length >= 8 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) return 3;
    if (pwd.length >= 6) return 2;
    return 1;
  };

  const passwordStrength = getPasswordStrength(password);
  const strengthColors = ['#EF4444', '#F59E0B', '#10B981'];
  const strengthLabels = ['Weak', 'Fair', 'Strong'];

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#0A0418', '#0D0821', '#060310']}
        style={StyleSheet.absoluteFill}
      />

      {/* Magical floating orbs */}
      <View style={styles.orbPurple} />
      <View style={styles.orbBlue} />
      <View style={styles.orbCyan} />
      <View style={styles.orbPink} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + 16,
              paddingBottom: insets.bottom + 30
            }
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Professional Header */}
          <View style={styles.headerSection}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.buttonPressed
              ]}
            >
              <MaterialIcons name="arrow-back-ios" size={18} color={Colors.text} />
            </Pressable>

            <View style={styles.brandContainer}>
              <LinearGradient
                colors={['#7C3AED', '#2563EB', '#7C3AED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoWrapper}
              >
                <View style={styles.logoInner}>
                  <Text style={styles.logoText}>Q</Text>
                </View>
              </LinearGradient>
              <Text style={styles.brandName}>QuizForge</Text>
            </View>

            <View style={styles.placeholder} />
          </View>

          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>Begin Your Journey</Text>
            <Text style={styles.subtitleText}>Create your account and start mastering new skills</Text>

            {/* Level Preview Cards */}
            <View style={styles.levelContainer}>
              {[
                { level: 'B', name: 'Beginner', active: true },
                { level: 'I', name: 'Intermediate', active: false },
                { level: 'A', name: 'Advanced', active: false },
                { level: 'E', name: 'Expert', active: false },
              ].map((item, index) => (
                <View key={item.level} style={styles.levelCard}>
                  <LinearGradient
                    colors={item.active
                      ? ['rgba(124,58,237,0.2)', 'rgba(37,99,235,0.1)']
                      : ['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.02)']
                    }
                    style={[
                      styles.levelGradient,
                      item.active && styles.levelActive
                    ]}
                  >
                    <Text style={[
                      styles.levelLetter,
                      item.active && styles.levelLetterActive
                    ]}>
                      {item.level}
                    </Text>
                  </LinearGradient>
                  <Text style={[
                    styles.levelName,
                    item.active && styles.levelNameActive
                  ]}>
                    {item.name}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Main Form Card */}
          <View style={styles.formCard}>
            <LinearGradient
              colors={['rgba(124,58,237,0.08)', 'rgba(37,99,235,0.04)']}
              style={styles.formGradient}
            >
              <Text style={styles.formTitle}>Create Account</Text>

              {/* Username Input */}
              <View style={styles.inputWrapper}>
                <View style={styles.inputHeader}>
                  <MaterialIcons name="person-outline" size={16} color={Colors.primaryLight} />
                  <Text style={styles.inputLabel}>Username</Text>
                </View>
                <View style={styles.inputField}>
                  <TextInput
                    style={styles.input}
                    placeholder="Choose a unique username"
                    placeholderTextColor={Colors.textSubtle}
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {username.length > 0 && (
                    <View style={styles.inputIndicator}>
                      <MaterialIcons
                        name={username.length >= 3 ? "check-circle" : "error-outline"}
                        size={18}
                        color={username.length >= 3 ? Colors.success : Colors.warning}
                      />
                    </View>
                  )}
                </View>
              </View>

              {/* Email Input */}
              <View style={styles.inputWrapper}>
                <View style={styles.inputHeader}>
                  <MaterialIcons name="alternate-email" size={16} color={Colors.primaryLight} />
                  <Text style={styles.inputLabel}>Email Address</Text>
                </View>
                <View style={styles.inputField}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor={Colors.textSubtle}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputWrapper}>
                <View style={styles.inputHeader}>
                  <MaterialIcons name="lock-outline" size={16} color={Colors.primaryLight} />
                  <Text style={styles.inputLabel}>Password</Text>
                </View>
                <View style={styles.inputField}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Minimum 6 characters"
                    placeholderTextColor={Colors.textSubtle}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.visibilityToggle}
                  >
                    <MaterialIcons
                      name={showPassword ? 'visibility-off' : 'visibility'}
                      size={20}
                      color={Colors.textSubtle}
                    />
                  </Pressable>
                </View>

                {/* Password Strength Indicator */}
                {password.length > 0 && (
                  <View style={styles.strengthContainer}>
                    <View style={styles.strengthBars}>
                      {[0, 1, 2].map((index) => (
                        <View
                          key={index}
                          style={[
                            styles.strengthBar,
                            index < passwordStrength && {
                              backgroundColor: strengthColors[passwordStrength - 1]
                            }
                          ]}
                        />
                      ))}
                    </View>
                    <Text style={[
                      styles.strengthLabel,
                      { color: strengthColors[passwordStrength - 1] || Colors.textSubtle }
                    ]}>
                      {strengthLabels[passwordStrength - 1] || ''}
                    </Text>
                  </View>
                )}
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputWrapper}>
                <View style={styles.inputHeader}>
                  <MaterialIcons name="verified-outline" size={16} color={Colors.primaryLight} />
                  <Text style={styles.inputLabel}>Confirm Password</Text>
                </View>
                <View style={styles.inputField}>
                  <TextInput
                    style={styles.input}
                    placeholder="Repeat your password"
                    placeholderTextColor={Colors.textSubtle}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  {confirmPassword.length > 0 && (
                    <View style={styles.inputIndicator}>
                      <MaterialIcons
                        name={password === confirmPassword ? "check-circle" : "error-outline"}
                        size={18}
                        color={password === confirmPassword ? Colors.success : Colors.warning}
                      />
                    </View>
                  )}
                </View>
              </View>

              <NeonButton
                title="Create Free Account"
                onPress={handleRegister}
                loading={loading}
                fullWidth
                size="lg"
                style={styles.registerButton}
              />

              <View style={styles.termsContainer}>
                <MaterialIcons name="verified-user" size={14} color={Colors.textSubtle} />
                <Text style={styles.termsText}>
                  By signing up, you agree to our{' '}
                  <Text style={styles.termsLink}>Terms</Text> and{' '}
                  <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
              </View>

              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>Already have an account?</Text>
                <View style={styles.divider} />
              </View>

              <Pressable
                onPress={() => router.push('/auth/login')}
                style={({ pressed }) => [
                  styles.signInButton,
                  pressed && styles.buttonPressed
                ]}
              >
                <Text style={styles.signInText}>Sign In to Your Account</Text>
                <MaterialIcons name="arrow-forward" size={18} color={Colors.primaryLight} />
              </Pressable>
            </LinearGradient>
          </View>

          {/* Footer Info */}
          <View style={styles.footer}>
            <View style={styles.featurePill}>
              <MaterialIcons name="school" size={14} color={Colors.primaryLight} />
              <Text style={styles.featureText}>Learn at your pace</Text>
            </View>
            <View style={styles.featurePill}>
              <MaterialIcons name="emoji-events" size={14} color={Colors.warning} />
              <Text style={styles.featureText}>Earn achievements</Text>
            </View>
            <View style={styles.featurePill}>
              <MaterialIcons name="groups" size={14} color={Colors.success} />
              <Text style={styles.featureText}>Join community</Text>
            </View>
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
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
  },

  // Magical Orbs
  orbPurple: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(124,58,237,0.08)',
    transform: [{ scale: 1.1 }],
  },
  orbBlue: {
    position: 'absolute',
    bottom: 100,
    left: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(37,99,235,0.06)',
  },
  orbCyan: {
    position: 'absolute',
    top: '40%',
    left: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(6,182,212,0.04)',
  },
  orbPink: {
    position: 'absolute',
    bottom: '30%',
    right: -30,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(236,72,153,0.03)',
  },

  // Header Section
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logoWrapper: {
    width: 40,
    height: 40,
    borderRadius: 14,
    padding: 2,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  logoInner: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0A0418',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.3)',
  },
  logoText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textShadowColor: '#7C3AED',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  brandName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 0.5,
  },
  placeholder: {
    width: 44,
  },

  // Welcome Section
  welcomeSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  welcomeText: {
    fontSize: 34,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: Spacing.xs,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitleText: {
    fontSize: FontSize.base,
    color: Colors.textSubtle,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },

  // Level Cards
  levelContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'center',
  },
  levelCard: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  levelGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  levelActive: {
    borderColor: 'rgba(124,58,237,0.5)',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  levelLetter: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textSubtle,
  },
  levelLetterActive: {
    color: Colors.primaryLight,
    textShadowColor: '#7C3AED',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  levelName: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  levelNameActive: {
    color: Colors.primaryLight,
  },

  // Form Card
  formCard: {
    // borderRadius: BorderRadius.xxxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.15)',
    backgroundColor: 'rgba(255,255,255,0.02)',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 15,
    marginBottom: Spacing.xl,
  },
  formGradient: {
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  formTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },

  // Input Fields
  inputWrapper: {
    gap: Spacing.xs,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  inputLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10,4,24,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.2)',
    borderRadius: BorderRadius.xl,
    height: 56,
    paddingHorizontal: Spacing.lg,
  },
  input: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSize.base,
    fontWeight: '500',
  },
  passwordInput: {
    paddingRight: Spacing.xl,
  },
  visibilityToggle: {
    position: 'absolute',
    right: Spacing.lg,
    padding: Spacing.xs,
  },
  inputIndicator: {
    position: 'absolute',
    right: Spacing.lg,
  },

  // Password Strength
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  strengthBars: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  strengthBar: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    minWidth: 40,
  },

  // Register Button
  registerButton: {
    marginTop: Spacing.md,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },

  // Terms
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: -Spacing.xs,
  },
  termsText: {
    fontSize: FontSize.xs,
    color: Colors.textSubtle,
    textAlign: 'center',
  },
  termsLink: {
    color: Colors.primaryLight,
    fontWeight: '600',
  },

  // Divider
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginVertical: Spacing.md,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(124,58,237,0.2)',
  },
  dividerText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: '500',
  },

  // Sign In Button
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.3)',
    backgroundColor: 'rgba(124,58,237,0.05)',
  },
  signInText: {
    fontSize: FontSize.base,
    color: Colors.primaryLight,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.7,
    backgroundColor: 'rgba(124,58,237,0.1)',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
    flexWrap: 'wrap',
    marginTop: Spacing.sm,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  featureText: {
    fontSize: FontSize.xs,
    color: Colors.textSubtle,
    fontWeight: '500',
  },
});