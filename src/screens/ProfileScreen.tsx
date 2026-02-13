import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { useProfileStore } from '../stores/useProfileStore';
import { useAuthStore } from '../stores/useAuthStore';
import { Goal, ActivityLevel, Gender } from '../models/types';
import { GOAL_LABELS, ACTIVITY_LABELS, GENDER_LABELS } from '../utils/constants';
import { colors } from '../theme/colors';
import { backupToGoogleDrive, restoreFromGoogleDrive, getBackupInfo } from '../services/googleDrive';

WebBrowser.maybeCompleteAuthSession();

const googleClientId = Constants.expoConfig?.extra?.googleClientId || '';

interface Props {
  isOnboarding?: boolean;
}

export default function ProfileScreen({ isOnboarding = false }: Props) {
  const { profile, setProfile, calculateTargets, resetProfile } = useProfileStore();
  const { user, logout } = useAuthStore();
  const [name, setName] = useState(profile.name);
  const [age, setAge] = useState(String(profile.age));
  const [height, setHeight] = useState(String(profile.heightCm));
  const [weight, setWeight] = useState(String(profile.weightKg));
  const [gender, setGender] = useState<Gender>(profile.gender);
  const [goal, setGoal] = useState<Goal>(profile.goal);
  const [activity, setActivity] = useState<ActivityLevel>(profile.activityLevel);
  const [syncing, setSyncing] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(null);

  const discovery = AuthSession.useAutoDiscovery('https://accounts.google.com');

  const [driveRequest, , promptDriveAsync] = AuthSession.useAuthRequest(
    {
      clientId: googleClientId,
      scopes: ['https://www.googleapis.com/auth/drive.appdata'],
      redirectUri: AuthSession.makeRedirectUri(),
    },
    discovery
  );

  const getDriveToken = useCallback(async (): Promise<string | null> => {
    if (!googleClientId || googleClientId === 'YOUR_GOOGLE_CLIENT_ID_HERE') {
      Alert.alert('Настройка', 'Для синхронизации необходимо настроить GOOGLE_CLIENT_ID в .env');
      return null;
    }
    const result = await promptDriveAsync();
    if (result.type === 'success' && result.authentication) {
      return result.authentication.accessToken;
    }
    return null;
  }, [promptDriveAsync, googleClientId]);

  const handleBackup = useCallback(async () => {
    setSyncing(true);
    try {
      const token = await getDriveToken();
      if (!token) { setSyncing(false); return; }
      await backupToGoogleDrive(token);
      setLastBackup(new Date().toLocaleString('ru-RU'));
      Alert.alert('Готово', 'Данные сохранены в Google Drive');
    } catch (e: any) {
      Alert.alert('Ошибка', e.message || 'Не удалось создать резервную копию');
    } finally {
      setSyncing(false);
    }
  }, [getDriveToken]);

  const handleRestore = useCallback(async () => {
    Alert.alert(
      'Восстановление',
      'Текущие данные будут заменены данными из резервной копии. Продолжить?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Восстановить',
          onPress: async () => {
            setSyncing(true);
            try {
              const token = await getDriveToken();
              if (!token) { setSyncing(false); return; }
              await restoreFromGoogleDrive(token);
              Alert.alert('Готово', 'Данные восстановлены. Перезапустите приложение для применения.');
            } catch (e: any) {
              Alert.alert('Ошибка', e.message || 'Не удалось восстановить данные');
            } finally {
              setSyncing(false);
            }
          },
        },
      ]
    );
  }, [getDriveToken]);

  const handleCheckBackup = useCallback(async () => {
    setSyncing(true);
    try {
      const token = await getDriveToken();
      if (!token) { setSyncing(false); return; }
      const info = await getBackupInfo(token);
      if (info.exists && info.modifiedTime) {
        const date = new Date(info.modifiedTime).toLocaleString('ru-RU');
        setLastBackup(date);
        Alert.alert('Резервная копия', `Последнее обновление: ${date}`);
      } else {
        Alert.alert('Резервная копия', 'Резервная копия не найдена');
      }
    } catch (e: any) {
      Alert.alert('Ошибка', e.message || 'Не удалось проверить');
    } finally {
      setSyncing(false);
    }
  }, [getDriveToken]);

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

        {!isOnboarding && (
          <View style={styles.syncSection}>
            <Text style={styles.sectionTitle}>Google Drive</Text>
            <Text style={styles.syncDescription}>
              Сохраняйте и восстанавливайте данные через Google Drive
            </Text>
            {lastBackup && (
              <Text style={styles.syncLastBackup}>
                Последняя копия: {lastBackup}
              </Text>
            )}
            {syncing ? (
              <View style={styles.syncLoading}>
                <ActivityIndicator color={colors.primary} size="small" />
                <Text style={styles.syncLoadingText}>Синхронизация...</Text>
              </View>
            ) : (
              <View style={styles.syncButtons}>
                <TouchableOpacity style={styles.syncButton} onPress={handleBackup}>
                  <Text style={styles.syncButtonIcon}>↑</Text>
                  <Text style={styles.syncButtonText}>Сохранить</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.syncButton} onPress={handleRestore}>
                  <Text style={styles.syncButtonIcon}>↓</Text>
                  <Text style={styles.syncButtonText}>Восстановить</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.syncButtonSmall} onPress={handleCheckBackup}>
                  <Text style={styles.syncButtonSmallText}>Проверить</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
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
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primary,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: 18,
    marginBottom: 8,
    letterSpacing: 1.2,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  chipText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  activityItem: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 6,
  },
  activityActive: {
    backgroundColor: 'rgba(108, 92, 231, 0.12)',
    borderColor: colors.primary,
  },
  activityText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  activityTextActive: {
    color: colors.primaryLight,
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: 17,
    alignItems: 'center',
    marginTop: 28,
    shadowColor: colors.primary,
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
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    marginTop: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  targetsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
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
    color: colors.textMuted,
    marginTop: 2,
  },
  accountSection: {
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
  },
  accountCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountEmail: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  providerBadge: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  providerText: {
    fontSize: 12,
    color: colors.textSecondary,
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
    color: colors.error,
    fontSize: 16,
    fontWeight: '600',
  },
  syncSection: {
    marginTop: 24,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  syncDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 19,
  },
  syncLastBackup: {
    fontSize: 12,
    color: colors.success,
    marginBottom: 10,
    fontWeight: '500',
  },
  syncLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 8,
  },
  syncLoadingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  syncButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  syncButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(108, 92, 231, 0.12)',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
  },
  syncButtonIcon: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  syncButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  syncButtonSmall: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
  },
  syncButtonSmallText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
