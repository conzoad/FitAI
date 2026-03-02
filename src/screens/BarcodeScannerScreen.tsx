import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { lookupBarcode } from '../services/barcodeService';
import { BarcodeProduct } from '../models/types';
import { useLanguageStore } from '../stores/useLanguageStore';
import { t } from '../i18n/translations';
import { darkColors } from '../theme/colors';
import { useColors } from '../theme/useColors';

export default function BarcodeScannerScreen() {
  const navigation = useNavigation();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<BarcodeProduct | null>(null);
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const lang = useLanguageStore((s) => s.language);
  const T = t(lang);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  const handleBarCodeScanned = async (result: BarcodeScanningResult) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);

    try {
      const found = await lookupBarcode(result.data);
      if (found) {
        setProduct(found);
      } else {
        Alert.alert(
          T.barcode.notFound,
          T.barcode.notFoundMessage.replace('{code}', result.data),
          [
            { text: T.barcode.scanMore, onPress: () => setScanned(false) },
            { text: T.common.back, onPress: () => navigation.goBack() },
          ]
        );
      }
    } catch {
      Alert.alert(T.common.error, T.barcode.networkError);
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  const handleUseProduct = () => {
    if (product) {
      // Pass product data back via navigation params
      (navigation as any).navigate('AddMeal', { barcodeProduct: product });
    }
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            {T.barcode.cameraPermission}
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>{T.barcode.allowCamera}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backLink}>{T.common.back}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {product ? (
        <View style={styles.resultContainer}>
          <TouchableOpacity onPress={() => { setProduct(null); setScanned(false); }}>
            <Text style={styles.backText}>← {T.barcode.scanMore}</Text>
          </TouchableOpacity>

          <View style={styles.productCard}>
            <Text style={styles.productName}>{product.name}</Text>
            {product.brand && <Text style={styles.productBrand}>{product.brand}</Text>}
            <Text style={styles.servingSize}>{T.barcode.serving} {product.servingSize}</Text>

            <View style={styles.macrosRow}>
              <View style={styles.macroItem}>
                <Text style={[styles.macroValue, { color: colors.calories }]}>
                  {product.macros.calories}
                </Text>
                <Text style={styles.macroLabel}>{T.common.kcal}</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={[styles.macroValue, { color: colors.proteins }]}>
                  {product.macros.proteins}
                </Text>
                <Text style={styles.macroLabel}>{T.mealDetail.proteins}</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={[styles.macroValue, { color: colors.fats }]}>
                  {product.macros.fats}
                </Text>
                <Text style={styles.macroLabel}>{T.mealDetail.fats}</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={[styles.macroValue, { color: colors.carbs }]}>
                  {product.macros.carbs}
                </Text>
                <Text style={styles.macroLabel}>{T.mealDetail.carbs}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.useButton} onPress={handleUseProduct}>
            <Text style={styles.useButtonText}>{T.barcode.addToMeal}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelButtonText}>{T.common.cancel}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            barcodeScannerSettings={{
              barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'],
            }}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          />

          <View style={styles.overlay}>
            <View style={styles.overlayTop} />
            <View style={styles.overlayMiddle}>
              <View style={styles.overlaySide} />
              <View style={styles.scanArea}>
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />
              </View>
              <View style={styles.overlaySide} />
            </View>
            <View style={styles.overlayBottom}>
              <Text style={styles.scanText}>
                {loading ? T.barcode.searching : T.barcode.pointAt}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>

          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#FFFFFF" />
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

function getStyles(c: typeof darkColors) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: c.background,
    },
    permissionContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 30,
    },
    permissionText: {
      fontSize: 16,
      color: c.text,
      textAlign: 'center',
      marginBottom: 20,
    },
    permissionButton: {
      backgroundColor: c.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
      marginBottom: 16,
    },
    permissionButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    backLink: {
      color: c.primary,
      fontSize: 15,
    },
    cameraContainer: {
      flex: 1,
      position: 'relative',
    },
    camera: {
      flex: 1,
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
    },
    overlayTop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    overlayMiddle: {
      flexDirection: 'row',
      height: 200,
    },
    overlaySide: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    scanArea: {
      width: 280,
      height: 200,
      position: 'relative',
    },
    corner: {
      position: 'absolute',
      width: 30,
      height: 30,
      borderColor: '#FFFFFF',
    },
    cornerTL: {
      top: 0,
      left: 0,
      borderTopWidth: 3,
      borderLeftWidth: 3,
    },
    cornerTR: {
      top: 0,
      right: 0,
      borderTopWidth: 3,
      borderRightWidth: 3,
    },
    cornerBL: {
      bottom: 0,
      left: 0,
      borderBottomWidth: 3,
      borderLeftWidth: 3,
    },
    cornerBR: {
      bottom: 0,
      right: 0,
      borderBottomWidth: 3,
      borderRightWidth: 3,
    },
    overlayBottom: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      alignItems: 'center',
      paddingTop: 30,
    },
    scanText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    closeButton: {
      position: 'absolute',
      top: 10,
      right: 20,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    closeText: {
      color: '#FFFFFF',
      fontSize: 20,
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.3)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    resultContainer: {
      flex: 1,
      padding: 20,
    },
    backText: {
      fontSize: 16,
      color: c.primary,
      fontWeight: '600',
      marginBottom: 16,
    },
    productCard: {
      backgroundColor: c.surface,
      borderRadius: 12,
      padding: 20,
      marginBottom: 20,
    },
    productName: {
      fontSize: 20,
      fontWeight: '700',
      color: c.text,
      marginBottom: 4,
    },
    productBrand: {
      fontSize: 14,
      color: c.textSecondary,
      marginBottom: 4,
    },
    servingSize: {
      fontSize: 13,
      color: c.textSecondary,
      marginBottom: 16,
    },
    macrosRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    macroItem: {
      alignItems: 'center',
    },
    macroValue: {
      fontSize: 20,
      fontWeight: '700',
    },
    macroLabel: {
      fontSize: 12,
      color: c.textSecondary,
      marginTop: 2,
    },
    useButton: {
      backgroundColor: c.primary,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      marginBottom: 10,
    },
    useButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
    },
    cancelButton: {
      padding: 14,
      alignItems: 'center',
    },
    cancelButtonText: {
      color: c.textSecondary,
      fontSize: 15,
    },
  });
}
