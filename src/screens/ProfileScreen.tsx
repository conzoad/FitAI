import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfileStore } from '../stores/useProfileStore';
import { useAuthStore } from '../stores/useAuthStore';
import { Goal, ActivityLevel, Gender } from '../models/types';
import { GOAL_LABELS, ACTIVITY_LABELS, GENDER_LABELS } from '../utils/constants';
import { darkColors } from '../theme/colors';
import { useColors } from '../theme/useColors';
import { useThemeStore, ThemeMode } from '../stores/useThemeStore';

interface Props {
  isOnboarding?: boolean;
}

export default function ProfileScreen({ isOnboarding = false }: Props) {
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const { profile, setProfile, calculateTargets, resetProfile } = useProfileStore();
  const { user, logout } = useAuthStore();
  const currentTheme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const [name, setName] = useState(profile.name);
  const [age, setAge] = useState(String(profile.age));
  const [height, setHeight] = useState(String(profile.heightCm));
  const [weight, setWeight] = useState(String(profile.weightKg));
  const [gender, setGender] = useState<Gender>(profile.gender);
  const [goal, setGoal] = useState<Goal>(profile.goal);
  const [activity, setActivity] = useState<ActivityLevel>(profile.activityLevel);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Ошибка', 'Введите ваше имя');
      return;
    }
    setProfile({
      name: name.trim(),
      age: parseInt(age) || 25,
      heightCm: parseInt(height) || 175,
      weightKg: parseInt(weight) || 70,
      gender,
      goal,
      activityLevel: activity,
      isOnboarded: true,
    });
    setTimeout(() => calculateTargets(), 100);
  };

  const goals: Goal[] = ['loss', 'maintenance', 'gain'];
  const activities: ActivityLevel[] = ['sedentary', 'light', 'moderate', 'active', 'very_active'];
  const genders: Gender[] = ['male', 'female'];
  const themes: { key: ThemeMode; label: string }[] = [
    { key: 'dark', label: 'Тёмная' },
    { key: 'light', label: 'Светлая' },
    { key: 'system', label: 'Системная' },
  ];

  const handleLogout = () => {
    Alert.alert('Выйти из аккаунта?', 'Данные профиля будут сброшены', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Выйти',
        style: 'destructive',
        onPress: () => {
          resetProfile();
          logout();
        },
      },
    ]);
  };

  const initials = (name || 'U').charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Avatar & Header */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.title}>
            {isOnboarding ? 'Добро пожаловать!' : name || 'Профиль'}
          </Text>
          {isOnboarding && (
            <Text style={styles.subtitle}>
              Расскажите о себе, чтобы мы рассчитали вашу норму КБЖУ
            </Text>
          )}
        </View>

        <Text style={styles.label}>ИМЯ</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Ваше имя"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>ПОЛ</Text>
        <View style={styles.row}>
          {genders.map((g) => (
            <TouchableOpacity
              key={g}
              style={[styles.chip, gender === g && styles.chipActive]}
              onPress={() => setGender(g)}
            >
              <Text style={[styles.chipText, gender === g && styles.chipTextActive]}>
                {GENDER_LABELS[g]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.rowInputs}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>ВОЗРАСТ</Text>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
              placeholder="25"
              placeholderTextColor={colors.textMuted}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>РОСТ (СМ)</Text>
            <TextInput
              style={styles.input}
              value={height}
              onChangeText={setHeight}
              keyboardType="numeric"
              placeholder="175"
              placeholderTextColor={colors.textMuted}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>ВЕС (КГ)</Text>
            <TextInput
              style={styles.input}
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
              placeholder="70"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>

        <Text style={styles.label}>ЦЕЛЬ</Text>
        <View style={styles.row}>
          {goals.map((g) => (
            <TouchableOpacity
              key={g}
              style={[styles.chip, goal === g && styles.chipActive]}
              onPress={() => setGoal(g)}
            >
              <Text style={[styles.chipText, goal === g && styles.chipTextActive]}>
                {GOAL_LABELS[g]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>УРОВЕНЬ АКТИВНОСТИ</Text>
        {activities.map((a) => (
          <TouchableOpacity
            key={a}
            style={[styles.activityItem, activity === a && styles.activityActive]}
            onPress={() => setActivity(a)}
          >
            <Text style={[styles.activityText, activity === a && styles.activityTextActive]}>
              {ACTIVITY_LABELS[a]}
            </Text>
          </TouchableOpacity>
        ))}

        {!isOnboarding && (
          <>
            <Text style={styles.label}>ТЕМА</Text>
            <View style={styles.row}>
              {themes.map((t) => (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.chip, currentTheme === t.key && styles.chipActive]}
                  onPress={() => setTheme(t.key)}
                >
                  <Text style={[styles.chipText, currentTheme === t.key && styles.chipTextActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>GEMINI API КЛЮЧ (опционально)</Text>
            <Text style={styles.helperText}>
              Укажите свой ключ, чтобы не использовать общий лимит. Получить можно на ai.google.dev
            </Text>
            <TextInput
              style={styles.input}
              value={profile.geminiApiKey || ''}
              onChangeText={(text) => setProfile({ geminiApiKey: text.trim() })}
              placeholder="AIzaSy..."
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </>
        )}

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveText}>
            {isOnboarding ? 'Начать' : 'Сохранить'}
          </Text>
        </TouchableOpacity>

        {!isOnboarding && profile.targetCalories > 0 && (
          <View style={styles.targetsCard}>
            <Text style={styles.targetsTitle}>Ваша дневная норма</Text>
            <View style={styles.targetRow}>
              <View style={styles.targetItem}>
                <Text style={[styles.targetValue, { color: colors.calories }]}>{profile.targetCalories}</Text>
                <Text style={styles.targetLabel}>ккал</Text>
              </View>
              <View style={styles.targetItem}>
                <Text style={[styles.targetValue, { color: colors.proteins }]}>{profile.targetProteins}г</Text>
                <Text style={styles.targetLabel}>белки</Text>
              </View>
              <View style={styles.targetItem}>
                <Text style={[styles.targetValue, { color: colors.fats }]}>{profile.targetFats}г</Text>
                <Text style={styles.targetLabel}>жиры</Text>
              </View>
              <View style={styles.targetItem}>
                <Text style={[styles.targetValue, { color: colors.carbs }]}>{profile.targetCarbs}г</Text>
                <Text style={styles.targetLabel}>углев.</Text>
              </View>
            </View>
          </View>
        )}

        {!isOnboarding && user && (
          <View style={styles.accountSection}>
            <Text style={styles.sectionTitle}>Аккаунт</Text>
            <View style={styles.accountCard}>
              <Text style={styles.accountEmail}>{user.email}</Text>
              <View style={styles.providerBadge}>
                <Text style={styles.providerText}>
                  {user.provider === 'google' ? 'Google' : 'Email'}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutText}>Выйти из аккаунта</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
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
    avatarSection: {
      alignItems: 'center',
      marginBottom: 24,
    },
    avatarCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: c.surfaceLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
      borderWidth: 3,
      borderColor: c.primary,
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 6,
    },
    avatarText: {
      fontSize: 32,
      fontWeight: '800',
      color: c.primary,
    },
    title: {
      fontSize: 28,
      fontWeight: '800',
      color: c.text,
      marginBottom: 4,
      letterSpacing: -0.3,
    },
    subtitle: {
      fontSize: 15,
      color: c.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
    label: {
      fontSize: 12,
      fontWeight: '700',
      color: c.textMuted,
      marginTop: 18,
      marginBottom: 8,
      letterSpacing: 1.2,
    },
    helperText: {
      fontSize: 13,
      color: c.textMuted,
      marginTop: -4,
      marginBottom: 8,
      lineHeight: 18,
    },
    input: {
      backgroundColor: c.surface,
      borderRadius: 14,
      padding: 14,
      fontSize: 16,
      color: c.text,
      borderWidth: 1,
      borderColor: c.border,
    },
    row: {
      flexDirection: 'row',
      gap: 8,
      flexWrap: 'wrap',
    },
    rowInputs: {
      flexDirection: 'row',
      gap: 10,
    },
    inputGroup: {
      flex: 1,
    },
    chip: {
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    chipActive: {
      backgroundColor: c.primary,
      borderColor: c.primary,
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    chipText: {
      fontSize: 14,
      color: c.textSecondary,
      fontWeight: '500',
    },
    chipTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    activityItem: {
      padding: 14,
      borderRadius: 14,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 6,
    },
    activityActive: {
      backgroundColor: 'rgba(108, 92, 231, 0.12)',
      borderColor: c.primary,
    },
    activityText: {
      fontSize: 14,
      color: c.textSecondary,
    },
    activityTextActive: {
      color: c.primaryLight,
      fontWeight: '700',
    },
    saveButton: {
      backgroundColor: c.primary,
      borderRadius: 14,
      padding: 17,
      alignItems: 'center',
      marginTop: 28,
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 6,
    },
    saveText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    targetsCard: {
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: 18,
      marginTop: 24,
      borderWidth: 1,
      borderColor: c.border,
    },
    targetsTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: c.text,
      marginBottom: 14,
    },
    targetRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    targetItem: {
      alignItems: 'center',
    },
    targetValue: {
      fontSize: 20,
      fontWeight: '800',
    },
    targetLabel: {
      fontSize: 12,
      color: c.textMuted,
      marginTop: 2,
    },
    accountSection: {
      marginTop: 28,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: c.text,
      marginBottom: 10,
    },
    accountCard: {
      backgroundColor: c.surface,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: c.border,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    accountEmail: {
      fontSize: 15,
      fontWeight: '600',
      color: c.text,
      flex: 1,
    },
    providerBadge: {
      backgroundColor: c.surfaceLight,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    providerText: {
      fontSize: 12,
      color: c.textSecondary,
      fontWeight: '600',
    },
    logoutButton: {
      marginTop: 12,
      padding: 14,
      borderRadius: 14,
      backgroundColor: 'rgba(255, 107, 107, 0.1)',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 107, 107, 0.2)',
    },
    logoutText: {
      color: c.error,
      fontSize: 16,
      fontWeight: '600',
    },
  });
}
