import AppText from '@/components/ui/app-text';
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import QRCode from 'react-native-qrcode-svg';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { requireSupabase } from '../../utils/supabase';
import { theme } from '../../constants/app-theme';

type OrderService = {
  service_name: string;
  quantity: number;
  quantity_unit: string;
  estimated_total: number;
  final_total: number | null;
};
type Order = {
  id: string;
  service_name: string;
  quantity: number;
  quantity_unit: string;
  final_quantity: number | null;
  address: string;
  notes: string | null;
  pickup_delivery: boolean;
  estimated_total: number;
  delivery_fee: number;
  final_total: number | null;
  status: string;
  created_at: string;
  payment_method?: 'cash' | 'gcash';
  payment_reference?: string | null;
  payment_status?: 'unpaid' | 'pending_verification' | 'paid';
  order_services?: OrderService[];
};

const STATUS_LABELS: Record<string, string> = {
  received: 'Order received', washing: 'Washing', drying: 'Drying',
  ready: 'Ready for pickup', completed: 'Completed', cancelled: 'Cancelled',
};
const PAYMENT_STATUS_LABELS: Record<string, string> = {
  unpaid: 'Unpaid', pending_verification: 'Awaiting staff verification', paid: 'Paid',
};
const orderAmount = (order: Order) => Number(order.final_total ?? (Number(order.estimated_total) + Number(order.delivery_fee ?? 0)));

