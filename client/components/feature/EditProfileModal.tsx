import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius, Spacing, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { NeonButton } from '../ui/NeonButton';
import { User } from '@/services/authService';
import { useAuth } from '@/hooks/useAuth';
import { useAlert } from '@/template';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  user: User;
}

export function EditProfileModal({ visible, onClose, user }: EditProfileModalProps) {
  const { updateUserData } = useAuth();
  const { showAlert } = useAlert();
  
  const [username, setUsername] = useState(user.username);
  const [country, setCountry] = useState(user.country || '');
  const [avatar, setAvatar] = useState(user.avatar || '😎');
  const [isLoading, setIsLoading] = useState(false);
  
  // Slide animation
  const slideAnim = React.useRef(new Animated.Value(300)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
      
      setUsername(user.username);
      setCountry(user.country || '');
      setAvatar(user.avatar || '😎');
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
      setTimeout(() => slideAnim.setValue(300), 200);
    }
  }, [visible]);

  const lastUpdate = user.lastProfileUpdate ? new Date(user.lastProfileUpdate) : null;
  const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
  const timeSinceLastUpdate = lastUpdate ? new Date().getTime() - lastUpdate.getTime() : thirtyDaysInMs + 1;
  const canUpdate = timeSinceLastUpdate >= thirtyDaysInMs;
  const remainingDays = canUpdate ? 0 : Math.ceil((thirtyDaysInMs - timeSinceLastUpdate) / (1000 * 60 * 60 * 24));

  const validateInputs = () => {
    if (username.length < 3 || username.length > 20) {
      showAlert('Invalid Username', 'Username must be between 3 and 20 characters.');
      return false;
    }
    const emojiRegex = /^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}\u{238C}-\u{2454}\u{20D0}-\u{20FF}]+$/u;
    if (!emojiRegex.test(avatar) && avatar.length > 2) {
      showAlert('Invalid Avatar', 'Avatar must be a single emoji.');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!canUpdate) {
      showAlert('Restricted', `You must wait ${remainingDays} days before updating your profile again.`);
      return;
    }
    if (!validateInputs()) return;

    setIsLoading(true);
    try {
      await updateUserData({ username, country, avatar });
      showAlert('Success', 'Profile updated successfully!');
      onClose();
    } catch (err: any) {
      showAlert('Error', err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!visible && fadeAnim.valueOf() === 0) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.container}
        >
          <Animated.View style={[styles.modalContent, { transform: [{ translateY: slideAnim }] }]}>
            <LinearGradient
              colors={[Colors.bgSecondary, Colors.bg]}
              style={styles.gradientBg}
            />
            
            <View style={styles.header}>
              <Text style={styles.title}>Edit Profile</Text>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <MaterialIcons name="close" size={24} color={Colors.textMuted} />
              </Pressable>
            </View>

            {!canUpdate && (
              <LinearGradient
                colors={['rgba(239, 68, 68, 0.2)', 'rgba(239, 68, 68, 0.05)']}
                style={styles.warningBox}
              >
                <MaterialIcons name="lock-clock" size={24} color={Colors.error} />
                <View style={styles.warningTextContainer}>
                  <Text style={styles.warningTitle}>Update Restricted</Text>
                  <Text style={styles.warningDesc}>
                    You recently updated your profile. Please wait <Text style={{ color: Colors.text, fontWeight: 'bold' }}>{remainingDays} days</Text> before applying new changes.
                  </Text>
                </View>
              </LinearGradient>
            )}

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Avatar (Emoji)</Text>
                <TextInput
                  style={[styles.input, styles.emojiInput, !canUpdate && styles.inputDisabled]}
                  value={avatar}
                  onChangeText={setAvatar}
                  maxLength={2}
                  editable={canUpdate && !isLoading}
                  placeholderTextColor={Colors.textDisabled}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Username</Text>
                <TextInput
                  style={[styles.input, !canUpdate && styles.inputDisabled]}
                  value={username}
                  onChangeText={setUsername}
                  editable={canUpdate && !isLoading}
                  placeholderTextColor={Colors.textDisabled}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Country</Text>
                <TextInput
                  style={[styles.input, !canUpdate && styles.inputDisabled]}
                  value={country}
                  onChangeText={setCountry}
                  editable={canUpdate && !isLoading}
                  placeholderTextColor={Colors.textDisabled}
                  placeholder="E.g., France, USA"
                />
              </View>

              <View style={styles.actionContainer}>
                <NeonButton
                  title={canUpdate ? "Save Changes" : "Locked"}
                  onPress={handleSave}
                  disabled={!canUpdate || isLoading}
                  loading={isLoading}
                  variant={canUpdate ? 'primary' : 'secondary'}
                  fullWidth
                />
              </View>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    width: '100%',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    backgroundColor: Colors.bgSecondary,
    borderTopWidth: 1,
    borderTopColor: Colors.glassBorder,
    borderLeftWidth: 1,
    borderLeftColor: Colors.glassBorder,
    borderRightWidth: 1,
    borderRightColor: Colors.glassBorder,
    overflow: 'hidden',
    paddingBottom: Spacing.xl,
    ...Shadow.purple,
  },
  gradientBg: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  warningBox: {
    flexDirection: 'row',
    padding: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  warningTextContainer: {
    flex: 1,
  },
  warningTitle: {
    color: Colors.error,
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    marginBottom: 4,
  },
  warningDesc: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    lineHeight: 18,
  },
  form: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  inputGroup: {
    gap: Spacing.xs,
  },
  label: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  input: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    color: Colors.text,
    fontSize: FontSize.base,
  },
  emojiInput: {
    fontSize: 24,
    textAlign: 'center',
    padding: Spacing.sm,
  },
  inputDisabled: {
    opacity: 0.5,
  },
  actionContainer: {
    marginTop: Spacing.md,
  },
});
