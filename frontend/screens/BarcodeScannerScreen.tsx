import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { scannerAPI, productAPI } from '../lib/api';
import { useTheme, useAccessibility } from '../lib/theme';

const USER_SCAN_AUTO_OPEN_DETAIL_KEY = 'user_scan_auto_open_detail';

export default function BarcodeScannerScreen({ navigation, route }: any) {
  const theme = useTheme();
  const { reduceMotion } = useAccessibility();
  const styles = createStyles(theme);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [userScanAutoOpenDetail, setUserScanAutoOpenDetail] = useState(true);
  const scanLineAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getCameraPermissions();

    const loadScannerPreference = async () => {
      try {
        const storedValue = await AsyncStorage.getItem(USER_SCAN_AUTO_OPEN_DETAIL_KEY);
        setUserScanAutoOpenDetail(storedValue === null ? true : storedValue === 'true');
      } catch (error) {
        console.error('Failed to load scanner preference:', error);
        setUserScanAutoOpenDetail(true);
      }
    };

    loadScannerPreference();
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      return;
    }

    // Animate scan line
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => {
      animation.stop();
    };
  }, [reduceMotion, scanLineAnim]);

  const handleBarCodeScanned = async ({ data }: any) => {
    setScanned(true);

    const barcode = typeof data === 'string' ? data.trim() : '';

    if (!barcode || barcode.length < 4) {
      Alert.alert(
        'Unreadable Barcode',
        'The barcode could not be read. Please align it and try again.',
        [{ text: 'Continue Scanning', onPress: () => setScanned(false) }],
      );
      return;
    }

    const isAdminProductScan = route?.params?.mode === 'adminProduct';
    const onBarcodeScanned = route?.params?.onBarcodeScanned;

    if (isAdminProductScan) {
      if (typeof onBarcodeScanned === 'function') {
        onBarcodeScanned(barcode);
        navigation.goBack();
        return;
      }

      navigation.navigate('AdminDashboard', {
        screen: 'Products',
        params: {
          adminScannedBarcode: barcode,
          adminScanNonce: Date.now(),
        },
      });
      return;
    }
    
    try {
      const product = await scannerAPI.lookupByBarcode(barcode);

      const getProductForDetail = async () => {
        if (!product?.id) {
          return product;
        }

        try {
          return await productAPI.getProductById(String(product.id));
        } catch (detailError) {
          console.error('Failed to load full product detail:', detailError);
          return product;
        }
      };
    
      if (product) {
        if (userScanAutoOpenDetail) {
          const fullProduct = await getProductForDetail();
          navigation.replace('ProductDetail', { product: fullProduct });
          return;
        }

        Alert.alert(
          'Product Found',
          `${product.name}`,
          [
            {
              text: 'View Details',
              onPress: async () => {
                const fullProduct = await getProductForDetail();
                navigation.replace('ProductDetail', { product: fullProduct });
              },
            },
            {
              text: 'Continue Scanning',
              onPress: () => setScanned(false),
            },
          ]
        );
      } else {
        Alert.alert(
          'Product Not Found',
          `Barcode: ${barcode}`,
          [
            {
              text: 'Continue Scanning',
              onPress: () => setScanned(false),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error scanning barcode:', error);

      const errorMessage = error instanceof Error ? error.message : '';

      if (errorMessage.includes('No product found')) {
        Alert.alert(
          'Product Not Found',
          `No product found for barcode: ${barcode}`,
          [{ text: 'Continue Scanning', onPress: () => setScanned(false) }],
        );
        return;
      }

      if (errorMessage.includes('Invalid barcode')) {
        Alert.alert(
          'Unreadable Barcode',
          'The barcode format is invalid. Please try again.',
          [{ text: 'Continue Scanning', onPress: () => setScanned(false) }],
        );
        return;
      }

      Alert.alert(
        'Error',
        'Failed to find product',
        [
          {
            text: 'Continue Scanning',
            onPress: () => setScanned(false),
          },
        ]
      );
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Ionicons name="camera-outline" size={80} color="#cbd5e1" />
        <Text style={styles.permissionText}>No camera access</Text>
        <Text style={styles.permissionSubtext}>
          Please allow Trinity Shop to access camera in settings
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        enableTorch={torchOn}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'code128'],
        }}
      >
        <View style={styles.overlay}>
          {/* Top Controls */}
          <View style={styles.topControls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => setTorchOn(!torchOn)}
            >
              <Ionicons 
                name={torchOn ? "sunny" : "sunny-outline"} 
                size={24} 
                color="#fff" 
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Scan Area with Corners and Animation */}
          <View style={styles.scanArea}>
            <View style={styles.scanFrame}>
              {/* Corner Borders */}
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
              
              {/* Animated Scan Line */}
              {!reduceMotion ? (
                <Animated.View
                  style={[
                    styles.scanLine,
                    {
                      transform: [
                        {
                          translateY: scanLineAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-100, 100],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              ) : (
                <View style={styles.scanLine} />
              )}
            </View>
          </View>

          {/* Instructions */}
          <View style={styles.instructions}>
            <Text style={styles.instructionsText}>
              {scanned ? 'Barcode Scanned!' : 'Align barcode within the frame'}
            </Text>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 280,
    height: 180,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#fff',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scanLine: {
    width: '100%',
    height: 2,
    backgroundColor: '#00ff00',
    position: 'absolute',
    top: '50%',
    shadowColor: '#00ff00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  instructions: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  instructionsText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  permissionText: {
    fontSize: 18,
    color: theme.textSecondary,
    marginTop: 16,
  },
  permissionSubtext: {
    fontSize: 14,
    color: theme.textTertiary,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