export default function OrdersDetails() {
  const router = useRouter();
  const { orderId: requestedOrderId } = useLocalSearchParams<{ orderId?: string | string[] }>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const client = requireSupabase();
      const { data: { user }, error: userError } = await client.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Sign in to view your orders.');
      const query = client.from('orders').select('*, order_services(*)').eq('user_id', user.id).order('created_at', { ascending: false });
      const { data, error } = await query;
      if (error) throw error;
      const loadedOrders = (data ?? []) as Order[];
      setOrders(loadedOrders);
    } catch (error) {
      Alert.alert('Unable to load orders', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void loadOrders();
    return () => setSelectedOrder(null);
  }, [loadOrders]));

  useEffect(() => {
    const orderId = Array.isArray(requestedOrderId) ? requestedOrderId[0] : requestedOrderId;
    if (!orderId) return;
    const matchingOrder = orders.find((order) => order.id === orderId);
    if (matchingOrder) setSelectedOrder(matchingOrder);
  }, [orders, requestedOrderId]);

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTitle}>
            <AppText style={styles.subtitle}>YOUR LAUNDRY</AppText>
            <AppText style={styles.title}>Orders</AppText>
          </View>
          <TouchableOpacity style={styles.historyButton} onPress={() => router.push('/history')}>
            <Feather name="archive" size={16} color={theme.color.secondary} />
            <AppText style={styles.historyButtonText}>History</AppText>
          </TouchableOpacity>
        </View>

        <View style={styles.statusRefreshInfo}>
          <Ionicons name="refresh-outline" size={17} color={theme.color.secondary} />
          <AppText style={styles.statusRefreshText}>Order statuses refresh when you reopen this screen. Live updates are coming soon.</AppText>
        </View>

        {loading ? <ActivityIndicator color={theme.color.secondary} style={styles.loader} /> : null}
        {!loading && orders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="water-outline" size={34} color={theme.color.secondary} />
            <AppText style={styles.emptyTitle}>No orders yet</AppText>
            <AppText style={styles.detail}>Your laundry orders will appear here.</AppText>
            <TouchableOpacity style={styles.button} onPress={() => router.push('/orders')}>
              <AppText style={styles.buttonText}>Create an order</AppText>
            </TouchableOpacity>
          </View>
        ) : null}

        {orders.map((order) => (
          <View key={order.id} style={styles.card}>
            <View style={styles.row}>
              <View style={styles.badge}>
                <View style={styles.dot} />
                <AppText style={styles.badgeText}>{STATUS_LABELS[order.status] ?? order.status}</AppText>
              </View>
              <AppText style={styles.orderId}>#{order.id.slice(0, 8).toUpperCase()}</AppText>
            </View>
            <AppText style={styles.service}>
              {order.order_services?.length ? order.order_services.map((service) => service.service_name).join(', ') : order.service_name}
            </AppText>
            <AppText style={styles.detail}>{new Date(order.created_at).toLocaleDateString()}</AppText>
            <TouchableOpacity onPress={() => setSelectedOrder(order)} activeOpacity={0.75} accessibilityRole="button" accessibilityLabel={`View details for order ${order.id.slice(0, 8)}`}>
              <AppText style={styles.openHint}>Tap to view order details</AppText>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <Modal visible={Boolean(selectedOrder)} transparent animationType="fade" onRequestClose={() => setSelectedOrder(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.headerTitle}>
                <AppText style={styles.subtitle}>ORDER DETAILS</AppText>
                <AppText style={styles.modalTitle}>#{selectedOrder?.id.slice(0, 8).toUpperCase()}</AppText>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedOrder(null)} accessibilityLabel="Close order details">
                <Feather name="x" size={21} color="#334155" />
              </TouchableOpacity>
            </View>
            {selectedOrder ? (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalContent}>
                <View style={styles.modalStatus}>
                  <View style={styles.badge}><View style={styles.dot} /><AppText style={styles.badgeText}>{STATUS_LABELS[selectedOrder.status] ?? selectedOrder.status}</AppText></View>
                  <AppText style={styles.detail}>{new Date(selectedOrder.created_at).toLocaleString()}</AppText>
                </View>
                <AppText style={styles.sectionTitle}>Selected services</AppText>
                {selectedOrder.order_services?.length ? selectedOrder.order_services.map((service) => (
                  <View key={service.service_name} style={styles.serviceRow}>
                    <View style={styles.serviceInfo}>
                      <AppText style={styles.serviceName}>{service.service_name}</AppText>
                      <AppText style={styles.detail}>{service.service_name === 'Ironing' ? 'Fixed-price service' : 'Estimated ' + service.quantity + ' ' + service.quantity_unit}</AppText>
                    </View>
                    <View style={styles.servicePrice}>
                      <AppText style={styles.price}>${Number(service.final_total ?? service.estimated_total).toFixed(2)}</AppText>
                      <AppText style={styles.priceHint}>{service.final_total !== null ? 'final' : 'estimate'}</AppText>
                    </View>
                  </View>
                )) : (
                  <View style={styles.serviceRow}>
                    <AppText style={styles.serviceName}>{selectedOrder.service_name}</AppText>
                    <AppText style={styles.price}>${Number(selectedOrder.estimated_total).toFixed(2)}</AppText>
                  </View>
                )}
                {selectedOrder.final_quantity !== null ? <AppText style={styles.detail}>Final order amount: {selectedOrder.final_quantity} {selectedOrder.quantity_unit}</AppText> : selectedOrder.order_services?.length && selectedOrder.order_services.every((service) => service.service_name === 'Ironing') ? <AppText style={styles.detail}>Ironing has a fixed service charge.</AppText> : <AppText style={styles.detail}>Final amount will be confirmed by staff.</AppText>}
                <View style={styles.infoBlock}>
                  <AppText style={styles.sectionTitle}>Pickup and delivery</AppText>
                  <AppText style={styles.detail}>{selectedOrder.pickup_delivery ? 'Pickup & delivery' : 'Store drop-off'}</AppText>
                  {selectedOrder.pickup_delivery ? <AppText style={styles.detail}>Delivery fee: ${Number(selectedOrder.delivery_fee).toFixed(2)}</AppText> : null}
                  <AppText style={styles.detail}>{selectedOrder.address}</AppText>
                </View>
                <View style={styles.infoBlock}>
                  <AppText style={styles.sectionTitle}>Payment</AppText>
                  <AppText style={styles.detail}>Method: {selectedOrder.payment_method === 'gcash' ? 'GCash' : 'Cash'}</AppText>
                  <AppText style={styles.detail}>Status: {PAYMENT_STATUS_LABELS[selectedOrder.payment_status ?? 'unpaid'] ?? 'Unpaid'}</AppText>
                  {selectedOrder.payment_reference ? <AppText style={styles.detail}>GCash reference: {selectedOrder.payment_reference}</AppText> : null}
                  {selectedOrder.payment_status === 'pending_verification' ? <AppText style={styles.paymentHint}>Staff will verify the GCash reference manually.</AppText> : null}
                </View>
                {selectedOrder.notes ? <View style={styles.infoBlock}><AppText style={styles.sectionTitle}>Notes</AppText><AppText style={styles.detail}>{selectedOrder.notes}</AppText></View> : null}
                <View style={styles.modalTotal}>
                  <AppText style={styles.totalLabel}>{selectedOrder.final_total !== null ? 'Final total' : 'Estimated total'}</AppText>
                  <AppText style={styles.total}>${orderAmount(selectedOrder).toFixed(2)}</AppText>
                </View>
                <View style={styles.receiptPreview}>
                  <View style={styles.receiptPreviewHeader}>
                    <View>
                      <AppText style={styles.receiptPreviewEyebrow}>RECEIPT PREVIEW</AppText>
                      <AppText style={styles.receiptPreviewTitle}>Order #{selectedOrder.id.slice(0, 8).toUpperCase()}</AppText>
                    </View>
                    <Ionicons name="receipt-outline" size={22} color={theme.color.secondary} />
                  </View>
                  <View style={styles.receiptPreviewRow}><AppText style={styles.receiptPreviewLabel}>Date</AppText><AppText style={styles.receiptPreviewValue}>{new Date(selectedOrder.created_at).toLocaleDateString()}</AppText></View>
                  <View style={styles.receiptPreviewRow}><AppText style={styles.receiptPreviewLabel}>Payment</AppText><AppText style={styles.receiptPreviewValue}>{selectedOrder.payment_method === 'gcash' ? 'GCash' : 'Cash'} · {PAYMENT_STATUS_LABELS[selectedOrder.payment_status ?? 'unpaid'] ?? 'Unpaid'}</AppText></View>
                  <View style={styles.receiptPreviewRow}><AppText style={styles.receiptPreviewLabel}>Amount</AppText><AppText style={styles.receiptPreviewAmount}>${orderAmount(selectedOrder).toFixed(2)}</AppText></View>
                  <View style={styles.receiptPreviewActions}>
                    <TouchableOpacity style={styles.receiptPreviewButton} disabled accessibilityRole="button">
                      <Ionicons name="download-outline" size={16} color="#94a3b8" />
                      <AppText style={styles.receiptPreviewButtonText}>Download</AppText>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.receiptPreviewButton} disabled accessibilityRole="button">
                      <Ionicons name="print-outline" size={16} color="#94a3b8" />
                      <AppText style={styles.receiptPreviewButtonText}>Print</AppText>
                    </TouchableOpacity>
                  </View>
                  <AppText style={styles.receiptPreviewNote}>Receipt export is a preview. Download and print are not active yet.</AppText>
                </View>
                {selectedOrder.status === 'ready' ? (
                  <View style={styles.claimPass}>
                    <AppText style={styles.claimTitle}>Ready for pickup</AppText>
                    <AppText style={styles.claimHint}>Show this order QR code to staff when you collect it.</AppText>
                    <View style={styles.qrCard}><QRCode value={'AQUACYCLE_ORDER:' + selectedOrder.id} size={180} backgroundColor="#ffffff" color="#0f172a" /></View>
                  </View>
                ) : <AppText style={styles.claimUnavailable}>The claim QR code will appear here when the order is ready.</AppText>}
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, ...theme.color.lightBackground },
  container: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40, flexGrow: 1 },
  header: { marginBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusRefreshInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 14, borderRadius: 12, backgroundColor: '#eff6ff' },
  statusRefreshText: { flex: 1, color: '#475569', fontSize: 11, lineHeight: 16 },
  headerTitle: { flex: 1 },
  historyButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: '#eaf2ff' },
  historyButtonText: { color: theme.color.secondary, fontSize: 12, fontWeight: '700' },
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
  service: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginTop: 14, marginBottom: 2 },
  detail: { color: '#64748b', fontSize: 13, marginTop: 5 },
  paymentHint: { color: theme.color.secondary, fontSize: 12, lineHeight: 18, marginTop: 7 },
  total: { fontSize: 16, color: theme.color.secondary, fontWeight: '800' },
  openHint: { color: theme.color.secondary, fontSize: 12, fontWeight: '700', marginTop: 10 },
  button: { backgroundColor: theme.color.secondary, borderRadius: 12, padding: 13, marginTop: 16, alignItems: 'center' },
  buttonText: { color: '#ffffff', fontWeight: '700' },
  modalBackdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: 'rgba(15,23,42,0.52)' },
  modalCard: { width: '100%', maxWidth: 480, maxHeight: '86%', backgroundColor: '#ffffff', borderRadius: 24, padding: 20, elevation: 12 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginTop: 3 },
  closeButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#f1f5f9' },
  modalContent: { paddingBottom: 8 },
  modalStatus: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 8 },
  sectionTitle: { color: '#334155', fontSize: 14, fontWeight: '800', marginTop: 14, marginBottom: 8 },
  serviceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#eef2f7' },
  serviceInfo: { flex: 1 },
  servicePrice: { alignItems: 'flex-end', marginLeft: 12 },
  serviceName: { color: '#0f172a', fontSize: 14, fontWeight: '700' },
  price: { color: '#0f172a', fontSize: 14, fontWeight: '800' },
  priceHint: { color: '#64748b', fontSize: 10, marginTop: 2 },
  infoBlock: { marginTop: 8 },
  modalTotal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#e2e8f0', marginTop: 16, paddingTop: 14 },
  totalLabel: { color: '#334155', fontSize: 14, fontWeight: '700' },
  receiptPreview: { marginTop: 16, padding: 14, borderWidth: 1, borderColor: '#dbe4f0', borderRadius: 16, backgroundColor: '#f8fafc' },
  receiptPreviewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 },
  receiptPreviewEyebrow: { color: '#64748b', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  receiptPreviewTitle: { color: '#0f172a', fontSize: 14, fontWeight: '800', marginTop: 3 },
  receiptPreviewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#e8edf4' },
  receiptPreviewLabel: { color: '#64748b', fontSize: 11 },
  receiptPreviewValue: { color: '#334155', fontSize: 11, fontWeight: '600', textAlign: 'right', flexShrink: 1, marginLeft: 8 },
  receiptPreviewAmount: { color: theme.color.secondary, fontSize: 13, fontWeight: '800' },
  receiptPreviewActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  receiptPreviewButton: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingVertical: 10, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 11, backgroundColor: '#f1f5f9', opacity: 0.75 },
  receiptPreviewButtonText: { color: '#94a3b8', fontSize: 11, fontWeight: '700' },
  receiptPreviewNote: { color: '#64748b', fontSize: 10, lineHeight: 14, textAlign: 'center', marginTop: 9 },
  claimPass: { alignItems: 'center', marginTop: 20, padding: 16, borderRadius: 16, backgroundColor: '#f0fdf4' },
  claimTitle: { color: '#166534', fontSize: 16, fontWeight: '800' },
  claimHint: { color: '#475569', fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 5 },
  qrCard: { backgroundColor: '#ffffff', padding: 12, borderRadius: 14, marginTop: 14 },
  claimUnavailable: { color: '#64748b', fontSize: 12, lineHeight: 18, marginTop: 16, textAlign: 'center' },
});
