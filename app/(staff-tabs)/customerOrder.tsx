import Feather from '@expo/vector-icons/Feather';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { theme } from '../theme';
import { requireSupabase } from '../../utils/supabase';

type Order = { id: string; customer_name: string; service_name: string; quantity: number; quantity_unit: string; estimated_total: number; status: string; created_at: string };
const FILTER_KEYS = ['All', 'New', 'In progress', 'Ready'] as const;
const STATUS_LABELS: Record<string, string> = { received: 'New', washing: 'Washing', drying: 'Drying', ready: 'Ready', completed: 'Completed', cancelled: 'Cancelled' };
const NEXT_STATUS: Record<string, string> = { received: 'washing', washing: 'drying', drying: 'ready', ready: 'completed' };

export default function StaffOrdersScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await requireSupabase().from('orders').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setOrders((data ?? []) as Order[]);
    } catch (error) {
      Alert.alert('Unable to load orders', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);
  useFocusEffect(useCallback(() => { void loadOrders(); }, [loadOrders]));

  const counts = useMemo(() => ({
    All: orders.length,
    New: orders.filter((item) => item.status === 'received').length,
    'In progress': orders.filter((item) => ['washing', 'drying'].includes(item.status)).length,
    Ready: orders.filter((item) => item.status === 'ready').length,
  }), [orders]);

  const filteredOrders = orders.filter((item) => {
    const category = item.status === 'received' ? 'New' : ['washing', 'drying'].includes(item.status) ? 'In progress' : item.status === 'ready' ? 'Ready' : 'Other';
    const customer = item.customer_name ?? 'Customer';
    return (activeFilter === 'All' || category === activeFilter) &&
      `${customer} ${item.id}`.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const advanceOrder = async (order: Order) => {
    const status = NEXT_STATUS[order.status];
    if (!status) return;
    try {
      const { error } = await requireSupabase().from('orders').update({ status }).eq('id', order.id);
      if (error) throw error;
      setOrders((current) => current.map((item) => item.id === order.id ? { ...item, status } : item));
    } catch (error) {
      Alert.alert('Unable to update order', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f0f0f0" animated />
      <View style={styles.headerBlock}>
        <Text style={styles.categoryTag}>OPERATIONS</Text>
        <Text style={styles.title}>All orders</Text>
      </View>
      <View style={styles.searchContainer}>
        <Feather name="search" size={18} color="#94a3b8" style={styles.searchIcon} />
        <TextInput style={styles.searchInput} placeholder="Search customer or order ID" placeholderTextColor="#94a3b8" value={searchQuery} onChangeText={setSearchQuery} />
      </View>
      <View style={styles.filterRow}>
        {FILTER_KEYS.map((key) => {
          const selected = activeFilter === key;
          return <TouchableOpacity key={key} style={[styles.filterChip, selected ? styles.activeChip : styles.inactiveChip]} onPress={() => setActiveFilter(key)} activeOpacity={0.8}>
            <Text style={[styles.filterText, selected && styles.activeFilterText]}>{key}</Text>
            <Text style={[styles.badgeCount, selected && styles.activeBadgeCount]}>{counts[key]}</Text>
          </TouchableOpacity>;
        })}
      </View>
      {loading ? <ActivityIndicator color={theme.color.secondary} style={{ marginTop: 28 }} /> : <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={<Text style={styles.emptyText}>No orders found.</Text>}
        renderItem={({ item }) => {
          const customer = item.customer_name ?? 'Customer';
          const initials = customer.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'C';
          const status = STATUS_LABELS[item.status] ?? item.status;
          const badge = item.status === 'received' ? { bg: '#e0f2fe', text: theme.color.secondary } : item.status === 'washing' ? { bg: '#e0e7ff', text: '#4338ca' } : item.status === 'drying' ? { bg: '#ffedd5', text: '#c2410c' } : item.status === 'ready' ? { bg: '#dcfce7', text: '#15803d' } : { bg: '#f1f5f9', text: '#64748b' };
          return <TouchableOpacity style={styles.orderCard} activeOpacity={0.7} onPress={() => {
            const next = NEXT_STATUS[item.status];
            if (next) Alert.alert('Update order status?', `${status} → ${STATUS_LABELS[next]}`, [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Update', onPress: () => { void advanceOrder(item); } },
            ]);
          }}>
            <View style={styles.avatarCircle}><Text style={styles.avatarText}>{initials}</Text></View>
            <View style={styles.orderInfo}>
              <Text style={styles.orderMetaText}>{item.id.slice(0, 8).toUpperCase()} · {new Date(item.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</Text>
              <Text style={styles.customerName}>{customer}</Text>
              <Text style={styles.serviceText}>{item.service_name} · {item.quantity} {item.quantity_unit}</Text>
            </View>
            <View style={styles.rightCol}>
              <Text style={styles.priceText}>₱{Number(item.estimated_total).toFixed(2)}</Text>
              <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}><Text style={[styles.statusText, { color: badge.text }]}>{status}</Text></View>
            </View>
          </TouchableOpacity>;
        }}
      />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, ...theme.color.lightBackground, paddingHorizontal: 20, paddingTop: 16 },
  headerBlock: { marginBottom: 16 },
  categoryTag: { fontSize: 11, fontWeight: '800', color: '#64748b', letterSpacing: 1, textTransform: 'uppercase' },
  title: { fontSize: 32, fontWeight: '800', color: '#0f172a', fontFamily: 'serif', marginTop: 4 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 24, paddingHorizontal: 16, height: 48, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 16 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 14, color: '#0f172a' },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 6 },
  activeChip: { backgroundColor: '#5881ea' },
  inactiveChip: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0' },
  filterText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  activeFilterText: { color: '#ffffff' },
  badgeCount: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  activeBadgeCount: { color: '#a7f3d0' },
  listContent: { paddingBottom: 40 },
  orderCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  avatarCircle: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#e2e8f0', ...theme.spacing.trueCenter },
  avatarText: { fontSize: 13, fontWeight: '700', color: '#475569' },
  orderInfo: { flex: 1, marginLeft: 14 },
  orderMetaText: { fontSize: 11, fontWeight: '600', color: '#94a3b8' },
  customerName: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginVertical: 2 },
  serviceText: { fontSize: 12, color: '#64748b' },
  rightCol: { alignItems: 'flex-end', gap: 6 },
  priceText: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '700' },
  separator: { height: 1, backgroundColor: '#f1f5f9' },
  emptyText: { textAlign: 'center', color: '#64748b', padding: 32 },
});
