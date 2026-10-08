import AppText from '@/components/ui/app-text';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { requireSupabase } from '../../utils/supabase';

type Notification = {
  id: string;
  order_id: string;
  notification_type: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
};

const TYPE_PRESENTATION: Record<string, { icon: string; iconColor: string; bgColor: string }> = {
  order_received: { icon: 'receipt-text-outline', iconColor: '#2563eb', bgColor: '#eaf2ff' },
  order_status: { icon: 'washing-machine', iconColor: '#7e22ce', bgColor: '#f3e8ff' },
  payment_review: { icon: 'cash-clock', iconColor: '#b45309', bgColor: '#fef3c7' },
  payment_paid: { icon: 'check-all', iconColor: '#15803d', bgColor: '#dcfce7' },
};

function notificationTime(value: string) {
  const elapsed = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(elapsed / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Date(value).toLocaleDateString();
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<'staff' | 'customer'>('customer');

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const client = requireSupabase();
      const { data: { user }, error: userError } = await client.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Sign in to view your notifications.');

      const { data: profile, error: profileError } = await client.from('profiles').select('role').eq('id', user.id).single();
      if (profileError) throw profileError;
      setRole(profile.role === 'staff' ? 'staff' : 'customer');

      const { data, error } = await client
        .from('notifications')
        .select('id, order_id, notification_type, title, message, created_at, is_read')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setNotifications((data ?? []) as Notification[]);
    } catch (error) {
      Alert.alert('Unable to load notifications', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void loadNotifications();
  }, [loadNotifications]));

  const openNotification = async (item: Notification) => {
    if (!item.is_read) {
      setNotifications((current) => current.map((notification) => notification.id === item.id ? { ...notification, is_read: true } : notification));
      try {
        const { error } = await requireSupabase().from('notifications').update({ is_read: true }).eq('id', item.id);
        if (error) throw error;
      } catch (error) {
        Alert.alert('Unable to update notification', error instanceof Error ? error.message : 'Please try again.');
      }
    }
    router.push(role === 'staff' ? '/orders' : '/(customer-tabs)/orderDetails');
  };

  const handleGoBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace(role === 'staff' ? '/(staff-tabs)/staffHome' : '/(customer-tabs)');
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <AppText style={styles.title}>Notifications</AppText>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator color="#2563eb" style={styles.loader} />
      ) : notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="notifications-outline" size={36} color="#94a3b8" />
          <AppText style={styles.emptyTitle}>No notifications yet</AppText>
          <AppText style={styles.emptyMessage}>Order updates will show here when your laundry status changes.</AppText>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.container}>
          {notifications.map((item, index) => {
            const presentation = TYPE_PRESENTATION[item.notification_type] ?? TYPE_PRESENTATION.order_status;
            return (
              <View key={item.id}>
                <TouchableOpacity style={styles.notifItem} onPress={() => void openNotification(item)} activeOpacity={0.75} accessibilityRole="button">
                  <View style={[styles.iconBox, { backgroundColor: presentation.bgColor }]}>
                    <MaterialCommunityIcons name={presentation.icon as any} size={22} color={presentation.iconColor} />
                  </View>
                  <View style={styles.textContainer}>
                    <View style={styles.titleRow}>
                    <AppText style={[styles.itemTitle, !item.is_read && styles.unreadTitle]}>{item.title}</AppText>
                      {!item.is_read ? <View style={styles.unreadDot} /> : null}
                    </View>
                    <AppText style={styles.itemSubtitle}>{item.message} · {notificationTime(item.created_at)}</AppText>
                  </View>
                </TouchableOpacity>
                {index < notifications.length - 1 ? <View style={styles.divider} /> : null}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#ffffff' },
  header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  backButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  container: { paddingHorizontal: 20, paddingVertical: 12 },
  loader: { marginTop: 48 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#334155', marginTop: 12 },
  emptyMessage: { color: '#64748b', fontSize: 13, lineHeight: 19, marginTop: 5, textAlign: 'center' },
  notifItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  iconBox: { width: 44, height: 44, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  textContainer: { flex: 1, marginLeft: 14 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  itemTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: '#334155' },
  unreadTitle: { fontWeight: '800', color: '#0f172a' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2563eb' },
  itemSubtitle: { fontSize: 12, color: '#64748b', marginTop: 3, lineHeight: 18 },
  divider: { height: 1, backgroundColor: '#f1f5f9' },
});
