
import AppText from '@/components/ui/app-text';
import AppTextInput from '@/components/ui/app-text-input';
import Entypo from '@expo/vector-icons/Entypo';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { theme } from '../../constants/app-theme';
import { requireSupabase } from '../../utils/supabase';

export default function ResetPassword() {
  const router = useRouter();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [checkingLink, setCheckingLink] = useState(true);
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusIsError, setStatusIsError] = useState(false);

  useEffect(() => {
    let active = true;
    let processing = false;

    const processRecoveryLink = async (url: string | null) => {
      if (!url || processing) return;

      let code: string | null = null;
      let accessToken: string | null = null;
      let refreshToken: string | null = null;

      try {
        const parsedUrl = new URL(url);
        const fragment = new URLSearchParams(
          parsedUrl.hash.replace(/^#/, '')
        );

        code = parsedUrl.searchParams.get('code');
        accessToken =
          parsedUrl.searchParams.get('access_token') ??
          fragment.get('access_token');
        refreshToken =
          parsedUrl.searchParams.get('refresh_token') ??
          fragment.get('refresh_token');

        const errorDescription =
          parsedUrl.searchParams.get('error_description') ??
          fragment.get('error_description');

        if (errorDescription) {
          throw new Error(errorDescription);
        }

        if (!code && (!accessToken || !refreshToken)) return;

        processing = true;

        const client = requireSupabase();

        if (code) {
          const { error } =
            await client.auth.exchangeCodeForSession(code);

          if (error) throw error;
        } else {
          const { error } = await client.auth.setSession({
            access_token: accessToken!,
            refresh_token: refreshToken!,
          });

          if (error) throw error;
        }

        const {
          data: { session },
          error: sessionError,
        } = await client.auth.getSession();

        if (sessionError) throw sessionError;

        if (!session) {
          throw new Error(
            'The recovery session could not be established.'
          );
        }

        if (active) {
          setRecoveryReady(true);
          setStatusMessage('');
        }
      } catch (error) {
        if (active) {
          setRecoveryReady(false);
          setStatusIsError(true);
          setStatusMessage(
            error instanceof Error
              ? error.message
              : 'Request a new password reset email and try again.'
          );
        }
      } finally {
        processing = false;

        if (active) {
          setCheckingLink(false);
        }
      }
    };

    const subscription = Linking.addEventListener('url', ({ url }) => {
      setCheckingLink(true);
      void processRecoveryLink(url);
    });

    void Linking.getInitialURL()
      .then((url) => {
        if (url) {
          void processRecoveryLink(url);
        } else {
          setCheckingLink(false);
        }
      })
      .catch(() => {
        if (active) {
          setCheckingLink(false);
          setStatusIsError(true);
          setStatusMessage(
            'Unable to read the recovery link. Please open the link from your email again.'
          );
        }
      });

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  const updatePassword = async () => {
    if (saving) return;

    setStatusMessage('');
    setStatusIsError(false);

    if (newPassword.length < 8) {
      setStatusMessage(
        'Your password must contain at least 8 characters.'
      );
      setStatusIsError(true);
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatusMessage('The passwords do not match.');
      setStatusIsError(true);
      return;
    }

    if (!recoveryReady) {
      setStatusMessage(
        'Please open a valid password recovery link first.'
      );
      setStatusIsError(true);
      return;
    }

    setSaving(true);

    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    try {
      const client = requireSupabase();

      const {
        data: { session },
        error: sessionError,
      } = await client.auth.getSession();

      if (sessionError) throw sessionError;

      if (!session) {
        throw new Error(
          'Your recovery session has expired. Request a new reset email.'
        );
      }

      const updatePromise = client.auth.updateUser({
        password: newPassword,
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(
            new Error(
              'The request timed out. Check your connection and verify your password before trying again.'
            )
          );
        }, 20000);
      });

      const { error } = await Promise.race([
        updatePromise,
        timeoutPromise,
      ]);

      if (error) throw error;

      setStatusIsError(false);
      setStatusMessage(
        'Password updated successfully. You can now sign in with your new password.'
      );

      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setStatusIsError(true);
      setStatusMessage(
        error instanceof Error
          ? error.message
          : 'Unable to update your password. Please try again.'
      );
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      setSaving(false);
    }
  };

  if (checkingLink) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <AppText style={styles.loadingText}>
          Verifying password reset link...
        </AppText>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.card}>
        <TouchableOpacity
          onPress={() => router.replace('/(auth)/login')}
          style={styles.backButton}
          disabled={saving}
        >
          <AppText style={styles.backText}>Back to Login</AppText>
        </TouchableOpacity>

        <AppText style={styles.title}>Reset Password</AppText>

        <AppText style={styles.description}>
          Enter your new password and confirm it below.
        </AppText>

        {statusMessage ? (
          <AppText
            style={[
              styles.statusMessage,
              statusIsError
                ? styles.statusError
                : styles.statusSuccess,
            ]}
          >
            {statusMessage}
          </AppText>
        ) : null}

        {!recoveryReady ? (
          <>
            {!statusMessage ? (
              <AppText style={styles.errorText}>
                Your reset link has not been verified or has expired.
                Request a new reset email to continue.
              </AppText>
            ) : null}

            <TouchableOpacity
              style={styles.button}
              onPress={() =>
                router.replace('/(auth)/forgot-password')
              }
            >
              <AppText style={styles.buttonText}>
                Request New Reset Link
              </AppText>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <AppText style={styles.label}>New Password</AppText>

            <View style={styles.passwordContainer}>
              <AppTextInput
                style={styles.passwordInput}
                placeholder="Enter new password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!saving}
              />

              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() =>
                  setShowPassword((previous) => !previous)
                }
                accessibilityLabel={
                  showPassword ? 'Hide password' : 'Show password'
                }
                disabled={saving}
              >
                <Entypo
                  name={showPassword ? 'eye-with-line' : 'eye'}
                  size={21}
                  color="#64748b"
                />
              </TouchableOpacity>
            </View>

            <AppText style={styles.hint}>
              Use at least 8 characters.
            </AppText>

            <AppText style={styles.label}>
              Confirm New Password
            </AppText>

            <View style={styles.passwordContainer}>
              <AppTextInput
                style={styles.passwordInput}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!saving}
              />

              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() =>
                  setShowConfirmPassword((previous) => !previous)
                }
                accessibilityLabel={
                  showConfirmPassword
                    ? 'Hide confirm password'
                    : 'Show confirm password'
                }
                disabled={saving}
              >
                <Entypo
                  name={
                    showConfirmPassword ? 'eye-with-line' : 'eye'
                  }
                  size={21}
                  color="#64748b"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.button, saving && styles.buttonDisabled]}
              onPress={updatePassword}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <AppText style={styles.buttonText}>
                  Update Password
                </AppText>
              )}
            </TouchableOpacity>

            {statusMessage && !statusIsError ? (
              <TouchableOpacity
                style={styles.loginButton}
                onPress={() => router.replace('/(auth)/login')}
              >
                <AppText style={styles.loginButtonText}>
                  Continue to Login
                </AppText>
              </TouchableOpacity>
            ) : null}
          </>
        )}
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
  loadingContainer: {
    ...theme.spacing.centerMainContainer,
    ...theme.color.lightBackground,
    flex: 1,
    padding: 20,
  },
  loadingText: {
    marginTop: 14,
    color: '#64748b',
    fontSize: 14,
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
  statusMessage: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 16,
  },
  statusError: {
    color: '#b91c1c',
  },
  statusSuccess: {
    color: '#15803d',
  },
  label: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 8,
  },
  passwordContainer: {
    position: 'relative',
    justifyContent: 'center',
    width: '100%',
  },
  passwordInput: {
    height: 48,
    paddingLeft: 14,
    paddingRight: 48,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#dbe3ef',
    borderRadius: 10,
    color: '#0f172a',
  },
  eyeButton: {
    position: 'absolute',
    right: 14,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hint: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 6,
    marginBottom: 12,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 20,
  },
  button: {
    ...theme.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    minHeight: 50,
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  loginButton: {
    alignItems: 'center',
    padding: 12,
    marginTop: 10,
  },
  loginButtonText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
  },
});
