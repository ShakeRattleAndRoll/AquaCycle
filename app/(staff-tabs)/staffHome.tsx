import AppText from '@/components/ui/app-text';
import AppTextInput from '@/components/ui/app-text-input';
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../constants/app-theme';
import { requireSupabase } from '../../utils/supabase';

type Order = {
  id: string; user_id: string; customer_name: string; service_name: string; status: string;
  estimated_total: number; final_total: number | null; delivery_fee: number;
  created_at: string; completed_at: string | null;
};
const SERVICES = [
  { name: 'Wash & Fold', unit: 'kg', rate: 45 }, { name: 'Ironing', unit: 'kg', rate: 35 },
  { name: 'Dry Cleaning', unit: 'kg', rate: 120 }, { name: 'Wash & Iron', unit: 'kg', rate: 65 },
  { name: 'Self Service', unit: 'kg', rate: 65 },
] as const;
const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const amountFor = (order: Order) => Number(order.final_total ?? (Number(order.estimated_total) + Number(order.delivery_fee ?? 0)));

export default function StaffHomeScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [staffName, setStaffName] = useState('Staff');
  const [loading, setLoading] = useState(true);
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>(['Wash & Fold']);
  const [pickup, setPickup] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'gcash'>('cash');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const client = requireSupabase();
      const { data: { user }, error: userError } = await client.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Sign in to view the staff dashboard.');
      const [ordersResult, profileResult] = await Promise.all([
        client.from('orders').select('id,user_id,customer_name,service_name,status,estimated_total,final_total,delivery_fee,created_at,completed_at').order('created_at', { ascending: false }),
        client.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
      ]);
      if (ordersResult.error) throw ordersResult.error;
      setOrders((ordersResult.data ?? []) as Order[]);
      setStaffName(profileResult.data?.full_name?.trim() || 'Staff');
    } catch (error) {
      Alert.alert('Unable to load dashboard', error instanceof Error ? error.message : String(error));
    } finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { void loadDashboard(); }, [loadDashboard]));

  const today = dateKey(new Date());
  const todayOrders = orders.filter((order) => dateKey(new Date(order.created_at)) === today);
  const completedToday = orders.filter((order) => order.status === 'completed' && order.completed_at && dateKey(new Date(order.completed_at)) === today);
  const activeOrders = orders.filter((order) => !['completed', 'cancelled'].includes(order.status));
  const readyOrders = orders.filter((order) => order.status === 'ready');
  const customerCount = new Set(orders.map((order) => order.customer_name.trim().toLocaleLowerCase()).filter(Boolean)).size;
  const todayRevenue = completedToday.reduce((sum, order) => sum + amountFor(order), 0);
  const weekRevenue = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = dateKey(date);
    return orders.filter((order) => order.status === 'completed' && order.completed_at && dateKey(new Date(order.completed_at)) === key).reduce((sum, order) => sum + amountFor(order), 0);
  }), [orders]);
  const maxRevenue = Math.max(...weekRevenue, 1);
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';
  const chosenServices = SERVICES.filter((service) => selectedServices.includes(service.name));
  const estimatedTotal = chosenServices.reduce((sum, service) => sum + service.rate, 0) + (pickup ? 10 : 0);

  const submitNewOrder = async () => {
    if (!customerName.trim() || !address.trim() || !chosenServices.length) {
      Alert.alert('Complete the order details', 'Enter the customer name and address, and choose at least one service.');
      return;
    }
    setSaving(true);
    try {
      const client = requireSupabase();
      const { data: { user }, error: userError } = await client.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Sign in before creating an order.');
      const { error } = await client.rpc('create_order_with_payment', {
        p_customer_name: customerName.trim(),
        p_address: address.trim(),
        p_notes: notes.trim() || null,
        p_pickup_delivery: pickup,
        p_service_names: chosenServices.map((service) => service.name),
        p_payment_method: paymentMethod,
        p_payment_reference: null,
      });
      if (error) throw error;
      setNewOrderOpen(false);
      setCustomerName(''); setAddress(''); setNotes(''); setSelectedServices(['Wash & Fold']); setPickup(true); setPaymentMethod('cash');
      await loadDashboard();
      Alert.alert('Order created', 'The new order is now in the orders list.');
    } catch (error) {
      const detail = error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' ? error.message : String(error);
      Alert.alert('Unable to create order', detail);
    } finally { setSaving(false); }
  };

  return (
    <SafeAreaView edges={[]} style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f0f0f0" animated />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.greetingRow}>
          <View><AppText style={styles.dateText}>{new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</AppText><AppText style={styles.greetingTitle}>{greeting},{'\n'}{staffName}.</AppText></View>
          <View style={styles.statusBadge}><View style={styles.statusDot} /><AppText style={styles.statusText}>Staff dashboard</AppText></View>
        </View>

        <View style={[styles.revenueCard, theme.color.primary]}>
          <View style={styles.revenueLeft}><AppText style={styles.revenueLabel}>COMPLETED REVENUE TODAY</AppText><AppText style={styles.revenueAmount}>₱{todayRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</AppText><AppText style={styles.trendText}>{completedToday.length} completed {completedToday.length === 1 ? 'order' : 'orders'} today</AppText></View>
          <View style={styles.chartContainer}>{weekRevenue.map((value, index) => <View key={index} style={[styles.bar, { height: Math.max(5, (value / maxRevenue) * 58), opacity: value ? 0.9 : 0.35 }]} />)}</View>
        </View>

        <View style={styles.gridContainer}>
          <Metric icon={<Feather name="box" size={20} color={theme.color.secondary} />} value={loading ? '—' : String(activeOrders.length)} label="Active orders" />
          <Metric icon={<Feather name="clock" size={20} color={theme.color.secondary} />} value={loading ? '—' : String(readyOrders.length)} label="Ready for pickup" />
          <Metric icon={<Ionicons name="receipt-outline" size={20} color={theme.color.secondary} />} value={loading ? '—' : String(todayOrders.length)} label="Orders today" />
          <Metric icon={<Feather name="users" size={20} color={theme.color.secondary} />} value={loading ? '—' : String(customerCount)} label="Customers with orders" />
        </View>

        <AppText style={styles.sectionTitle}>Quick actions</AppText>
        <View style={styles.quickActionsRow}>
          <Action icon={<MaterialCommunityIcons name="qrcode-scan" size={22} color={theme.color.secondary} />} label="Scan claim pass" onPress={() => router.push('/(staff-tabs)/QRscanning')} />
          <Action icon={<Feather name="plus" size={24} color={theme.color.secondary} />} label="New order" onPress={() => setNewOrderOpen(true)} />
          <Action icon={<Ionicons name="bar-chart-outline" size={22} color={theme.color.secondary} />} label="Sales report" onPress={() => router.push('/(staff-tabs)/report')} />
        </View>

        <View style={styles.sectionHeaderRow}><AppText style={styles.sectionTitle}>Recent orders</AppText><TouchableOpacity onPress={() => router.push('/staffOrders')}><AppText style={[styles.seeAllText, { color: theme.color.secondary }]}>See all</AppText></TouchableOpacity></View>
        <View style={[styles.ordersCard, theme.color.lightBox]}>
          {loading ? <ActivityIndicator color={theme.color.secondary} style={{ padding: 22 }} /> : orders.length === 0 ? <AppText style={styles.emptyText}>No orders yet. Create one to get started.</AppText> : orders.slice(0, 4).map((order, index) => <React.Fragment key={order.id}>
            <TouchableOpacity style={styles.orderRow} onPress={() => router.push('/orders')}>
              <View style={styles.orderAvatar}><AppText style={[styles.orderAvatarText, { color: theme.color.secondary }]}>{(order.customer_name || 'Customer').split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('')}</AppText></View>
              <View style={styles.orderMeta}><AppText style={styles.customerName}>{order.customer_name || 'Customer'}</AppText><AppText style={styles.orderDetails}>#{order.id.slice(0, 8).toUpperCase()} · {order.service_name}</AppText></View>
              <View style={styles.orderPriceCol}><AppText style={styles.priceText}>₱{amountFor(order).toFixed(2)}</AppText><AppText style={styles.statusTag}>{order.status.replace('_', ' ')}</AppText></View>
            </TouchableOpacity>
            {index < Math.min(orders.length, 4) - 1 && <View style={styles.divider} />}
          </React.Fragment>)}
        </View>
      </ScrollView>

      <Modal visible={newOrderOpen} transparent animationType="slide" onRequestClose={() => setNewOrderOpen(false)}>
        <View style={styles.modalBackdrop}><View style={styles.modalSheet}>
          <View style={styles.modalHeader}><View><AppText style={styles.revenueLabelDark}>WALK-IN · STAFF-MANAGED</AppText><AppText style={styles.modalTitle}>New order</AppText></View><TouchableOpacity style={styles.closeButton} onPress={() => setNewOrderOpen(false)}><Feather name="x" size={22} color="#334155" /></TouchableOpacity></View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <AppText style={styles.formLabel}>Customer name</AppText><AppTextInput style={styles.formInput} value={customerName} onChangeText={setCustomerName} placeholder="Enter customer name" />
            <AppText style={styles.formLabel}>Services</AppText><View style={styles.serviceChoices}>{SERVICES.map((service) => { const selected = selectedServices.includes(service.name); return <TouchableOpacity key={service.name} style={[styles.serviceChoice, selected && styles.serviceChoiceSelected]} onPress={() => setSelectedServices((current) => selected ? current.filter((name) => name !== service.name) : [...current, service.name])}><AppText style={[styles.serviceChoiceText, selected && styles.serviceChoiceTextSelected]}>{service.name} · ₱{service.rate} {service.name === 'Ironing' ? 'fixed' : `/${service.unit} estimate`}</AppText></TouchableOpacity>; })}</View>
            <AppText style={styles.formLabel}>Pickup / delivery address</AppText><AppTextInput style={styles.formInput} value={address} onChangeText={setAddress} placeholder="Enter customer address" />
            <AppText style={styles.formLabel}>Additional notes</AppText><AppTextInput style={[styles.formInput, styles.notesInput]} value={notes} onChangeText={setNotes} placeholder="Optional instructions" multiline />
            <AppText style={styles.formLabel}>Order method</AppText><View style={styles.serviceChoices}><TouchableOpacity style={[styles.serviceChoice, pickup && styles.serviceChoiceSelected]} onPress={() => setPickup(true)}><AppText style={[styles.serviceChoiceText, pickup && styles.serviceChoiceTextSelected]}>Pickup & delivery · ₱10</AppText></TouchableOpacity><TouchableOpacity style={[styles.serviceChoice, !pickup && styles.serviceChoiceSelected]} onPress={() => setPickup(false)}><AppText style={[styles.serviceChoiceText, !pickup && styles.serviceChoiceTextSelected]}>Store drop-off · Free</AppText></TouchableOpacity></View>
            <AppText style={styles.formLabel}>Payment method</AppText><View style={styles.serviceChoices}><TouchableOpacity style={[styles.serviceChoice, paymentMethod === 'cash' && styles.serviceChoiceSelected]} onPress={() => setPaymentMethod('cash')}><AppText style={[styles.serviceChoiceText, paymentMethod === 'cash' && styles.serviceChoiceTextSelected]}>Cash</AppText></TouchableOpacity><TouchableOpacity style={[styles.serviceChoice, paymentMethod === 'gcash' && styles.serviceChoiceSelected]} onPress={() => setPaymentMethod('gcash')}><AppText style={[styles.serviceChoiceText, paymentMethod === 'gcash' && styles.serviceChoiceTextSelected]}>GCash</AppText></TouchableOpacity></View>
            <View style={styles.totalRow}><AppText style={styles.formLabel}>Estimated total</AppText><AppText style={styles.formTotal}>₱{estimatedTotal.toFixed(2)}</AppText></View><AppText style={styles.formHint}>This order is managed in the staff workspace. Final weight sets the final price, and pickup stays blocked until staff confirms payment.</AppText>
            <TouchableOpacity style={styles.submitButton} onPress={() => { void submitNewOrder(); }} disabled={saving}>{saving ? <ActivityIndicator color="#fff" /> : <AppText style={styles.submitText}>Create order</AppText>}</TouchableOpacity>
          </ScrollView>
        </View></View>
      </Modal>
    </SafeAreaView>
  );
}

function Metric({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return <View style={[styles.gridCard, theme.color.lightBox]}><View style={styles.cardIconBox}>{icon}</View><View style={styles.cardTextCol}><AppText style={styles.cardValue}>{value}</AppText><AppText style={styles.cardLabel}>{label}</AppText></View></View>;
}

function Action({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress: () => void }) {
  return <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7} onPress={onPress}><View style={styles.actionIconCircle}>{icon}</View><AppText style={styles.actionLabel}>{label}</AppText></TouchableOpacity>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, ...theme.color.lightBackground },
  scrollContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 },
  greetingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  dateText: { fontSize: 13, color: '#64748b', fontWeight: '500', marginBottom: 4 },
  greetingTitle: { fontSize: 26, fontWeight: '800', color: '#0f172a', fontFamily: 'Montserrat_700Bold', lineHeight: 32 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, gap: 6, marginTop: 18, borderWidth: 1, borderColor: '#e2e8f0' },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#16a34a' },
  statusText: { fontSize: 12, fontWeight: '600', color: '#0f172a' },
  revenueCard: { borderRadius: 20, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16, elevation: 2 },
  revenueLeft: { flex: 1 }, revenueLabel: { fontSize: 11, fontWeight: '800', color: '#fff', letterSpacing: 1, opacity: 0.85, marginBottom: 6 },
  revenueLabelDark: { fontSize: 10, fontWeight: '800', color: '#64748b', letterSpacing: 1 },
  revenueAmount: { fontSize: 28, fontWeight: '800', color: '#fff', fontFamily: 'Montserrat_700Bold', marginBottom: 8 },
  trendText: { fontSize: 11, color: '#fff', fontWeight: '600' },
  chartContainer: { flexDirection: 'row', alignItems: 'flex-end', gap: 5, paddingBottom: 4, height: 68 },
  bar: { width: 8, backgroundColor: '#fff', borderRadius: 4 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  gridCard: { width: '48%', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  cardIconBox: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#f0f4fe', alignItems: 'center', justifyContent: 'center' },
  cardTextCol: { flex: 1 }, cardValue: { fontSize: 20, fontWeight: '800', color: '#0f172a', fontFamily: 'Montserrat_700Bold' },
  cardLabel: { fontSize: 10, color: '#64748b', fontWeight: '500', marginTop: 1 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', fontFamily: 'Montserrat_700Bold' },
  quickActionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 14 },
  actionBtn: { alignItems: 'center', flex: 1 }, actionIconCircle: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  actionLabel: { fontSize: 11, fontWeight: '600', color: '#0f172a', textAlign: 'center' },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 12 },
  seeAllText: { fontSize: 13, fontWeight: '700' },
  ordersCard: { borderRadius: 18, paddingHorizontal: 16, paddingVertical: 6, borderWidth: 1, borderColor: '#e2e8f0' },
  orderRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  orderAvatar: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#f0f4fe', alignItems: 'center', justifyContent: 'center' },
  orderAvatarText: { fontSize: 12, fontWeight: '700' }, orderMeta: { flex: 1, marginLeft: 12 },
  customerName: { fontSize: 14, fontWeight: '700', color: '#0f172a' }, orderDetails: { fontSize: 11, color: '#64748b', marginTop: 2 },
  orderPriceCol: { alignItems: 'flex-end' }, priceText: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  statusTag: { fontSize: 10, fontWeight: '700', color: theme.color.secondary, marginTop: 2, textTransform: 'capitalize' },
  divider: { height: 1, backgroundColor: '#f1f5f9' }, emptyText: { textAlign: 'center', padding: 20, color: '#64748b' },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.45)' },
  modalSheet: { maxHeight: '92%', backgroundColor: '#f8fafc', borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 28 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }, modalTitle: { fontSize: 25, fontWeight: '800', color: '#0f172a', fontFamily: 'Montserrat_700Bold' },
  closeButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#e2e8f0' },
  formLabel: { color: '#334155', fontWeight: '700', fontSize: 13, marginTop: 16, marginBottom: 8 },
  formInput: { minHeight: 46, borderRadius: 12, borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#0f172a' },
  notesInput: { minHeight: 74, textAlignVertical: 'top' }, serviceChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  serviceChoice: { borderRadius: 12, borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#fff', paddingHorizontal: 11, paddingVertical: 9 },
  serviceChoiceSelected: { borderColor: theme.color.secondary, backgroundColor: '#eaf2ff' }, serviceChoiceText: { color: '#475569', fontSize: 12, fontWeight: '600' },
  serviceChoiceTextSelected: { color: theme.color.secondary, fontWeight: '800' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 },
  formTotal: { fontSize: 20, color: theme.color.secondary, fontWeight: '800', fontFamily: 'Montserrat_700Bold' }, formHint: { fontSize: 12, color: '#64748b', marginTop: 4 },
  submitButton: { minHeight: 50, marginTop: 20, borderRadius: 14, backgroundColor: theme.color.secondary, alignItems: 'center', justifyContent: 'center' },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});

