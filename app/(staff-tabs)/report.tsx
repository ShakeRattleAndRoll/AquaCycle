import AppText from '@/components/ui/app-text';
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { theme } from '../../constants/app-theme';
import { requireSupabase } from '../../utils/supabase';

type Range = 'Daily' | 'Weekly' | 'Monthly';
type Order = {
  id: string;
  customer_name: string;
  service_name: string;
  estimated_total: number;
  final_total: number | null;
  delivery_fee: number;
  status: string;
  created_at: string;
  completed_at: string | null;
};
type ReportTransaction = { order: Order; occurredAt: string };
const ORDER_COLUMNS = 'id,customer_name,service_name,estimated_total,final_total,delivery_fee,status,created_at,completed_at';
const RANGES: Range[] = ['Daily', 'Weekly', 'Monthly'];

function getRangeBounds(range: Range) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (range === 'Weekly') start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  if (range === 'Monthly') start.setDate(1);
  const end = new Date(start);
  if (range === 'Daily') end.setDate(end.getDate() + 1);
  if (range === 'Weekly') end.setDate(end.getDate() + 7);
  if (range === 'Monthly') end.setMonth(end.getMonth() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

function orderAmount(order: Order) {
  return Number(order.final_total ?? (Number(order.estimated_total) + Number(order.delivery_fee ?? 0)));
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    received: 'New', washing: 'Washing', drying: 'Drying', ready: 'Ready',
    completed: 'Completed', cancelled: 'Cancelled',
  };
  return labels[status] ?? status;
}

function statusColors(status: string) {
  if (status === 'completed') return { backgroundColor: '#dcfce7', color: '#15803d' };
  if (status === 'ready') return { backgroundColor: '#fef3c7', color: '#b45309' };
  if (status === 'cancelled') return { backgroundColor: '#fee2e2', color: '#b91c1c' };
  return { backgroundColor: '#e0f2fe', color: '#0369a1' };
}

