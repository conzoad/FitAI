import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import {
  WorkoutStackParamList,
  MuscleGroup,
  Equipment,
  ExerciseCategory,
  ExerciseForce,
  ExerciseLevel,
} from '../models/types';
import { useExercisePrefsStore } from '../stores/useExercisePrefsStore';
import { analyzeExercisePhoto } from '../services/gemini';
import {
  MUSCLE_GROUP_LABELS,
  EQUIPMENT_LABELS,
  EXERCISE_CATEGORY_LABELS,
  EXERCISE_FORCE_LABELS,
  EXERCISE_LEVEL_LABELS,
} from '../utils/constants';
import { getAllMuscleGroups } from '../services/exerciseDatabase';
import { colors } from '../theme/colors';

type Nav = NativeStackNavigationProp<WorkoutStackParamList, 'CreateExercise'>;

export default function CreateExerciseScreen() {
  const navigation = useNavigation<Nav>();
  const addCustomExercise = useExercisePrefsStore((s) => s.addCustomExercise);

  const [name, setName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>('chest');
  const [equipment, setEquipment] = useState<Equipment>('none');
  const [category, setCategory] = useState<ExerciseCategory>('strength');
  const [force, setForce] = useState<ExerciseForce>('push');
  const [level, setLevel] = useState<ExerciseLevel>('beginner');
  const [isCompound, setIsCompound] = useState(true);
  const [description, setDescription] = useState('');

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  const [analyzing, setAnalyzing] = useState(false);

  const pickImage = async (source: 'camera' | 'gallery') => {
    let result: ImagePicker.ImagePickerResult;

    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Ошибка', 'Нужен доступ к камере');
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        base64: true,
        quality: 0.7,
      });
    } else {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Ошибка', 'Нужен доступ к галерее');
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({
        base64: true,
        quality: 0.7,
      });
    }

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      setImageBase64(asset.base64 ?? null);
      const mime = asset.uri.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
      setImageMimeType(mime);
    }
  };

  const handleAnalyze = async () => {
    if (!imageBase64) {
      Alert.alert('Ошибка', 'Сначала сделайте или выберите фото');
      return;
    }

    setAnalyzing(true);
    try {
      const result = await analyzeExercisePhoto(imageBase64, imageMimeType);
      setName(result.name);
      setMuscleGroup(result.muscleGroup);
      setEquipment(result.equipment);
      setCategory(result.category);
      setForce(result.force);
      setLevel(result.level);
      setIsCompound(result.isCompound);
      setDescription(result.description);
    } catch (error: any) {
      Alert.alert('Ошибка анализа', error.message || 'Не удалось распознать упражнение');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Ошибка', 'Введите название упражнения');
      return;
    }

    addCustomExercise({
      name: name.trim(),
      muscleGroup,
      equipment,
      category,
      force,
      level,
      isCompound,
      description: description.trim(),
    });

    navigation.goBack();
  };

  const muscleGroups = getAllMuscleGroups();
  const equipmentKeys = Object.keys(EQUIPMENT_LABELS) as Equipment[];
  const categoryKeys = Object.keys(EXERCISE_CATEGORY_LABELS) as ExerciseCategory[];
  const forceKeys = Object.keys(EXERCISE_FORCE_LABELS) as ExerciseForce[];
  const levelKeys = Object.keys(EXERCISE_LEVEL_LABELS) as ExerciseLevel[];

  const renderChips = <T extends string>(
    options: T[],
    labels: Record<string, string>,
    selected: T,
    onSelect: (value: T) => void
  ) => (
    <View style={styles.chipsContainer}>
      {options.map((option) => {
        const isSelected = option === selected;
        return (
          <TouchableOpacity
            key={option}
            style={[styles.chip, isSelected && styles.chipSelected]}
            onPress={() => onSelect(option)}
          >
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
              {labels[option] || option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Назад</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Новое упражнение</Text>

        {/* Photo Section */}
        <View style={styles.photoSection}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.photoPreview} resizeMode="cover" />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoPlaceholderText}>Фото упражнения</Text>
            </View>
          )}

          <View style={styles.photoButtons}>
            <TouchableOpacity
              style={styles.photoButton}
              onPress={() => pickImage('camera')}
            >
              <Text style={styles.photoButtonText}>Камера</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.photoButton}
              onPress={() => pickImage('gallery')}
            >
              <Text style={styles.photoButtonText}>Галерея</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.photoButton, styles.aiButton]}
              onPress={handleAnalyze}
              disabled={analyzing || !imageBase64}
            >
              {analyzing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={[styles.photoButtonText, styles.aiButtonText]}>
                  Распознать с ИИ
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Name */}
        <Text style={styles.label}>Название</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Название упражнения"
          placeholderTextColor={colors.textSecondary}
        />

        {/* Muscle Group */}
        <Text style={styles.label}>Группа мышц</Text>
        {renderChips(muscleGroups, MUSCLE_GROUP_LABELS, muscleGroup, setMuscleGroup)}

        {/* Equipment */}
        <Text style={styles.label}>Оборудование</Text>
        {renderChips(equipmentKeys, EQUIPMENT_LABELS, equipment, setEquipment)}

        {/* Category */}
        <Text style={styles.label}>Категория</Text>
        {renderChips(categoryKeys, EXERCISE_CATEGORY_LABELS, category, setCategory)}

        {/* Force */}
        <Text style={styles.label}>Тип усилия</Text>
        {renderChips(forceKeys, EXERCISE_FORCE_LABELS, force, setForce)}

        {/* Level */}
        <Text style={styles.label}>Уровень</Text>
        {renderChips(levelKeys, EXERCISE_LEVEL_LABELS, level, setLevel)}

        {/* isCompound Toggle */}
        <Text style={styles.label}>Тип упражнения</Text>
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setIsCompound((prev) => !prev)}
        >
          <Text style={styles.toggleText}>
            {isCompound ? 'Базовое' : 'Изолирующее'}
          </Text>
        </TouchableOpacity>

        {/* Description */}
        <Text style={styles.label}>Описание</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Описание техники выполнения..."
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, !name.trim() && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!name.trim()}
        >
          <Text style={styles.saveText}>Сохранить упражнение</Text>
        </TouchableOpacity>
      </ScrollView>
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
  backButton: {
    marginBottom: 8,
  },
  backText: {
    fontSize: 16,
    color: colors.workout,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },

  // Photo Section
  photoSection: {
    marginBottom: 8,
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: colors.surface,
    marginBottom: 10,
  },
  photoPlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  photoPlaceholderText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  photoButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  photoButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  aiButton: {
    backgroundColor: colors.workout,
    borderColor: colors.workout,
  },
  aiButtonText: {
    color: '#FFFFFF',
  },

  // Form
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    minHeight: 100,
  },

  // Chips
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.workout,
    borderColor: colors.workout,
  },
  chipText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Toggle
  toggleButton: {
    backgroundColor: colors.workoutLight,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.workout,
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.workout,
  },

  // Save
  saveButton: {
    backgroundColor: colors.workout,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
