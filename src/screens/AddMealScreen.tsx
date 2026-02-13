import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { MealType, FoodItem, GeminiNutritionResponse, AddMealStackParamList, BarcodeProduct, SavedFoodItem } from '../models/types';
import { MEAL_TYPE_LABELS } from '../utils/constants';
import { todayKey } from '../utils/dateHelpers';
import { generateId } from '../utils/calculations';
import FoodItemCard from '../components/FoodItemCard';
import LoadingOverlay from '../components/LoadingOverlay';
import { colors } from '../theme/colors';
import { useFoodLibraryStore } from '../stores/useFoodLibraryStore';

type InputMode = 'text' | 'photo' | 'search';
type Nav = NativeStackNavigationProp<AddMealStackParamList, 'AddMeal'>;

export default function AddMealScreen() {
  const addMeal = useDiaryStore((s) => s.addMeal);
  const addToLibrary = useFoodLibraryStore((s) => s.addItems);
  const searchLibrary = useFoodLibraryStore((s) => s.searchItems);
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<AddMealStackParamList, 'AddMeal'>>();

  const [mealType, setMealType] = useState<MealType>('lunch');
  const [mode, setMode] = useState<InputMode>('text');
  const [textInput, setTextInput] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeminiNutritionResponse | null>(null);
  const [saved, setSaved] = useState(false);

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
        }],
        totalCalories: barcodeProduct.macros.calories,
        totalProteins: barcodeProduct.macros.proteins,
        totalFats: barcodeProduct.macros.fats,
        totalCarbs: barcodeProduct.macros.carbs,
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
      }],
      totalCalories: product.macros.calories,
      totalProteins: product.macros.proteins,
      totalFats: product.macros.fats,
      totalCarbs: product.macros.carbs,
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
      }],
      totalCalories: item.macros.calories,
      totalProteins: item.macros.proteins,
      totalFats: item.macros.fats,
      totalCarbs: item.macros.carbs,
      confidence: 'high',
    });
    setSearchResults([]);
    setLibraryResults([]);
    setSearchQuery('');
    setSaved(false);
  };

  const handleAnalyzeText = async () => {
    if (!textInput.trim()) {
      Alert.alert('\u041E\u0448\u0438\u0431\u043A\u0430', '\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u0431\u043B\u044E\u0434\u0430');
      return;
    }
    setLoading(true);
    setResult(null);
    setSaved(false);
    try {
      const res = await analyzeTextMeal(textInput.trim());
      setResult(res);
    } catch (e: any) {
      Alert.alert('\u041E\u0448\u0438\u0431\u043A\u0430', e.message || '\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u0440\u043E\u0430\u043D\u0430\u043B\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0431\u043B\u044E\u0434\u043E');
    } finally {
      setLoading(false);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('\u041E\u0448\u0438\u0431\u043A\u0430', '\u041D\u0443\u0436\u0435\u043D \u0434\u043E\u0441\u0442\u0443\u043F \u043A \u043A\u0430\u043C\u0435\u0440\u0435');
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
      Alert.alert('\u041E\u0448\u0438\u0431\u043A\u0430', '\u041D\u0443\u0436\u0435\u043D \u0434\u043E\u0441\u0442\u0443\u043F \u043A \u0433\u0430\u043B\u0435\u0440\u0435\u0435');
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
      Alert.alert('\u041E\u0448\u0438\u0431\u043A\u0430', '\u0421\u043D\u0430\u0447\u0430\u043B\u0430 \u0441\u0434\u0435\u043B\u0430\u0439\u0442\u0435 \u0438\u043B\u0438 \u0432\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0444\u043E\u0442\u043E');
      return;
    }
    setLoading(true);
    setResult(null);
    setSaved(false);
    try {
      const res = await analyzePhotoMeal(base64Data);
      setResult(res);
    } catch (e: any) {
      Alert.alert('\u041E\u0448\u0438\u0431\u043A\u0430', e.message || '\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0440\u0430\u0441\u043F\u043E\u0437\u043D\u0430\u0442\u044C \u0431\u043B\u044E\u0434\u043E');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!result) return;
    const items: FoodItem[] = result.items.map((item) => ({
      id: generateId(),
      name: item.name,
      amount: item.amount,
      macros: {
        calories: item.calories,
        proteins: item.proteins,
        fats: item.fats,
        carbs: item.carbs,
      },
    }));
    addMeal(todayKey(), mealType, items, mode === 'search' ? 'text' : mode, photoUri || undefined);
    const source = mode === 'search' ? 'barcode' as const : 'ai' as const;
    addToLibrary(items, source);
    setSaved(true);
    Alert.alert('\u0413\u043E\u0442\u043E\u0432\u043E', '\u041F\u0440\u0438\u0451\u043C \u043F\u0438\u0449\u0438 \u0441\u043E\u0445\u0440\u0430\u043D\u0451\u043D \u0432 \u0434\u043D\u0435\u0432\u043D\u0438\u043A');
  };

  const handleReset = () => {
    setTextInput('');
    setPhotoUri(null);
    setBase64Data(null);
    setResult(null);
    setSaved(false);
    setSearchQuery('');
    setSearchResults([]);
    setLibraryResults([]);
  };

  const confidenceLabel = {
    high: '\u0412\u044B\u0441\u043E\u043A\u0430\u044F \u0442\u043E\u0447\u043D\u043E\u0441\u0442\u044C',
    medium: '\u0421\u0440\u0435\u0434\u043D\u044F\u044F \u0442\u043E\u0447\u043D\u043E\u0441\u0442\u044C',
    low: '\u041D\u0438\u0437\u043A\u0430\u044F \u0442\u043E\u0447\u043D\u043E\u0441\u0442\u044C',
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          <Text style={styles.title}>{'\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043F\u0440\u0438\u0451\u043C \u043F\u0438\u0449\u0438'}</Text>

          <View style={styles.mealTypeRow}>
            {mealTypes.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.mealTypeChip, mealType === t && styles.mealTypeActive]}
                onPress={() => setMealType(t)}
              >
                <Text style={[styles.mealTypeText, mealType === t && styles.mealTypeTextActive]}>
                  {MEAL_TYPE_LABELS[t]}
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
                  {m === 'text' ? '\u0422\u0435\u043A\u0441\u0442' : m === 'photo' ? '\u0424\u043E\u0442\u043E' : '\u041F\u043E\u0438\u0441\u043A'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.barcodeButton}
            onPress={() => navigation.navigate('BarcodeScanner')}
          >
            <Text style={styles.barcodeIcon}>{'\u{1F4F7}'}</Text>
            <Text style={styles.barcodeText}>{'\u0421\u043A\u0430\u043D\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0448\u0442\u0440\u0438\u0445\u043A\u043E\u0434'}</Text>
          </TouchableOpacity>

          {mode === 'text' && (
            <View>
              <TextInput
                style={styles.textArea}
                value={textInput}
                onChangeText={setTextInput}
                placeholder={'\u041E\u043F\u0438\u0448\u0438\u0442\u0435 \u0431\u043B\u044E\u0434\u043E, \u043D\u0430\u043F\u0440\u0438\u043C\u0435\u0440: \u043A\u0443\u0440\u0438\u043D\u0430\u044F \u0433\u0440\u0443\u0434\u043A\u0430 200\u0433 \u0441 \u0440\u0438\u0441\u043E\u043C \u0438 \u0441\u0430\u043B\u0430\u0442\u043E\u043C'}
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
              />
              <TouchableOpacity style={styles.analyzeButton} onPress={handleAnalyzeText}>
                <Text style={styles.analyzeText}>{'\u0420\u0430\u0441\u043F\u043E\u0437\u043D\u0430\u0442\u044C'}</Text>
              </TouchableOpacity>
            </View>
          )}

          {mode === 'photo' && (
            <View>
              <View style={styles.photoButtons}>
                <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
                  <Text style={styles.photoButtonText}>{'\u0421\u0434\u0435\u043B\u0430\u0442\u044C \u0444\u043E\u0442\u043E'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoButton} onPress={pickPhoto}>
                  <Text style={styles.photoButtonText}>{'\u0418\u0437 \u0433\u0430\u043B\u0435\u0440\u0435\u0438'}</Text>
                </TouchableOpacity>
              </View>
              {photoUri && (
                <Image source={{ uri: photoUri }} style={styles.preview} />
              )}
              {photoUri && (
                <TouchableOpacity style={styles.analyzeButton} onPress={handleAnalyzePhoto}>
                  <Text style={styles.analyzeText}>{'\u0420\u0430\u0441\u043F\u043E\u0437\u043D\u0430\u0442\u044C'}</Text>
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
                placeholder={'\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043F\u0440\u043E\u0434\u0443\u043A\u0442\u0430, \u043D\u0430\u043F\u0440.: \u043C\u043E\u043B\u043E\u043A\u043E, \u043E\u0432\u0441\u044F\u043D\u043A\u0430, \u0440\u0438\u0441'}
                placeholderTextColor={colors.textSecondary}
                autoFocus
              />

              {libraryResults.length > 0 && (
                <View style={styles.searchResultsList}>
                  <Text style={styles.searchSectionLabel}>{'\u041C\u043E\u0438 \u043F\u0440\u043E\u0434\u0443\u043A\u0442\u044B'}</Text>
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
                          {item.macros.calories} {'\u043A\u043A\u0430\u043B'}
                        </Text>
                        <Text style={styles.searchResultBju}>
                          {'\u0411'}{item.macros.proteins} {'\u0416'}{item.macros.fats} {'\u0423'}{item.macros.carbs}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {searching && (
                <View style={styles.searchingRow}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.searchingText}>{'\u041F\u043E\u0438\u0441\u043A...'}</Text>
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
                          {product.macros.calories} {'\u043A\u043A\u0430\u043B'}
                        </Text>
                        <Text style={styles.searchResultBju}>
                          {'\u0411'}{product.macros.proteins} {'\u0416'}{product.macros.fats} {'\u0423'}{product.macros.carbs}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {!searching && searchQuery.length >= 2 && searchResults.length === 0 && libraryResults.length === 0 && (
                <Text style={styles.noSearchResults}>{'\u041D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E'}</Text>
              )}
            </View>
          )}

          {result && (
            <View style={styles.resultContainer}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultTitle}>{'\u0420\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442'}</Text>
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
                <Text style={styles.totalTitle}>{'\u0418\u0442\u043E\u0433\u043E'}</Text>
                <View style={styles.totalRow}>
                  <Text style={[styles.totalValue, { color: colors.calories }]}>
                    {result.totalCalories} {'\u043A\u043A\u0430\u043B'}
                  </Text>
                  <Text style={[styles.totalValue, { color: colors.proteins }]}>
                    {'\u0411'}:{result.totalProteins}{'\u0433'}
                  </Text>
                  <Text style={[styles.totalValue, { color: colors.fats }]}>
                    {'\u0416'}:{result.totalFats}{'\u0433'}
                  </Text>
                  <Text style={[styles.totalValue, { color: colors.carbs }]}>
                    {'\u0423'}:{result.totalCarbs}{'\u0433'}
                  </Text>
                </View>
              </View>

              <Text style={styles.disclaimer}>
                * {'\u0414\u0430\u043D\u043D\u044B\u0435 \u043F\u0440\u0438\u0431\u043B\u0438\u0437\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u0435'}
                {mode !== 'search' ? ' \u0438 \u0440\u0430\u0441\u0441\u0447\u0438\u0442\u0430\u043D\u044B \u0418\u0418' : ' (\u043D\u0430 100\u0433)'}
              </Text>

              {!saved ? (
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <Text style={styles.saveText}>{'\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u0432 \u0434\u043D\u0435\u0432\u043D\u0438\u043A'}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.newButton} onPress={handleReset}>
                  <Text style={styles.newText}>{'\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0435\u0449\u0451'}</Text>
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

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
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
    color: colors.text,
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
    backgroundColor: colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  mealTypeActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  mealTypeText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  mealTypeTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modeRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 11,
    alignItems: 'center',
  },
  modeActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modeText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textMuted,
  },
  modeTextActive: {
    color: '#FFFFFF',
  },
  textArea: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    minHeight: 90,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.border,
    lineHeight: 22,
  },
  analyzeButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: colors.primary,
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
    borderColor: colors.primary,
  },
  photoButtonText: {
    color: colors.primaryLight,
    fontSize: 15,
    fontWeight: '600',
  },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginTop: 12,
    backgroundColor: colors.surface,
  },
  // Search
  searchInput: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
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
    color: colors.textSecondary,
  },
  searchResultsList: {
    marginTop: 12,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchResultInfo: {
    flex: 1,
    marginRight: 10,
  },
  searchResultName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  searchResultBrand: {
    fontSize: 12,
    color: colors.textSecondary,
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
    color: colors.textMuted,
    marginTop: 2,
  },
  noSearchResults: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 24,
  },
  searchSectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
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
    color: colors.text,
  },
  confidence: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  totalCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  totalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
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
    color: colors.textMuted,
    marginTop: 10,
    fontStyle: 'italic',
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: 17,
    alignItems: 'center',
    marginTop: 18,
    shadowColor: colors.primary,
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
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 17,
    alignItems: 'center',
    marginTop: 18,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  newText: {
    color: colors.primaryLight,
    fontSize: 17,
    fontWeight: '700',
  },
  barcodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 8,
  },
  barcodeIcon: {
    fontSize: 18,
  },
  barcodeText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
});
