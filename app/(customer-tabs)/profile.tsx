import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { requireSupabase } from '../../utils/supabase';

const PROFILE_ITEMS = [
  {
    title: 'Personal information',
    subtitle: 'Manage your account details',
    icon: 'person-outline' as const,
    message: '',
  },
  {
    title: 'Payment methods',
    subtitle: 'Manage your payment options',
    icon: 'card-outline' as const,
    message: 'Payment methods will be available here soon.',
  },
  {
    title: 'Laundry preferences',
    subtitle: 'Set your preferred services',
    icon: 'water-outline' as const,
    message: 'Laundry preferences will be available here soon.',
  },
  {
    title: 'Help & support',
    subtitle: 'Get assistance with AquaCycle',
    icon: 'help-circle-outline' as const,
    message: 'Please contact the AquaCycle team for help.',
  },
];

export default function ProfileScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [draft, setDraft] = useState({ name, email, phone });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      try {
        const client = requireSupabase();
        const { data: { user }, error: userError } = await client.auth.getUser();
        if (userError) throw userError;
        if (!user) throw new Error('Sign in to view your profile.');
        const { data, error } = await client.from('profiles').select('full_name, phone, address').eq('id', user.id).single();
        if (error) throw error;
        if (!active) return;
        const profileName = data.full_name || user.email || 'Customer';
        setName(profileName);
        setEmail(user.email ?? '');
        setPhone(data.phone ?? '');
        setDraft({ name: profileName, email: user.email ?? '', phone: data.phone ?? '' });
      } catch (error) {
        if (active) Alert.alert('Unable to load profile', error instanceof Error ? error.message : 'Please try again.');
      }
    };
    void loadProfile();
    return () => { active = false; };
  }, []);

  const initials = useMemo(
    () => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'C',
    [name],
  );

  const openEditor = () => {
    setDraft({ name, email, phone });
    setIsEditing(true);
  };

  const saveProfile = async () => {
    if (!draft.name.trim()) {
      Alert.alert('Missing information', 'Enter your name to continue.');
      return;
    }
    try {
      const client = requireSupabase();
      const { data: { user }, error: userError } = await client.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Sign in to update your profile.');
      const nextProfile = { full_name: draft.name.trim(), phone: draft.phone.trim() };
      const { error } = await client.from('profiles').update(nextProfile).eq('id', user.id);
      if (error) throw error;
      setName(nextProfile.full_name);
      setPhone(nextProfile.phone);
      setIsEditing(false);
    } catch (error) {
      Alert.alert('Unable to save profile', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const selectItem = (title: string, message: string) => {
    if (title === 'Personal information') {
      openEditor();
      return;
    }
    Alert.alert(title, message);
  };

  const signOut = async () => {
    try {
      const { error } = await requireSupabase().auth.signOut();
      if (error) throw error;
      router.replace('/login');
    } catch (error) {
      Alert.alert('Unable to sign out', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const confirmSignOut = () => {
    Alert.alert('Sign out?', 'You will return to the login screen.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => { void signOut(); } },
    ]);
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f0f0f0" animated />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerBlock}>
          <Text style={styles.categoryTag}>ACCOUNT</Text>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.headerSubtitle}>Manage your account and laundry settings</Text>
        </View>

        <View style={[styles.profileCard, theme.color.primary]}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileMeta}>
            <Text style={styles.profileName}>{name}</Text>
            <Text style={styles.profileEmail} numberOfLines={1}>{email}</Text>
          </View>
          <View style={styles.customerBadge}>
            <Text style={styles.badgeText}>Customer</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Account settings</Text>
          <Text style={styles.itemCount}>4 options</Text>
        </View>

        <View style={[styles.menuCard, theme.color.lightBox]}>
          {PROFILE_ITEMS.map((item, index) => (
            <React.Fragment key={item.title}>
              <TouchableOpacity
                style={styles.itemRow}
                activeOpacity={0.7}
                onPress={() => selectItem(item.title, item.message)}
                accessibilityRole="button"
                accessibilityLabel={`${item.title}. ${item.subtitle}`}
              >
                <View style={styles.iconCircle}>
                  <Ionicons name={item.icon} size={20} color={theme.color.secondary} />
                </View>
                <View style={styles.itemMeta}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                </View>
                <Feather name="chevron-right" size={18} color="#94a3b8" />
              </TouchableOpacity>
              {index < PROFILE_ITEMS.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        <View style={styles.infoNote}>
          <Feather name="info" size={16} color={theme.color.secondary} />
          <Text style={styles.infoNoteText}>Your profile is saved to your AquaCycle account.</Text>
        </View>

        <TouchableOpacity
          style={styles.signOutButton}
          activeOpacity={0.8}
          onPress={confirmSignOut}
          accessibilityRole="button"
        >
          <Feather name="log-out" size={18} color="#dc2626" />
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={isEditing}
        transparent
        animationType="slide"
        onRequestClose={() => setIsEditing(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.editSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Personal information</Text>
                <Text style={styles.modalSubtitle}>Keep your contact details up to date.</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsEditing(false)}
                accessibilityRole="button"
                accessibilityLabel="Close editor"
                style={styles.closeButton}
              >
                <Feather name="x" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Full name</Text>
            <TextInput
              value={draft.name}
              onChangeText={(value) => setDraft((current) => ({ ...current, name: value }))}
              style={styles.input}
              placeholder="Your name"
              autoCapitalize="words"
              returnKeyType="next"
            />
            <Text style={styles.inputLabel}>Email address</Text>
            <TextInput
              value={draft.email}
              style={styles.input}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={false}
              returnKeyType="next"
            />
            <Text style={styles.inputLabel}>Phone number (optional)</Text>
            <TextInput
              value={draft.phone}
              onChangeText={(value) => setDraft((current) => ({ ...current, phone: value }))}
              style={styles.input}
              placeholder="Your phone number"
              keyboardType="phone-pad"
              returnKeyType="done"
            />

            <TouchableOpacity
              style={[styles.saveButton, theme.color.primary]}
              onPress={saveProfile}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <Text style={styles.saveButtonText}>Save changes</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    ...theme.color.lightBackground,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 36,
  },
  headerBlock: {
    marginBottom: 20,
  },
  categoryTag: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: 'serif',
    marginTop: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 5,
  },
  profileCard: {
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 26,
    elevation: 2,
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    ...theme.spacing.trueCenter,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  profileMeta: {
    flex: 1,
    minWidth: 0,
    marginLeft: 14,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
    fontFamily: 'serif',
  },
  profileEmail: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 3,
  },
  customerBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: 'serif',
  },
  itemCount: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  menuCard: {
    borderRadius: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#f0f4fe',
    ...theme.spacing.trueCenter,
  },
  itemMeta: {
    flex: 1,
    marginLeft: 14,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    textTransform: 'capitalize',
  },
  itemSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 3,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: '#eaf1ff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  infoNoteText: {
    flex: 1,
    color: '#475569',
    fontSize: 12,
    lineHeight: 17,
  },
  signOutButton: {
    flexDirection: 'row',
    gap: 9,
    backgroundColor: '#fef2f2',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  signOutText: {
    color: '#dc2626',
    fontSize: 15,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15,23,42,0.4)',
  },
  editSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 30,
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 3,
    backgroundColor: '#cbd5e1',
    alignSelf: 'center',
    marginBottom: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: 'serif',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 3,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    ...theme.spacing.trueCenter,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 7,
    marginTop: 8,
  },
  input: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbe3ef',
    backgroundColor: '#ffffff',
    paddingHorizontal: 13,
    color: '#0f172a',
    fontSize: 14,
  },
  saveButton: {
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 15,
    marginTop: 22,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});
