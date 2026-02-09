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

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>
          {isOnboarding ? 'Добро пожаловать!' : 'Профиль'}
        </Text>
        {isOnboarding && (
          <Text style={styles.subtitle}>
            Расскажите о себе, чтобы мы рассчитали вашу норму КБЖУ
          </Text>
        )}

        <Text style={styles.label}>Имя</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Ваше имя"
        />

        <Text style={styles.label}>Пол</Text>
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
            <Text style={styles.label}>Возраст</Text>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
              placeholder="25"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Рост (см)</Text>
            <TextInput
              style={styles.input}
              value={height}
              onChangeText={setHeight}
              keyboardType="numeric"
              placeholder="175"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Вес (кг)</Text>
            <TextInput
              style={styles.input}
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
              placeholder="70"
            />
          </View>
        </View>

        <Text style={styles.label}>Цель</Text>
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

        <Text style={styles.label}>Уровень активности</Text>
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
            <Text style={styles.targetItem}>Калории: {profile.targetCalories} ккал</Text>
            <Text style={styles.targetItem}>Белки: {profile.targetProteins} г</Text>
            <Text style={styles.targetItem}>Жиры: {profile.targetFats} г</Text>
            <Text style={styles.targetItem}>Углеводы: {profile.targetCarbs} г</Text>
          </View>
        )}

        {!isOnboarding && user && (
          <View style={styles.accountSection}>
            <Text style={styles.accountTitle}>Аккаунт</Text>
            <View style={styles.accountCard}>
              <Text style={styles.accountEmail}>{user.email}</Text>
              <Text style={styles.accountProvider}>
                {user.provider === 'google' ? 'Google' : 'Email'}
              </Text>
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutText}>Выйти из аккаунта</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isOnboarding && (
          <View style={styles.syncSection}>
            <Text style={styles.syncTitle}>Google Drive</Text>
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 20,
  },
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 14,
    color: colors.text,
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  activityItem: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 6,
  },
  activityActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  activityText: {
    fontSize: 14,
    color: colors.text,
  },
  activityTextActive: {
    color: colors.primaryDark,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  targetsCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  targetsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
  },
  targetItem: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  accountSection: {
    marginTop: 24,
  },
  accountTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
  },
  accountCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  accountEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  accountProvider: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  logoutButton: {
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
  },
  logoutText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '600',
  },
  syncSection: {
    marginTop: 24,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  syncTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  syncDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  syncLastBackup: {
    fontSize: 12,
    color: colors.primary,
    marginBottom: 10,
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
    backgroundColor: colors.primaryLight,
    borderRadius: 10,
    paddingVertical: 12,
    gap: 6,
  },
  syncButtonIcon: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  syncButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  syncButtonSmall: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.background,
    justifyContent: 'center',
  },
  syncButtonSmallText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
