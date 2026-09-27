import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useState } from 'react';
import {
  Alert,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { theme } from '../theme';

export default function QRScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    Alert.alert('Claim Pass Scanned', `Scanned Order Code: ${data}`, [
      { text: 'OK', onPress: () => setScanned(false) },
    ]);
  };

  const handleSimulateScan = () => {
    handleBarCodeScanned({ data: 'AC-2051' });
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
          <Text style={styles.permissionTitle}>Camera Access Needed</Text>
          <Text style={styles.permissionSub}>
            AquaCycle needs access to your camera to scan customer claim passes.
          </Text>
          <TouchableOpacity
            style={[styles.primaryButton, theme.color.primary]}
            onPress={requestPermission}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Grant Camera Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f0f0f0" animated />

      <View style={styles.headerBlock}>
        <Text style={styles.categoryTag}>CAMERA ACCESS</Text>
        <Text style={styles.title}>Scan claim pass</Text>
        <Text style={styles.subtitle}>
          Position the customer's QR code inside the frame.
        </Text>
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

      <TouchableOpacity
        style={[styles.primaryButton, theme.color.primary]}
        onPress={handleSimulateScan}
        activeOpacity={0.85}
      >
        <Text style={styles.primaryButtonText}>Simulate QR scan</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.manualButton}
        onPress={() => Alert.alert('Manual Input', 'Enter order ID feature')}
        activeOpacity={0.7}
      >
        <Text style={styles.manualButtonText}>Enter order number manually</Text>
      </TouchableOpacity>
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
  manualButton: {
    marginTop: 18,
    alignItems: 'center',
  },
  manualButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2162db',
  },

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