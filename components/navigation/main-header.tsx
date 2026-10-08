import AppText from '@/components/ui/app-text';
import Entypo from '@expo/vector-icons/Entypo';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { usePathname, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../constants/app-theme';
import { requireSupabase } from '../../utils/supabase';

type HeaderNotification = {
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
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(value).toLocaleDateString();
}

export default function CustomHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<HeaderNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState('');

  const isStaffRoute = pathname.includes('staffHome') || pathname.includes('staffOrders') || pathname.includes('QRscanning') || pathname.includes('report') || pathname.includes('staffProfile') || pathname.includes('customerOrder');
  const hasUnread = unreadCount > 0;

  const loadNotifications = useCallback(async () => {
    setNotificationsLoading(true);
    setNotificationsError('');
    try {
      const client = requireSupabase();
      const { data: { user }, error: userError } = await client.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Sign in to view notifications.');

      const [recentResult, unreadResult] = await Promise.all([
        client.from('notifications')
          .select('id, order_id, notification_type, title, message, created_at, is_read')
          .eq('recipient_id', user.id)
          .order('created_at', { ascending: false })
          .limit(4),
        client.from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('recipient_id', user.id)
          .eq('is_read', false),
      ]);
      if (recentResult.error) throw recentResult.error;
      if (unreadResult.error) throw unreadResult.error;
      setNotifications((recentResult.data ?? []) as HeaderNotification[]);
      setUnreadCount(unreadResult.count ?? 0);
    } catch (error) {
      setNotificationsError(error instanceof Error ? error.message : 'Notifications could not be loaded.');
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications, pathname, showNotifications]);

  const handleSeeAll = () => {
    setShowNotifications(false);
    router.push('/notification');
  };

  const openNotification = async (item: HeaderNotification) => {
    if (!item.is_read) {
      setNotifications((current) => current.map((notification) => notification.id === item.id ? { ...notification, is_read: true } : notification));
      setUnreadCount((current) => Math.max(0, current - 1));
      try {
        const { error } = await requireSupabase().from('notifications').update({ is_read: true }).eq('id', item.id);
        if (error) throw error;
      } catch (error) {
        setNotificationsError(error instanceof Error ? error.message : 'Could not mark this notification as read.');
      }
    }
    setShowNotifications(false);
    router.push(isStaffRoute ? '/orders' : '/(customer-tabs)/orderDetails');
  };

  return (
    <SafeAreaView edges={['top']}>
      <View style={styles.headerContainer}>
        <View style={styles.brandGroup}>
          <View style={styles.logoCont}><Entypo name="drop" size={20} color="#ffffff" /></View>
          <View style={styles.brandCopy}>
            <AppText style={styles.brandTitle}>AquaCycle</AppText>
            <AppText style={styles.userRole}>{isStaffRoute ? 'WORKSPACE' : 'Customer'}</AppText>
          </View>
        </View>

        <View style={styles.profileSide}>
          <TouchableOpacity
            style={styles.bellButton}
            onPress={() => setShowNotifications(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Notifications${hasUnread ? `, ${unreadCount} unread` : ''}`}
          >
            <Ionicons name="notifications-outline" size={20} color="#0f172a" />
            {hasUnread ? <View style={styles.unreadDot} /> : null}
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={showNotifications} transparent animationType="fade" onRequestClose={() => setShowNotifications(false)}>
        <TouchableWithoutFeedback onPress={() => setShowNotifications(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.dropdownCard}>
                <View style={styles.dropdownHeader}>
                  <View>
                    <AppText style={styles.notifSubtitle}>UPDATES</AppText>
                    <AppText style={styles.notifTitle}>Notifications</AppText>
                  </View>
                  <TouchableOpacity style={styles.closeButton} onPress={() => setShowNotifications(false)} activeOpacity={0.7} accessibilityLabel="Close notifications">
                    <Ionicons name="close" size={18} color="#0f172a" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.notifList} showsVerticalScrollIndicator={false} bounces={false}>
                  {notificationsLoading ? <ActivityIndicator color={theme.color.secondary} style={styles.listState} /> : null}
                  {!notificationsLoading && notificationsError ? <AppText style={styles.listMessage}>{notificationsError}</AppText> : null}
                  {!notificationsLoading && !notificationsError && notifications.length === 0 ? <AppText style={styles.listMessage}>No notifications yet.</AppText> : null}
                  {!notificationsLoading && !notificationsError ? notifications.map((item, index) => {
                    const presentation = TYPE_PRESENTATION[item.notification_type] ?? TYPE_PRESENTATION.order_status;
                    return (
                      <View key={item.id}>
                        <TouchableOpacity style={styles.notifItem} onPress={() => void openNotification(item)} activeOpacity={0.75}>
                          <View style={[styles.notifIconBox, { backgroundColor: presentation.bgColor }]}>
                            <MaterialCommunityIcons name={presentation.icon as any} size={20} color={presentation.iconColor} />
                          </View>
                          <View style={styles.notifTextContainer}>
                            <View style={styles.itemTitleRow}>
                              <AppText style={[styles.itemTitle, !item.is_read && styles.unreadItemTitle]} numberOfLines={1}>{item.title}</AppText>
                              {!item.is_read ? <View style={styles.itemUnreadDot} /> : null}
                            </View>
                            <AppText style={styles.itemSubtitle} numberOfLines={2}>{item.message} · {notificationTime(item.created_at)}</AppText>
                          </View>
                        </TouchableOpacity>
                        {index < notifications.length - 1 ? <View style={styles.divider} /> : null}
                      </View>
                    );
                  }) : null}
                </ScrollView>

                <TouchableOpacity style={styles.seeAllButton} onPress={handleSeeAll} activeOpacity={0.7}>
                  <AppText style={styles.seeAllText}>See all notifications</AppText>
                  <Ionicons name="chevron-forward" size={14} color={theme.color.secondary} />
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerContainer: { height: 64, backgroundColor: '#ffffff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  brandGroup: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoCont: { ...theme.color.primary, width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  brandCopy: { gap: 2 },
  brandTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', fontFamily: 'serif' },
  userRole: { fontSize: 10, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 },
  profileSide: { flexDirection: 'row', alignItems: 'center' },
  bellButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  unreadDot: { position: 'absolute', top: 9, right: 10, width: 9, height: 9, borderRadius: 5, backgroundColor: '#ef4444', borderWidth: 1, borderColor: '#ffffff' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.25)', paddingHorizontal: 16, paddingTop: 60 },
  dropdownCard: { backgroundColor: '#ffffff', borderRadius: 24, padding: 20, maxHeight: 380, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  dropdownHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  notifSubtitle: { fontSize: 11, fontWeight: '800', color: '#64748b', letterSpacing: 1 },
  notifTitle: { fontSize: 22, fontWeight: '700', color: '#0f172a', marginTop: 2 },
  closeButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  notifList: { maxHeight: 220 },
  listState: { marginVertical: 24 },
  listMessage: { color: '#64748b', fontSize: 13, lineHeight: 19, textAlign: 'center', paddingVertical: 28 },
  notifItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  notifIconBox: { width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  notifTextContainer: { flex: 1, marginLeft: 12 },
  itemTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: '#334155' },
  unreadItemTitle: { fontWeight: '800', color: '#0f172a' },
  itemUnreadDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#2563eb' },
  itemSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#f1f5f9' },
  seeAllButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingTop: 14, marginTop: 6, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  seeAllText: { fontSize: 13, fontWeight: '700', color: theme.color.secondary },
});
