import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { theme } from '../theme';

export default function OrdersDetails() {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.container} style={styles.containerStyle}>

      <View style={styles.header}>
        <Text style={styles.subtitle}>YOUR LAUNDRY</Text>
        <Text style={styles.title}>Orders</Text>
      </View>

      <View style={styles.activeCard}>
        <View style={styles.cardHeader}>
          <View style={styles.statusBadge}>
            <View style={styles.badgeDot} />
            <Text style={styles.badgeText}>In progress</Text>
          </View>
          <Text style={styles.orderId}>#AC-2048</Text>
        </View>

        <Text style={styles.serviceName}>Wash & Fold</Text>

        <View style={styles.timelineContainer}>

          <View style={styles.stepRow}>
            <View style={styles.stepIconColumn}>
              <View style={[styles.circle, styles.circleCompleted]}>
                <Ionicons name="checkmark" size={14} color="#ffffff" />
              </View>
              <View style={[styles.line, styles.lineCompleted]} />
            </View>
            <View style={styles.stepTextContainer}>
              <Text style={styles.stepTitleCompleted}>Order received</Text>
              <Text style={styles.stepTime}>10:40 AM</Text>
            </View>
          </View>

          <View style={styles.stepRow}>
            <View style={styles.stepIconColumn}>
              <View style={[styles.circle, styles.circleCompleted]}>
                <Ionicons name="checkmark" size={14} color="#ffffff" />
              </View>
              <View style={[styles.line, styles.lineCompleted]} />
            </View>
            <View style={styles.stepTextContainer}>
              <Text style={styles.stepTitleCompleted}>Washing complete</Text>
              <Text style={styles.stepTime}>1:15 PM</Text>
            </View>
          </View>

          <View style={styles.stepRow}>
            <View style={styles.stepIconColumn}>
              <View style={[styles.circle, styles.circleActive]}>
                <Text style={styles.activeStepNumber}>3</Text>
              </View>
              <View style={[styles.line, styles.lineInactive]} />
            </View>
            <View style={styles.stepTextContainer}>
              <Text style={styles.stepTitleActive}>Drying in progress</Text>
              <Text style={styles.stepTimeActive}>Estimated 3:30 PM</Text>
            </View>
          </View>

          <View style={styles.stepRow}>
            <View style={styles.stepIconColumn}>
              <View style={[styles.circle, styles.circleInactive]}>
                <Text style={styles.inactiveStepNumber}>4</Text>
              </View>
            </View>
            <View style={styles.stepTextContainer}>
              <Text style={styles.stepTitleInactive}>Ready for pickup</Text>
              <Text style={styles.stepTimeInactive}>We'll notify you</Text>
            </View>
          </View>

        </View>

        <TouchableOpacity style={styles.claimButton} activeOpacity={0.85} onPress={() => router.replace('/(customer-tabs)/QRclaim')}>
          <Text style={styles.claimButtonText}>View claim pass</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.pastOrdersSection}>
        <Text style={styles.pastOrdersTitle}>Past orders</Text>

        <TouchableOpacity style={styles.pastOrderItem} activeOpacity={0.7}>
          <View style={styles.pastOrderLeft}>
            <View style={styles.pastOrderIconBox}>
              <MaterialCommunityIcons name="washing-machine" size={24} color={theme.color.secondary} />
            </View>
            <View>
              <Text style={styles.pastOrderName}>Wash & Fold</Text>
              <Text style={styles.pastOrderMeta}>September 18 · 4.2 kg</Text>
            </View>
          </View>
          <Text style={styles.pastOrderPrice}>₱189</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.pastOrderItem} activeOpacity={0.7}>
          <View style={styles.pastOrderLeft}>
            <View style={styles.pastOrderIconBox}>
              <MaterialCommunityIcons name="iron" size={24} color={theme.color.secondary} />
            </View>
            <View>
              <Text style={styles.pastOrderName}>Ironing</Text>
              <Text style={styles.pastOrderMeta}>September 03 · 2.0 kg</Text>
            </View>
          </View>
          <Text style={styles.pastOrderPrice}>₱70</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  containerStyle: {
    ...theme.color.lightBackground,
  },
  header: {
    marginBottom: 18,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
  },

  /* Active Order */
  activeCard: {
    backgroundColor: '#ebf3fe',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#d6e4fd',
    padding: 20,
    marginBottom: 28,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    backgroundColor: '#d6e4fd',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.color.secondary,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.color.secondary,
  },
  orderId: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  serviceName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0f172a',
    marginVertical: 14,
  },

  /* Timeline */
  timelineContainer: {
    marginVertical: 6,
    paddingLeft: 4,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepIconColumn: {
    alignItems: 'center',
    width: 28,
  },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleCompleted: {
    backgroundColor: theme.color.secondary,
  },
  circleActive: {
    backgroundColor: theme.color.secondary,
  },
  circleInactive: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: theme.color.tertiary,
  },
  activeStepNumber: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  inactiveStepNumber: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  line: {
    width: 2,
    height: 32,
  },
  lineCompleted: {
    backgroundColor: theme.color.secondary,
  },
  lineInactive: {
    backgroundColor: '#cbd5e1',
  },
  stepTextContainer: {
    marginLeft: 12,
    paddingBottom: 16,
  },
  stepTitleCompleted: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  stepTitleActive: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.color.secondary,
  },
  stepTitleInactive: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
  },
  stepTime: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  stepTimeActive: {
    fontSize: 12,
    color: theme.color.secondary,
    fontWeight: '500',
    marginTop: 2,
  },
  stepTimeInactive: {
    fontSize: 12,
    color: '#cbd5e1',
    marginTop: 2,
  },

  /* Button */
  claimButton: {
    backgroundColor: theme.color.secondary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  claimButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },

  /* Past Orders */
  pastOrdersSection: {
    marginTop: 4,
  },
  pastOrdersTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'serif',
    marginBottom: 16,
  },
  pastOrderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  pastOrderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  pastOrderIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#ebf3fe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pastOrderName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  pastOrderMeta: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  pastOrderPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 4,
  },
});