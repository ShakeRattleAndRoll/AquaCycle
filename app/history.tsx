import AppText from '@/components/ui/app-text';
import AppTextInput from '@/components/ui/app-text-input';
import Feather from '@expo/vector-icons/Feather';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { requireSupabase } from '../utils/supabase';
import { theme } from '../constants/app-theme';

type HistoryOrder = {
  id: string;
  user_id: string;
  customer_name: string;
  pickup_delivery: boolean;
  service_name: string;
  status: 'completed' | 'cancelled';
  estimated_total: number;
  final_total: number | null;
  delivery_fee: number;
  final_quantity: number | null;
  quantity_unit: string;
  address: string;
  notes: string | null;
  created_at: string;
  completed_at: string | null;
  order_services?: { service_name: string; quantity_unit: string; final_quantity: number | null }[];
};

type Filter = 'All' | 'Completed' | 'Cancelled';
const FILTERS: Filter[] = ['All', 'Completed', 'Cancelled'];

function amount(order: HistoryOrder) {
  return Number(order.final_total ?? (Number(order.estimated_total) + Number(order.delivery_fee ?? 0)));
}

export default function StaffHistoryScreen() {
  const router = useRouter();
  const [role, setRole] = useState<'staff' | 'customer'>('customer');
  const [orders, setOrders] = useState<HistoryOrder[]>([]);
  const [filter, setFilter] = useState<Filter>('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const client = requireSupabase();
      const { data: { user }, error: userError } = await client.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Sign in to view order history.');
      const { data: profile, error: profileError } = await client.from('profiles').select('role').eq('id', user.id).single();
      if (profileError) throw profileError;
      const nextRole = profile.role === 'staff' ? 'staff' : 'customer';
      setRole(nextRole);
      let query = client.from('orders').select('id,user_id,customer_name,service_name,status,estimated_total,final_total,delivery_fee,pickup_delivery,final_quantity,quantity_unit,address,notes,created_at,completed_at,order_services(service_name,quantity_unit,final_quantity)').in('status', ['completed', 'cancelled']);
      if (nextRole === 'customer') query = query.eq('user_id', user.id);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      setOrders((data ?? []) as HistoryOrder[]);
    } catch (error) {
      Alert.alert('Unable to load order history', error instanceof Error ? error.message : String(error));
    } finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { void loadHistory(); }, [loadHistory]));

  const filteredOrders = useMemo(() => orders.filter((order) => {
    const matchesFilter = filter === 'All' || (filter === 'Completed' ? order.status === 'completed' : order.status === 'cancelled');
    const haystack = `${order.customer_name} ${order.id} ${order.service_name}`.toLowerCase();
    return matchesFilter && haystack.includes(search.toLowerCase());
  }), [filter, orders, search]);

  const counts = useMemo(() => ({
    All: orders.length,
    Completed: orders.filter((order) => order.status === 'completed').length,
    Cancelled: orders.filter((order) => order.status === 'cancelled').length,
  }), [orders]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" animated />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityLabel="Go back"
          >
            <Feather name="arrow-left" size={20} color="#0f172a" />
          </TouchableOpacity>

          <View>
            <AppText style={styles.eyebrow}>
              {role === 'staff' ? 'OPERATIONS' : 'YOUR LAUNDRY'}
            </AppText>
            <AppText style={styles.title}>History</AppText>
            <AppText style={styles.subtitle}>
              Completed and cancelled orders
            </AppText>
          </View>
        </View>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => { void loadHistory(); }}
          accessibilityLabel="Refresh order history"
        >
          <Feather name="refresh-cw" size={18} color={theme.color.secondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBox}>
        <Feather name="search" size={17} color="#94a3b8" />
        <AppTextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder={role === 'staff' ? 'Search customer, service, or ID' : 'Search service or order ID'}
          placeholderTextColor="#94a3b8"
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScrollView}
        contentContainerStyle={styles.filterRow}
      >
        {FILTERS.map((item) => (
          <TouchableOpacity
            key={item}
            style={[styles.filterChip, item === filter ? styles.filterChipSelected : null]}
            onPress={() => setFilter(item)}
          >
            <AppText style={[styles.filterText, item === filter ? styles.filterTextSelected : null]}>
              {item}
            </AppText>
            <AppText style={[styles.filterCount, item === filter ? styles.filterTextSelected : null]}>
              {counts[item]}
            </AppText>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator color={theme.color.secondary} style={styles.loader} />
      ) : (
        <ScrollView
          style={styles.scrollList}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredOrders.length === 0 ? (
            <AppText style={styles.emptyText}>
              No {filter === 'All' ? '' : filter.toLowerCase() + ' '}orders in history.
            </AppText>
          ) : filteredOrders.map((order) => {
            const completed = order.status === 'completed';

            return (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderTop}>
                  <View style={styles.identity}>
                    <View style={[styles.statusDot, { backgroundColor: completed ? '#16a34a' : '#dc2626' }]} />
                    {role === 'staff' ? <AppText style={styles.customer}>{order.customer_name || 'Customer'}</AppText> : null}
                  </View>

                  <View style={[styles.statusPill, completed ? styles.completedPill : styles.cancelledPill]}>
                    <AppText style={[styles.statusText, completed ? styles.completedText : styles.cancelledText]}>
                      {completed ? 'Completed' : 'Cancelled'}
                    </AppText>
                  </View>
                </View>

                <AppText style={styles.orderMeta}>
                  #{order.id.slice(0, 8).toUpperCase()} | {new Date(completed && order.completed_at ? order.completed_at : order.created_at).toLocaleString()}
                </AppText>

                <AppText style={styles.service}>{order.service_name}</AppText>

                <AppText style={styles.details}>
                  {order.final_quantity
                    ? `Final order amount: ${order.final_quantity} ${order.quantity_unit}`
                    : order.order_services?.length && order.order_services.every((service) => service.service_name === 'Ironing')
                      ? 'Ironing has a fixed service charge'
                      : 'Final amount not recorded'}
                </AppText>

                <AppText style={styles.details}>
                  {order.pickup_delivery ? 'Pickup & delivery' : 'Store drop-off'}
                </AppText>

                {order.notes ? <AppText style={styles.notes}>Note: {order.notes}</AppText> : null}

                <View style={styles.totalRow}>
                  <AppText style={styles.totalLabel}>
                    {completed ? 'Final total' : 'Estimated total'}
                  </AppText>
                  <AppText style={styles.total}>${amount(order).toFixed(2)}</AppText>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 18,
    paddingTop: 18
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1
  },
  backButton: {
    width: 42,
    height: 42,
    backgroundColor: '#eaf2ff',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 1.2,
    color: '#64748b',
    fontWeight: '800'
  },
  title: {
    color: '#0f172a',
    fontSize: 30,
    fontWeight: '800',
    marginTop: 3
  },
  subtitle: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 3
  },
  refreshButton: {
    width: 42,
    height: 42,
    backgroundColor: '#eaf2ff',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  searchBox: {
    height: 48,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 14,
    marginBottom: 16
  },
  searchInput: {
    flex: 1,
    color: '#0f172a',
    fontSize: 14
  },
  filterScrollView: {
    flexGrow: 0,
    marginBottom: 16
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center'
  },
  filterChip: {
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 9,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignSelf: 'flex-start',
    justifyContent: 'center'
  },
  filterChipSelected: {
    backgroundColor: theme.color.secondary,
    borderColor: theme.color.secondary
  },
  filterText: {
    color: '#64748b',
    fontWeight: '700',
    fontSize: 12
  },
  filterTextSelected: {
    color: '#fff'
  },
  filterCount: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '800'
  },
  loader: {
    marginTop: 32
  },
  scrollList: {
    flex: 1
  },
  listContent: {
    paddingBottom: 28,
    gap: 12
  },
  emptyText: {
    textAlign: 'center',
    padding: 28,
    color: '#64748b'
  },
  orderCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    padding: 16
  },
  orderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  customer: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '800',
    flexShrink: 1
  },
  statusPill: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10
  },
  completedPill: {
    backgroundColor: '#dcfce7'
  },
  cancelledPill: {
    backgroundColor: '#fee2e2'
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800'
  },
  completedText: {
    color: '#15803d'
  },
  cancelledText: {
    color: '#b91c1c'
  },
  orderMeta: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 8
  },
  service: {
    color: '#0f172a',
    fontSize: 17,
    fontWeight: '800',
    marginTop: 8
  },
  details: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 5
  },
  notes: {
    color: '#475569',
    fontSize: 12,
    marginTop: 7,
    fontStyle: 'italic'
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    marginTop: 12,
    paddingTop: 11
  },
  totalLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600'
  },
  total: {
    color: theme.color.secondary,
    fontSize: 15,
    fontWeight: '800'
  }
});
