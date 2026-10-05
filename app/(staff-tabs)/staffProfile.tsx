import AppText from '@/components/ui/app-text';
import AppTextInput from '@/components/ui/app-text-input';
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
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { requireSupabase } from '../../utils/supabase';
import { theme } from '../../constants/app-theme';

export default function StaffProfileScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('staff');
  const [userId, setUserId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ name: '', phone: '' });
  const [isEditing, setIsEditing] = useState(false);
<<<<<<< HEAD
  const [logoutConfirmationOpen, setLogoutConfirmationOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
=======
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
>>>>>>> 1c7ed926179abc8495e838066cb6ff6a4a286b28

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
    if (signingOut) return;
    setSigningOut(true);
    try {
      const { error } = await requireSupabase().auth.signOut();
      if (error) throw error;
      setLogoutConfirmationOpen(false);
      router.replace('/login');
    } catch (error) {
      Alert.alert(
        'Unable to sign out',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setSigningOut(false);
    }
  };

  const confirmSignOut = () => {
    setLogoutConfirmationOpen(true);
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
<<<<<<< HEAD
          <AppText style={styles.categoryTag}>STAFF ACCOUNT</AppText>
          <AppText style={styles.title}>Profile</AppText>
          <AppText style={styles.headerSubtitle}>Your account and work information</AppText>
        </View>

        <View style={[styles.profileCard, theme.color.primary]}>
          <View style={styles.avatarCircle}>
            <AppText style={styles.avatarText}>{initials}</AppText>
          </View>
          <View style={styles.profileMeta}>
            <AppText style={styles.profileName}>{name}</AppText>
            <AppText style={styles.profileRole}>Store Employee</AppText>
          </View>
          <View style={styles.activeBadge}>
            <View style={styles.activeDot} />
            <AppText style={styles.activeText}>Active</AppText>
          </View>
        </View>
=======
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
>>>>>>> 1c7ed926179abc8495e838066cb6ff6a4a286b28

        <View style={styles.sectionHeader}>
          <AppText style={styles.sectionTitle}>Personal information</AppText>
          <TouchableOpacity
            onPress={openEditor}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Edit personal information"
            style={styles.editButton}
            disabled={isLoading}
          >
<<<<<<< HEAD
            <AppText style={styles.editText}>Edit</AppText>
=======
            <Feather name="edit-2" size={14} color={theme.color.secondary} />
            <Text style={styles.editText}>Edit</Text>
>>>>>>> 1c7ed926179abc8495e838066cb6ff6a4a286b28
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <InfoRow icon="user" label="Full name" value={name} />
          <View style={styles.divider} />
          <InfoRow icon="mail" label="Email address" value={email || 'Not available'} muted={!email} />
          <View style={styles.divider} />
          <InfoRow icon="phone" label="Phone number" value={phone || 'Not provided'} muted={!phone} />
        </View>

<<<<<<< HEAD
        <AppText style={styles.sectionTitle}>Work information</AppText>
        <View style={[styles.infoCard, theme.color.lightBox]}>
          <InfoRow icon="briefcase" label="Position" value="Store Employee" />
=======
        <Text style={styles.sectionTitle}>Work information</Text>
        <View style={styles.infoCard}>
          <InfoRow icon="briefcase" label="Position" value={role === 'staff' ? 'Store Employee' : 'Customer'} />
>>>>>>> 1c7ed926179abc8495e838066cb6ff6a4a286b28
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
          <AppText style={styles.signOutText}>Sign out</AppText>
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
                <AppText style={styles.modalTitle}>Edit profile</AppText>
                <AppText style={styles.modalSubtitle}>Update your contact information.</AppText>
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

            <AppText style={styles.inputLabel}>Full name</AppText>
            <AppTextInput
              value={draft.name}
              onChangeText={(value) => setDraft((current) => ({ ...current, name: value }))}
              style={styles.input}
              placeholder="Your name"
              autoCapitalize="words"
              returnKeyType="next"
            />
<<<<<<< HEAD
            <AppText style={styles.inputLabel}>Email address</AppText>
            <AppTextInput
              value={draft.email}
              onChangeText={(value) => setDraft((current) => ({ ...current, email: value }))}
              style={styles.input}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
            />
            <AppText style={styles.inputLabel}>Phone number (optional)</AppText>
            <AppTextInput
=======
            <Text style={styles.inputLabel}>Phone number (optional)</Text>
            <TextInput
>>>>>>> 1c7ed926179abc8495e838066cb6ff6a4a286b28
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
<<<<<<< HEAD
              <AppText style={styles.saveButtonText}>Save changes</AppText>
=======
              {isSaving ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.saveButtonText}>Save changes</Text>}
>>>>>>> 1c7ed926179abc8495e838066cb6ff6a4a286b28
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
      <Modal visible={logoutConfirmationOpen} transparent animationType="fade" onRequestClose={() => setLogoutConfirmationOpen(false)}>
        <View style={styles.logoutBackdrop}>
          <View style={styles.logoutCard}>
            <View style={styles.logoutIcon}><Feather name="log-out" size={22} color="#dc2626" /></View>
            <AppText style={styles.logoutTitle}>Sign out?</AppText>
            <AppText style={styles.logoutMessage}>Are you sure you want to sign out? You will return to the login screen.</AppText>
            <View style={styles.logoutActions}>
              <TouchableOpacity style={styles.logoutCancelButton} onPress={() => setLogoutConfirmationOpen(false)} disabled={signingOut} accessibilityRole="button">
                <AppText style={styles.logoutCancelText}>Cancel</AppText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.logoutConfirmButton} onPress={() => { void signOut(); }} disabled={signingOut} accessibilityRole="button">
                {signingOut ? <ActivityIndicator color="#ffffff" /> : <AppText style={styles.logoutConfirmText}>Sign out</AppText>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
        <AppText style={styles.infoLabel}>{label}</AppText>
        <AppText style={[styles.infoValue, muted && styles.mutedValue]}>{value}</AppText>
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
  logoutBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 22,
    backgroundColor: 'rgba(15,23,42,0.52)',
  },
  logoutCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 22,
    padding: 22,
    backgroundColor: '#ffffff',
    elevation: 12,
  },
  logoutIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  logoutTitle: { color: '#0f172a', fontSize: 20, fontWeight: '800' },
  logoutMessage: { color: '#64748b', fontSize: 14, lineHeight: 20, marginTop: 7 },
  logoutActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 22 },
  logoutCancelButton: { minHeight: 44, paddingHorizontal: 17, justifyContent: 'center', borderRadius: 12, backgroundColor: '#f1f5f9' },
  logoutCancelText: { color: '#334155', fontSize: 13, fontWeight: '700' },
  logoutConfirmButton: { minHeight: 44, minWidth: 104, paddingHorizontal: 17, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#dc2626' },
  logoutConfirmText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
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

