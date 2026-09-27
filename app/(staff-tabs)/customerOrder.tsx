import Feather from '@expo/vector-icons/Feather';
import React, { useState } from 'react';
import {
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { theme } from '../theme';

// Dummy Data
const ORDERS_DATA = [
  {
    id: '1',
    orderId: 'AC-2051',
    time: '11:26 AM',
    customer: 'Maria Santos',
    initials: 'MS',
    service: 'Wash & Fold',
    weight: '4.5 kg',
    price: '₱203',
    status: 'New',
    statusCategory: 'New',
  },
  {
    id: '2',
    orderId: 'AC-2050',
    time: '10:58 AM',
    customer: 'John Reyes',
    initials: 'JR',
    service: 'Dry Clean',
    weight: '3.0 kg',
    price: '₱225',
    status: 'Washing',
    statusCategory: 'In progress',
  },
  {
    id: '3',
    orderId: 'AC-2049',
    time: '10:15 AM',
    customer: 'Liza Cruz',
    initials: 'LC',
    service: 'Wash & Iron',
    weight: '6.2 kg',
    price: '₱496',
    status: 'Drying',
    statusCategory: 'In progress',
  },
  {
    id: '4',
    orderId: 'AC-2048',
    time: '9:42 AM',
    customer: 'Xerted Española',
    initials: 'XE',
    service: 'Wash & Fold',
    weight: '6.0 kg',
    price: '₱270',
    status: 'Drying',
    statusCategory: 'In progress',
  },
  {
    id: '5',
    orderId: 'AC-2047',
    time: '9:10 AM',
    customer: 'Paolo Lim',
    initials: 'PL',
    service: 'Self-Service',
    weight: '5.0 kg',
    price: '₱125',
    status: 'Ready',
    statusCategory: 'Ready',
  },
];

const FILTERS = [
  { key: 'All', label: 'All', count: 24 },
  { key: 'New', label: 'New', count: 3 },
  { key: 'In progress', label: 'In progress', count: 14 },
  { key: 'Ready', label: 'Ready', count: 7 },
];

export default function StaffOrdersScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const filteredOrders = ORDERS_DATA.filter((item) => {
    const matchesFilter =
      activeFilter === 'All' || item.statusCategory === activeFilter;
    const matchesSearch =
      item.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.orderId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadgeStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new':
        return { bg: '#e0f2fe', text: theme.color.secondary };
      case 'washing':
        return { bg: '#e0e7ff', text: '#4338ca' };
      case 'drying':
        return { bg: '#ffedd5', text: '#c2410c' };
      case 'ready':
        return { bg: '#dcfce7', text: '#15803d' };
      default:
        return { bg: '#f1f5f9', text: '#64748b' };
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
        <TextInput
          style={styles.searchInput}
          placeholder="Search name or order ID"
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((tab) => {
          const isActive = activeFilter === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.filterChip,
                isActive ? styles.activeChip : styles.inactiveChip,
              ]}
              onPress={() => setActiveFilter(tab.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterText, isActive && styles.activeFilterText]}>
                {tab.label}
              </Text>
              <Text style={[styles.badgeCount, isActive && styles.activeBadgeCount]}>
                {tab.count}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => {
          const badgeStyle = getStatusBadgeStyle(item.status);

          return (
            <TouchableOpacity style={styles.orderCard} activeOpacity={0.7}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{item.initials}</Text>
              </View>

              <View style={styles.orderInfo}>
                <Text style={styles.orderMetaText}>
                  {item.orderId} · {item.time}
                </Text>
                <Text style={styles.customerName}>{item.customer}</Text>
                <Text style={styles.serviceText}>
                  {item.service} · {item.weight}
                </Text>
              </View>

              <View style={styles.rightCol}>
                <Text style={styles.priceText}>{item.price}</Text>
                <View style={[styles.statusBadge, { backgroundColor: badgeStyle.bg }]}>
                  <Text style={[styles.statusText, { color: badgeStyle.text }]}>
                    {item.status}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    ...theme.color.lightBackground,
    paddingHorizontal: 20,
    paddingTop: 16,
  },

  headerBlock: {
    marginBottom: 16,
  },
  categoryTag: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: 'serif',
    marginTop: 4,
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
  },

  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  activeChip: {
    backgroundColor: '#5881ea', 
  },
  inactiveChip: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  activeFilterText: {
    color: '#ffffff',
  },
  badgeCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  activeBadgeCount: {
    color: '#a7f3d0',
  },

  listContent: {
    paddingBottom: 40,
  },
  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#e2e8f0',
    ...theme.spacing.trueCenter,
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  orderInfo: {
    flex: 1,
    marginLeft: 14,
  },
  orderMetaText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginVertical: 2,
  },
  serviceText: {
    fontSize: 12,
    color: '#64748b',
  },
  rightCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  separator: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },
});