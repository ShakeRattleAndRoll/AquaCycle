import AppText from '@/components/ui/app-text';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { theme } from '../../constants/app-theme';
import { requireSupabase } from '../../utils/supabase';

export default function ConfirmEmailScreen() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [message, setMessage] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    let active = true;
    let processing = false;

    const confirmFromUrl = async (url: string | null) => {
      if (!url || processing) return;
      processing = true;

      try {
        const parsed = new URL(url);
        const fragment = new URLSearchParams(parsed.hash.replace(/^#/, ''));
        const errorDescription = parsed.searchParams.get('error_description') ?? fragment.get('error_description');
        if (errorDescription) throw new Error(errorDescription);

        const code = parsed.searchParams.get('code');
        const tokenHash = parsed.searchParams.get('token_hash') ?? parsed.searchParams.get('token');
        const type = parsed.searchParams.get('type');
        const client = requireSupabase();

        if (code) {
          const { error } = await client.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (tokenHash && type === 'email') {
          const { error } = await client.auth.verifyOtp({ token_hash: tokenHash, type: 'email' });
          if (error) throw error;
        } else {
          throw new Error('The confirmation link is incomplete or expired. Please request a new sign-up email.');
        }

        if (active) {
          setConfirmed(true);
          setMessage('Your email is confirmed. You can now sign in to AquaCycle.');
        }
      } catch (error) {
        if (active) {
          setConfirmed(false);
          setMessage(error instanceof Error ? error.message : 'Unable to confirm this email. Please try again.');
        }
      } finally {
        processing = false;
        if (active) setChecking(false);
      }
    };

    const subscription = Linking.addEventListener('url', ({ url }) => {
      setChecking(true);
      void confirmFromUrl(url);
    });
    void Linking.getInitialURL().then(confirmFromUrl).catch(() => {
      if (active) {
        setMessage('Unable to open the confirmation link. Please try again from your email.');
        setChecking(false);
      }
    });

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <AppText style={styles.title}>Confirm your email</AppText>
        {checking ? <ActivityIndicator size="large" color="#2563eb" /> : null}
        {!checking && message ? <AppText style={[styles.message, !confirmed && styles.error]}>{message}</AppText> : null}
        {!checking ? (
          <TouchableOpacity style={styles.button} onPress={() => router.replace('/(auth)/login')}>
            <AppText style={styles.buttonText}>{confirmed ? 'Continue to Login' : 'Back to Login'}</AppText>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { ...theme.spacing.centerMainContainer, ...theme.color.lightBackground, flex: 1, padding: 20 },
  card: { ...theme.color.lightBox, width: '100%', maxWidth: 380, padding: 24, borderRadius: 18, elevation: 3 },
  title: { color: '#0f172a', fontSize: 23, fontWeight: 'bold', marginBottom: 18 },
  message: { color: '#15803d', fontSize: 14, lineHeight: 21 },
  error: { color: '#b91c1c' },
  button: { ...theme.color.primary, alignItems: 'center', justifyContent: 'center', minHeight: 50, padding: 15, borderRadius: 10, marginTop: 20 },
  buttonText: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
});
