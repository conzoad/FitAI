import React, { useState, useMemo } from 'react';
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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
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
import { uploadExercisePhoto } from '../services/imageUpload';
import { getAllMuscleGroups, getExerciseById } from '../services/exerciseDatabase';
import { darkColors } from '../theme/colors';
import { useColors } from '../theme/useColors';
import { useLanguageStore } from '../stores/useLanguageStore';
import { t } from '../i18n/translations';

type Nav = NativeStackNavigationProp<WorkoutStackParamList, 'CreateExercise'>;
type Route = RouteProp<WorkoutStackParamList, 'CreateExercise'>;

export default function CreateExerciseScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const editingId = route.params?.exerciseId;

  const addCustomExercise = useExercisePrefsStore((s) => s.addCustomExercise);
  const updateCustomExercise = useExercisePrefsStore((s) => s.updateCustomExercise);
  const customExercises = useExercisePrefsStore((s) => s.customExercises);

  const existingExercise = useMemo(
    () => (editingId ? getExerciseById(editingId, customExercises) : null),
    [editingId, customExercises],
  );

  const [name, setName] = useState(existingExercise?.name ?? '');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>(existingExercise?.muscleGroup ?? 'chest');
  const [equipment, setEquipment] = useState<Equipment>(existingExercise?.equipment ?? 'none');
  const [category, setCategory] = useState<ExerciseCategory>(existingExercise?.category ?? 'strength');
  const [force, setForce] = useState<ExerciseForce>(existingExercise?.force ?? 'push');
  const [level, setLevel] = useState<ExerciseLevel>(existingExercise?.level ?? 'beginner');
  const [isCompound, setIsCompound] = useState(existingExercise?.isCompound ?? true);
  const [description, setDescription] = useState(existingExercise?.description ?? '');

  const [imageUri, setImageUri] = useState<string | null>(existingExercise?.photoUrl ?? null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  const [analyzing, setAnalyzing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const lang = useLanguageStore((s) => s.language);
  const T = t(lang);

  const pickImage = async (source: 'camera' | 'gallery') => {
    let result: ImagePicker.ImagePickerResult;

    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(T.common.error, T.createExercise.cameraError);
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        base64: true,
        quality: 0.7,
      });
    } else {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(T.common.error, T.createExercise.galleryError);
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
      Alert.alert(T.common.error, T.createExercise.analyzeError);
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
      Alert.alert(T.common.error, error.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(T.common.error, T.createExercise.nameError);
      return;
    }

    setUploading(true);
    try {
      const exerciseData = {
        name: name.trim(),
        muscleGroup,
        equipment,
        category,
        force,
        level,
        isCompound,
        description: description.trim(),
      };

      if (editingId) {
        updateCustomExercise(editingId, exerciseData);

        if (imageUri && imageBase64) {
          try {
            const photoUrl = await uploadExercisePhoto(imageUri, editingId);
            updateCustomExercise(editingId, { photoUrl });
          } catch (uploadError) {
            console.warn('[CreateExercise] Photo upload failed:', uploadError);
          }
        }
      } else {
        const newId = addCustomExercise(exerciseData);

        if (imageUri && imageBase64) {
          try {
            const photoUrl = await uploadExercisePhoto(imageUri, newId);
            updateCustomExercise(newId, { photoUrl });
          } catch (uploadError) {
            console.warn('[CreateExercise] Photo upload failed:', uploadError);
          }
        }
      }

      navigation.goBack();
    } catch (error: any) {
      Alert.alert(T.common.error, error.message);
    } finally {
      setUploading(false);
    }
  };

  const muscleGroups = getAllMuscleGroups();
  const equipmentKeys: Equipment[] = ['none', 'barbell', 'dumbbells', 'dumbbell', 'kettlebell', 'machine', 'cable', 'band', 'fitball', 'pullUpBar', 'parallelBars', 'ezBar', 'treadmill', 'stationaryBike', 'jumpRope'];
  const categoryKeys: ExerciseCategory[] = ['strength', 'cardio', 'stretching', 'plyometric', 'powerlifting', 'weightlifting'];
  const forceKeys: ExerciseForce[] = ['push', 'pull', 'static', 'other'];
  const levelKeys: ExerciseLevel[] = ['beginner', 'intermediate', 'advanced'];

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
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>{T.common.back}</Text>
          </TouchableOpacity>

          <Text style={styles.title}>{editingId ? T.createExercise.titleEdit : T.createExercise.titleNew}</Text>

          {/* Photo Section */}
          <View style={styles.photoSection}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.photoPreview} resizeMode="cover" />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoPlaceholderText}>{T.createExercise.photoLabel}</Text>
              </View>
            )}

            <View style={styles.photoButtons}>
              <TouchableOpacity
                style={styles.photoButton}
                onPress={() => pickImage('camera')}
              >
                <Text style={styles.photoButtonText}>{T.createExercise.camera}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.photoButton}
                onPress={() => pickImage('gallery')}
              >
                <Text style={styles.photoButtonText}>{T.createExercise.gallery}</Text>
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
                    {T.createExercise.analyzeAI}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Name */}
          <Text style={styles.label}>{T.createExercise.nameLabel}</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={T.createExercise.namePlaceholder}
            placeholderTextColor={colors.textSecondary}
          />

          {/* Muscle Group */}
          <Text style={styles.label}>{T.createExercise.muscleGroupLabel}</Text>
          {renderChips(muscleGroups, T.labels.muscleGroups, muscleGroup, setMuscleGroup)}

          {/* Equipment */}
          <Text style={styles.label}>{T.createExercise.equipmentLabel}</Text>
          {renderChips(equipmentKeys, T.labels.equipment, equipment, setEquipment)}

          {/* Category */}
          <Text style={styles.label}>{T.createExercise.categoryLabel}</Text>
          {renderChips(categoryKeys, T.labels.exerciseCategories, category, setCategory)}

          {/* Force */}
          <Text style={styles.label}>{T.createExercise.forceLabel}</Text>
          {renderChips(forceKeys, T.labels.exerciseForce, force, setForce)}

          {/* Level */}
          <Text style={styles.label}>{T.createExercise.levelLabel}</Text>
          {renderChips(levelKeys, T.labels.exerciseLevels, level, setLevel)}

          {/* isCompound Toggle */}
          <Text style={styles.label}>{T.createExercise.typeLabel}</Text>
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setIsCompound((prev) => !prev)}
          >
            <Text style={styles.toggleText}>
              {isCompound ? T.createExercise.compound : T.createExercise.isolation}
            </Text>
          </TouchableOpacity>

          {/* Description */}
          <Text style={styles.label}>{T.createExercise.descriptionLabel}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder={T.createExercise.descriptionPlaceholder}
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, (!name.trim() || uploading) && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!name.trim() || uploading}
          >
            {uploading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveText}>{editingId ? T.createExercise.saveEdit : T.createExercise.saveNew}</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
    backButton: {
      marginBottom: 8,
    },
    backText: {
      fontSize: 16,
      color: c.workout,
      fontWeight: '600',
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: c.text,
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
      backgroundColor: c.surface,
      marginBottom: 10,
    },
    photoPlaceholder: {
      width: '100%',
      height: 200,
      borderRadius: 12,
      backgroundColor: c.surface,
      borderWidth: 2,
      borderColor: c.border,
      borderStyle: 'dashed',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10,
    },
    photoPlaceholderText: {
      fontSize: 15,
      color: c.textSecondary,
    },
    photoButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    photoButton: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: 10,
      paddingVertical: 10,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
    },
    photoButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: c.text,
    },
    aiButton: {
      backgroundColor: c.workout,
      borderColor: c.workout,
    },
    aiButtonText: {
      color: '#FFFFFF',
    },

    // Form
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: c.textSecondary,
      marginTop: 16,
      marginBottom: 8,
    },
    input: {
      backgroundColor: c.surface,
      borderRadius: 10,
      padding: 14,
      fontSize: 16,
      color: c.text,
      borderWidth: 1,
      borderColor: c.border,
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
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    chipSelected: {
      backgroundColor: c.workout,
      borderColor: c.workout,
    },
    chipText: {
      fontSize: 13,
      color: c.textSecondary,
    },
    chipTextSelected: {
      color: '#FFFFFF',
      fontWeight: '600',
    },

    // Toggle
    toggleButton: {
      backgroundColor: c.workoutLight,
      borderRadius: 10,
      paddingVertical: 12,
      paddingHorizontal: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.workout,
    },
    toggleText: {
      fontSize: 15,
      fontWeight: '600',
      color: c.workout,
    },

    // Save
    saveButton: {
      backgroundColor: c.workout,
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
}
