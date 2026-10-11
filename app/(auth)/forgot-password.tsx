import AppText from '@/components/ui/app-text';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Linking from 'expo-linking';
import { theme } from '../../constants/app-theme';
import { requireSupabase } from '../../utils/supabase';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const sendResetEmail = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      Alert.alert('Missing email', 'Enter your registered email address.');
      return;
    }

    setLoading(true);

    try {
      const client = requireSupabase();
      const redirectTo = Linking.createURL('reset-password');
      console.log('Password reset redirect:', redirectTo);

      const { error } = await client.auth.resetPasswordForEmail(
        normalizedEmail,
        { redirectTo }
      );

      if (error) throw error;

      Alert.alert(
        'Check your email',
        'If your address is registered, you should receive a password reset link. Open that link to continue.'
      );
    } catch (error) {
      Alert.alert(
        'Unable to send email',
        error instanceof Error
          ? error.message
          : 'Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.card}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <AppText style={styles.backText}>‹ Back to Login</AppText>
        </TouchableOpacity>

        <AppText style={styles.title}>Forgot Password?</AppText>

        <AppText style={styles.description}>
          Enter the email address linked to your AquaCycle account. We will
          send you a link to reset your password.
        </AppText>

        <AppText style={styles.label}>Email Address</AppText>

        <TextInput
          style={styles.input}
          placeholder="Enter your registered email"
          placeholderTextColor="#94a3b8"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={sendResetEmail}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <AppText style={styles.buttonText}>Send Reset Link</AppText>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    ...theme.spacing.centerMainContainer,
    ...theme.color.lightBackground,
    flexGrow: 1,
    padding: 20,
  },
  card: {
    ...theme.color.lightBox,
    width: '100%',
    maxWidth: 380,
    padding: 24,
    borderRadius: 18,
    elevation: 3,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 24,
    paddingVertical: 6,
  },
  backText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    color: '#0f172a',
    fontSize: 23,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  description: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 24,
  },
  label: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 48,
    paddingHorizontal: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#dbe3ef',
    borderRadius: 10,
    color: '#0f172a',
    marginBottom: 20,
  },
  button: {
    ...theme.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    minHeight: 50,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
