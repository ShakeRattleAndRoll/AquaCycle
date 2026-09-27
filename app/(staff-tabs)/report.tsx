import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { theme } from '../theme'; // Adjust path according to your structure

const RECENT_TRANSACTIONS = [
  {
    id: 'AC-2051',
    customer: 'Maria Santos',
    service: 'Wash & Dry (Full Load)',
    amount: '₱270.00',
    status: 'Completed',
    time: '10:42 AM',
  },
  {
    id: 'AC-2050',
    customer: 'John Doe',
    service: 'Dry Clean & Press',
    amount: '₱180.00',
    status: 'Processing',
    time: '09:15 AM',
  },
  {
    id: 'AC-2049',
    customer: 'Elena Rostova',
    service: 'Wash & Fold',
    amount: '₱350.00',
    status: 'Ready for Pickup',
    time: 'Yesterday',
  },
  {
    id: 'AC-2048',
    customer: 'Carlos Gutierrez',
    service: 'Heavy Blanket Wash',
    amount: '₱420.00',
    status: 'Completed',
    time: 'Yesterday',
  },
];

export default function ReportsScreen() {
  const router = useRouter();
  const [activeRange, setActiveRange] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f0f0f0" animated />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.headerBlock}>
          <View>
            <Text style={styles.categoryTag}>MANAGEMENT</Text>
            <Text style={styles.title}>Reports & Records</Text>
          </View>
        </View>

        <View style={styles.filterBar}>
          {(['Daily', 'Weekly', 'Monthly'] as const).map((range) => (
            <TouchableOpacity
              key={range}
              style={[
                styles.filterTab,
                activeRange === range && styles.activeFilterTab,
              ]}
              onPress={() => setActiveRange(range)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filterTabText,
                  activeRange === range && styles.activeFilterText,
                ]}
              >
                {range}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.heroCard, theme.color.primary]}>
          <View style={styles.heroHeader}>
            <Text style={styles.heroLabel}>Total Revenue ({activeRange})</Text>
            <View style={styles.trendBadge}>
              <Feather name="trending-up" size={12} color="#10b981" />
              <Text style={styles.trendText}>+14.2%</Text>
            </View>
          </View>
          <Text style={styles.heroAmount}>₱12,450.00</Text>
          <Text style={styles.heroSubText}>Based on 34 total transactions</Text>
        </View>

        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <View style={[styles.metricIconBox, { backgroundColor: '#e0f2fe' }]}>
              <MaterialIcons name="local-laundry-service" size={20} color="#0284c7" />
            </View>
            <Text style={styles.metricValue}>28</Text>
            <Text style={styles.metricLabel}>Orders Processed</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIconBox, { backgroundColor: '#dcfce7' }]}>
              <Ionicons name="checkmark-done-circle-outline" size={20} color="#16a34a" />
            </View>
            <Text style={styles.metricValue}>24</Text>
            <Text style={styles.metricLabel}>Orders Claimed</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.seeAllText}>Export PDF</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.transactionsCard}>
          {RECENT_TRANSACTIONS.map((item, index) => (
            <React.Fragment key={item.id}>
              <View style={styles.txRow}>
                <View style={styles.txMeta}>
                  <Text style={styles.txId}>{item.id} · {item.customer}</Text>
                  <Text style={styles.txService}>{item.service}</Text>
                  <Text style={styles.txTime}>{item.time}</Text>
                </View>
                <View style={styles.txRight}>
                  <Text style={styles.txAmount}>{item.amount}</Text>
                  <View
                    style={[
                      styles.statusPill,
                      item.status === 'Completed'
                        ? { backgroundColor: '#dcfce7' }
                        : item.status === 'Ready for Pickup'
                          ? { backgroundColor: '#fef3c7' }
                          : { backgroundColor: '#e0f2fe' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        item.status === 'Completed'
                          ? { color: '#15803d' }
                          : item.status === 'Ready for Pickup'
                            ? { color: '#b45309' }
                            : { color: '#0369a1' },
                      ]}
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>
              </View>
              {index < RECENT_TRANSACTIONS.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>
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

  /* Header */
  headerBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...theme.spacing.trueCenter,
  },
  categoryTag: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: 'serif',
  },

  /* Filter Tabs */
  filterBar: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeFilterTab: {
    backgroundColor: '#ffffff',
    elevation: 1,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  activeFilterText: {
    color: '#0f172a',
  },

  /* Hero */
  heroCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10b981',
  },
  heroAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    fontFamily: 'serif',
    marginTop: 8,
  },
  heroSubText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },

  /* Metrics */
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  metricIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    ...theme.spacing.trueCenter,
    marginBottom: 10,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  metricLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },

  /* Section */
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: 'serif',
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.color.secondary,
  },

  /* Transactions */
  transactionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  txMeta: {
    flex: 1,
    paddingRight: 10,
  },
  txId: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  txService: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  txTime: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
  },
  txRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },
});