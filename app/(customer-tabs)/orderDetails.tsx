import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '../theme';
import { requireSupabase } from '../../utils/supabase';

type Order = {
  id: string;
  service_name: string;
  quantity: number;
  quantity_unit: string;
  address: string;
  notes: string | null;
  pickup_delivery: boolean;
  estimated_total: number;
  status: string;
  created_at: string;
};

const STATUS_LABELS: Record<string, string> = {
  received: 'Order received', washing: 'Washing', drying: 'Drying',
  ready: 'Ready for pickup', completed: 'Completed', cancelled: 'Cancelled',
};

export default function OrdersDetails() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const client = requireSupabase();
      const { data: { user }, error: userError } = await client.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Sign in to view your orders.');
      let query = client.from('orders').select('*').order('created_at', { ascending: false });
      if (orderId) query = query.eq('id', orderId);
      const { data, error } = await query;
      if (error) throw error;
      setOrders((data ?? []) as Order[]);
    } catch (error) {
      Alert.alert('Unable to load orders', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useFocusEffect(useCallback(() => { void loadOrders(); }, [loadOrders]));

  return (
    <ScrollView contentContainerStyle={styles.container} style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.subtitle}>YOUR LAUNDRY</Text>
        <Text style={styles.title}>Orders</Text>
      </View>
      {loading ? <ActivityIndicator color={theme.color.secondary} style={styles.loader} /> : null}
      {!loading && orders.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="water-outline" size={34} color={theme.color.secondary} />
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.detail}>Your laundry orders will appear here.</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.push('/(customer-tabs)/createOrder')}>
            <Text style={styles.buttonText}>Create an order</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      {orders.map((order) => (
        <View key={order.id} style={styles.card}>
          <View style={styles.row}>
            <View style={styles.badge}><View style={styles.dot} /><Text style={styles.badgeText}>{STATUS_LABELS[order.status] ?? order.status}</Text></View>
            <Text style={styles.orderId}>#{order.id.slice(0, 8).toUpperCase()}</Text>
          </View>
          <Text style={styles.service}>{order.service_name}</Text>
          <Text style={styles.detail}>{order.quantity} {order.quantity_unit} · {order.pickup_delivery ? 'Pickup & delivery' : 'Store drop-off'}</Text>
          <Text style={styles.detail}>{order.address}</Text>
          {order.notes ? <Text style={styles.detail}>Note: {order.notes}</Text> : null}
          <View style={[styles.row, styles.totalRow]}>
            <Text style={styles.detail}>{new Date(order.created_at).toLocaleDateString()}</Text>
            <Text style={styles.total}>₱{Number(order.estimated_total).toFixed(2)}</Text>
          </View>
          {order.status === 'ready' ? (
            <TouchableOpacity style={styles.button} onPress={() => router.push('/(customer-tabs)/QRclaim')}>
              <Text style={styles.buttonText}>View claim pass</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { ...theme.color.lightBackground },
  container: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  header: { marginBottom: 20 },
  subtitle: { fontSize: 12, fontWeight: '800', color: '#64748b', letterSpacing: 1 },
  title: { fontSize: 32, fontWeight: '700', color: '#0f172a', marginTop: 2 },
  loader: { marginTop: 36 },
  card: { backgroundColor: '#ffffff', borderRadius: 20, borderWidth: 1, borderColor: '#d6e4fd', padding: 18, marginBottom: 14 },
  emptyCard: { backgroundColor: '#ffffff', borderRadius: 20, padding: 24, alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginTop: 10, marginBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { backgroundColor: '#eaf2ff', borderRadius: 14, paddingVertical: 5, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 7 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: theme.color.secondary },
  badgeText: { color: theme.color.secondary, fontSize: 12, fontWeight: '700' },
  orderId: { fontSize: 12, color: '#64748b', fontWeight: '700' },
  service: { fontSize: 22, fontWeight: '700', color: '#0f172a', marginTop: 14, marginBottom: 6 },
  detail: { color: '#64748b', fontSize: 13, marginTop: 5 },
  totalRow: { borderTopWidth: 1, borderTopColor: '#e2e8f0', marginTop: 14, paddingTop: 12 },
  total: { fontSize: 16, color: theme.color.secondary, fontWeight: '800' },
  button: { backgroundColor: theme.color.secondary, borderRadius: 12, padding: 13, marginTop: 16, alignItems: 'center' },
  buttonText: { color: '#ffffff', fontWeight: '700' },
});
