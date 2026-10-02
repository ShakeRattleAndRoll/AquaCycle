import Entypo from '@expo/vector-icons/Entypo';
import { FunctionsHttpError, type Session } from '@supabase/supabase-js';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { requireSupabase } from '../utils/supabase';
import { theme } from './theme';

export default function SignUp() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [accountType, setAccountType] = useState<'customer' | 'staff'>('customer');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  const createAccount = async () => {
    const normalizedUsername = username.trim().toLowerCase();
    const normalizedEmail = email.trim().toLowerCase();
    if (!fullName.trim() || !normalizedUsername || !phone.trim() || !normalizedEmail || !address.trim() || !password) {
      Alert.alert('Missing information', 'Complete every field to create your account.');
      return;
    }
    if (!/^[a-z0-9_]{3,24}$/.test(normalizedUsername)) {
      Alert.alert('Invalid username', 'Use 3 to 24 lowercase letters, numbers, or underscores.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      Alert.alert('Invalid email', 'Enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Password too short', 'Use at least 8 characters.');
      return;
    }
    if (accountType === 'staff' && !inviteCode.trim()) {
      Alert.alert('Staff code required', 'Enter the private staff testing code to continue.');
      return;
    }
    setLoading(true);
    try {
      const client = requireSupabase();
      const accountDetails = {
        email: normalizedEmail,
        password,
        full_name: fullName.trim(),
        username: normalizedUsername,
        phone: phone.trim(),
        address: address.trim(),
      };

      if (accountType === 'staff') {
        const { data, error } = await client.functions.invoke('staff-signup', {
          body: { ...accountDetails, invite_code: inviteCode.trim() },
        });
        if (error instanceof FunctionsHttpError) {
          if (error.context.status === 404) {
            throw new Error('Staff signup is not deployed yet. Deploy the staff-signup Edge Function in Supabase.');
          }
          const response = await error.context.clone().json().catch(() => null) as { error?: string } | null;
          throw new Error(response?.error ?? 'Could not create the staff testing account.');
        }
        if (error) throw new Error('Could not reach the staff signup service. Check your connection and try again.');
        const session = data?.session as Session | undefined;
        if (!session?.access_token || !session.refresh_token) {
          throw new Error('Staff signup service returned an invalid session.');
        }
        const { error: sessionError } = await client.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        });
        if (sessionError) throw sessionError;
        router.replace('/(staff-tabs)/staffHome');
        return;
      }

      const { data, error } = await client.auth.signUp({
        email: normalizedEmail,
        password,
        options: { data: { full_name: fullName.trim(), username: normalizedUsername, phone: phone.trim(), address: address.trim() } },
      });
      if (error) throw error;
      if (!data.session) {
        Alert.alert('Check your email', 'Confirm your email address, then sign in.');
        router.replace('/login');
      } else router.replace('/(customer-tabs)');
    } catch (error) {
      Alert.alert('Unable to create account', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      style={styles.containerStyle}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.signupContainer}>
        <View style={styles.titleContainer}>
          <View style={styles.logo}>
            <Entypo name="drop" size={24} color="#ffffff" />
          </View>
          <View>
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>Book laundry service with AquaCycle</Text>
          </View>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Account type</Text>
          <View style={styles.accountTypePicker}>
            {(['customer', 'staff'] as const).map((type) => {
              const selected = accountType === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.accountTypeOption, selected && styles.accountTypeOptionSelected]}
                  onPress={() => setAccountType(type)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <Text style={[styles.accountTypeText, selected && styles.accountTypeTextSelected]}>
                    {type === 'customer' ? 'Customer' : 'Staff (testing)'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {accountType === 'staff' ? (
            <>
              <Text style={styles.staffNote}>Staff testing accounts require the private code configured in Supabase.</Text>
              <Text style={styles.label}>Staff testing code</Text>
              <TextInput
                placeholder="Enter invite code"
                style={styles.input}
                value={inviteCode}
                onChangeText={setInviteCode}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
              />
            </>
          ) : null}

          <Text style={styles.label}>Name</Text>
          <TextInput
            placeholder="Juan Dela Cruz"
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            autoComplete="name"
            autoCapitalize="words"
          />

          <Text style={styles.label}>Username</Text>
          <TextInput
            placeholder="juan_dela_cruz"
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            autoComplete="username-new"
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={24}
          />
          <Text style={styles.hint}>Unique username, 3 to 24 letters, numbers, or underscores</Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            placeholder="you@example.com"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            placeholder="09XXXXXXXXX"
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoComplete="tel"
          />

          <Text style={styles.label}>Address</Text>
          <TextInput
            placeholder="Enter your address"
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            autoComplete="street-address"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            placeholder="Enter your password"
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
          />

          <TouchableOpacity
            style={styles.createButton}
            activeOpacity={0.8}
            onPress={createAccount}
          >
            {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>Create Account</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginLink}
            activeOpacity={0.7}
            onPress={() => router.replace('/login')}
          >
            <Text style={styles.loginText}>
              Already have an account? <Text style={{color: '#4e8ef4'}}> Login </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    ...theme.spacing.centerMainContainer,
    paddingVertical: 30,
    paddingHorizontal: 18,
  },
  containerStyle: {
    ...theme.color.lightBackground,
  },
  signupContainer: {
    ...theme.color.lightBox,
    padding: 22,
    width: '100%',
    maxWidth: 360,
    borderRadius: 18,
    elevation: 3,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  logo: {
    ...theme.spacing.trueCenter,
    ...theme.color.primary,
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 3,
  },
  form: {
    width: '100%',
  },
  accountTypePicker: {
    flexDirection: 'row',
    gap: 8,
    padding: 4,
    borderRadius: 10,
    backgroundColor: '#eef2f7',
  },
  accountTypeOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  accountTypeOptionSelected: {
    backgroundColor: '#ffffff',
    elevation: 1,
  },
  accountTypeText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  accountTypeTextSelected: {
    color: theme.color.secondary,
  },
  staffNote: {
    marginTop: 8,
    color: '#64748b',
    fontSize: 12,
    lineHeight: 17,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    height: 48,
    paddingHorizontal: 14,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dbe3ef',
    color: '#0f172a',
    fontSize: 14,
  },
  hint: {
    marginTop: 5,
    fontSize: 11,
    color: '#64748b',
  },
  createButton: {
    ...theme.color.primary,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 22,
  },
  buttonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 16,
  },
  loginText: {
    fontSize: 13,
    color: '#475569',
  },
});
