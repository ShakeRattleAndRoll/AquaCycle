import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ALL_NOTIFICATIONS = [
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
  {
    id: '4',
    title: 'Special Discount!',
    subtitle: 'Get 15% off your next Wash & Fold · 4 days ago',
    icon: 'tag-outline',
    iconColor: '#7e22ce',
    bgColor: '#f3e8ff',
  },
];

export default function NotificationsScreen() {
  const router = useRouter();

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(customer-tabs)'); 
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleGoBack}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {ALL_NOTIFICATIONS.map((item, index) => (
          <View key={item.id}>
            <View style={styles.notifItem}>
              <View style={[styles.iconBox, { backgroundColor: item.bgColor }]}>
                <MaterialCommunityIcons name={item.icon as any} size={22} color={item.iconColor} />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
              </View>
            </View>
            {index < ALL_NOTIFICATIONS.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  container: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
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
});