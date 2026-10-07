import AppText from '@/components/ui/app-text';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppNotification, fetchAppNotifications, markAllAppNotificationsRead, markAppNotificationRead } from '../utils/notifications';

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingRead, setMarkingRead] = useState(false);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setNotifications(await fetchAppNotifications());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  const markAllRead = async () => {
    setMarkingRead(true);
    try {
      await markAllAppNotificationsRead();
      await loadNotifications();
    } catch (markError) {
      setError(markError instanceof Error ? markError.message : 'Could not update notifications.');
    } finally {
      setMarkingRead(false);
    }
  };

  const openNotification = async (item: AppNotification) => {
    try {
      if (!item.readAt) await markAppNotificationRead(item.id);
    } catch (markError) {
      setError(markError instanceof Error ? markError.message : 'Could not update this notification.');
      return;
    }
    if (item.isStaffNotification) {
      router.push({ pathname: '/orders', params: { orderId: item.orderId } });
    } else {
      router.push({ pathname: '/(customer-tabs)/orderDetails', params: { orderId: item.orderId } });
    }
  };

  useFocusEffect(useCallback(() => {
    void loadNotifications();
  }, [loadNotifications]));

  const handleGoBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(customer-tabs)');
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack} activeOpacity={0.7} accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <AppText style={styles.title}>Notifications</AppText>
        <TouchableOpacity onPress={() => void markAllRead()} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Mark all notifications as read" disabled={markingRead}>
          <AppText style={styles.markReadText}>{markingRead ? 'Saving...' : 'Mark all read'}</AppText>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void loadNotifications()} tintColor="#2563eb" />}
      >
        {loading && notifications.length === 0 ? (
          <ActivityIndicator style={styles.loader} color="#2563eb" />
        ) : error ? (
          <View style={styles.emptyCard}>
            <AppText style={styles.emptyTitle}>Could not load notifications</AppText>
            <AppText style={styles.emptyText}>{error}</AppText>
            <TouchableOpacity style={styles.retryButton} onPress={() => void loadNotifications()}>
              <AppText style={styles.retryText}>Try again</AppText>
            </TouchableOpacity>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}><Ionicons name="notifications-outline" size={24} color="#2563eb" /></View>
            <AppText style={styles.emptyTitle}>No updates yet</AppText>
            <AppText style={styles.emptyText}>Order and payment updates will appear here.</AppText>
          </View>
        ) : (
          notifications.map((item, index) => (
            <View key={item.id}>
              <TouchableOpacity
                style={[styles.notifItem, !item.readAt && styles.unreadItem]}
                onPress={() => void openNotification(item)}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={`${item.title}. Open order.`}
              >
                <View style={[styles.iconBox, { backgroundColor: item.bgColor }]}>
                  <MaterialCommunityIcons name={item.icon as any} size={22} color={item.iconColor} />
                </View>
                <View style={styles.textContainer}>
                  <AppText style={styles.itemTitle}>{item.title}</AppText>
                  <AppText style={styles.itemSubtitle}>{item.subtitle} · {new Date(item.createdAt).toLocaleString()}</AppText>
                </View>
              </TouchableOpacity>
              {index < notifications.length - 1 && <View style={styles.divider} />}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#ffffff' },
  header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  backButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  markReadText: { color: '#2563eb', fontSize: 12, fontWeight: '700' },
  title: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  container: { paddingHorizontal: 20, paddingVertical: 12, flexGrow: 1 },
  loader: { marginTop: 40 },
  notifItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  unreadItem: { backgroundColor: '#f8fbff' },
  iconBox: { width: 44, height: 44, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  textContainer: { flex: 1, marginLeft: 14 },
  itemTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  itemSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#f1f5f9' },
  emptyCard: { marginTop: 28, alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 20, padding: 24 },
  emptyIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#dbeafe', marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', textAlign: 'center' },
  emptyText: { fontSize: 13, lineHeight: 19, color: '#64748b', textAlign: 'center', marginTop: 6 },
  retryButton: { marginTop: 14, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, backgroundColor: '#2563eb' },
  retryText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
});
