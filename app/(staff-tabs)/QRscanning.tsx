import AppText from '@/components/ui/app-text';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useState } from 'react';
import {
  Alert,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { theme } from '../../constants/app-theme';
import { requireSupabase } from '../../utils/supabase';

export default function QRScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    const finishScan = (title: string, message: string) => {
      Alert.alert(title, message, [{ text: 'OK', onPress: () => setScanned(false) }]);
    };
    const prefix = 'AQUACYCLE_ORDER:';
    if (!data.startsWith(prefix)) {
      finishScan('Invalid claim pass', 'This QR code is not an AquaCycle order claim pass.');
      return;
    }

    try {
      const orderId = data.slice(prefix.length).trim();
      const client = requireSupabase();
      const { data: { user }, error: userError } = await client.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Sign in with a staff account to scan claim passes.');

      const { data: profile, error: profileError } = await client.from('profiles').select('role').eq('id', user.id).single();
      if (profileError) throw profileError;
      if (profile.role !== 'staff') throw new Error('Only staff can scan claim passes.');

      const { data: order, error: orderError } = await client.from('orders').select('id,customer_name,service_name,status').eq('id', orderId).maybeSingle();
      if (orderError) throw orderError;
      if (!order) {
        finishScan('Order not found', 'This claim pass does not match an order.');
        return;
      }
      if (order.status !== 'ready') {
        finishScan('Order is not ready', `${order.customer_name || 'Customer'} · ${order.service_name} · Status: ${order.status}.`);
        return;
      }

      const { data: updatedOrder, error: updateError } = await client.from('orders')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', order.id)
        .eq('status', 'ready')
        .select('id')
        .maybeSingle();
      if (updateError) throw updateError;
      if (!updatedOrder) {
        finishScan('Order already claimed', 'This order is no longer ready for pickup.');
        return;
      }
      finishScan('Pickup confirmed', `${order.customer_name || 'Customer'} · ${order.service_name} is now marked completed.`);
    } catch (error) {
      finishScan('Unable to verify claim pass', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.permissionCenter]}>
        <StatusBar barStyle="dark-content" backgroundColor="#f0f0f0" animated />
        <View style={styles.permissionCard}>
          <Ionicons name="camera-outline" size={48} color={theme.color.secondary} />
          <AppText style={styles.permissionTitle}>Camera Access Needed</AppText>
          <AppText style={styles.permissionSub}>
            AquaCycle needs access to your camera to scan customer claim passes.
          </AppText>
          <TouchableOpacity
            style={[styles.primaryButton, theme.color.primary]}
            onPress={requestPermission}
            activeOpacity={0.8}
          >
            <AppText style={styles.primaryButtonText}>Grant Camera Permission</AppText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f0f0f0" animated />

      <View style={styles.headerBlock}>
        <AppText style={styles.categoryTag}>CAMERA ACCESS</AppText>
        <AppText style={styles.title}>Scan claim pass</AppText>
        <AppText style={styles.subtitle}>
          Position the customer&apos;s QR code inside the frame.
        </AppText>
      </View>

      <View style={styles.cameraFrame}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        />

        <View style={styles.overlay} />

        <View style={styles.scanReticle}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />

          <MaterialCommunityIcons
            name="qrcode"
            size={54}
            color="rgba(255,255,255,0.15)"
          />

          {/* <View style={styles.glowLine} /> */}
        </View>
      </View>

      <AppText style={styles.scanHint}>A valid scan confirms pickup and marks that order completed.</AppText>
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

  /* Header */
  headerBlock: {
    marginBottom: 20,
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
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 6,
  },

  /* Camera */
  cameraFrame: {
    width: '100%',
    height: 340,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1b2d24', 
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 20, 0.45)',
  },

  /* Scanner */
  scanReticle: {
    width: 220,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: '#a7f3d0', 
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 12,
  },

  glowLine: {
    position: 'absolute',
    bottom: 12,
    width: '100%',
    height: 3,
    backgroundColor: '#a7f3d0',
    borderRadius: 2,
    shadowColor: '#a7f3d0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 6,
  },

  /* Buttons */
  primaryButton: {
    padding: 10,
    width: '100%',
    height: 52,
    borderRadius: 16,
    ...theme.spacing.trueCenter,
    elevation: 2,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  scanHint: { color: '#64748b', textAlign: 'center', fontSize: 13, lineHeight: 19 },

  /* Permission Request */
  permissionCenter: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionCard: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 12,
  },
  permissionSub: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginVertical: 12,
  },
});

