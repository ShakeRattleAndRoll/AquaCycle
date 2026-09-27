import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function OrderTracker() {
  const router = useRouter();

  return (
    <View style={styles.container}>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Track your laundry</Text>
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.replace('/(tabs)/orderDetails')}>
          <Text style={styles.detailsText}>Details</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.trackerCard} activeOpacity={0.9}>
        <View style={styles.progressCircleContainer}>
          <View style={styles.outerCircle}>
            <View style={styles.innerCircle}>
              <Text style={styles.stepNumber}>3</Text>
              <Text style={styles.stepTotal}>of 4</Text>
            </View>
          </View>
        </View>

        <View style={styles.statusInfo}>
          <View style={styles.statusBadge}>
            <View style={styles.badgeDot} />
            <Text style={styles.badgeText}>Drying now</Text>
          </View>

          <Text style={styles.statusTitle}>Almost fresh & ready!</Text>

          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={14} color="#94a3b8" />
            <Text style={styles.timeText}>Pickup around 3:30 PM</Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={18} color="#64748b" />
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  detailsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0284c7',
  },

  /* Tracker  */
  trackerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
  },
  progressCircleContainer: {
    marginRight: 14,
  },
  outerCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 5,
    borderColor: '#0284c7', 
    borderTopColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    alignItems: 'center',
  },
  stepNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 20,
  },
  stepTotal: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },

  statusInfo: {
    flex: 1,
  },
  statusBadge: {
    backgroundColor: '#e0f2fe',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0284c7',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284c7',
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'serif',
    marginBottom: 2,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
});