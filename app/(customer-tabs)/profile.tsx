import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { theme } from '../theme';

const PROFILE_ITEMS = [
  {
    title: 'Personal Information',
    subtitle: 'Manage your account details',
    icon: 'person-outline' as const,
  },
  {
    title: 'Payment Methods',
    subtitle: 'Manage your payment options',
    icon: 'card-outline' as const,
  },
  {
    title: 'Laundry Preferences',
    subtitle: 'Set your preferred services',
    icon: 'water-outline' as const,
  },
  {
    title: 'Help & Support',
    subtitle: 'Get assistance with AquaCycle',
    icon: 'help-circle-outline' as const,
  },
];

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#f0f0f0"
        animated
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.headerBlock}>
          <Text style={styles.categoryTag}>ACCOUNT</Text>
          <Text style={styles.title}>Profile</Text>
        </View>

        <View style={[styles.profileCard, theme.color.primary]}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>KR</Text>
          </View>

          <View style={styles.profileMeta}>
            <Text style={styles.profileName}>Ken Rec</Text>
            <Text style={styles.profileEmail}>KenRec@email.com</Text>
          </View>

          <View style={styles.customerBadge}>
            <Text style={styles.badgeText}>Customer</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Account Settings</Text>

        <View style={[styles.menuCard, theme.color.lightBox]}>
          {PROFILE_ITEMS.map((item, index) => (
            <React.Fragment key={item.title}>
              <TouchableOpacity
                style={styles.itemRow}
                activeOpacity={0.7}
              >
                <View style={styles.iconCircle}>
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={theme.color.secondary}
                  />
                </View>

                <View style={styles.itemMeta}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemSubtitle}>
                    {item.subtitle}
                  </Text>
                </View>

                <Feather
                  name="chevron-right"
                  size={18}
                  color="#94a3b8"
                />
              </TouchableOpacity>

              {index < PROFILE_ITEMS.length - 1 && (
                <View style={styles.divider} />
              )}
            </React.Fragment>
          ))}
        </View>

        <TouchableOpacity
          style={styles.signOutButton}
          activeOpacity={0.8}
          onPress={() => router.replace('/login')}
        >
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
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
    paddingBottom: 40,
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

  profileCard: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
    elevation: 2,
  },

  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    ...theme.spacing.trueCenter,
  },

  avatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
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

  profileEmail: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },

  customerBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },

  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: 'serif',
    marginBottom: 14,
  },

  menuCard: {
    borderRadius: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 24,
  },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
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
  },

  itemSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },

  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },

  signOutButton: {
    backgroundColor: '#fef2f2',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
  },

  signOutText: {
    color: '#dc2626',
    fontSize: 15,
    fontWeight: '700',
  },
});
