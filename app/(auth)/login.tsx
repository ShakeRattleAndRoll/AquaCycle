import AppText from '@/components/ui/app-text';
import AppTextInput from '@/components/ui/app-text-input';
import Entypo from '@expo/vector-icons/Entypo';
import { useRouter } from 'expo-router';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { isSupabaseConfigured, requireSupabase } from '../../utils/supabase';

export default function Login() {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [portal, setPortal] = useState<'customer' | 'staff'>('customer');
  const [loading, setLoading] = useState(false);

  const routeAccount = useCallback(
    async (userId: string) => {
      const client = requireSupabase();

      const { data: profile, error: profileError } = await client
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      router.replace(
        profile.role === 'staff'
          ? '/(staff-tabs)/staffHome'
          : '/(customer-tabs)'
      );
    },
    [router]
  );

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    let active = true;

    const resumeSession = async () => {
      try {
        const client = requireSupabase();

        const {
          data: { session },
        } = await client.auth.getSession();

        if (session && active) {
          await routeAccount(session.user.id);
        }
      } catch {
        // Keep the login screen available if the session or backend is unavailable.
      }
    };

    void resumeSession();

    return () => {
      active = false;
    };
  }, [routeAccount]);

  const signIn = async () => {
    if (!username.trim() || !password) {
      Alert.alert(
        'Missing information',
        'Enter your username and password.'
      );
      return;
    }

    setLoading(true);

    try {
      const client = requireSupabase();

      const { data, error } = await client.functions.invoke(
        'username-login',
        {
          body: {
            username: username.trim().toLowerCase(),
            password,
          },
        }
      );

      if (error instanceof FunctionsHttpError) {
        if (error.context.status === 404) {
          throw new Error(
            'Username login is not deployed yet. Deploy the username-login Edge Function in Supabase.'
          );
        }

        const response = (await error.context
          .clone()
          .json()
          .catch(() => null)) as { error?: string } | null;

        throw new Error(
          response?.error ?? 'The username or password is incorrect.'
        );
      }

      if (error) {
        throw new Error(
          'Could not reach the sign-in service. Check your connection and try again.'
        );
      }

      const session = data?.session as
        | {
            access_token?: string;
            refresh_token?: string;
          }
        | undefined;

      if (!session?.access_token || !session.refresh_token) {
        throw new Error('Login service returned an invalid session.');
      }

      const { data: authData, error: sessionError } =
        await client.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        });

      if (sessionError) throw sessionError;

      if (!authData.user) {
        throw new Error('Could not load your account.');
      }

      const { data: profile, error: profileError } = await client
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single();

      if (profileError) throw profileError;

      if (profile.role !== portal) {
        await client.auth.signOut();

        Alert.alert(
          'Wrong portal',
          `This account is registered as a ${profile.role}. Choose ${
            profile.role === 'staff' ? 'Staff' : 'Customer'
          } to sign in.`
        );

        return;
      }

      await routeAccount(authData.user.id);
    } catch (error) {
      Alert.alert(
        'Unable to sign in',
        error instanceof Error ? error.message : 'Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <View style={styles.logo}>
          <Entypo name="drop" size={34} color="#ffffff" />
        </View>

        <AppText style={styles.brand}>AquaCycle</AppText>
        <AppText style={styles.tagline}>
          Fresh clothes. Easier laundry.
        </AppText>
      </View>

      <View style={styles.loginCard}>
        <AppText style={styles.heading}>Welcome Back</AppText>
        <AppText style={styles.subtitle}>
          Sign in to continue to your account.
        </AppText>

        <AppText style={styles.portalLabel}>SIGN IN AS</AppText>

        <View style={styles.portalPicker}>
          {(['customer', 'staff'] as const).map((option) => {
            const selected = portal === option;

            return (
              <TouchableOpacity
                key={option}
                style={[
                  styles.portalOption,
                  selected && styles.portalOptionSelected,
                ]}
                onPress={() => setPortal(option)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <Entypo
                  name={option === 'customer' ? 'user' : 'briefcase'}
                  size={17}
                  color={selected ? '#ffffff' : '#64748b'}
                />
                <AppText
                  style={[
                    styles.portalText,
                    selected && styles.portalTextSelected,
                  ]}
                >
                  {option === 'customer' ? 'Customer' : 'Staff'}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.field}>
          <AppText style={styles.inputLabel}>Username</AppText>

          <View style={styles.inputWrapper}>
            <Entypo
              name="user"
              size={19}
              color="#64748b"
              style={styles.inputIcon}
            />

            <AppTextInput
              placeholder="Enter your username"
              autoCapitalize="none"
              autoComplete="username"
              autoCorrect={false}
              maxLength={24}
              style={styles.textInput}
              value={username}
              onChangeText={setUsername}
            />
          </View>
        </View>

        <View style={styles.field}>
          <AppText style={styles.inputLabel}>Password</AppText>

          <View style={styles.inputWrapper}>
            <Entypo
              name="lock"
              size={19}
              color="#64748b"
              style={styles.inputIcon}
            />

            <AppTextInput
              placeholder="Enter your password"
              style={styles.passwordInput}
              value={password}
              secureTextEntry={!showPassword}
              autoComplete="password"
              textContentType="password"
              onChangeText={setPassword}
            />

            <TouchableOpacity
              onPress={() => setShowPassword((previous) => !previous)}
              style={styles.passwordToggle}
              accessibilityRole="button"
              accessibilityLabel={
                showPassword ? 'Hide password' : 'Show password'
              }
              hitSlop={8}
            >
              <Entypo
                name={showPassword ? 'eye-with-line' : 'eye'}
                size={20}
                color="#64748b"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/(auth)/forgot-password')}
            style={styles.forgotPasswordLink}
            activeOpacity={0.7}
          >
            <AppText style={styles.forgotPasswordText}>
              Forgot Password?
            </AppText>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={signIn}
          style={[styles.loginButton, loading && styles.loginButtonDisabled]}
          activeOpacity={0.8}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <AppText style={styles.buttonText}>Sign In</AppText>
              <Entypo name="arrow-right" size={20} color="#ffffff" />
            </>
          )}
        </TouchableOpacity>

        <View style={styles.signupRow}>
          <AppText style={styles.signupPrompt}>
            Don&apos;t have an account?
          </AppText>

          <TouchableOpacity
            onPress={() => router.push('/signup')}
            activeOpacity={0.7}
          >
            <AppText style={styles.signupText}>Create account</AppText>
          </TouchableOpacity>
        </View>
      </View>

      <AppText style={styles.footer}>
        AQUACYCLE LAUNDRY MANAGEMENT SYSTEM
      </AppText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#eff6ff',
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logo: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: '#1677d2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    elevation: 5,
    shadowColor: '#1677d2',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  brand: {
    fontSize: 29,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#12365a',
    textTransform: 'uppercase',
  },
  tagline: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 6,
  },
  loginCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#dbeafe',
    elevation: 4,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  heading: {
    fontSize: 25,
    fontWeight: '800',
    color: '#12365a',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 7,
    marginBottom: 24,
  },
  portalLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 1,
    marginBottom: 9,
  },
  portalPicker: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    padding: 5,
    borderRadius: 12,
    marginBottom: 22,
    gap: 6,
  },
  portalOption: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 9,
    paddingHorizontal: 8,
  },
  portalOptionSelected: {
    backgroundColor: '#1677d2',
    elevation: 2,
  },
  portalText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  portalTextSelected: {
    color: '#ffffff',
  },
  field: {
    marginBottom: 17,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  inputWrapper: {
    position: 'relative',
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#dbe3ef',
    borderRadius: 12,
  },
  inputIcon: {
    marginLeft: 14,
  },
  textInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 12,
    color: '#0f172a',
  },
  passwordInput: {
    flex: 1,
    height: 50,
    paddingLeft: 12,
    paddingRight: 8,
    color: '#0f172a',
  },
  passwordToggle: {
    height: 48,
    width: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    paddingTop: 11,
    paddingBottom: 3,
  },
  forgotPasswordText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1677d2',
  },
  loginButton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#1677d2',
    borderRadius: 12,
    marginTop: 5,
    elevation: 2,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  signupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 22,
  },
  signupPrompt: {
    fontSize: 12,
    color: '#64748b',
  },
  signupText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1677d2',
  },
  footer: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.1,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 25,
  },
});
