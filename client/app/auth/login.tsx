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
        colors={['#0A0418', '#0D0821', '#060310']}
        style={StyleSheet.absoluteFill}
      />

      {/* Magical floating orbs */}
      <View style={styles.orbPurple} />
      <View style={styles.orbBlue} />
      <View style={styles.orbPink} />
      <View style={styles.orbIndigo} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + 40,
              paddingBottom: insets.bottom + 30
            }
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Professional Header */}
          <View style={styles.headerSection}>
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
            <Text style={styles.welcomeText}>Welcome Back</Text>
            <Text style={styles.subtitleText}>Continue your learning adventure</Text>
          </View>

          {/* Main Form Card */}
          <View style={styles.formCard}>
            <LinearGradient
              colors={['rgba(124,58,237,0.08)', 'rgba(37,99,235,0.04)']}
              style={styles.formGradient}
            >
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

              <View style={styles.inputWrapper}>
                <View style={styles.inputHeader}>
                  <MaterialIcons name="lock-outline" size={16} color={Colors.primaryLight} />
                  <Text style={styles.inputLabel}>Password</Text>
                </View>
                <View style={styles.inputField}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Enter your password"
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
              </View>

              <Pressable
                
                style={styles.forgotPasswordLink}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </Pressable>

              <NeonButton
                title="Sign In "
                onPress={handleLogin}
                loading={loading}
                fullWidth
                size="lg"
                style={styles.signInButton}
              />

              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>New to QuizForge?</Text>
                <View style={styles.divider} />
              </View>

              <Pressable
                onPress={() => router.push('/auth/register')}
                style={({ pressed }) => [
                  styles.createAccountButton,
                  pressed && styles.buttonPressed
                ]}
              >
                <Text style={styles.createAccountText}>Create Free Account</Text>
                <MaterialIcons name="arrow-forward" size={18} color={Colors.primaryLight} />
              </Pressable>
            </LinearGradient>
          </View>

          {/* Footer Info */}
          <View style={styles.footer}>
            <View style={styles.featurePill}>
              <MaterialIcons name="security" size={14} color={Colors.success} />
              <Text style={styles.featureText}>Secure Login</Text>
            </View>
            <View style={styles.featurePill}>
              <MaterialIcons name="bolt" size={14} color={Colors.warning} />
              <Text style={styles.featureText}>Instant Access</Text>
            </View>
            <View style={styles.featurePill}>
              <MaterialIcons name="verified" size={14} color={Colors.primaryLight} />
              <Text style={styles.featureText}>Verified Platform</Text>
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
    top: -100,
    right: -80,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: 'rgba(124,58,237,0.08)',
    transform: [{ scale: 1.2 }],
  },
  orbBlue: {
    position: 'absolute',
    bottom: -50,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(37,99,235,0.06)',
  },
  orbPink: {
    position: 'absolute',
    top: '30%',
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(236,72,153,0.04)',
  },
  orbIndigo: {
    position: 'absolute',
    bottom: '20%',
    right: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(79,70,229,0.05)',
  },

  // Header Section
  headerSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  logoWrapper: {
    width: 56,
    height: 56,
    borderRadius: 20,
    padding: 2,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  logoInner: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0A0418',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.3)',
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    textShadowColor: '#7C3AED',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  brandName: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: 1,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: FontSize.base,
    color: Colors.textSubtle,
    textAlign: 'center',
    letterSpacing: 0.3,
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
  },
  formGradient: {
    padding: Spacing.xl,
    gap: Spacing.lg,
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

  // Forgot Password
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    paddingVertical: Spacing.xs,
  },
  forgotPasswordText: {
    fontSize: FontSize.sm,
    color: Colors.primaryLight,
    fontWeight: '600',
  },

  // Sign In Button
  signInButton: {
    marginTop: Spacing.md,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
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

  // Create Account Button
  createAccountButton: {
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
  createAccountText: {
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
    marginTop: Spacing.xl,
    flexWrap: 'wrap',
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