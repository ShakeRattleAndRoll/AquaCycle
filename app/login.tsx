import AppText from '@/components/ui/app-text';
import AppTextInput from '@/components/ui/app-text-input';
import Entypo from '@expo/vector-icons/Entypo';
import { useRouter } from 'expo-router';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { theme } from '../constants/app-theme';
import { isSupabaseConfigured, requireSupabase } from '../utils/supabase';

export default function Login() {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [portal, setPortal] = useState<'customer' | 'staff'>('customer');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    const resumeSession = async () => {
      try {
        const client = requireSupabase();
        const { data: { session } } = await client.auth.getSession();
        if (!session) return;
        const { data: profile } = await client.from('profiles').select('role').eq('id', session.user.id).single();
        if (active && profile) router.replace(profile.role === 'staff' ? '/(staff-tabs)/staffHome' : '/(customer-tabs)');
      } catch {
        // Keep the sign-in screen available if the saved session or backend is unavailable.
      }
    };
    void resumeSession();
    return () => { active = false; };
  }, [router]);

  const signIn = async () => {
    if (!username.trim() || !password) {
      Alert.alert('Missing information', 'Enter your username and password.');
      return;
    }
    setLoading(true);
    try {
      const client = requireSupabase();
      const { data, error } = await client.functions.invoke('username-login', {
        body: { username: username.trim().toLowerCase(), password },
      });
      if (error instanceof FunctionsHttpError) {
        if (error.context.status === 404) {
          throw new Error('Username login is not deployed yet. Deploy the username-login Edge Function in Supabase.');
        }
        const response = await error.context.clone().json().catch(() => null) as { error?: string } | null;
        throw new Error(response?.error ?? 'The username or password is incorrect.');
      }
      if (error) throw new Error('Could not reach the sign-in service. Check your connection and try again.');
      const session = data?.session as { access_token?: string; refresh_token?: string } | undefined;
      if (!session?.access_token || !session.refresh_token) {
        throw new Error('Login service returned an invalid session.');
      }
      const { data: authData, error: sessionError } = await client.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
      if (sessionError) throw sessionError;
      if (!authData.user) throw new Error('Could not load your account.');

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
          `This account is registered as a ${profile.role}. Choose ${profile.role === 'staff' ? 'Staff' : 'Customer'} to sign in.`,
        );
        return;
      }

      router.replace(portal === 'staff' ? '/(staff-tabs)/staffHome' : '/(customer-tabs)');
    } catch (error) {
      Alert.alert('Unable to sign in', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      style={styles.containerStyle}
    >
      <View style={styles.loginContainer}>
        <View style={styles.titleContainer}>
          <View style={styles.logo}>
            <Entypo name="drop" size={24} color="#ffffff" />
          </View>
          <AppText style={styles.title}>AquaCycle</AppText>
        </View>

        <View style={styles.portalPicker}>
          {(['customer', 'staff'] as const).map((option) => {
            const selected = portal === option;
            return (
              <TouchableOpacity
                key={option}
                style={[styles.portalOption, selected && styles.portalOptionSelected]}
                onPress={() => setPortal(option)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <AppText style={[styles.portalText, selected && styles.portalTextSelected]}>
                  {option === 'customer' ? 'Customer' : 'Staff'}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.credentialContainer}>
          <AppText style={styles.inputLabel}>Username</AppText>
          <AppTextInput
            placeholder="your_username"
            autoCapitalize="none"
            autoComplete="username"
            autoCorrect={false}
            maxLength={24}
            style={styles.credentialInput}
            value={username}
            onChangeText={setUsername}
          />
        </View>

        <View style={styles.credentialContainer}>
          <AppText style={styles.inputLabel}>Password</AppText>
          <AppTextInput
            placeholder="******"
            style={styles.credentialInput}
            value={password}
            secureTextEntry
            autoComplete="password"
            textContentType="password"
            onChangeText={setPassword}
          />
        </View>

        <View style={styles.credentialContainer}>
          <TouchableOpacity
            onPress={signIn}
            style={styles.loginButton}
            activeOpacity={0.55}
          >
            {loading ? <ActivityIndicator color="#ffffff" /> : <AppText style={styles.buttonText}>Login</AppText>}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/signup')}
            style={styles.signupLink}
            activeOpacity={0.7}
          >
            <AppText style={styles.signupText}>Create an account</AppText>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    ...theme.spacing.centerMainContainer,
    paddingHorizontal: 18,
    paddingVertical: 24,
  },
  containerStyle: {
    ...theme.color.lightBackground,
  },
  loginContainer: {
    ...theme.color.lightBox,
    padding: 22,
    width: '100%',
    maxWidth: 380,
    borderRadius: 18,
    elevation: 3,
  },
  titleContainer: {
    ...theme.spacing.trueCenter,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  logo: {
    ...theme.spacing.trueCenter,
    ...theme.color.primary,
    width: 50,
    height: 50,
    borderRadius: 80,
  },
  title: {
    fontSize: 21,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#0f172a',
  },
  portalPicker: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#eef2f7',
    padding: 4,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 8,
  },
  portalOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 6,
  },
  portalOptionSelected: {
    backgroundColor: '#ffffff',
    elevation: 1,
  },
  portalText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  portalTextSelected: {
    color: theme.color.secondary,
  },
  credentialContainer: {
    padding: 5,
    marginBottom: 6,
    width: '100%',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 7,
  },
  credentialInput: {
    height: 48,
    paddingHorizontal: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#dbe3ef',
    borderRadius: 10,
    color: '#0f172a',
  },
  loginButton: {
    marginBottom: 5,
    ...theme.color.primary,
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
  },
  buttonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  signupLink: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  signupText: {
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '600',
  },
});

