import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { requireSupabase } from '../../utils/supabase';
import { theme } from '../theme';

export default function StaffProfileScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('staff');
  const [userId, setUserId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ name: '', phone: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        const client = requireSupabase();
        const { data: { user }, error: userError } = await client.auth.getUser();
        if (userError) throw userError;
        if (!user) throw new Error('Please sign in again to view your profile.');

        const { data: profile, error: profileError } = await client
          .from('profiles')
          .select('full_name, phone, role')
          .eq('id', user.id)
          .single();
        if (profileError) throw profileError;

        if (active) {
          setUserId(user.id);
          setName(profile.full_name || '');
          setEmail(user.email ?? '');
          setPhone(profile.phone || '');
          setRole(profile.role || 'staff');
        }
      } catch (error) {
        if (active) {
          Alert.alert(
            'Unable to load profile',
            error instanceof Error ? error.message : 'Please try again.',
          );
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void loadProfile();
    return () => { active = false; };
  }, []);

  const initials = useMemo(
    () => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'S',
    [name],
  );

  const openEditor = () => {
    setDraft({ name, phone });
    setIsEditing(true);
  };

  const saveProfile = async () => {
    if (!draft.name.trim()) {
      Alert.alert('Name required', 'Enter your name to continue.');
      return;
    }

    if (!userId) {
      Alert.alert('Unable to save', 'Your account could not be found. Please sign in again.');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await requireSupabase()
        .from('profiles')
        .update({ full_name: draft.name.trim(), phone: draft.phone.trim() })
        .eq('id', userId);
      if (error) throw error;

      setName(draft.name.trim());
      setPhone(draft.phone.trim());
      setIsEditing(false);
    } catch (error) {
      Alert.alert('Unable to save profile', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await requireSupabase().auth.signOut();
      if (error) throw error;
      router.replace('/login');
    } catch (error) {
      Alert.alert(
        'Unable to sign out',
        error instanceof Error ? error.message : 'Please try again.',
      );
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
          <View style={styles.eyebrow}>
            <Feather name="user" size={13} color={theme.color.secondary} />
            <Text style={styles.categoryTag}>STAFF ACCOUNT</Text>
          </View>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.headerSubtitle}>Manage your account and contact details.</Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={theme.color.secondary} />
            <Text style={styles.loadingText}>Loading your profile…</Text>
          </View>
        ) : (
          <View style={styles.profileCard}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.profileMeta}>
              <Text style={styles.profileName} numberOfLines={1}>{name || 'Staff member'}</Text>
              <Text style={styles.profileRole}>AquaCycle team</Text>
            </View>
            <View style={styles.activeBadge}>
              <View style={styles.activeDot} />
              <Text style={styles.activeText}>Active</Text>
            </View>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Personal information</Text>
          <TouchableOpacity
            onPress={openEditor}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Edit personal information"
            style={styles.editButton}
            disabled={isLoading}
          >
            <Feather name="edit-2" size={14} color={theme.color.secondary} />
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <InfoRow icon="user" label="Full name" value={name} />
          <View style={styles.divider} />
          <InfoRow icon="mail" label="Email address" value={email || 'Not available'} muted={!email} />
          <View style={styles.divider} />
          <InfoRow icon="phone" label="Phone number" value={phone || 'Not provided'} muted={!phone} />
        </View>

        <Text style={styles.sectionTitle}>Work information</Text>
        <View style={styles.infoCard}>
          <InfoRow icon="briefcase" label="Position" value={role === 'staff' ? 'Store Employee' : 'Customer'} />
          <View style={styles.divider} />
          <InfoRow icon="shield" label="Account type" value={role === 'staff' ? 'Staff' : role} />
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
          <ScrollView
            style={styles.editSheet}
            contentContainerStyle={styles.editSheetContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.sheetHandle} />
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Edit profile</Text>
                <Text style={styles.modalSubtitle}>Update your contact information.</Text>
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
              disabled={isSaving}
            >
              {isSaving ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.saveButtonText}>Save changes</Text>}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function InfoRow({
  icon,
  label,
  value,
  muted = false,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Feather name={icon} size={17} color={theme.color.secondary} />
      </View>
      <View style={styles.infoMeta}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, muted && styles.mutedValue]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f8fc',
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 44,
  },
  headerBlock: {
    marginBottom: 22,
  },
  eyebrow: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#e8f0ff',
  },
  categoryTag: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.color.secondary,
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 10,
    letterSpacing: -0.7,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 6,
  },
  profileCard: {
    borderRadius: 22,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e6edf7',
    shadowColor: '#18345f',
    shadowOpacity: 0.07,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 7 },
    elevation: 2,
  },
  loadingCard: {
    minHeight: 94,
    borderRadius: 22,
    marginBottom: 28,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#64748b',
    fontSize: 13,
  },
  avatarCircle: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: '#e9f0ff',
    ...theme.spacing.trueCenter,
  },
  avatarText: {
    color: theme.color.secondary,
    fontSize: 19,
    fontWeight: '800',
  },
  profileMeta: {
    flex: 1,
    minWidth: 0,
    marginLeft: 13,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  profileRole: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 5,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ecfdf3',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  activeText: {
    color: '#15803d',
    fontSize: 11,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 10,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    borderRadius: 12,
    backgroundColor: '#e8f0ff',
  },
  editText: {
    color: theme.color.secondary,
    fontSize: 14,
    fontWeight: '700',
  },
  infoCard: {
    borderRadius: 20,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#e7edf5',
    backgroundColor: '#ffffff',
    marginBottom: 25,
    shadowColor: '#18345f',
    shadowOpacity: 0.035,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  infoRow: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#edf3ff',
    ...theme.spacing.trueCenter,
  },
  infoMeta: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '700',
    marginTop: 3,
  },
  mutedValue: {
    color: '#94a3b8',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginLeft: 50,
  },
  signOutButton: {
    flexDirection: 'row',
    gap: 9,
    backgroundColor: '#fef2f2',
    borderRadius: 15,
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
    maxHeight: '90%',
  },
  editSheetContent: {
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
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
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
