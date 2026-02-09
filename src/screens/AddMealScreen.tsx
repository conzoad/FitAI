import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { analyzeTextMeal, analyzePhotoMeal } from '../services/gemini';
import { useDiaryStore } from '../stores/useDiaryStore';
import { MealType, FoodItem, GeminiNutritionResponse } from '../models/types';
import { MEAL_TYPE_LABELS } from '../utils/constants';
import { todayKey } from '../utils/dateHelpers';
import { generateId } from '../utils/calculations';
import FoodItemCard from '../components/FoodItemCard';
import LoadingOverlay from '../components/LoadingOverlay';
import { colors } from '../theme/colors';

type InputMode = 'text' | 'photo';

export default function AddMealScreen() {
  const addMeal = useDiaryStore((s) => s.addMeal);

  const [mealType, setMealType] = useState<MealType>('lunch');
  const [mode, setMode] = useState<InputMode>('text');
  const [textInput, setTextInput] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeminiNutritionResponse | null>(null);
  const [saved, setSaved] = useState(false);

  const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

  const handleAnalyzeText = async () => {
    if (!textInput.trim()) {
      Alert.alert('Ошибка', 'Введите описание блюда');
      return;
    }
    setLoading(true);
    setResult(null);
    setSaved(false);
    try {
      const res = await analyzeTextMeal(textInput.trim());
      setResult(res);
    } catch (e: any) {
      Alert.alert('Ошибка', e.message || 'Не удалось проанализировать блюдо');
    } finally {
      setLoading(false);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Ошибка', 'Нужен доступ к камере');
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
      Alert.alert('Ошибка', 'Нужен доступ к галерее');
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
      Alert.alert('Ошибка', 'Сначала сделайте или выберите фото');
      return;
    }
    setLoading(true);
    setResult(null);
    setSaved(false);
    try {
      const res = await analyzePhotoMeal(base64Data);
      setResult(res);
    } catch (e: any) {
      Alert.alert('Ошибка', e.message || 'Не удалось распознать блюдо');
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
    addMeal(todayKey(), mealType, items, mode, photoUri || undefined);
    setSaved(true);
    Alert.alert('Готово', 'Приём пищи сохранён в дневник');
  };

  const handleReset = () => {
    setTextInput('');
    setPhotoUri(null);
    setBase64Data(null);
    setResult(null);
    setSaved(false);
  };

  const confidenceLabel = {
    high: 'Высокая точность',
    medium: 'Средняя точность',
    low: 'Низкая точность',
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          <Text style={styles.title}>Добавить приём пищи</Text>

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
            <TouchableOpacity
              style={[styles.modeTab, mode === 'text' && styles.modeActive]}
              onPress={() => { setMode('text'); setResult(null); setSaved(false); }}
            >
              <Text style={[styles.modeText, mode === 'text' && styles.modeTextActive]}>
                Текст
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeTab, mode === 'photo' && styles.modeActive]}
              onPress={() => { setMode('photo'); setResult(null); setSaved(false); }}
            >
              <Text style={[styles.modeText, mode === 'photo' && styles.modeTextActive]}>
                Фото
              </Text>
            </TouchableOpacity>
          </View>

          {mode === 'text' ? (
            <View>
              <TextInput
                style={styles.textArea}
                value={textInput}
                onChangeText={setTextInput}
                placeholder="Опишите блюдо, например: куриная грудка 200г с рисом и салатом"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
              />
              <TouchableOpacity style={styles.analyzeButton} onPress={handleAnalyzeText}>
                <Text style={styles.analyzeText}>Распознать</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <View style={styles.photoButtons}>
                <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
                  <Text style={styles.photoButtonText}>Сделать фото</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoButton} onPress={pickPhoto}>
                  <Text style={styles.photoButtonText}>Из галереи</Text>
                </TouchableOpacity>
              </View>
              {photoUri && (
                <Image source={{ uri: photoUri }} style={styles.preview} />
              )}
              {photoUri && (
                <TouchableOpacity style={styles.analyzeButton} onPress={handleAnalyzePhoto}>
                  <Text style={styles.analyzeText}>Распознать</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {result && (
            <View style={styles.resultContainer}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultTitle}>Результат</Text>
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
                <Text style={styles.totalTitle}>Итого</Text>
                <View style={styles.totalRow}>
                  <Text style={[styles.totalValue, { color: colors.calories }]}>
                    {result.totalCalories} ккал
                  </Text>
                  <Text style={[styles.totalValue, { color: colors.proteins }]}>
                    Б:{result.totalProteins}г
                  </Text>
                  <Text style={[styles.totalValue, { color: colors.fats }]}>
                    Ж:{result.totalFats}г
                  </Text>
                  <Text style={[styles.totalValue, { color: colors.carbs }]}>
                    У:{result.totalCarbs}г
                  </Text>
                </View>
              </View>

              <Text style={styles.disclaimer}>
                * Данные приблизительные и рассчитаны ИИ
              </Text>

              {!saved ? (
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <Text style={styles.saveText}>Сохранить в дневник</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.newButton} onPress={handleReset}>
                  <Text style={styles.newText}>Добавить ещё</Text>
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
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  mealTypeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  mealTypeChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  mealTypeActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  mealTypeText: {
    fontSize: 13,
    color: colors.text,
  },
  mealTypeTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modeRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  modeActive: {
    backgroundColor: colors.primary,
  },
  modeText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  modeTextActive: {
    color: '#FFFFFF',
  },
  textArea: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.border,
  },
  analyzeButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  analyzeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  photoButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  photoButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 12,
    backgroundColor: colors.border,
  },
  resultContainer: {
    marginTop: 20,
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
  },
  totalCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },
  totalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  newButton: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  newText: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: '700',
  },
});
