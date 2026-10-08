import AppText from '@/components/ui/app-text';
import AppTextInput from '@/components/ui/app-text-input';
import Entypo from '@expo/vector-icons/Entypo';
import Ionicons from '@expo/vector-icons/Ionicons';
import { FunctionsHttpError, type Session } from '@supabase/supabase-js';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { requireSupabase } from '../../utils/supabase';
import { theme } from '../../constants/app-theme';

type SignupField = 'fullName' | 'username' | 'email' | 'phone' | 'address' | 'password' | 'confirmPassword' | 'inviteCode';
type UsernameCheck = 'idle' | 'checking' | 'available' | 'taken' | 'failed';

export default function SignUp() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<SignupField, string>>>({});
  const [formError, setFormError] = useState('');
  const [usernameCheck, setUsernameCheck] = useState<UsernameCheck>('idle');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [accountType, setAccountType] = useState<'customer' | 'staff'>('customer');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  const clearFieldError = (field: SignupField) => {
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setFormError('');
  };

  const checkUsername = async (value: string) => {
    const normalized = value.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,24}$/.test(normalized)) {
      setUsernameCheck('idle');
      return null;
    }
    setUsernameCheck('checking');
    try {
      const { data, error } = await requireSupabase().rpc('is_username_available', { p_username: normalized });
      if (error) throw error;
      const available = data === true;
      setUsernameCheck(available ? 'available' : 'taken');
      return available;
    } catch {
      setUsernameCheck('failed');
      return null;
    }
  };

  const createAccount = async () => {
    const normalizedUsername = username.trim().toLowerCase();
    const normalizedEmail = email.trim().toLowerCase();
    const errors: Partial<Record<SignupField, string>> = {};
    if (!fullName.trim()) errors.fullName = 'Enter your name.';
    if (!normalizedUsername) errors.username = 'Choose a username.';
    else if (!/^[a-z0-9_]{3,24}$/.test(normalizedUsername)) errors.username = 'Use 3–24 lowercase letters, numbers, or underscores.';
    if (!normalizedEmail) errors.email = 'Enter your email address.';
    else if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) errors.email = 'Enter a valid email address.';
    if (!phone.trim()) errors.phone = 'Enter your phone number.';
    if (!address.trim()) errors.address = 'Enter your address.';
    if (!password) errors.password = 'Create a password.';
    else if (password.length < 8) errors.password = 'Use at least 8 characters.';
    if (!confirmPassword) errors.confirmPassword = 'Confirm your password.';
    else if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match.';
    if (accountType === 'staff' && !inviteCode.trim()) errors.inviteCode = 'Enter the staff testing code.';
    setFieldErrors(errors);
    setFormError('');
    if (Object.keys(errors).length) return;

    setLoading(true);

    try {
      const client = requireSupabase();
      const usernameAvailable = await checkUsername(normalizedUsername);
      if (usernameAvailable === false) {
        setFieldErrors((current) => ({ ...current, username: 'This username is already taken. Try another one.' }));
        setLoading(false);
        return;
      }
      if (usernameAvailable === null) {
        setFieldErrors((current) => ({ ...current, username: 'Username availability check is unavailable. Check your connection or run supabase/signup-validation.sql in Supabase.' }));
        setLoading(false);
        return;
      }
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
          throw new Error('Staff account was created, but sign-in did not complete. Please sign in.');
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
        options: {
          data: {
            full_name: fullName.trim(),
            username: normalizedUsername,
            phone: phone.trim(),
            address: address.trim(),
          },
        },
      });

      if (error) throw error;

      if (!data.session) {
        Alert.alert('Check your email', 'Confirm your email address, then sign in.');
        router.replace('/login');
      } else {
        router.replace('/(customer-tabs)');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again.';
      const normalizedMessage = message.toLowerCase();
      if ((normalizedMessage.includes('email') && (normalizedMessage.includes('exist') || normalizedMessage.includes('registered') || normalizedMessage.includes('already') || normalizedMessage.includes('invalid'))) || normalizedMessage.includes('user already registered')) {
        setFieldErrors((current) => ({ ...current, email: normalizedMessage.includes('invalid') ? 'Enter a valid email address.' : 'This email is already registered. Try signing in instead.' }));
      } else if (normalizedMessage.includes('username') || normalizedMessage.includes('duplicate key') || normalizedMessage.includes('unique constraint')) {
        setFieldErrors((current) => ({ ...current, username: 'This username is already taken. Try another one.' }));
        setUsernameCheck('taken');
      } else if (normalizedMessage.includes('database error saving new user')) {
        const usernameAvailable = await checkUsername(normalizedUsername);
        if (usernameAvailable === false) {
          setFieldErrors((current) => ({ ...current, username: 'This username is already taken. Try another one.' }));
        } else {
          setFormError('Supabase could not save this account. Check the username and email, then try again.');
        }
      } else if (normalizedMessage.includes('password')) {
        setFieldErrors((current) => ({ ...current, password: message }));
      } else if (normalizedMessage.includes('invite') || normalizedMessage.includes('staff code')) {
        setFieldErrors((current) => ({ ...current, inviteCode: message }));
      } else {
        setFormError(message);
      }
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
            <AppText style={styles.title}>Create your account</AppText>
            <AppText style={styles.subtitle}>Book laundry service with AquaCycle</AppText>
          </View>
        </View>

        <View style={styles.form}>
          <AppText style={styles.label}>Account type</AppText>
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
                  <AppText style={[styles.accountTypeText, selected && styles.accountTypeTextSelected]}>
                    {type === 'customer' ? 'Customer' : 'Staff (testing)'}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>

          {accountType === 'staff' ? (
            <>
              <AppText style={styles.staffNote}>Staff testing accounts require the private code configured in Supabase.</AppText>
              <AppText style={styles.label}>Staff testing code</AppText>
              <AppTextInput
                placeholder="Enter invite code"
                style={[styles.input, fieldErrors.inviteCode && styles.inputError]}
                value={inviteCode}
                onChangeText={(value) => { setInviteCode(value); clearFieldError('inviteCode'); }}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
              />
              <InlineError message={fieldErrors.inviteCode} />
            </>
          ) : null}

          <AppText style={styles.label}>Name</AppText>
          <AppTextInput
            placeholder="Juan Dela Cruz"
            style={[styles.input, fieldErrors.fullName && styles.inputError]}
            value={fullName}
            onChangeText={(value) => { setFullName(value); clearFieldError('fullName'); }}
            autoComplete="name"
            autoCapitalize="words"
          />
          <InlineError message={fieldErrors.fullName} />

          <AppText style={styles.label}>Username</AppText>
          <AppTextInput
            placeholder="juan_dela_cruz"
            style={[styles.input, fieldErrors.username && styles.inputError]}
            value={username}
            onChangeText={(value) => { setUsername(value); clearFieldError('username'); setUsernameCheck('idle'); }}
            onBlur={() => { void checkUsername(username); }}
            autoComplete="username-new"
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={24}
          />
          <AppText style={styles.hint}>Unique username, 3 to 24 letters, numbers, or underscores</AppText>
          <InlineError message={fieldErrors.username} />
          {usernameCheck === 'checking' ? <AppText style={styles.hint}>Checking username…</AppText> : null}
          {usernameCheck === 'available' ? <AppText style={styles.successText}>Username is available.</AppText> : null}
          {usernameCheck === 'taken' && !fieldErrors.username ? <AppText style={styles.errorText}>This username is already taken. Try another one.</AppText> : null}

          <AppText style={styles.label}>Email</AppText>
          <AppText style={styles.hint}>We will email you a code to verify this address.</AppText>
          <AppTextInput
            placeholder="you@example.com"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            style={[styles.input, fieldErrors.email && styles.inputError]}
            value={email}
            onChangeText={(value) => { setEmail(value); clearFieldError('email'); }}
          />
          <InlineError message={fieldErrors.email} />

          <AppText style={styles.label}>Phone Number</AppText>
          <AppTextInput
            placeholder="09XXXXXXXXX"
            style={[styles.input, fieldErrors.phone && styles.inputError]}
            value={phone}
            onChangeText={(value) => { setPhone(value); clearFieldError('phone'); }}
            keyboardType="phone-pad"
            autoComplete="tel"
          />
          <InlineError message={fieldErrors.phone} />

          <AppText style={styles.label}>Address</AppText>
          <AppTextInput
            placeholder="Enter your address"
            style={[styles.input, fieldErrors.address && styles.inputError]}
            value={address}
            onChangeText={(value) => { setAddress(value); clearFieldError('address'); }}
            autoComplete="street-address"
          />
          <InlineError message={fieldErrors.address} />

          <AppText style={styles.label}>Password</AppText>
          <View style={styles.passwordContainer}>
            <AppTextInput
              placeholder="Enter your password"
              style={[styles.passwordInput, fieldErrors.password && styles.inputError]}
              value={password}
              onChangeText={(value) => { setPassword(value); clearFieldError('password'); }}
              secureTextEntry={!showPassword}
              autoComplete="new-password"
              textContentType="newPassword"
            />

            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color="#64748b"
              />
            </TouchableOpacity>
          </View>
          <InlineError message={fieldErrors.password} />

          <AppText style={styles.label}>Confirm Password</AppText>
          <View style={styles.passwordContainer}>
            <AppTextInput
              placeholder="Re-enter your password"
              style={[
                styles.passwordInput,
                fieldErrors.confirmPassword && styles.inputError,
              ]}
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                clearFieldError('confirmPassword');
              }}
              secureTextEntry={!showConfirmPassword}
              autoComplete="new-password"
              textContentType="newPassword"
            />

            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeButton}
            >
              <Ionicons
                name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color="#64748b"
              />
            </TouchableOpacity>
          </View>

          <InlineError message={fieldErrors.confirmPassword} />
          {formError ? <AppText style={styles.formError} accessibilityRole="alert">{formError}</AppText> : null}

          <TouchableOpacity
            style={styles.createButton}
            activeOpacity={0.8}
            onPress={createAccount}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <AppText style={styles.buttonText}>Create Account</AppText>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginLink}
            activeOpacity={0.7}
            onPress={() => router.replace('/login')}
          >
            <AppText style={styles.loginText}>
              Already have an account? <AppText style={{color: '#4e8ef4'}}> Login </AppText>
            </AppText>
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
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    height: 48,
    paddingHorizontal: 14,
    paddingRight: 48,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dbe3ef',
    color: '#0f172a',
    fontSize: 14,
  },
  eyeButton: {
    position: 'absolute',
    right: 14,
    top: 13,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 5,
  },
  hint: {
    marginTop: 5,
    fontSize: 11,
    color: '#64748b',
  },
  successText: {
    marginTop: 5,
    color: '#15803d',
    fontSize: 12,
  },
  formError: {
    marginTop: 12,
    color: '#b91c1c',
    fontSize: 13,
    lineHeight: 18,
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

function InlineError({ message }: { message?: string }) {
  if (!message) return null;
  return <AppText style={styles.errorText} accessibilityRole="alert">{message}</AppText>;
}
