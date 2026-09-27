import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { theme } from '../theme';

export default function ProfileScreen() {
  const router = useRouter();
  const menuItems = [
    { title: 'Personal information' },
    { title: 'Payment methods' },
    { title: 'Laundry preferences' },
    { title: 'Help & support' },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container} style={styles.containerStyle}>

      <View style={styles.header}>
        <Text style={styles.subtitle}>ACCOUNT</Text>
        <Text style={styles.title}>Profile</Text>
      </View>

      <View style={styles.userCard}>
        <View style={styles.avatarBox}>
          <Text style={styles.avatarText}>KR</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>Ken Rec</Text>
          <Text style={styles.userEmail}>KenRec@email.com</Text>
        </View>
      </View>

      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <View key={index}>
            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
              <Text style={styles.menuText}>{item.title}</Text>
              <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
            </TouchableOpacity>
            {index < menuItems.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.signOutButton} activeOpacity={0.8} onPress={() => router.replace('/login')}>
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  containerStyle: {
    ...theme.color.lightBackground,
  },

  header: {
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
  },

  /* User Info */
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },
  avatarBox: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#ebf3fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.color.secondary,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'serif',
  },
  userEmail: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },

  /* Menu Item */
  menuContainer: {
    marginBottom: 32,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
  },
  menuText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
  },

  /* Log out Button */
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