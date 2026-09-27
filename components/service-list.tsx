import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const SERVICES = [
  {
    id: '1',
    title: 'Wash & Fold',
    price: '₱45/kg',
    icon: 'washing-machine',
    library: 'MaterialCommunityIcons',
    bgColor: '#ebf3fe',
    iconColor: '#2162db',
  },
  {
    id: '2',
    title: 'Dry Clean',
    price: '₱75/kg',
    icon: 'dry-cleaning', 
    library: 'MaterialIcons',
    bgColor: '#ebdfcf',
    iconColor: '#885e03',
  },
  {
    id: '3',
    title: 'Ironing',
    price: '₱15/kg',
    icon: 'iron',
    library: 'MaterialCommunityIcons',
    bgColor: '#e6ccee',
    iconColor: '#9105a0',
  },
  {
    id: '4',
    title: 'Self-Service',
    price: '₱25/kg',
    icon: 'timer-outline',
    library: 'MaterialCommunityIcons',
    bgColor: '#d1f1c9',
    iconColor: '#279705',
  },
];

export default function ServicesList() {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContainer}
    >
      {SERVICES.map((item) => (
        <TouchableOpacity key={item.id} style={styles.card} activeOpacity={0.8}>

          <View style={[styles.iconBox, { backgroundColor: item.bgColor }]}>
            {item.library === 'MaterialIcons' ? (
              <MaterialIcons name={item.icon as any} size={24} color={item.iconColor} />
            ) : (
              <MaterialCommunityIcons name={item.icon as any} size={26} color={item.iconColor} />
            )}
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.titleText}>{item.title}</Text>
            <Text style={styles.priceText}>{item.price}</Text>
          </View>

          <View style={styles.chevronCircle}>
            <Ionicons name="chevron-forward" size={14} color="#64748b" />
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    gap: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    width: 210,
    elevation: 0.5,
    marginBottom: 2,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  priceText: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
    fontWeight: '500',
  },
  chevronCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
});