export default function ReportsScreen() {
  const [activeRange, setActiveRange] = useState<Range>('Daily');
  const [transactions, setTransactions] = useState<ReportTransaction[]>([]);
  const [ordersProcessed, setOrdersProcessed] = useState(0);
  const [ordersClaimed, setOrdersClaimed] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const { start, end } = getRangeBounds(activeRange);
      const client = requireSupabase();
      const [createdResult, completedResult] = await Promise.all([
        client.from('orders').select(ORDER_COLUMNS).gte('created_at', start).lt('created_at', end).order('created_at', { ascending: false }),
        client.from('orders').select(ORDER_COLUMNS).eq('status', 'completed').gte('completed_at', start).lt('completed_at', end).order('completed_at', { ascending: false }),
      ]);
      if (createdResult.error) throw createdResult.error;
      if (completedResult.error) throw completedResult.error;

      const createdOrders = (createdResult.data ?? []) as Order[];
      const completedOrders = (completedResult.data ?? []) as Order[];
      const transactionMap = new Map<string, ReportTransaction>();
      createdOrders.forEach((order) => transactionMap.set(order.id, { order, occurredAt: order.created_at }));
      completedOrders.forEach((order) => transactionMap.set(order.id, { order, occurredAt: order.completed_at ?? order.created_at }));
      setTransactions([...transactionMap.values()].sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()));
      setOrdersProcessed(createdOrders.filter((order) => order.status !== 'cancelled').length);
      setOrdersClaimed(completedOrders.length);
      setRevenue(completedOrders.reduce((sum, order) => sum + orderAmount(order), 0));
    } catch (error) {
      Alert.alert('Unable to load reports', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  }, [activeRange]);

  useFocusEffect(useCallback(() => { void loadReport(); }, [loadReport]));

  const rangeLabel = useMemo(() => {
    if (activeRange === 'Daily') return new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
    if (activeRange === 'Weekly') return 'This week (Monday to Sunday)';
    return new Date().toLocaleDateString([], { month: 'long', year: 'numeric' });
  }, [activeRange]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f0f0f0" animated />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerBlock}>
          <View><AppText style={styles.categoryTag}>MANAGEMENT</AppText><AppText style={styles.title}>Reports & Records</AppText></View>
          <TouchableOpacity style={styles.refreshButton} onPress={() => { void loadReport(); }} accessibilityRole="button" accessibilityLabel="Refresh report">
            <Feather name="refresh-cw" size={17} color={theme.color.secondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.filterBar}>
          {RANGES.map((range) => (
            <TouchableOpacity key={range} style={[styles.filterTab, activeRange === range && styles.activeFilterTab]} onPress={() => setActiveRange(range)} activeOpacity={0.8}>
              <AppText style={[styles.filterTabText, activeRange === range && styles.activeFilterText]}>{range}</AppText>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.heroCard, theme.color.primary]}>
          <View style={styles.heroHeader}>
            <AppText style={styles.heroLabel}>Completed-order revenue</AppText>
            <Feather name="trending-up" size={18} color="#d1fae5" />
          </View>
          <AppText style={styles.heroAmount}>{loading ? '—' : `₱${revenue.toFixed(2)}`}</AppText>
          <AppText style={styles.heroSubText}>{rangeLabel} · {ordersClaimed} completed order{ordersClaimed === 1 ? '' : 's'}</AppText>
        </View>

        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <View style={[styles.metricIconBox, { backgroundColor: '#e0f2fe' }]}><MaterialIcons name="local-laundry-service" size={20} color="#0284c7" /></View>
            <AppText style={styles.metricValue}>{loading ? '—' : ordersProcessed}</AppText>
            <AppText style={styles.metricLabel}>Orders Processed</AppText>
          </View>
          <View style={styles.metricCard}>
            <View style={[styles.metricIconBox, { backgroundColor: '#dcfce7' }]}><Ionicons name="checkmark-done-circle-outline" size={20} color="#16a34a" /></View>
            <AppText style={styles.metricValue}>{loading ? '—' : ordersClaimed}</AppText>
            <AppText style={styles.metricLabel}>Orders Claimed</AppText>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <AppText style={styles.sectionTitle}>Transaction History</AppText>
          <AppText style={styles.recordCount}>{transactions.length} record{transactions.length === 1 ? '' : 's'}</AppText>
        </View>
        <View style={styles.transactionsCard}>
          {loading ? <ActivityIndicator color={theme.color.secondary} style={styles.loading} /> : transactions.length === 0 ? <AppText style={styles.emptyText}>No orders in this period.</AppText> : transactions.map((item, index) => {
            const colors = statusColors(item.order.status);
            return <React.Fragment key={item.order.id}>
              <View style={styles.txRow}>
                <View style={styles.txMeta}>
                  <AppText style={styles.txId}>#{item.order.id.slice(0, 8).toUpperCase()} | {item.order.customer_name || 'Customer'}</AppText>
                  <AppText style={styles.txService}>{item.order.service_name}</AppText>
                  <AppText style={styles.txTime}>{new Date(item.occurredAt).toLocaleString()}</AppText>
                </View>
                <View style={styles.txRight}>
                  <AppText style={styles.txAmount}>₱{orderAmount(item.order).toFixed(2)}</AppText>
                  <View style={[styles.statusPill, { backgroundColor: colors.backgroundColor }]}><AppText style={[styles.statusText, { color: colors.color }]}>{statusLabel(item.order.status)}</AppText></View>
                </View>
              </View>
              {index < transactions.length - 1 ? <View style={styles.divider} /> : null}
            </React.Fragment>;
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, ...theme.color.lightBackground },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  headerBlock: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  refreshButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#eaf2ff', alignItems: 'center', justifyContent: 'center' },
  categoryTag: { fontSize: 11, fontWeight: '800', color: '#64748b', letterSpacing: 1, textTransform: 'uppercase' },
  title: { fontSize: 26, fontWeight: '800', color: '#0f172a', fontFamily: 'serif' },
  filterBar: { flexDirection: 'row', backgroundColor: '#e2e8f0', borderRadius: 12, padding: 4, marginBottom: 20 },
  filterTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  activeFilterTab: { backgroundColor: '#ffffff', elevation: 1 },
  filterTabText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  activeFilterText: { color: '#0f172a' },
  heroCard: { borderRadius: 20, padding: 20, marginBottom: 16, elevation: 2 },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroLabel: { fontSize: 13, color: 'rgba(255, 255, 255, 0.8)', fontWeight: '600' },
  heroAmount: { fontSize: 32, fontWeight: '800', color: '#ffffff', fontFamily: 'serif', marginTop: 8 },
  heroSubText: { fontSize: 12, color: 'rgba(255, 255, 255, 0.8)', marginTop: 4 },
  metricsGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  metricCard: { flex: 1, backgroundColor: '#ffffff', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  metricIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  metricValue: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  metricLabel: { fontSize: 12, color: '#64748b', marginTop: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a', fontFamily: 'serif' },
  recordCount: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  transactionsCard: { backgroundColor: '#ffffff', borderRadius: 20, paddingHorizontal: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  loading: { padding: 28 },
  emptyText: { color: '#64748b', textAlign: 'center', padding: 24 },
  txRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14 },
  txMeta: { flex: 1, paddingRight: 10 },
  txId: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  txService: { fontSize: 12, color: '#64748b', marginTop: 2 },
  txTime: { fontSize: 11, color: '#94a3b8', marginTop: 4 },
  txRight: { alignItems: 'flex-end', justifyContent: 'center' },
  txAmount: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 6 },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  divider: { height: 1, backgroundColor: '#f1f5f9' },
});
