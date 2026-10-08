import AppText from '@/components/ui/app-text';
import AppTextInput from '@/components/ui/app-text-input';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../constants/app-theme';
import { requireSupabase } from '../../utils/supabase';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const savePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Missing information', 'Fill in all three password fields.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Password too short', 'Your new password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Re-enter the same new password in both fields.');
      return;
    }
    if (newPassword === currentPassword) {
      Alert.alert('Choose a new password', 'Your new password must be different from your current password.');
      return;
    }

    setSaving(true);
    try {
      const client = requireSupabase();
      const { data: { user }, error: userError } = await client.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Your session has expired. Sign in again and retry.');

      const { error } = await client.auth.updateUser({
        current_password: currentPassword,
        password: newPassword,
      });
      if (error) throw error;

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Password changed', 'Your account password has been updated.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again.';
      const lowerMessage = message.toLowerCase();
      Alert.alert(
        lowerMessage.includes('password') && (lowerMessage.includes('current') || lowerMessage.includes('incorrect') || lowerMessage.includes('invalid'))
          ? 'Current password is incorrect'
          : 'Unable to change password',
        lowerMessage.includes('current') || lowerMessage.includes('incorrect') || lowerMessage.includes('invalid')
          ? 'Check your current password and try again.'
          : message,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Feather name="arrow-left" size={20} color={theme.color.secondary} />
            <AppText style={styles.backText}>Back to profile</AppText>
          </TouchableOpacity>

          <View style={styles.heading}>
            <View style={styles.lockIcon}><Feather name="lock" size={22} color={theme.color.secondary} /></View>
            <AppText style={styles.title}>Change password</AppText>
            <AppText style={styles.subtitle}>Verify your current password, then choose a new one.</AppText>
          </View>

          <View style={styles.formCard}>
            <AppText style={styles.label}>Current password</AppText>
            <AppTextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="next"
            />

            <AppText style={styles.label}>New password</AppText>
            <AppTextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="At least 8 characters"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="next"
            />

            <AppText style={styles.label}>Confirm new password</AppText>
            <AppTextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Type the new password again"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="done"
              onSubmitEditing={() => void savePassword()}
            />

            <AppText style={styles.helper}>Use at least 8 characters. Your current password is required for security.</AppText>

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={() => void savePassword()}
              disabled={saving}
              accessibilityRole="button"
            >
              {saving ? <ActivityIndicator color="#ffffff" /> : <AppText style={styles.saveButtonText}>Update password</AppText>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f8fc' },
  flex: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 0, paddingBottom: 36 },
  backButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 8, paddingVertical: 8 },
  backText: { color: theme.color.secondary, fontSize: 14, fontWeight: '700' },
  heading: { marginTop: 8, marginBottom: 24 },
  lockIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#e8f0ff', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { color: '#0f172a', fontSize: 26, fontWeight: '700' },
  subtitle: { color: '#64748b', fontSize: 14, lineHeight: 21, marginTop: 7 },
  formCard: { backgroundColor: '#ffffff', borderRadius: 20, borderWidth: 1, borderColor: '#e6edf7', padding: 18 },
  label: { color: '#334155', fontSize: 13, fontWeight: '700', marginBottom: 8, marginTop: 14 },
  input: { minHeight: 50, borderWidth: 1, borderColor: '#dbe3ef', borderRadius: 13, paddingHorizontal: 14, color: '#0f172a', fontSize: 15, backgroundColor: '#ffffff' },
  helper: { color: '#64748b', fontSize: 12, lineHeight: 18, marginTop: 12 },
  saveButton: { minHeight: 50, borderRadius: 14, backgroundColor: theme.color.secondary, alignItems: 'center', justifyContent: 'center', marginTop: 22 },
  saveButtonDisabled: { opacity: 0.65 },
  saveButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
});
