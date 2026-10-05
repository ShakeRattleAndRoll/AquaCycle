import AppText from '@/components/ui/app-text';
import AppTextInput from '@/components/ui/app-text-input';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
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
  const [name, setName] = useState('Ken Rec');
  const [email, setEmail] = useState('KenRec@email.com');
  const [phone, setPhone] = useState('');
  const [draft, setDraft] = useState({ name, email, phone });
  const [isEditing, setIsEditing] = useState(false);
  const [logoutConfirmationOpen, setLogoutConfirmationOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const initials = useMemo(
    () => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'S',
    [name],
  );

  const openEditor = () => {
    setDraft({ name, email, phone });
    setIsEditing(true);
  };

  const saveProfile = () => {
    if (!draft.name.trim() || !draft.email.trim()) {
      Alert.alert('Missing information', 'Enter your name and email address to continue.');
      return;
    }

    setName(draft.name.trim());
    setEmail(draft.email.trim());
    setPhone(draft.phone.trim());
    setIsEditing(false);
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

        <View style={styles.sectionHeader}>
          <AppText style={styles.sectionTitle}>Personal information</AppText>
          <TouchableOpacity
            onPress={openEditor}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Edit personal information"
          >
            <AppText style={styles.editText}>Edit</AppText>
          </TouchableOpacity>
        </View>

        <View style={[styles.infoCard, theme.color.lightBox]}>
          <InfoRow icon="user" label="Full name" value={name} />
          <View style={styles.divider} />
          <InfoRow icon="mail" label="Email address" value={email} />
          <View style={styles.divider} />
          <InfoRow icon="phone" label="Phone number" value={phone || 'Not provided'} muted={!phone} />
        </View>

        <AppText style={styles.sectionTitle}>Work information</AppText>
        <View style={[styles.infoCard, theme.color.lightBox]}>
          <InfoRow icon="briefcase" label="Position" value="Store Employee" />
          <View style={styles.divider} />
          <InfoRow icon="shield" label="Account type" value="Staff" />
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
          <View style={styles.editSheet}>
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
              <AppText style={styles.saveButtonText}>Save changes</AppText>
            </TouchableOpacity>
          </View>
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
    marginLeft: 14,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
    fontFamily: 'serif',
  },
  profileRole: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 3,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#bbf7d0',
  },
  activeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: 'serif',
    marginBottom: 12,
  },
  editText: {
    color: theme.color.secondary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  infoCard: {
    borderRadius: 18,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 24,
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
    backgroundColor: '#f0f4fe',
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

