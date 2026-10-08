import AppText from '@/components/ui/app-text';
import AppTextInput from '@/components/ui/app-text-input';
import Feather from '@expo/vector-icons/Feather';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ActivityIndicator, Alert, FlatList, Modal, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { requireSupabase } from '../utils/supabase';
import { theme } from '../constants/app-theme';

export default function OrdersRoute() {
  const [role, setRole] = useState<'staff' | 'customer' | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadRole = async () => {
      try {
        const client = requireSupabase();
        const { data: { user }, error: userError } = await client.auth.getUser();
        if (userError) throw userError;
        if (!user) throw new Error('Sign in to continue.');
        const { data: profile, error } = await client.from('profiles').select('role').eq('id', user.id).single();
        if (error) throw error;
        if (mounted) setRole(profile.role === 'staff' ? 'staff' : 'customer');
      } catch (error) {
        Alert.alert('Unable to open orders', error instanceof Error ? error.message : 'Please try again.');
      }
    };
    void loadRole();
    return () => { mounted = false; };
  }, []);

  if (role === 'staff') return <StaffOrdersScreen />;
  if (role === 'customer') return <CustomerCreateOrderScreen />;
  return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator color={theme.color.secondary} /></View>;
}
type OrderService = { service_name: string; quantity: number; quantity_unit: string; estimated_total: number; final_quantity: number | null; final_total: number | null };
type Order = { id: string; customer_name: string; service_name: string; quantity: number; quantity_unit: string; estimated_total: number; delivery_fee: number; address: string; notes: string | null; pickup_delivery: boolean; final_quantity: number | null; final_total: number | null; status: string; created_at: string; completed_at: string | null; payment_method?: 'cash' | 'gcash'; payment_reference?: string | null; payment_status?: 'unpaid' | 'pending_verification' | 'paid'; payment_verified_at?: string | null; payment_verified_by?: string | null; order_services?: OrderService[] };
const FILTER_KEYS = ['Active', 'New', 'In progress', 'Ready'] as const;
const STATUS_LABELS: Record<string, string> = { received: 'New', washing: 'Washing', drying: 'Drying', ready: 'Ready', completed: 'Completed', cancelled: 'Cancelled' };
const PAYMENT_STATUS_LABELS: Record<string, string> = { unpaid: 'Unpaid', pending_verification: 'Awaiting verification', paid: 'Paid' };
const SERVICES = [
  { name: 'Wash & Fold', unit: 'kg', rate: 45 }, { name: 'Ironing', unit: 'kg', rate: 35 },
  { name: 'Dry Cleaning', unit: 'item', rate: 120 }, { name: 'Wash & Iron', unit: 'kg', rate: 65 },
  { name: 'Self Service', unit: 'kg', rate: 65 },
] as const;

