import Entypo from '@expo/vector-icons/Entypo';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { theme } from '../theme';

export default function QRclaimpass() {
  return (
    <ScrollView contentContainerStyle={styles.container} style={styles.containerStyle}>

      <View style={styles.header}>
        <Text style={styles.subtitle}>PAPERLESS PICKUP</Text>
        <Text style={styles.title}>Claim pass</Text>
      </View>

      <View style={styles.ticketCard}>

        <View style={styles.brandRow}>
          <View style={styles.brandIconBox}>
            <Entypo name="drop" size={16} color="#ffffff" />
          </View>
          <Text style={styles.brandName}>AquaCycle</Text>
        </View>

        <View style={styles.qrContainer}>
          <View style={styles.qrPlaceholderBox}>
            <MaterialCommunityIcons name="qrcode-scan" size={80} color={theme.color.secondary} />
            <Text style={styles.qrPlaceholderText}>[ QR Code Placeholder ]</Text>
          </View>
        </View>

        <Text style={styles.orderNumber}>Order #AC-2048</Text>
        <Text style={styles.instructionText}>
          Show this code at the counter when your order is ready for pickup.
        </Text>

        <View style={styles.dashedLineContainer}>
          <View style={styles.dashedLine} />
        </View>

        <View style={styles.metaRow}>
          <View>
            <Text style={styles.metaLabel}>Customer</Text>
            <Text style={styles.metaValue}>Ken Rec</Text>
          </View>
          <View style={styles.metaRight}>
            <Text style={styles.metaLabel}>Items</Text>
            <Text style={styles.metaValue}>6.0 kg</Text>
          </View>
        </View>

      </View>

      <View style={styles.offlineRow}>
        <Ionicons name="checkmark" size={16} color="#64748b" />
        <Text style={styles.offlineText}>This pass is saved offline on your device</Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 40,
  },
  containerStyle: {
    ...theme.color.lightBackground,
  },

  /* Header */
  header: {
    alignSelf: 'flex-start',
    marginBottom: 20,
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

  /* Ticket Card */
  ticketCard: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },

  /* Brand  */
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  brandIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    ...theme.color.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandName: {
    textTransform: 'uppercase',
    fontSize: 14,
    fontWeight: '700',
    color: theme.color.secondary,
  },

  /* QR Box */
  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  qrPlaceholderBox: {
    width: 220,
    height: 220,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  qrPlaceholderText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
  },

  /* Order Info */
  orderNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'serif',
    textAlign: 'center',
    marginTop: 18,
  },
  instructionText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 12,
    lineHeight: 18,
  },

  /* Dashed Divider */
  dashedLineContainer: {
    marginVertical: 20,
    overflow: 'hidden',
  },
  dashedLine: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
  },

  /* Meta Details Row */
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  metaRight: {
    alignItems: 'flex-end',
  },
  metaLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },

  /* Offline Indicator */
  offlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 20,
  },
  offlineText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
});