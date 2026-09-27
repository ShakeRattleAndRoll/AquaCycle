import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';

export default function StaffHomeScreen() {
  return (
    <SafeAreaView edges={[]} style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f0f0f0" animated />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.greetingRow}>
          <View>
            <Text style={styles.dateText}>Monday, September 28</Text>
            <Text style={styles.greetingTitle}>
              Good morning,{"\n"}KenRec.
            </Text>
          </View>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Shop open</Text>
          </View>
        </View>

        <View style={[styles.revenueCard, theme.color.primary]}>
          <View style={styles.revenueLeft}>
            <Text style={styles.revenueLabel}>TODAY'S REVENUE</Text>
            <Text style={styles.revenueAmount}>₱8,450.00</Text>
            <View style={styles.trendRow}>
              <Feather name="trending-up" size={13} color="#ffffff" />
              <Text style={styles.trendText}>12.4% from yesterday</Text>
            </View>
          </View>

          <View style={styles.chartContainer}>
            <View style={[styles.bar, { height: 20 }]} />
            <View style={[styles.bar, { height: 32 }]} />
            <View style={[styles.bar, { height: 26 }]} />
            <View style={[styles.bar, { height: 42 }]} />
            <View style={[styles.bar, { height: 38 }]} />
            <View style={[styles.bar, { height: 50 }]} />
            <View style={[styles.bar, { height: 60 }]} />
          </View>
        </View>

        <View style={styles.gridContainer}>
          <View style={[styles.gridCard, theme.color.lightBox]}>
            <View style={styles.cardIconBox}>
              <Feather name="box" size={20} color={theme.color.secondary} />
            </View>
            <View style={styles.cardTextCol}>
              <Text style={styles.cardValue}>24</Text>
              <Text style={styles.cardLabel}>Active orders</Text>
            </View>
          </View>

          <View style={[styles.gridCard, theme.color.lightBox]}>
            <View style={styles.cardIconBox}>
              <Feather name="clock" size={20} color={theme.color.secondary} />
            </View>
            <View style={styles.cardTextCol}>
              <Text style={styles.cardValue}>7</Text>
              <Text style={styles.cardLabel}>Ready for pickup</Text>
            </View>
          </View>

          <View style={[styles.gridCard, theme.color.lightBox]}>
            <View style={styles.cardIconBox}>
              <Ionicons name="receipt-outline" size={20} color={theme.color.secondary} />
            </View>
            <View style={styles.cardTextCol}>
              <Text style={styles.cardValue}>32</Text>
              <Text style={styles.cardLabel}>Orders today</Text>
            </View>
          </View>

          <View style={[styles.gridCard, theme.color.lightBox]}>
            <View style={styles.cardIconBox}>
              <Feather name="users" size={20} color={theme.color.secondary} />
            </View>
            <View style={styles.cardTextCol}>
              <Text style={styles.cardValue}>18</Text>
              <Text style={styles.cardLabel}>Customers</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Quick actions</Text>
        <View style={styles.quickActionsRow}>
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
            <View style={styles.actionIconCircle}>
              <MaterialCommunityIcons name="qrcode-scan" size={22} color={theme.color.secondary} />
            </View>
            <Text style={styles.actionLabel}>Scan claim pass</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
            <View style={styles.actionIconCircle}>
              <Feather name="plus" size={24} color={theme.color.secondary} />
            </View>
            <Text style={styles.actionLabel}>New order</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
            <View style={styles.actionIconCircle}>
              <Ionicons name="bar-chart-outline" size={22} color={theme.color.secondary} />
            </View>
            <Text style={styles.actionLabel}>Sales report</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent orders</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={[styles.seeAllText, { color: theme.color.secondary }]}>See all</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.ordersCard, theme.color.lightBox]}>
          <View style={styles.orderRow}>
            <View style={styles.orderAvatar}>
              <Text style={[styles.orderAvatarText, { color: theme.color.secondary }]}>MS</Text>
            </View>
            <View style={styles.orderMeta}>
              <Text style={styles.customerName}>Maria Santos</Text>
              <Text style={styles.orderDetails}>AC-2051 · Wash & Fold</Text>
            </View>
            <View style={styles.orderPriceCol}>
              <Text style={styles.priceText}>₱203</Text>
              <Text style={[styles.statusTag, { color: theme.color.secondary }]}>New</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.orderRow}>
            <View style={styles.orderAvatar}>
              <Text style={[styles.orderAvatarText, { color: theme.color.secondary }]}>JR</Text>
            </View>
            <View style={styles.orderMeta}>
              <Text style={styles.customerName}>John Reyes</Text>
              <Text style={styles.orderDetails}>AC-2050 · Dry Clean</Text>
            </View>
            <View style={styles.orderPriceCol}>
              <Text style={styles.priceText}>₱225</Text>
              <Text style={[styles.statusTag, { color: theme.color.secondary }]}>Washing</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    ...theme.color.lightBackground,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },

  /* Greeting */
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  dateText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 4,
  },
  greetingTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: 'serif',
    lineHeight: 32,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16a34a',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },

  /* Revenue */
  revenueCard: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
    elevation: 2,
  },
  revenueLeft: {
    flex: 1,
  },
  revenueLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 1,
    opacity: 0.85,
    marginBottom: 6,
  },
  revenueAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    fontFamily: 'serif',
    marginBottom: 8,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: '600',
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 5,
    paddingBottom: 4,
  },
  bar: {
    width: 8,
    backgroundColor: '#ffffff',
    borderRadius: 4,
    opacity: 0.85,
  },

  /* Grid */
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  gridCard: {
    width: '48%',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f0f4fe',
    ...theme.spacing.trueCenter,
  },
  cardTextCol: {
    flex: 1,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: 'serif',
  },
  cardLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 1,
  },

  /* Quick Actions */
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: 'serif',
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 14,
  },
  actionBtn: {
    alignItems: 'center',
    flex: 1,
  },
  actionIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    ...theme.spacing.trueCenter,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0f172a',
    textAlign: 'center',
  },

  /* Recent Orders */
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
  },
  ordersCard: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  orderAvatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#f0f4fe',
    ...theme.spacing.trueCenter,
  },
  orderAvatarText: {
    fontSize: 12,
    fontWeight: '700',
  },
  orderMeta: {
    flex: 1,
    marginLeft: 12,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  orderDetails: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  orderPriceCol: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  statusTag: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },
});
