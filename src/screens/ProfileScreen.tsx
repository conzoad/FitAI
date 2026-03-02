import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfileStore } from '../stores/useProfileStore';
import { useAuthStore } from '../stores/useAuthStore';
import { Goal, ActivityLevel, Gender } from '../models/types';
import { darkColors } from '../theme/colors';
import { useColors } from '../theme/useColors';
import { useThemeStore, ThemeMode } from '../stores/useThemeStore';
import { useLanguageStore, Language } from '../stores/useLanguageStore';
import { t } from '../i18n/translations';

interface Props {
  isOnboarding?: boolean;
}

const MODEL_OPTIONS: { key: string; label: string }[] = [
  { key: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { key: 'gemini-3-flash', label: 'Gemini 3 Flash' },
  { key: 'gemma-3-27b-it', label: 'Gemma 3 27B' },
];

export default function ProfileScreen({ isOnboarding = false }: Props) {
  const colors = useColors();
  const lang = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);
  const T = t(lang);
  const styles = useMemo(() => getStyles(colors), [colors]);

  const { profile, setProfile, calculateTargets, resetProfile, apiRequestCounts } = useProfileStore();
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

  const currentModel = profile.geminiModel || 'gemini-2.5-flash';

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert(T.common.error, T.profile.nameError);
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
    { key: 'dark', label: T.profile.themeDark },
    { key: 'light', label: T.profile.themeLight },
    { key: 'system', label: T.profile.themeSystem },
  ];

  const languages: { key: Language; label: string }[] = [
    { key: 'ru', label: 'Русский' },
    { key: 'en', label: 'English' },
  ];

  const handleLogout = () => {
    Alert.alert(T.profile.logoutTitle, T.profile.logoutMessage, [
      { text: T.common.cancel, style: 'cancel' },
      {
        text: T.profile.logoutConfirm,
        style: 'destructive',
        onPress: () => {
          resetProfile();
          logout();
        },
      },
    ]);
  };

  const todayDate = new Date().toISOString().split('T')[0];

  const getRequestCount = (model: string): number => {
    const entry = apiRequestCounts[model];
    if (!entry || entry.date !== todayDate) return 0;
    return entry.today;
  };

  const initials = (name || 'U').charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          {/* Avatar & Header */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <Text style={styles.title}>
              {isOnboarding ? T.profile.welcome : name || T.profile.profileTitle}
            </Text>
            {isOnboarding && (
              <Text style={styles.subtitle}>
                {T.profile.onboardingSubtitle}
              </Text>
            )}
          </View>

          <Text style={styles.label}>{T.profile.nameLabel}</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={T.profile.namePlaceholder}
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.label}>{T.profile.genderLabel}</Text>
          <View style={styles.row}>
            {genders.map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.chip, gender === g && styles.chipActive]}
                onPress={() => setGender(g)}
              >
                <Text style={[styles.chipText, gender === g && styles.chipTextActive]}>
                  {T.labels.genders[g]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.rowInputs}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{T.profile.ageLabel}</Text>
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
              <Text style={styles.label}>{T.profile.heightLabel}</Text>
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
              <Text style={styles.label}>{T.profile.weightLabel}</Text>
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

          <Text style={styles.label}>{T.profile.goalLabel}</Text>
          <View style={styles.row}>
            {goals.map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.chip, goal === g && styles.chipActive]}
                onPress={() => setGoal(g)}
              >
                <Text style={[styles.chipText, goal === g && styles.chipTextActive]}>
                  {T.labels.goals[g]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>{T.profile.activityLabel}</Text>
          {activities.map((a) => (
            <TouchableOpacity
              key={a}
              style={[styles.activityItem, activity === a && styles.activityActive]}
              onPress={() => setActivity(a)}
            >
              <Text style={[styles.activityText, activity === a && styles.activityTextActive]}>
                {T.labels.activities[a]}
              </Text>
            </TouchableOpacity>
          ))}

          {!isOnboarding && (
            <>
              {/* Language Selector */}
              <Text style={styles.label}>{T.profile.languageLabel}</Text>
              <View style={styles.row}>
                {languages.map((l) => (
                  <TouchableOpacity
                    key={l.key}
                    style={[styles.chip, lang === l.key && styles.chipActive]}
                    onPress={() => setLanguage(l.key)}
                  >
                    <Text style={[styles.chipText, lang === l.key && styles.chipTextActive]}>
                      {l.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Theme Selector */}
              <Text style={styles.label}>{T.profile.themeLabel}</Text>
              <View style={styles.row}>
                {themes.map((th) => (
                  <TouchableOpacity
                    key={th.key}
                    style={[styles.chip, currentTheme === th.key && styles.chipActive]}
                    onPress={() => setTheme(th.key)}
                  >
                    <Text style={[styles.chipText, currentTheme === th.key && styles.chipTextActive]}>
                      {th.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Model Selector */}
              <Text style={styles.label}>{T.profile.modelLabel}</Text>
              <View style={styles.row}>
                {MODEL_OPTIONS.map((m) => (
                  <TouchableOpacity
                    key={m.key}
                    style={[styles.chip, currentModel === m.key && styles.chipActiveModel]}
                    onPress={() => setProfile({ geminiModel: m.key })}
                  >
                    <Text style={[styles.chipText, currentModel === m.key && styles.chipTextActive]}>
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Request Counter */}
              <View style={styles.requestCountRow}>
                {MODEL_OPTIONS.map((m) => {
                  const count = getRequestCount(m.key);
                  if (count === 0 && m.key !== currentModel) return null;
                  return (
                    <Text
                      key={m.key}
                      style={[
                        styles.requestCountText,
                        m.key === currentModel && { color: colors.workout },
                      ]}
                    >
                      {m.label}: {count} {T.profile.requestsToday.toLowerCase()}
                    </Text>
                  );
                })}
              </View>

              {/* API Key */}
              <Text style={styles.label}>{T.profile.apiKeyLabel}</Text>
              <Text style={styles.helperText}>
                {T.profile.apiKeyHelper}
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
              {isOnboarding ? T.profile.startButton : T.profile.saveButton}
            </Text>
          </TouchableOpacity>

          {!isOnboarding && profile.targetCalories > 0 && (
            <View style={styles.targetsCard}>
              <Text style={styles.targetsTitle}>{T.profile.dailyTargets}</Text>
              <View style={styles.targetRow}>
                <View style={styles.targetItem}>
                  <Text style={[styles.targetValue, { color: colors.calories }]}>{profile.targetCalories}</Text>
                  <Text style={styles.targetLabel}>{T.common.kcal}</Text>
                </View>
                <View style={styles.targetItem}>
                  <Text style={[styles.targetValue, { color: colors.proteins }]}>{profile.targetProteins}{T.common.g}</Text>
                  <Text style={styles.targetLabel}>{T.profile.proteins}</Text>
                </View>
                <View style={styles.targetItem}>
                  <Text style={[styles.targetValue, { color: colors.fats }]}>{profile.targetFats}{T.common.g}</Text>
                  <Text style={styles.targetLabel}>{T.profile.fats}</Text>
                </View>
                <View style={styles.targetItem}>
                  <Text style={[styles.targetValue, { color: colors.carbs }]}>{profile.targetCarbs}{T.common.g}</Text>
                  <Text style={styles.targetLabel}>{T.profile.carbs}</Text>
                </View>
              </View>
            </View>
          )}

          {!isOnboarding && user && (
            <View style={styles.accountSection}>
              <Text style={styles.sectionTitle}>{T.profile.account}</Text>
              <View style={styles.accountCard}>
                <Text style={styles.accountEmail}>{user.email}</Text>
                <View style={styles.providerBadge}>
                  <Text style={styles.providerText}>
                    {user.provider === 'google' ? 'Google' : 'Email'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutText}>{T.profile.logout}</Text>
              </TouchableOpacity>
            </View>
          )}

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
    chipActiveModel: {
      backgroundColor: c.workout,
      borderColor: c.workout,
      shadowColor: c.workout,
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
    requestCountRow: {
      marginTop: 8,
      gap: 4,
    },
    requestCountText: {
      fontSize: 13,
      color: c.textMuted,
    },
  });
}
