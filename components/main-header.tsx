import Entypo from '@expo/vector-icons/Entypo';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { usePathname, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../app/theme';

const NOTIFICATIONS = [
  {
    id: '1',
    title: 'Your laundry is being dried',
    subtitle: 'Order #AC-2048 · 12 minutes ago',
    icon: 'tshirt-crew-outline',
    iconColor: '#0284c7',
    bgColor: '#e0f2fe',
  },
  {
    id: '2',
    title: 'Payment received',
    subtitle: '₱270.00 paid via cash · Yesterday',
    icon: 'check',
    iconColor: '#16a34a',
    bgColor: '#dcfce7',
  },
  {
    id: '3',
    title: 'Order completed',
    subtitle: 'Order #AC-2012 · 2 days ago',
    icon: 'check-all',
    iconColor: '#0284c7',
    bgColor: '#e0f2fe',
  },
];

export default function CustomHeader() {
  const router = useRouter();
  const pathname = usePathname(); 
  const [showNotifications, setShowNotifications] = useState(false);
  const hasUnread = true;

  const isStaffRoute = pathname.includes('staffHome') || pathname.includes('QRscanning') || pathname.includes('report') || pathname.includes('staffProfile') || pathname.includes('customerOrder');

  const handleSeeAll = () => {
    setShowNotifications(false);
    router.push('/notification');
  };

  return (
    <SafeAreaView edges={['top']}>
      <View style={styles.headerContainer}>
        <View style={styles.brandGroup}>
          <View style={styles.logoCont}>
            <Entypo name="drop" size={20} color="#ffffff" />
          </View>
          <View style={{ gap: 2 }}>
            <Text style={styles.brandTitle}>AquaCycle</Text>
            <Text style={styles.userRole}>
              {isStaffRoute ? 'WORKSPACE' : 'Customer'}
            </Text>
          </View>
        </View>

        <View style={styles.profileSide}>
          <TouchableOpacity
            style={styles.bellButton}
            onPress={() => setShowNotifications(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={20} color="#0f172a" />
            {hasUnread && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={showNotifications}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNotifications(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowNotifications(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.dropdownCard}>

                <View style={styles.dropdownHeader}>
                  <View>
                    <Text style={styles.notifSubtitle}>UPDATES</Text>
                    <Text style={styles.notifTitle}>Notifications</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setShowNotifications(false)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close" size={18} color="#0f172a" />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={styles.notifList}
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                >
                  {NOTIFICATIONS.map((item, index) => (
                    <View key={item.id}>
                      <View style={styles.notifItem}>
                        <View style={[styles.notifIconBox, { backgroundColor: item.bgColor }]}>
                          <MaterialCommunityIcons
                            name={item.icon as any}
                            size={20}
                            color={item.iconColor}
                          />
                        </View>
                        <View style={styles.notifTextContainer}>
                          <Text style={styles.itemTitle}>{item.title}</Text>
                          <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                        </View>
                      </View>
                      {index < NOTIFICATIONS.length - 1 && <View style={styles.divider} />}
                    </View>
                  ))}
                </ScrollView>
                <TouchableOpacity
                  style={styles.seeAllButton}
                  onPress={handleSeeAll}
                  activeOpacity={0.7}
                >
                  <Text style={styles.seeAllText}>See all notifications</Text>
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
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoCont: {
    ...theme.color.primary,
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'serif',
  },
  userRole: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  profileSide: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  /* Bell Button  */
  bellButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.25)',
    paddingHorizontal: 16,
    paddingTop: 60,
  },
  dropdownCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    maxHeight: 380,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  notifSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 1,
  },
  notifTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* List & Items */
  notifList: {
    maxHeight: 220,
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  notifIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  itemTitle: {
    fontSize: 14,
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

  /* Button */
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 14,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.color.secondary,
  },
});