export function StaffOrdersScreen() {
  const router = useRouter();
  const { orderId: requestedOrderId } = useLocalSearchParams<{ orderId?: string | string[] }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('Active');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [addressDraft, setAddressDraft] = useState('');
  const [notesDraft, setNotesDraft] = useState('');
  const [finalQuantityDraft, setFinalQuantityDraft] = useState('');
  const [statusDraft, setStatusDraft] = useState('received');
  const [serviceDrafts, setServiceDrafts] = useState<string[]>([SERVICES[0].name]);
  const [pickupDraft, setPickupDraft] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await requireSupabase().from('orders').select('*, order_services(*)').order('created_at', { ascending: false });
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
    Active: orders.filter((item) => !['completed', 'cancelled'].includes(item.status)).length,
    New: orders.filter((item) => item.status === 'received').length,
    'In progress': orders.filter((item) => ['washing', 'drying'].includes(item.status)).length,
    Ready: orders.filter((item) => item.status === 'ready').length,
  }), [orders]);

  const filteredOrders = orders.filter((item) => {
    const category = item.status === 'received' ? 'New' : ['washing', 'drying'].includes(item.status) ? 'In progress' : item.status === 'ready' ? 'Ready' : 'Other';
    const customer = item.customer_name ?? 'Customer';
    return (activeFilter === 'Active' ? !['completed', 'cancelled'].includes(item.status) : category === activeFilter) &&
      `${customer} ${item.id}`.toLowerCase().includes(searchQuery.toLowerCase());
  });
  const selectedServiceOptions = SERVICES.filter((service) => serviceDrafts.includes(service.name));
  const serviceEstimate = selectedServiceOptions.reduce((sum, service) => sum + service.rate, 0);
  const finalQuantity = Number(finalQuantityDraft);
  const selectedMeasuredServices = selectedServiceOptions.filter((service) => service.name !== 'Ironing');
  const hasValidFinalQuantity = Number.isFinite(finalQuantity) && finalQuantity > 0;
  const finalEstimateComplete = selectedServiceOptions.length > 0 && (selectedMeasuredServices.length === 0 || hasValidFinalQuantity);
  const finalEstimate = selectedServiceOptions.reduce((sum, service) => sum + (service.name === 'Ironing' ? service.rate : hasValidFinalQuantity ? finalQuantity * service.rate : 0), pickupDraft ? 10 : 0);

  const openOrder = useCallback((order: Order) => {
    setSelectedOrder(order);
    setAddressDraft(order.address ?? '');
    setNotesDraft(order.notes ?? '');
    setStatusDraft(order.status);
    const serviceLines = order.order_services ?? [];
    const selectedNames = serviceLines.length ? serviceLines.map((line) => line.service_name) : [order.service_name];
    setServiceDrafts(selectedNames);
    const existingFinalQuantity = order.final_quantity ?? serviceLines.find((line) => line.final_quantity !== null)?.final_quantity;
    setFinalQuantityDraft(existingFinalQuantity ? String(existingFinalQuantity) : '');
    setPickupDraft(order.pickup_delivery);
    setExpandedSection(null);
  }, []);

  useEffect(() => {
    const orderId = Array.isArray(requestedOrderId) ? requestedOrderId[0] : requestedOrderId;
    if (!orderId) return;
    const matchingOrder = orders.find((order) => order.id === orderId);
    if (matchingOrder) openOrder(matchingOrder);
  }, [openOrder, orders, requestedOrderId]);

  const confirmAndSave = () => {
    if (selectedOrder && selectedOrder.status !== statusDraft) {
      Alert.alert('Confirm status change', `Change status from "${STATUS_LABELS[selectedOrder.status] ?? selectedOrder.status}" to "${STATUS_LABELS[statusDraft] ?? statusDraft}"?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm change', onPress: () => { void saveOrderChanges(); } },
      ]);
      return;
    }
    void saveOrderChanges();
  };

  const saveOrderChanges = async () => {
    if (!selectedOrder) return;
    if (!addressDraft.trim()) { Alert.alert('Address required', 'Enter the order address before saving.'); return; }
    const selectedServices = SERVICES.filter((item) => serviceDrafts.includes(item.name));
    if (!selectedServices.length) { Alert.alert('Choose a service', 'An order must include at least one service.'); return; }
    const existingLines = selectedOrder.order_services ?? [];
    const nextLines: OrderService[] = [];
    const finalQuantityInput = finalQuantityDraft.trim() ? Number(finalQuantityDraft) : null;
    if (finalQuantityInput !== null && (!Number.isFinite(finalQuantityInput) || finalQuantityInput <= 0)) {
      Alert.alert('Invalid final amount', 'Enter one positive weight or item count for the order.');
      return;
    }
    for (const service of selectedServices) {
      const quantity = existingLines.find((line) => line.service_name === service.name)?.quantity ?? 1;
      nextLines.push({
        service_name: service.name,
        quantity,
        quantity_unit: service.unit,
        estimated_total: Number((service.name === 'Ironing' ? service.rate : quantity * service.rate).toFixed(2)),
        final_quantity: service.name === 'Ironing' ? null : finalQuantityInput,
        final_total: service.name === 'Ironing' ? service.rate : finalQuantityInput === null ? null : Number((finalQuantityInput * service.rate).toFixed(2)),
      });
    }
    const deliveryFee = pickupDraft ? (Number(selectedOrder.delivery_fee ?? 0) > 0 ? 10 : 0) : 0;
    const allFinalAmountsEntered = selectedServices.every((service) => service.name === 'Ironing' || finalQuantityInput !== null);
    const orderFinalQuantity = selectedServices.some((service) => service.name !== 'Ironing') ? finalQuantityInput : null;
    const finalTotal = allFinalAmountsEntered
      ? Number((nextLines.reduce((sum, line) => sum + (line.final_total ?? 0), 0) + deliveryFee).toFixed(2))
      : null;
    setSaving(true);
    try {
      const changes = {
        address: addressDraft.trim(), notes: notesDraft.trim() || null, status: statusDraft,
        service_name: selectedServices.map((item) => item.name).join(', '),
        quantity_unit: selectedServices[0].unit, final_quantity: orderFinalQuantity,
        estimated_total: Number(nextLines.reduce((sum, line) => sum + line.estimated_total, 0).toFixed(2)),
        pickup_delivery: pickupDraft, delivery_fee: deliveryFee, final_total: finalTotal,
        completed_at: statusDraft === 'completed' ? selectedOrder.completed_at ?? new Date().toISOString() : null,
      };
      const client = requireSupabase();
      const retainedLines = nextLines.filter((line) => existingLines.some((existing) => existing.service_name === line.service_name));
      const newLines = nextLines.filter((line) => !existingLines.some((existing) => existing.service_name === line.service_name));
      const updates = retainedLines.map((line) => client.from('order_services')
        .update({ quantity: line.quantity, quantity_unit: line.quantity_unit, estimated_total: line.estimated_total, final_quantity: line.final_quantity, final_total: line.final_total })
        .eq('order_id', selectedOrder.id)
        .eq('service_name', line.service_name));
      const updateResults = await Promise.all(updates);
      const updateError = updateResults.find((result) => result.error)?.error;
      if (updateError) throw updateError;
      if (newLines.length) {
        const { error: insertError } = await client.from('order_services').insert(newLines.map((line) => ({ ...line, order_id: selectedOrder.id })));
        if (insertError) throw insertError;
      }
      const removedNames = existingLines.map((line) => line.service_name).filter((name) => !serviceDrafts.includes(name));
      if (removedNames.length) {
        const { error: deleteError } = await client.from('order_services').delete().eq('order_id', selectedOrder.id).in('service_name', removedNames);
        if (deleteError) throw deleteError;
      }
      const { error } = await client.from('orders').update(changes).eq('id', selectedOrder.id);
      if (error) throw error;
      setOrders((current) => current.map((item) => item.id === selectedOrder.id ? { ...item, ...changes, order_services: nextLines } : item));
      setSelectedOrder(null);
    } catch (error) {
      const databaseError = error && typeof error === 'object' ? error as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown } : {};
      const message = typeof databaseError.message === 'string' ? databaseError.message : error instanceof Error ? error.message : String(error);
      const details = typeof databaseError.details === 'string' ? databaseError.details : '';
      const hint = typeof databaseError.hint === 'string' ? databaseError.hint : '';
      const code = typeof databaseError.code === 'string' ? `Code: ${databaseError.code}` : '';
      console.error('Order update failed:', error);
      Alert.alert('Unable to save order changes', [message, code, details, hint].filter(Boolean).join('\n') || 'Unknown database error.');
    } finally { setSaving(false); }
  };

  const confirmPayment = () => {
    if (!selectedOrder || selectedOrder.payment_status === 'paid') return;
    const method = selectedOrder.payment_method ?? 'cash';
    const message = method === 'gcash'
      ? `Confirm that you checked GCash and verified reference ${selectedOrder.payment_reference ?? ''}?`
      : 'Confirm that you received the cash payment for this order?';
    Alert.alert('Verify payment', message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Mark as paid', onPress: () => { void markPaymentAsPaid(); } },
    ]);
  };

  const markPaymentAsPaid = async () => {
    if (!selectedOrder || verifyingPayment) return;
    setVerifyingPayment(true);
    try {
      const client = requireSupabase();
      const { data: { user }, error: userError } = await client.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Sign in again to verify this payment.');
      const { data: payment, error } = await client.from('orders')
        .update({ payment_status: 'paid', payment_verified_at: new Date().toISOString(), payment_verified_by: user.id })
        .eq('id', selectedOrder.id)
        .neq('payment_status', 'paid')
        .select('payment_status,payment_verified_at,payment_verified_by')
        .single();
      if (error) throw error;
      const verifiedOrder = { ...selectedOrder, ...payment };
      setOrders((current) => current.map((order) => order.id === selectedOrder.id ? { ...order, ...payment } : order));
      setSelectedOrder(verifiedOrder);
    } catch (error) {
      Alert.alert('Unable to verify payment', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setVerifyingPayment(false);
    }
  };

  return (
    <View style={staffStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f0f0f0" animated />
      <View style={staffStyles.headerBlock}>
        <View><AppText style={staffStyles.categoryTag}>OPERATIONS</AppText><AppText style={staffStyles.title}>All orders</AppText></View>
        <TouchableOpacity style={staffStyles.historyButton} onPress={() => router.push('/history')}><Feather name="archive" size={16} color={theme.color.secondary} /><AppText style={staffStyles.historyButtonText}>History</AppText></TouchableOpacity>
      </View>
      <View style={staffStyles.searchContainer}>
        <Feather name="search" size={18} color="#94a3b8" style={staffStyles.searchIcon} />
        <AppTextInput style={staffStyles.searchInput} placeholder="Search customer or order ID" placeholderTextColor="#94a3b8" value={searchQuery} onChangeText={setSearchQuery} />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={staffStyles.filterScrollView}
        contentContainerStyle={staffStyles.filterRow}
      >
        {FILTER_KEYS.map((key) => {
          const selected = activeFilter === key;
          return <TouchableOpacity key={key} style={[staffStyles.filterChip, selected ? staffStyles.activeChip : staffStyles.inactiveChip]} onPress={() => setActiveFilter(key)} activeOpacity={0.8}>
            <AppText style={[staffStyles.filterText, selected && staffStyles.activeFilterText]}>{key}</AppText>
            <AppText style={[staffStyles.badgeCount, selected && staffStyles.activeBadgeCount]}>{counts[key]}</AppText>
          </TouchableOpacity>;
        })}
      </ScrollView>
      {loading ? (
        <ActivityIndicator color={theme.color.secondary} style={{ marginTop: 28 }} />
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          style={staffStyles.listContainer}
          contentContainerStyle={staffStyles.listContent}
          ItemSeparatorComponent={() => <View style={staffStyles.separator} />}
          ListEmptyComponent={<AppText style={staffStyles.emptyText}>No orders found.</AppText>}
          renderItem={({ item }) => {
            const customer = item.customer_name ?? 'Customer';
            const initials = customer.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'C';
            const status = STATUS_LABELS[item.status] ?? item.status;
            const badge = item.status === 'received' ? { bg: '#e0f2fe', text: theme.color.secondary } : item.status === 'washing' ? { bg: '#e0e7ff', text: '#4338ca' } : item.status === 'drying' ? { bg: '#ffedd5', text: '#c2410c' } : item.status === 'ready' ? { bg: '#dcfce7', text: '#15803d' } : { bg: '#f1f5f9', text: '#64748b' };
            return (
              <TouchableOpacity style={staffStyles.orderCard} activeOpacity={0.7} onPress={() => openOrder(item)}>
                <View style={staffStyles.avatarCircle}><AppText style={staffStyles.avatarText}>{initials}</AppText></View>
                <View style={staffStyles.orderInfo}>
                  <AppText style={staffStyles.orderMetaText}>{item.id.slice(0, 8).toUpperCase()} | {new Date(item.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</AppText>
                  <AppText style={staffStyles.customerName} numberOfLines={1}>{customer}</AppText>
                  <AppText style={staffStyles.serviceText} numberOfLines={1}>{item.service_name} | {item.quantity_unit === 'kg' ? (item.final_quantity ? `Final ${item.final_quantity} kg` : 'Weight pending') : `Estimated ${item.quantity} item(s)`}</AppText>
                </View>
                <View style={staffStyles.rightCol}>
                  <AppText style={staffStyles.priceText}>${Number(item.final_total ?? (item.estimated_total + Number(item.delivery_fee ?? 0))).toFixed(2)}</AppText>
                  <View style={[staffStyles.statusBadge, { backgroundColor: badge.bg }]}><AppText style={[staffStyles.statusText, { color: badge.text }]}>{status}</AppText></View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
      <Modal visible={Boolean(selectedOrder)} transparent animationType="slide" onRequestClose={() => setSelectedOrder(null)}>
        <View style={staffStyles.modalBackdrop}>
          <View style={staffStyles.modalSheet}>
            <View style={staffStyles.modalHeader}>
              <View><AppText style={staffStyles.modalEyebrow}>ORDER DETAILS</AppText><AppText style={staffStyles.modalTitle}>{selectedOrder?.customer_name}</AppText></View>
              <TouchableOpacity style={staffStyles.closeButton} onPress={() => setSelectedOrder(null)}><Feather name="x" size={22} color="#334155" /></TouchableOpacity>
            </View>
            {selectedOrder && <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <AppText style={staffStyles.orderMetaText}>#{selectedOrder.id.slice(0, 8).toUpperCase()} | {new Date(selectedOrder.created_at).toLocaleString()}</AppText>
              <TouchableOpacity style={staffStyles.dropdownHeader} onPress={() => setExpandedSection(expandedSection === 'service' ? null : 'service')}><AppText style={staffStyles.modalLabel}>Services</AppText><AppText style={staffStyles.dropdownValue}>{serviceDrafts.length} selected | {expandedSection === 'service' ? 'Done' : 'Edit'} <Feather name={expandedSection === 'service' ? 'chevron-up' : 'chevron-down'} size={16} /></AppText></TouchableOpacity>
              {expandedSection === 'service' && <View style={staffStyles.modalChoices}>{SERVICES.map((item) => {
                const selected = serviceDrafts.includes(item.name);
                return <TouchableOpacity key={item.name} style={[staffStyles.modalChoice, selected && staffStyles.modalChoiceSelected]} onPress={() => setServiceDrafts((current) => selected ? current.filter((name) => name !== item.name) : [...current, item.name])}><AppText style={[staffStyles.modalChoiceText, selected && staffStyles.modalChoiceTextSelected]}>{selected ? '[x] ' : '[ ] '}{item.name} | ${item.rate}{item.name === 'Ironing' ? ' flat' : `/${item.unit}`}</AppText></TouchableOpacity>;
              })}</View>}
              <TouchableOpacity style={staffStyles.dropdownHeader} onPress={() => setExpandedSection(expandedSection === 'status' ? null : 'status')}><AppText style={staffStyles.modalLabel}>Order status</AppText><AppText style={staffStyles.dropdownValue}>{STATUS_LABELS[statusDraft] ?? statusDraft} <Feather name={expandedSection === 'status' ? 'chevron-up' : 'chevron-down'} size={16} /></AppText></TouchableOpacity>
              {expandedSection === 'status' && <View style={staffStyles.modalChoices}>{Object.entries(STATUS_LABELS).map(([key, label]) => <TouchableOpacity key={key} style={[staffStyles.modalChoice, statusDraft === key && staffStyles.modalChoiceSelected]} onPress={() => { setStatusDraft(key); setExpandedSection(null); }}><AppText style={[staffStyles.modalChoiceText, statusDraft === key && staffStyles.modalChoiceTextSelected]}>{label}</AppText></TouchableOpacity>)}</View>}
              <TouchableOpacity style={staffStyles.dropdownHeader} onPress={() => setExpandedSection(expandedSection === 'address' ? null : 'address')}><AppText style={staffStyles.modalLabel}>Address</AppText><AppText style={staffStyles.dropdownValue} numberOfLines={1}>{addressDraft || 'Add address'} <Feather name={expandedSection === 'address' ? 'chevron-up' : 'chevron-down'} size={16} /></AppText></TouchableOpacity>
              {expandedSection === 'address' && <AppTextInput style={staffStyles.modalInput} value={addressDraft} onChangeText={setAddressDraft} multiline />}
              <TouchableOpacity style={staffStyles.dropdownHeader} onPress={() => setExpandedSection(expandedSection === 'notes' ? null : 'notes')}><AppText style={staffStyles.modalLabel}>Additional notes</AppText><AppText style={staffStyles.dropdownValue} numberOfLines={1}>{notesDraft || 'None'} <Feather name={expandedSection === 'notes' ? 'chevron-up' : 'chevron-down'} size={16} /></AppText></TouchableOpacity>
              {expandedSection === 'notes' && <AppTextInput style={[staffStyles.modalInput, staffStyles.modalMultiline]} value={notesDraft} onChangeText={setNotesDraft} placeholder="Add order notes" multiline />}
              <AppText style={staffStyles.modalLabel}>Service method</AppText>
              <AppText style={staffStyles.modalReadOnly}>{pickupDraft ? `Pickup & delivery | $${Number(selectedOrder.delivery_fee ?? 0).toFixed(2)} fee` : 'Store drop-off | Free'}</AppText>
               <AppText style={staffStyles.modalLabel}>Payment</AppText>
               <AppText style={staffStyles.modalReadOnly}>
                 {(selectedOrder.payment_method ?? 'cash') === 'gcash' ? 'GCash' : 'Cash'} | {PAYMENT_STATUS_LABELS[selectedOrder.payment_status ?? 'unpaid'] ?? 'Unpaid'}
               </AppText>
               {selectedOrder.payment_reference ? <AppText style={staffStyles.paymentReference}>Reference: {selectedOrder.payment_reference}</AppText> : null}
               {selectedOrder.payment_status !== 'paid' ? <>
                 <AppText style={staffStyles.paymentVerifyHint}>
                   {(selectedOrder.payment_method ?? 'cash') === 'gcash' ? 'Check the reference against the shop’s GCash transaction before confirming.' : 'Confirm after receiving the cash payment.'}
                 </AppText>
                 <TouchableOpacity style={staffStyles.verifyPaymentButton} onPress={confirmPayment} disabled={verifyingPayment || saving}>
                   {verifyingPayment ? <ActivityIndicator color="#ffffff" /> : <AppText style={staffStyles.verifyPaymentText}>Mark payment as paid</AppText>}
                 </TouchableOpacity>
               </> : null}
              {selectedMeasuredServices.length > 0 ? <>
                <AppText style={staffStyles.modalLabel}>Final {selectedMeasuredServices.every((service) => service.unit === 'kg') ? 'weight (kg)' : selectedMeasuredServices.every((service) => service.unit === 'item') ? 'item count' : 'amount (kg / items)'}</AppText>
                <AppTextInput style={staffStyles.modalInput} value={finalQuantityDraft} onChangeText={setFinalQuantityDraft} keyboardType="decimal-pad" placeholder="Enter final amount for the order" />
                <AppText style={staffStyles.helpText}>Ironing has a fixed $35 charge and is not affected by this amount.</AppText>
              </> : <AppText style={staffStyles.helpText}>Ironing is a fixed $35 service; no weight is needed.</AppText>}
              <View style={staffStyles.modalPriceRow}><AppText style={staffStyles.modalPriceLabel}>Services + delivery</AppText><AppText style={staffStyles.modalPrice}>${(serviceEstimate + (pickupDraft ? 10 : 0)).toFixed(2)}</AppText></View>
              {finalEstimateComplete ? <View style={staffStyles.modalPriceRow}><AppText style={staffStyles.modalPriceLabel}>Final total</AppText><AppText style={staffStyles.modalPrice}>${finalEstimate.toFixed(2)}</AppText></View> : null}
              <TouchableOpacity style={staffStyles.saveChangesButton} onPress={confirmAndSave} disabled={saving}>{saving ? <ActivityIndicator color="#fff" /> : <AppText style={staffStyles.saveChangesText}>Save changes</AppText>}</TouchableOpacity>
            </ScrollView>}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const staffStyles = StyleSheet.create({
  container: { flex: 1, ...theme.color.lightBackground, paddingHorizontal: 20, paddingTop: 16 },
  headerBlock: { marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  historyButton: { backgroundColor: '#eaf2ff', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12 },
  historyButtonText: { color: theme.color.secondary, fontWeight: '700', fontSize: 12 },
  categoryTag: { fontSize: 11, fontWeight: '800', color: '#64748b', letterSpacing: 1, textTransform: 'uppercase' },
  title: { fontSize: 32, fontWeight: '800', color: '#0f172a', marginTop: 4 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 24, paddingHorizontal: 16, height: 48, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 16 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 14, color: '#0f172a' },
  filterScrollView: { flexGrow: 0, marginBottom: 16 },
  filterRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    alignSelf: 'flex-start',
    justifyContent: 'center'
  },
  activeChip: { backgroundColor: '#5881ea' },
  inactiveChip: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0' },
  filterText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  activeFilterText: { color: '#ffffff' },
  badgeCount: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  activeBadgeCount: { color: '#a7f3d0' },
  listContainer: { flex: 1 },
  listContent: { paddingBottom: 40 },
  orderCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  avatarCircle: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#e2e8f0', ...theme.spacing.trueCenter },
  avatarText: { fontSize: 13, fontWeight: '700', color: '#475569' },
  orderInfo: { flex: 1, marginLeft: 14, marginRight: 8 },
  orderMetaText: { fontSize: 11, fontWeight: '600', color: '#94a3b8' },
  customerName: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginVertical: 2 },
  serviceText: { fontSize: 12, color: '#64748b' },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.45)' },
  modalSheet: { maxHeight: '92%', backgroundColor: '#f8fafc', borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 30 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalEyebrow: { fontSize: 10, letterSpacing: 1.2, fontWeight: '800', color: '#64748b' },
  modalTitle: { fontSize: 23, fontWeight: '800', color: '#0f172a', marginTop: 3 },
  closeButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#e2e8f0' },
  modalLabel: { color: '#334155', fontWeight: '700', fontSize: 13, marginTop: 18, marginBottom: 8 },
  dropdownHeader: { minHeight: 54, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', justifyContent: 'center', marginBottom: 10 },
  dropdownValue: { color: theme.color.secondary, fontSize: 14, fontWeight: '700', marginTop: -3 },
  modalChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  modalChoice: { borderRadius: 12, borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 9 },
  modalChoiceSelected: { backgroundColor: '#eaf2ff', borderColor: theme.color.secondary },
  modalChoiceText: { color: '#475569', fontSize: 12, fontWeight: '600' },
  modalChoiceTextSelected: { color: theme.color.secondary, fontWeight: '800' },
  modalInput: { minHeight: 46, borderRadius: 12, borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#0f172a' },
  helpText: { color: '#64748b', fontSize: 12, marginTop: 6 },
  modalReadOnly: { color: '#475569', fontSize: 14, paddingVertical: 8 },
  paymentReference: { color: '#334155', fontSize: 13, fontWeight: '700', marginTop: 3 },
  paymentVerifyHint: { color: '#64748b', fontSize: 12, lineHeight: 18, marginTop: 8 },
  verifyPaymentButton: { minHeight: 46, marginTop: 12, borderRadius: 12, backgroundColor: '#15803d', alignItems: 'center', justifyContent: 'center' },
  verifyPaymentText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
  modalMultiline: { minHeight: 76, textAlignVertical: 'top' },
  modalPriceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 },
  modalPriceLabel: { color: '#475569', fontSize: 12, fontWeight: '600' },
  modalPrice: { color: theme.color.secondary, fontSize: 14, fontWeight: '800' },
  saveChangesButton: { minHeight: 50, marginTop: 22, borderRadius: 14, backgroundColor: theme.color.secondary, alignItems: 'center', justifyContent: 'center' },
  saveChangesText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  rightCol: { alignItems: 'flex-end', gap: 6, minWidth: 80 },
  priceText: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '700' },
  separator: { height: 1, backgroundColor: '#f1f5f9' },
  emptyText: { textAlign: 'center', color: '#64748b', padding: 32 },
});

const CUSTOMER_SERVICES = [
  { id: '1', name: 'Wash & Fold', unitPrice: 45, unit: 'kg', icon: 'washing-machine' },
  { id: '2', name: 'Ironing', unitPrice: 35, unit: 'fixed', icon: 'iron' },
  { id: '3', name: 'Dry Cleaning', unitPrice: 120, unit: 'item', icon: 'tshirt-crew-outline' },
  { id: '4', name: 'Self Service', unitPrice: 65, unit: 'kg', icon: 'water-outline' },
];
const PICKUP_FEE = 10;
const PREVIEW_ADD_ONS = [
  { id: 'addon-1', name: 'Optional add-on 1' },
  { id: 'addon-2', name: 'Optional add-on 2' },
  { id: 'addon-3', name: 'Optional add-on 3' },
];

export function CustomerCreateOrderScreen() {
  const router = useRouter();
  const { service: requestedService } = useLocalSearchParams<{ service?: string | string[] }>();
  const [selectedServices, setSelectedServices] = useState<string[]>(['1']);
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [pickup, setPickup] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'gcash'>('cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [activeOrderCount, setActiveOrderCount] = useState(0);
  const [serviceListOpen, setServiceListOpen] = useState(false);
  const [previewQuantities, setPreviewQuantities] = useState<Record<string, string>>({});
  const [previewAddOns, setPreviewAddOns] = useState<string[]>([]);
  const chosenServices = CUSTOMER_SERVICES.filter((item) => selectedServices.includes(item.id));

  useEffect(() => {
    const serviceName = Array.isArray(requestedService) ? requestedService[0] : requestedService;
    const service = CUSTOMER_SERVICES.find((item) => item.name === serviceName);
    if (service) setSelectedServices([service.id]);
  }, [requestedService]);

  const serviceEstimate = useMemo(() => chosenServices.reduce((sum, item) => sum + item.unitPrice, 0), [chosenServices]);
  const total = serviceEstimate + (pickup ? PICKUP_FEE : 0);
  const quantityPreviewTotal = chosenServices.reduce((sum, item) => {
    if (item.unit === 'fixed') return sum + item.unitPrice;
    const quantity = Number(previewQuantities[item.id]);
    return sum + (Number.isFinite(quantity) && quantity > 0 ? quantity * item.unitPrice : 0);
  }, pickup ? PICKUP_FEE : 0);

  useEffect(() => {
    let active = true;
    const loadSavedAddress = async () => {
      try {
        const client = requireSupabase();
        const { data: { user } } = await client.auth.getUser();
        if (!user) return;
        const [{ data: profile }, { data: previousOrder }] = await Promise.all([
          client.from('profiles').select('address').eq('id', user.id).single(),
          client.from('orders').select('address').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        ]);
        if (active) setAddress(previousOrder?.address || profile?.address || '');
      } catch {
        // Keep the address field editable if saved details are unavailable.
      }
    };
    void loadSavedAddress();
    return () => { active = false; };
  }, []);

  const persistOrder = async (client: ReturnType<typeof requireSupabase>, user: { id: string; email?: string | null }) => {
    const { data: profile, error: profileError } = await client.from('profiles').select('full_name').eq('id', user.id).single();
    if (profileError) throw profileError;
    const { data: orderId, error } = await client.rpc('create_order_with_payment', {
      p_customer_name: profile.full_name || user.email || 'Customer',
      p_address: address.trim(),
      p_notes: notes.trim() || null,
      p_pickup_delivery: pickup,
      p_service_names: chosenServices.map((selected) => selected.name),
      p_payment_method: paymentMethod,
      p_payment_reference: paymentMethod === 'gcash' ? paymentReference.trim() : null,
    });
    if (error) throw error;
    if (!orderId) throw new Error('The order was created without an order ID.');
    router.replace('/(customer-tabs)/orderDetails');
  };

  const submitOrder = async () => {
    if (saving) return;
    if (!chosenServices.length || !address.trim()) {
      Alert.alert('Check your order', 'Choose at least one service and enter a pickup or delivery address.');
      return;
    }
    if (paymentMethod === 'gcash' && !paymentReference.trim()) {
      Alert.alert('GCash reference required', 'Enter the reference number from your GCash payment.');
      return;
    }
    if (paymentReference.trim().length > 100) {
      Alert.alert('Reference is too long', 'Keep the payment reference under 100 characters.');
      return;
    }
    setSaving(true);
    try {
      const client = requireSupabase();
      const { data: { user }, error: userError } = await client.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Sign in before creating an order.');
      const { count, error: countError } = await client.from('orders').select('id', { count: 'exact', head: true }).eq('user_id', user.id).in('status', ['received', 'washing', 'drying', 'ready']);
      if (countError) throw countError;
      if ((count ?? 0) > 0) {
        setActiveOrderCount(count ?? 0);
        setConfirmationText('');
        setConfirmationOpen(true);
        return;
      }
      await persistOrder(client, user);
    } catch (error) {
      Alert.alert('Unable to create order', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const confirmAndCreate = async () => {
    if (confirmationText.trim().toUpperCase() !== 'CONFIRM') {
      Alert.alert('Confirmation required', 'Type CONFIRM exactly to place another order.');
      return;
    }
    setConfirmationOpen(false);
    setSaving(true);
    try {
      const client = requireSupabase();
      const { data: { user }, error } = await client.auth.getUser();
      if (error) throw error;
      if (!user) throw new Error('Sign in before creating an order.');
      await persistOrder(client, user);
    } catch (error) {
      Alert.alert('Unable to create order', error instanceof Error ? error.message : 'Please try again.');
    } finally { setSaving(false); }
  };

  return (
    <ScrollView
      contentContainerStyle={customerStyles.container}
      style={customerStyles.containerStyle}
      showsVerticalScrollIndicator={false}
    >
      <View style={customerStyles.header}>
        <TouchableOpacity
          style={customerStyles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#0f172a" />
        </TouchableOpacity>

        <View>
          <AppText style={customerStyles.subtitle}>LAUNDRY SERVICE</AppText>
          <AppText style={customerStyles.title}>Create Order</AppText>
        </View>
      </View>

      <View style={customerStyles.comingSoonCard}>
        <View style={customerStyles.comingSoonIcon}>
          <Ionicons name="cloud-offline-outline" size={19} color={theme.color.secondary} />
        </View>
        <View style={customerStyles.comingSoonCopy}>
          <AppText style={customerStyles.comingSoonTitle}>Offline ordering · Coming soon</AppText>
          <AppText style={customerStyles.comingSoonText}>Orders must be submitted while connected. Drafts are not saved on this device yet.</AppText>
        </View>
      </View>

      <AppText style={customerStyles.sectionTitle}>Choose a service</AppText>
      <View style={customerStyles.servicesContainer}>
        <TouchableOpacity style={[customerStyles.serviceCard, customerStyles.servicePicker]} onPress={() => setServiceListOpen((open) => !open)} activeOpacity={0.8} accessibilityRole="button" accessibilityState={{ expanded: serviceListOpen }}>
          <View style={[customerStyles.serviceIcon, customerStyles.serviceIconSelected]}><MaterialCommunityIcons name="washing-machine" size={24} color="#ffffff" /></View>
          <View style={customerStyles.serviceInfo}><AppText style={customerStyles.serviceName}>{selectedServices.length ? `${selectedServices.length} service${selectedServices.length > 1 ? 's' : ''} selected` : 'Choose services'}</AppText><AppText style={customerStyles.servicePrice}>{chosenServices.map((item) => item.name).join(', ') || 'Tap to choose one or more'}</AppText></View>
          <Ionicons name={serviceListOpen ? 'chevron-up' : 'chevron-down'} size={20} color={theme.color.secondary} />
        </TouchableOpacity>
        {serviceListOpen && CUSTOMER_SERVICES.map((service) => {
          const selected = selectedServices.includes(service.id);

          return (
            <TouchableOpacity
              key={service.id}
              style={[
                customerStyles.serviceCard,
                selected && customerStyles.serviceCardSelected,
              ]}
              onPress={() => setSelectedServices((current) => selected ? current.filter((id) => id !== service.id) : [...current, service.id])}
              activeOpacity={0.8}
            >
              <View
                style={[
                  customerStyles.serviceIcon,
                  selected && customerStyles.serviceIconSelected,
                ]}
              >
                <MaterialCommunityIcons
                  name={service.icon as any}
                  size={24}
                  color={
                    selected ? '#ffffff' : theme.color.secondary
                  }
                />
              </View>

              <View style={customerStyles.serviceInfo}>
                <AppText style={customerStyles.serviceName}>{service.name}</AppText>
              <AppText style={customerStyles.servicePrice}>{service.name === 'Ironing' ? `Fixed $${service.unitPrice.toFixed(2)}` : `Estimated $${service.unitPrice.toFixed(2)}`}</AppText>
              </View>

              <View
                style={[
                  customerStyles.radio,
                  selected && customerStyles.radioSelected,
                ]}
              >
                {selected && <Ionicons name="checkmark" size={14} color={theme.color.secondary} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <AppText style={customerStyles.sectionTitle}>Order details</AppText>

      <View style={customerStyles.formCard}>
        <AppText style={customerStyles.label}>Service estimate</AppText>
        <AppText style={customerStyles.fieldHint}>Ironing is a fixed $35 charge. Other services are estimated and finalized by staff.</AppText>
        <AppText style={customerStyles.estimateAmount}>${serviceEstimate.toFixed(2)}</AppText>

        <View style={customerStyles.previewPanel}>
          <View style={customerStyles.previewPanelHeader}>
            <View style={customerStyles.previewPanelTitleGroup}>
              <AppText style={customerStyles.previewPanelTitle}>Estimate preview</AppText>
              <AppText style={customerStyles.previewPanelSubtitle}>UI preview · not added to submitted order</AppText>
            </View>
            <View style={customerStyles.previewBadge}><AppText style={customerStyles.previewBadgeText}>PREVIEW</AppText></View>
          </View>

          {chosenServices.filter((service) => service.unit !== 'fixed').map((service) => (
            <View key={service.id} style={customerStyles.quantityPreviewRow}>
              <View style={customerStyles.quantityPreviewCopy}>
                <AppText style={customerStyles.quantityPreviewName}>{service.name}</AppText>
                <AppText style={customerStyles.quantityPreviewRate}>${service.unitPrice.toFixed(2)} / {service.unit}</AppText>
              </View>
              <AppTextInput
                style={customerStyles.quantityPreviewInput}
                placeholder={service.unit === 'kg' ? 'kg' : 'items'}
                placeholderTextColor="#94a3b8"
                value={previewQuantities[service.id] ?? ''}
                onChangeText={(value) => setPreviewQuantities((current) => ({ ...current, [service.id]: value.replace(/[^0-9.]/g, '') }))}
                keyboardType="decimal-pad"
                accessibilityLabel={`Estimated ${service.unit} for ${service.name}`}
              />
            </View>
          ))}

          <AppText style={customerStyles.addOnTitle}>Optional paid add-ons</AppText>
          <AppText style={customerStyles.previewHelp}>Placeholder choices and rates. Replace these with the shop&apos;s approved options.</AppText>
          {PREVIEW_ADD_ONS.map((addOn) => {
            const selected = previewAddOns.includes(addOn.id);
            return (
              <TouchableOpacity
                key={addOn.id}
                style={[customerStyles.addOnRow, selected && customerStyles.addOnRowSelected]}
                onPress={() => setPreviewAddOns((current) => selected ? current.filter((id) => id !== addOn.id) : [...current, addOn.id])}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
              >
                <View style={[customerStyles.addOnCheck, selected && customerStyles.addOnCheckSelected]}>
                  {selected ? <Ionicons name="checkmark" size={13} color="#ffffff" /> : null}
                </View>
                <AppText style={customerStyles.addOnName}>{addOn.name}</AppText>
                <AppText style={customerStyles.addOnRate}>Rate TBD</AppText>
              </TouchableOpacity>
            );
          })}

          <View style={customerStyles.previewTotalRow}>
            <AppText style={customerStyles.previewTotalLabel}>Preview total</AppText>
            <AppText style={customerStyles.previewTotalAmount}>${quantityPreviewTotal.toFixed(2)}</AppText>
          </View>
          <AppText style={customerStyles.previewHelp}>Add-on rates are excluded. Quantity and add-on selections are visual previews and are not saved with the order yet.</AppText>
        </View>

        <AppText style={customerStyles.label}>Pickup / Delivery Address</AppText>

        <AppTextInput
          style={customerStyles.input}
          placeholder="Enter your address"
          placeholderTextColor="#94a3b8"
          value={address}
          onChangeText={setAddress}
        />

        <AppText style={customerStyles.label}>Additional Notes</AppText>

        <AppTextInput
          style={[customerStyles.input, customerStyles.notesInput]}
          placeholder="Add special instructions"
          placeholderTextColor="#94a3b8"
          value={notes}
          onChangeText={setNotes}
          multiline
        />
      </View>

      <AppText style={customerStyles.sectionTitle}>Service option</AppText>

      <View style={customerStyles.optionContainer}>
        <TouchableOpacity
          style={[
            customerStyles.optionButton,
            pickup && customerStyles.optionButtonSelected,
          ]}
          onPress={() => setPickup(true)}
          activeOpacity={0.8}
        >
          <Ionicons
            name="bicycle-outline"
            size={22}
            color={pickup ? '#ffffff' : theme.color.secondary}
          />
          <View style={customerStyles.optionTextContainer}>
            <AppText
              style={[
                customerStyles.optionTitle,
                pickup && customerStyles.optionTitleSelected,
              ]}
            >
              Pickup & Delivery
            </AppText>
            <AppText
              style={[
                customerStyles.optionSubtitle,
                pickup && customerStyles.optionSubtitleSelected,
              ]}
            >
              We collect and return your laundry | $10 fee
            </AppText>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            customerStyles.optionButton,
            !pickup && customerStyles.optionButtonSelected,
          ]}
          onPress={() => setPickup(false)}
          activeOpacity={0.8}
        >
          <Ionicons
            name="storefront-outline"
            size={22}
            color={!pickup ? '#ffffff' : theme.color.secondary}
          />
          <View style={customerStyles.optionTextContainer}>
            <AppText
              style={[
                customerStyles.optionTitle,
                !pickup && customerStyles.optionTitleSelected,
              ]}
            >
              Store Drop-off
            </AppText>
            <AppText
              style={[
                customerStyles.optionSubtitle,
                !pickup && customerStyles.optionSubtitleSelected,
              ]}
            >
              Bring your laundry to our store
            </AppText>
          </View>
        </TouchableOpacity>
      </View>

      <AppText style={customerStyles.sectionTitle}>Payment method</AppText>
      <View style={customerStyles.optionContainer}>
        <TouchableOpacity
          style={[customerStyles.optionButton, paymentMethod === 'cash' && customerStyles.optionButtonSelected]}
          onPress={() => setPaymentMethod('cash')}
          activeOpacity={0.8}
          accessibilityRole="radio"
          accessibilityState={{ selected: paymentMethod === 'cash' }}
        >
          <Ionicons name="cash-outline" size={22} color={paymentMethod === 'cash' ? '#ffffff' : theme.color.secondary} />
          <View style={customerStyles.optionTextContainer}>
            <AppText style={[customerStyles.optionTitle, paymentMethod === 'cash' && customerStyles.optionTitleSelected]}>Cash</AppText>
            <AppText style={[customerStyles.optionSubtitle, paymentMethod === 'cash' && customerStyles.optionSubtitleSelected]}>Pay on delivery or at the shop</AppText>
          </View>
          {paymentMethod === 'cash' ? <Ionicons name="checkmark-circle" size={20} color="#ffffff" /> : null}
        </TouchableOpacity>
        <TouchableOpacity
          style={[customerStyles.optionButton, paymentMethod === 'gcash' && customerStyles.optionButtonSelected]}
          onPress={() => setPaymentMethod('gcash')}
          activeOpacity={0.8}
          accessibilityRole="radio"
          accessibilityState={{ selected: paymentMethod === 'gcash' }}
        >
          <Ionicons name="phone-portrait-outline" size={22} color={paymentMethod === 'gcash' ? '#ffffff' : theme.color.secondary} />
          <View style={customerStyles.optionTextContainer}>
            <AppText style={[customerStyles.optionTitle, paymentMethod === 'gcash' && customerStyles.optionTitleSelected]}>GCash</AppText>
            <AppText style={[customerStyles.optionSubtitle, paymentMethod === 'gcash' && customerStyles.optionSubtitleSelected]}>Manual transfer; staff will verify</AppText>
          </View>
          {paymentMethod === 'gcash' ? <Ionicons name="checkmark-circle" size={20} color="#ffffff" /> : null}
        </TouchableOpacity>
      </View>
      {paymentMethod === 'gcash' ? (
        <View style={[customerStyles.formCard, customerStyles.paymentReferenceCard]}>
          <AppText style={customerStyles.label}>GCash payment reference</AppText>
          <AppText style={customerStyles.fieldHint}>After paying with the store’s GCash details, enter the receipt reference. Staff will verify it manually.</AppText>
          <AppTextInput
            style={customerStyles.input}
            placeholder="Enter reference number"
            placeholderTextColor="#94a3b8"
            value={paymentReference}
            onChangeText={setPaymentReference}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={100}
          />
        </View>
      ) : null}

      <View style={customerStyles.summaryCard}>
        <View style={customerStyles.summaryRow}>
          <AppText style={customerStyles.summaryLabel}>Estimated total</AppText>
          <AppText style={customerStyles.summaryPrice}>${total.toFixed(2)}</AppText>
        </View>
        <AppText style={customerStyles.summaryBreakdown}>Service estimate ${serviceEstimate.toFixed(2)}{pickup ? ` + Pickup & delivery $${PICKUP_FEE.toFixed(2)}` : ' | Store drop-off free'}</AppText>
        <AppText style={customerStyles.summaryNote}>Estimated amount only. Staff will confirm the final price after weighing or counting your laundry.</AppText>
      </View>

      <TouchableOpacity
        style={customerStyles.createButton}
        activeOpacity={0.85}
        onPress={submitOrder}
        disabled={saving}
      >
        {saving ? <ActivityIndicator color="#ffffff" /> : <><AppText style={customerStyles.createButtonText}>Create Order</AppText><Ionicons name="arrow-forward" size={18} color="#ffffff" /></>}
      </TouchableOpacity>
      <Modal visible={confirmationOpen} transparent animationType="fade" onRequestClose={() => setConfirmationOpen(false)}>
        <View style={customerStyles.confirmationBackdrop}><View style={customerStyles.confirmationCard}>
          <View style={customerStyles.confirmationIcon}><Ionicons name="alert-circle-outline" size={26} color={theme.color.secondary} /></View>
          <AppText style={customerStyles.confirmationTitle}>You already have an active order</AppText>
          <AppText style={customerStyles.confirmationCopy}>There {activeOrderCount === 1 ? 'is' : 'are'} {activeOrderCount} active service {activeOrderCount === 1 ? 'entry' : 'entries'} on your account. Type CONFIRM below if you want to place another order.</AppText>
          <AppTextInput style={customerStyles.confirmationInput} value={confirmationText} onChangeText={setConfirmationText} placeholder="Type CONFIRM" autoCapitalize="characters" autoCorrect={false} />
          <View style={customerStyles.confirmationActions}>
            <TouchableOpacity style={customerStyles.cancelButton} onPress={() => setConfirmationOpen(false)}><AppText style={customerStyles.cancelButtonText}>Go back</AppText></TouchableOpacity>
            <TouchableOpacity style={customerStyles.confirmButton} onPress={() => { void confirmAndCreate(); }} disabled={saving}>{saving ? <ActivityIndicator color="#fff" /> : <AppText style={customerStyles.confirmButtonText}>Place order</AppText>}</TouchableOpacity>
          </View>
        </View></View>
      </Modal>
    </ScrollView>
  );
}

const customerStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },

  containerStyle: {
    ...theme.color.lightBackground,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 14,
  },

  comingSoonCard: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 13, marginTop: -10, marginBottom: 20, borderRadius: 15, borderWidth: 1, borderColor: '#dbeafe', backgroundColor: '#eff6ff' },
  comingSoonIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#dbeafe' },
  comingSoonCopy: { flex: 1 },
  comingSoonTitle: { color: '#1e3a8a', fontSize: 12, fontWeight: '800' },
  comingSoonText: { color: '#475569', fontSize: 10, lineHeight: 15, marginTop: 3 },

  introCard: { backgroundColor: '#eaf2ff', borderRadius: 22, padding: 20, marginBottom: 25 },
  introIcon: { width: 46, height: 46, borderRadius: 15, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  introTitle: { fontSize: 21, fontWeight: '800', color: '#0f172a', fontFamily: 'Montserrat_700Bold' },
  introCopy: { fontSize: 13, lineHeight: 20, color: '#475569', marginTop: 6 },
  servicePicker: { marginBottom: 10 },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  subtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 1,
    fontFamily: 'Roboto_700Bold',
  },

  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: 'Montserrat_700Bold',
    marginTop: 2,
  },

  sectionTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: 'Montserrat_700Bold',
    marginBottom: 12,
    marginTop: 4,
  },

  servicesContainer: {
    gap: 10,
    marginBottom: 24,
  },

  serviceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  serviceCardSelected: {
    backgroundColor: '#ebf3fe',
    borderColor: '#c9dcfa',
  },

  serviceIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#f0f4fe',
    justifyContent: 'center',
    alignItems: 'center',
  },

  serviceIconSelected: {
    backgroundColor: theme.color.secondary,
  },

  serviceInfo: {
    flex: 1,
    marginLeft: 14,
  },

  serviceName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Roboto_700Bold',
  },

  servicePrice: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 3,
    fontFamily: 'Roboto_400Regular',
  },

  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
  },

  radioSelected: {
    borderColor: theme.color.secondary,
  },

  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.color.secondary,
  },

  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 24,
  },

  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
    marginTop: 4,
    fontFamily: 'Roboto_700Bold',
  },
  fieldHint: { fontSize: 12, lineHeight: 18, color: '#64748b', marginTop: -3, marginBottom: 12, fontFamily: 'Roboto_400Regular' },
  paymentReferenceCard: { marginTop: -10, marginBottom: 20 },

  estimateAmount: { color: theme.color.secondary, fontSize: 24, fontWeight: '800', marginBottom: 14, fontFamily: 'Montserrat_700Bold' },
  previewPanel: { padding: 14, marginBottom: 18, borderRadius: 16, borderWidth: 1, borderColor: '#dbe4f0', backgroundColor: '#f8fafc' },
  previewPanelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 },
  previewPanelTitleGroup: { flex: 1 },
  previewPanelTitle: { color: '#0f172a', fontSize: 14, fontWeight: '800' },
  previewPanelSubtitle: { color: '#64748b', fontSize: 10, marginTop: 3 },
  previewBadge: { paddingHorizontal: 7, paddingVertical: 5, borderRadius: 8, backgroundColor: '#dbeafe' },
  previewBadgeText: { color: theme.color.secondary, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  quantityPreviewRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#e8edf4' },
  quantityPreviewCopy: { flex: 1 },
  quantityPreviewName: { color: '#334155', fontSize: 12, fontWeight: '700' },
  quantityPreviewRate: { color: '#64748b', fontSize: 10, marginTop: 2 },
  quantityPreviewInput: { width: 86, height: 40, marginBottom: 0, paddingHorizontal: 10, textAlign: 'right', borderRadius: 10, borderWidth: 1, borderColor: '#dbe4f0', backgroundColor: '#ffffff', color: '#0f172a', fontSize: 12 },
  addOnTitle: { color: '#334155', fontSize: 12, fontWeight: '800', marginTop: 14 },
  previewHelp: { color: '#64748b', fontSize: 10, lineHeight: 15, marginTop: 4 },
  addOnRow: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 9, marginTop: 6, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#ffffff' },
  addOnRowSelected: { borderColor: '#93c5fd', backgroundColor: '#eff6ff' },
  addOnCheck: { width: 18, height: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#cbd5e1', borderRadius: 5 },
  addOnCheckSelected: { backgroundColor: theme.color.secondary, borderColor: theme.color.secondary },
  addOnName: { flex: 1, color: '#334155', fontSize: 11, fontWeight: '600' },
  addOnRate: { color: '#64748b', fontSize: 10, fontWeight: '700' },
  previewTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, marginTop: 10, borderTopWidth: 1, borderTopColor: '#dbe4f0' },
  previewTotalLabel: { color: '#334155', fontSize: 12, fontWeight: '700' },
  previewTotalAmount: { color: theme.color.secondary, fontSize: 15, fontWeight: '800' },

  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 16,
    fontFamily: 'Roboto_400Regular',
  },

  notesInput: {
    height: 80,
    paddingTop: 14,
    textAlignVertical: 'top',
  },

  optionContainer: {
    gap: 10,
    marginBottom: 24,
  },

  optionButton: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  optionButtonSelected: {
    backgroundColor: theme.color.secondary,
    borderColor: theme.color.secondary,
  },

  optionTextContainer: {
    flex: 1,
    marginLeft: 12,
  },

  optionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },

  optionTitleSelected: {
    color: '#ffffff',
  },

  optionSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 3,
  },

  optionSubtitleSelected: {
    color: 'rgba(255,255,255,0.8)',
  },

  summaryCard: {
    backgroundColor: '#ebf3fe',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  summaryLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    fontFamily: 'Roboto_700Bold',
  },

  summaryPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.color.secondary,
  },

  summaryNote: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 5,
    fontFamily: 'Roboto_400Regular',
  },
  summaryBreakdown: { fontFamily: 'Roboto_500Medium', color: '#334155', fontSize: 12, marginTop: 8 },

  createButton: {
    backgroundColor: theme.color.secondary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },

  createButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Roboto_700Bold',
  },
  confirmationBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', alignItems: 'center', justifyContent: 'center', padding: 22 },
  confirmationCard: { width: '100%', backgroundColor: '#fff', borderRadius: 22, padding: 22 },
  confirmationIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#eaf2ff', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  confirmationTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  confirmationCopy: { fontSize: 14, color: '#64748b', lineHeight: 21, marginTop: 8 },
  confirmationInput: { height: 48, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, paddingHorizontal: 14, marginTop: 18, color: '#0f172a' },
  confirmationActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 18 },
  cancelButton: { paddingHorizontal: 16, minHeight: 44, justifyContent: 'center', borderRadius: 12, backgroundColor: '#f1f5f9' },
  cancelButtonText: { color: '#475569', fontWeight: '700', fontSize: 13 },
  confirmButton: { paddingHorizontal: 16, minHeight: 44, minWidth: 104, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: theme.color.secondary },
  confirmButtonText: { color: '#fff', fontWeight: '800', fontSize: 13 },
});




