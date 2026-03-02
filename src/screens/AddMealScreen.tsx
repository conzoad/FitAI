import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { analyzeTextMeal, analyzePhotoMeal } from '../services/gemini';
import { searchProducts } from '../services/barcodeService';
import { useDiaryStore } from '../stores/useDiaryStore';
import { MealType, FoodItem, GeminiNutritionResponse, DiaryStackParamList, BarcodeProduct, SavedFoodItem } from '../models/types';
import { todayKey } from '../utils/dateHelpers';
import { generateId } from '../utils/calculations';
import FoodItemCard from '../components/FoodItemCard';
import LoadingOverlay from '../components/LoadingOverlay';
import { darkColors } from '../theme/colors';
import { useColors } from '../theme/useColors';
import { useFoodLibraryStore } from '../stores/useFoodLibraryStore';
import { uploadMealPhoto } from '../services/imageUpload';
import { useLanguageStore } from '../stores/useLanguageStore';
import { t } from '../i18n/translations';

type InputMode = 'text' | 'photo' | 'search';
type Nav = NativeStackNavigationProp<DiaryStackParamList, 'AddMeal'>;

export default function AddMealScreen() {
  const addMeal = useDiaryStore((s) => s.addMeal);
  const addToLibrary = useFoodLibraryStore((s) => s.addItems);
  const searchLibrary = useFoodLibraryStore((s) => s.searchItems);
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<DiaryStackParamList, 'AddMeal'>>();

  const colors = useColors();
  const lang = useLanguageStore((s) => s.language);
  const T = t(lang);
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [mealType, setMealType] = useState<MealType>('lunch');
  const [mode, setMode] = useState<InputMode>('text');
  const [textInput, setTextInput] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const [photoComment, setPhotoComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeminiNutritionResponse | null>(null);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BarcodeProduct[]>([]);
  const [searching, setSearching] = useState(false);
  const [libraryResults, setLibraryResults] = useState<SavedFoodItem[]>([]);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

  // Handle barcode product from scanner
  useEffect(() => {
    const barcodeProduct = (route.params as any)?.barcodeProduct as BarcodeProduct | undefined;
    if (barcodeProduct) {
      setResult({
        items: [{
          name: barcodeProduct.brand ? `${barcodeProduct.name} (${barcodeProduct.brand})` : barcodeProduct.name,
          amount: barcodeProduct.servingSize,
          calories: barcodeProduct.macros.calories,
          proteins: barcodeProduct.macros.proteins,
          fats: barcodeProduct.macros.fats,
          carbs: barcodeProduct.macros.carbs,
          ...(barcodeProduct.macros.sugar != null && { sugar: barcodeProduct.macros.sugar }),
          ...(barcodeProduct.macros.salt != null && { salt: barcodeProduct.macros.salt }),
        }],
        totalCalories: barcodeProduct.macros.calories,
        totalProteins: barcodeProduct.macros.proteins,
        totalFats: barcodeProduct.macros.fats,
        totalCarbs: barcodeProduct.macros.carbs,
        ...(barcodeProduct.macros.sugar != null && { totalSugar: barcodeProduct.macros.sugar }),
        ...(barcodeProduct.macros.salt != null && { totalSalt: barcodeProduct.macros.salt }),
        confidence: 'high',
      });
      setSaved(false);
    }
  }, [(route.params as any)?.barcodeProduct]);

  // Debounced product search
  const handleSearchInput = useCallback((text: string) => {
    setSearchQuery(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (text.trim().length < 2) {
      setSearchResults([]);
      setLibraryResults([]);
      return;
    }

    // Instant local search
    const localResults = searchLibrary(text.trim());
    setLibraryResults(localResults);

    // Debounced API search
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchProducts(text.trim());
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 500);
  }, [searchLibrary]);

  const handleSelectProduct = (product: BarcodeProduct) => {
    setResult({
      items: [{
        name: product.brand ? `${product.name} (${product.brand})` : product.name,
        amount: product.servingSize,
        calories: product.macros.calories,
        proteins: product.macros.proteins,
        fats: product.macros.fats,
        carbs: product.macros.carbs,
        ...(product.macros.sugar != null && { sugar: product.macros.sugar }),
        ...(product.macros.salt != null && { salt: product.macros.salt }),
      }],
      totalCalories: product.macros.calories,
      totalProteins: product.macros.proteins,
      totalFats: product.macros.fats,
      totalCarbs: product.macros.carbs,
      ...(product.macros.sugar != null && { totalSugar: product.macros.sugar }),
      ...(product.macros.salt != null && { totalSalt: product.macros.salt }),
      confidence: 'high',
    });
    setSearchResults([]);
    setSearchQuery('');
    setSaved(false);
  };

  const handleSelectLibraryItem = (item: SavedFoodItem) => {
    setResult({
      items: [{
        name: item.name,
        amount: item.amount,
        calories: item.macros.calories,
        proteins: item.macros.proteins,
        fats: item.macros.fats,
        carbs: item.macros.carbs,
        ...(item.macros.sugar != null && { sugar: item.macros.sugar }),
        ...(item.macros.salt != null && { salt: item.macros.salt }),
        ...(item.macros.glycemicIndex != null && { glycemicIndex: item.macros.glycemicIndex }),
        ...(item.macros.insulinIndex != null && { insulinIndex: item.macros.insulinIndex }),
      }],
      totalCalories: item.macros.calories,
      totalProteins: item.macros.proteins,
      totalFats: item.macros.fats,
      totalCarbs: item.macros.carbs,
      ...(item.macros.sugar != null && { totalSugar: item.macros.sugar }),
      ...(item.macros.salt != null && { totalSalt: item.macros.salt }),
      confidence: 'high',
    });
    setSearchResults([]);
    setLibraryResults([]);
    setSearchQuery('');
    setSaved(false);
  };

  const handleAnalyzeText = async () => {
    if (!textInput.trim()) {
      Alert.alert(T.common.error, T.meals.errorDescribe);
      return;
    }
    setLoading(true);
    setResult(null);
    setSaved(false);
    try {
      const res = await analyzeTextMeal(textInput.trim());
      setResult(res);
    } catch (e: any) {
      Alert.alert(T.common.error, e.message || T.meals.errorAnalyze);
    } finally {
      setLoading(false);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(T.common.error, T.meals.errorCamera);
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      base64: true,
      allowsEditing: true,
    });
    if (!res.canceled && res.assets[0]) {
      setPhotoUri(res.assets[0].uri);
      setBase64Data(res.assets[0].base64 || null);
      setResult(null);
      setSaved(false);
    }
  };

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(T.common.error, T.meals.errorGallery);
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      base64: true,
      allowsEditing: true,
    });
    if (!res.canceled && res.assets[0]) {
      setPhotoUri(res.assets[0].uri);
      setBase64Data(res.assets[0].base64 || null);
      setResult(null);
      setSaved(false);
    }
  };

  const handleAnalyzePhoto = async () => {
    if (!base64Data) {
      Alert.alert(T.common.error, T.meals.errorPhotoFirst);
      return;
    }
    setLoading(true);
    setResult(null);
    setSaved(false);
    try {
      const res = await analyzePhotoMeal(base64Data, 'image/jpeg', photoComment);
      setResult(res);
    } catch (e: any) {
      Alert.alert(T.common.error, e.message || T.meals.errorRecognize);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    setUploading(true);
    try {
      const items: FoodItem[] = result.items.map((item) => ({
        id: generateId(),
        name: item.name,
        amount: item.amount,
        macros: {
          calories: item.calories,
          proteins: item.proteins,
          fats: item.fats,
          carbs: item.carbs,
          ...(item.glycemicIndex != null && { glycemicIndex: item.glycemicIndex }),
          ...(item.insulinIndex != null && { insulinIndex: item.insulinIndex }),
          ...(item.sugar != null && { sugar: item.sugar }),
          ...(item.salt != null && { salt: item.salt }),
        },
      }));

      let finalPhotoUri: string | undefined;
      if (photoUri) {
        try {
          const photoId = generateId();
          finalPhotoUri = await uploadMealPhoto(photoUri, photoId);
        } catch (uploadError) {
          console.warn('[AddMeal] Photo upload failed:', uploadError);
          finalPhotoUri = photoUri;
        }
      }

      addMeal(todayKey(), mealType, items, mode === 'search' ? 'text' : mode, finalPhotoUri);
      const source = mode === 'search' ? 'barcode' as const : 'ai' as const;
      addToLibrary(items, source);
      setSaved(true);
      Alert.alert(T.meals.savedAlert, T.meals.savedMessage);
    } catch (error: any) {
      Alert.alert(T.common.error, error.message || T.meals.errorSave);
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setTextInput('');
    setPhotoUri(null);
    setBase64Data(null);
    setPhotoComment('');
    setResult(null);
    setSaved(false);
    setSearchQuery('');
    setSearchResults([]);
    setLibraryResults([]);
  };

  const confidenceLabel = {
    high: T.meals.confidenceHigh,
    medium: T.meals.confidenceMedium,
    low: T.meals.confidenceLow,
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          <Text style={styles.title}>{T.meals.title}</Text>

          <View style={styles.mealTypeRow}>
            {mealTypes.map((mt) => (
              <TouchableOpacity
                key={mt}
                style={[styles.mealTypeChip, mealType === mt && styles.mealTypeActive]}
                onPress={() => setMealType(mt)}
              >
                <Text style={[styles.mealTypeText, mealType === mt && styles.mealTypeTextActive]}>
                  {T.labels.mealTypes[mt]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.modeRow}>
            {(['text', 'photo', 'search'] as InputMode[]).map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.modeTab, mode === m && styles.modeActive]}
                onPress={() => { setMode(m); setResult(null); setSaved(false); }}
              >
                <Text style={[styles.modeText, mode === m && styles.modeTextActive]}>
                  {m === 'text' ? T.meals.text : m === 'photo' ? T.meals.photo : T.meals.searchTab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.barcodeButton}
            onPress={() => navigation.navigate('BarcodeScanner')}
          >
            <Text style={styles.barcodeIcon}>{'\u{1F4F7}'}</Text>
            <Text style={styles.barcodeText}>{T.meals.scanBarcode}</Text>
          </TouchableOpacity>

          {mode === 'text' && (
            <View>
              <TextInput
                style={styles.textArea}
                value={textInput}
                onChangeText={setTextInput}
                placeholder={T.meals.textPlaceholder}
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
              />
              <TouchableOpacity style={styles.analyzeButton} onPress={handleAnalyzeText}>
                <Text style={styles.analyzeText}>{T.meals.analyze}</Text>
              </TouchableOpacity>
            </View>
          )}

          {mode === 'photo' && (
            <View>
              <View style={styles.photoButtons}>
                <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
                  <Text style={styles.photoButtonText}>{T.meals.takePhoto}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoButton} onPress={pickPhoto}>
                  <Text style={styles.photoButtonText}>{T.meals.pickPhoto}</Text>
                </TouchableOpacity>
              </View>
              {photoUri && (
                <Image source={{ uri: photoUri }} style={styles.preview} />
              )}
              {photoUri && (
                <TextInput
                  style={styles.commentInput}
                  value={photoComment}
                  onChangeText={setPhotoComment}
                  placeholder={T.meals.commentPlaceholder}
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={2}
                />
              )}
              {photoUri && (
                <TouchableOpacity style={styles.analyzeButton} onPress={handleAnalyzePhoto}>
                  <Text style={styles.analyzeText}>{T.meals.analyze}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {mode === 'search' && (
            <View>
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={handleSearchInput}
                placeholder={T.meals.searchPlaceholder}
                placeholderTextColor={colors.textSecondary}
                autoFocus
              />

              {libraryResults.length > 0 && (
                <View style={styles.searchResultsList}>
                  <Text style={styles.searchSectionLabel}>{T.meals.myProducts}</Text>
                  {libraryResults.slice(0, 5).map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.searchResultItem}
                      onPress={() => handleSelectLibraryItem(item)}
                    >
                      <View style={styles.searchResultInfo}>
                        <Text style={styles.searchResultName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={styles.searchResultBrand} numberOfLines={1}>
                          {item.amount}
                        </Text>
                      </View>
                      <View style={styles.searchResultMacros}>
                        <Text style={[styles.searchResultKcal, { color: colors.calories }]}>
                          {item.macros.calories} {T.common.kcal}
                        </Text>
                        <Text style={styles.searchResultBju}>
                          {T.meals.B}{item.macros.proteins} {T.meals.F}{item.macros.fats} {T.meals.C}{item.macros.carbs}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {searching && (
                <View style={styles.searchingRow}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.searchingText}>{T.meals.searching}</Text>
                </View>
              )}
              {searchResults.length > 0 && (
                <View style={styles.searchResultsList}>
                  {libraryResults.length > 0 && (
                    <Text style={styles.searchSectionLabel}>Open Food Facts</Text>
                  )}
                  {searchResults.map((product, idx) => (
                    <TouchableOpacity
                      key={`${product.barcode}-${idx}`}
                      style={styles.searchResultItem}
                      onPress={() => handleSelectProduct(product)}
                    >
                      <View style={styles.searchResultInfo}>
                        <Text style={styles.searchResultName} numberOfLines={1}>
                          {product.name}
                        </Text>
                        {product.brand && (
                          <Text style={styles.searchResultBrand} numberOfLines={1}>
                            {product.brand}
                          </Text>
                        )}
                      </View>
                      <View style={styles.searchResultMacros}>
                        <Text style={[styles.searchResultKcal, { color: colors.calories }]}>
                          {product.macros.calories} {T.common.kcal}
                        </Text>
                        <Text style={styles.searchResultBju}>
                          {T.meals.B}{product.macros.proteins} {T.meals.F}{product.macros.fats} {T.meals.C}{product.macros.carbs}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {!searching && searchQuery.length >= 2 && searchResults.length === 0 && libraryResults.length === 0 && (
                <Text style={styles.noSearchResults}>{T.meals.nothingFound}</Text>
              )}
            </View>
          )}

          {result && (
            <View style={styles.resultContainer}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultTitle}>{T.meals.result}</Text>
                <Text style={[
                  styles.confidence,
                  result.confidence === 'high' && { color: colors.primary },
                  result.confidence === 'low' && { color: colors.error },
                ]}>
                  {confidenceLabel[result.confidence]}
                </Text>
              </View>

              {result.items.map((item, i) => (
                <FoodItemCard key={i} item={item} />
              ))}

              <View style={styles.totalCard}>
                <Text style={styles.totalTitle}>{T.meals.total}</Text>
                <View style={styles.totalRow}>
                  <Text style={[styles.totalValue, { color: colors.calories }]}>
                    {result.totalCalories} {T.common.kcal}
                  </Text>
                  <Text style={[styles.totalValue, { color: colors.proteins }]}>
                    {T.meals.B}:{result.totalProteins}{T.common.g}
                  </Text>
                  <Text style={[styles.totalValue, { color: colors.fats }]}>
                    {T.meals.F}:{result.totalFats}{T.common.g}
                  </Text>
                  <Text style={[styles.totalValue, { color: colors.carbs }]}>
                    {T.meals.C}:{result.totalCarbs}{T.common.g}
                  </Text>
                </View>
              </View>

              <Text style={styles.disclaimer}>
                * {T.meals.disclaimer}
                {mode !== 'search' ? T.meals.disclaimerAI : T.meals.disclaimerSearch}
              </Text>

              {!saved ? (
                <TouchableOpacity
                  style={[styles.saveButton, uploading && { opacity: 0.5 }]}
                  onPress={handleSave}
                  disabled={uploading}
                >
                  {uploading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveText}>{T.meals.saveToDiary}</Text>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.newButton} onPress={handleReset}>
                  <Text style={styles.newText}>{T.meals.addMore}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      <LoadingOverlay visible={loading} />
    </SafeAreaView>
  );
}

function getStyles(c: typeof darkColors) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: c.background,
    },
    container: {
      flex: 1,
    },
    content: {
      padding: 20,
      paddingBottom: 40,
    },
    title: {
      fontSize: 26,
      fontWeight: '800',
      color: c.text,
      marginBottom: 18,
      letterSpacing: -0.3,
    },
    mealTypeRow: {
      flexDirection: 'row',
      gap: 6,
      marginBottom: 16,
    },
    mealTypeChip: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 14,
      backgroundColor: c.surface,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
    },
    mealTypeActive: {
      backgroundColor: c.primary,
      borderColor: c.primary,
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 4,
    },
    mealTypeText: {
      fontSize: 13,
      color: c.textSecondary,
      fontWeight: '500',
    },
    mealTypeTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    modeRow: {
      flexDirection: 'row',
      backgroundColor: c.surface,
      borderRadius: 14,
      padding: 4,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: c.border,
    },
    modeTab: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 11,
      alignItems: 'center',
    },
    modeActive: {
      backgroundColor: c.primary,
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    modeText: {
      fontSize: 15,
      fontWeight: '600',
      color: c.textMuted,
    },
    modeTextActive: {
      color: '#FFFFFF',
    },
    textArea: {
      backgroundColor: c.surface,
      borderRadius: 14,
      padding: 16,
      fontSize: 16,
      color: c.text,
      minHeight: 90,
      textAlignVertical: 'top',
      borderWidth: 1,
      borderColor: c.border,
      lineHeight: 22,
    },
    analyzeButton: {
      backgroundColor: c.primary,
      borderRadius: 14,
      padding: 16,
      alignItems: 'center',
      marginTop: 12,
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 5,
    },
    analyzeText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    photoButtons: {
      flexDirection: 'row',
      gap: 10,
    },
    photoButton: {
      flex: 1,
      padding: 14,
      borderRadius: 14,
      backgroundColor: 'rgba(108, 92, 231, 0.1)',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.primary,
    },
    photoButtonText: {
      color: c.primaryLight,
      fontSize: 15,
      fontWeight: '600',
    },
    preview: {
      width: '100%',
      height: 200,
      borderRadius: 16,
      marginTop: 12,
      backgroundColor: c.surface,
    },
    commentInput: {
      backgroundColor: c.surface,
      borderRadius: 12,
      padding: 14,
      fontSize: 14,
      color: c.text,
      marginTop: 10,
      borderWidth: 1,
      borderColor: c.border,
      minHeight: 50,
      textAlignVertical: 'top',
      lineHeight: 20,
    },
    // Search
    searchInput: {
      backgroundColor: c.surface,
      borderRadius: 14,
      padding: 16,
      fontSize: 16,
      color: c.text,
      borderWidth: 1,
      borderColor: c.border,
    },
    searchingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 16,
    },
    searchingText: {
      fontSize: 14,
      color: c.textSecondary,
    },
    searchResultsList: {
      marginTop: 12,
    },
    searchResultItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surface,
      borderRadius: 14,
      padding: 14,
      marginBottom: 6,
      borderWidth: 1,
      borderColor: c.border,
    },
    searchResultInfo: {
      flex: 1,
      marginRight: 10,
    },
    searchResultName: {
      fontSize: 14,
      fontWeight: '600',
      color: c.text,
    },
    searchResultBrand: {
      fontSize: 12,
      color: c.textSecondary,
      marginTop: 2,
    },
    searchResultMacros: {
      alignItems: 'flex-end',
    },
    searchResultKcal: {
      fontSize: 14,
      fontWeight: '700',
    },
    searchResultBju: {
      fontSize: 11,
      color: c.textMuted,
      marginTop: 2,
    },
    noSearchResults: {
      fontSize: 14,
      color: c.textMuted,
      textAlign: 'center',
      paddingVertical: 24,
    },
    searchSectionLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: c.textSecondary,
      marginTop: 12,
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    // Results
    resultContainer: {
      marginTop: 24,
    },
    resultHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    resultTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: c.text,
    },
    confidence: {
      fontSize: 13,
      color: c.textSecondary,
      fontWeight: '500',
    },
    totalCard: {
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: 16,
      marginTop: 8,
      borderWidth: 1,
      borderColor: c.border,
    },
    totalTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: c.text,
      marginBottom: 10,
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    totalValue: {
      fontSize: 14,
      fontWeight: '700',
    },
    disclaimer: {
      fontSize: 12,
      color: c.textMuted,
      marginTop: 10,
      fontStyle: 'italic',
    },
    saveButton: {
      backgroundColor: c.primary,
      borderRadius: 14,
      padding: 17,
      alignItems: 'center',
      marginTop: 18,
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 6,
    },
    saveText: {
      color: '#FFFFFF',
      fontSize: 17,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    newButton: {
      backgroundColor: c.surface,
      borderRadius: 14,
      padding: 17,
      alignItems: 'center',
      marginTop: 18,
      borderWidth: 1,
      borderColor: c.primary,
    },
    newText: {
      color: c.primaryLight,
      fontSize: 17,
      fontWeight: '700',
    },
    barcodeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surface,
      borderRadius: 14,
      padding: 14,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: c.borderLight,
      gap: 8,
    },
    barcodeIcon: {
      fontSize: 18,
    },
    barcodeText: {
      fontSize: 15,
      fontWeight: '600',
      color: c.text,
    },
  });
}
