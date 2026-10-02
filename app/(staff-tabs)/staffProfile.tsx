import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
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
import { requireSupabase } from '../../utils/supabase';
import { theme } from '../theme';

export default function StaffProfileScreen() {
  const router = useRouter();
  const [name, setName] = useState('Ken Rec');
  const [email, setEmail] = useState('KenRec@email.com');
  const [phone, setPhone] = useState('');
  const [draft, setDraft] = useState({ name, email, phone });
  const [isEditing, setIsEditing] = useState(false);

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
          <Text style={styles.categoryTag}>STAFF ACCOUNT</Text>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.headerSubtitle}>Your account and work information</Text>
        </View>

        <View style={[styles.profileCard, theme.color.primary]}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileMeta}>
            <Text style={styles.profileName}>{name}</Text>
            <Text style={styles.profileRole}>Store Employee</Text>
          </View>
          <View style={styles.activeBadge}>
            <View style={styles.activeDot} />
            <Text style={styles.activeText}>Active</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Personal information</Text>
          <TouchableOpacity
            onPress={openEditor}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Edit personal information"
          >
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.infoCard, theme.color.lightBox]}>
          <InfoRow icon="user" label="Full name" value={name} />
          <View style={styles.divider} />
          <InfoRow icon="mail" label="Email address" value={email} />
          <View style={styles.divider} />
          <InfoRow icon="phone" label="Phone number" value={phone || 'Not provided'} muted={!phone} />
        </View>

        <Text style={styles.sectionTitle}>Work information</Text>
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
            <Text style={styles.inputLabel}>Email address</Text>
            <TextInput
              value={draft.email}
              onChangeText={(value) => setDraft((current) => ({ ...current, email: value }))}
              style={styles.input}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
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
