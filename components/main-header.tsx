import AppText from '@/components/ui/app-text';
import Entypo from '@expo/vector-icons/Entypo';
import Ionicons from '@expo/vector-icons/Ionicons';
import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../constants/app-theme';

export default function CustomHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const isStaffRoute = pathname.includes('staffHome') || pathname.includes('staffOrders') || pathname.includes('QRscanning') || pathname.includes('report') || pathname.includes('staffProfile') || pathname.includes('customerOrder');

  return (
    <SafeAreaView edges={['top']}>
      <View style={styles.headerContainer}>
        <View style={styles.brandGroup}>
          <View style={styles.logoCont}>
            <Entypo name="drop" size={20} color="#ffffff" />
          </View>
          <View style={{ gap: 2 }}>
            <AppText style={styles.brandTitle}>AquaCycle</AppText>
            <AppText style={styles.userRole}>{isStaffRoute ? 'WORKSPACE' : 'Customer'}</AppText>
          </View>
        </View>

        <TouchableOpacity
          style={styles.bellButton}
          onPress={() => router.push('/notification')}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Open notifications"
        >
          <Ionicons name="notifications-outline" size={20} color="#0f172a" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    height: 64,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  brandGroup: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoCont: {
    ...theme.color.primary,
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', fontFamily: 'serif' },
  userRole: { fontSize: 10, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 },
  bellButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
});
