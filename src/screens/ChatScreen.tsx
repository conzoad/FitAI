import React, { useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChatStore } from '../stores/useChatStore';
import { useProfileStore } from '../stores/useProfileStore';
import { useDiaryStore } from '../stores/useDiaryStore';
import { useWorkoutStore } from '../stores/useWorkoutStore';
import { sendChatMessage } from '../services/gemini';
import { GOAL_LABELS, MEAL_TYPE_LABELS, EMPTY_MACROS } from '../utils/constants';
import { todayKey } from '../utils/dateHelpers';
import { format, subDays } from 'date-fns';
import type { DailyEntry, MealType } from '../models/types';
import ChatMessageComponent from '../components/ChatMessage';
import { colors } from '../theme/colors';

export default function ChatScreen() {
  const { messages, isLoading, addMessage, setLoading, clearHistory } = useChatStore();
  const profile = useProfileStore((s) => s.profile);
  const entries = useDiaryStore((s) => s.entries);
  const todayEntry = entries[todayKey()] || { date: todayKey(), meals: [], totalMacros: EMPTY_MACROS };
  const workoutSessions = useWorkoutStore((s) => s.sessions);
  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const workoutContext = useMemo(() => {
    const lines: string[] = [];
    let weekVolume = 0;
    let weekWorkouts = 0;

    for (let i = 0; i < 7; i++) {
      const key = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const daySessions = workoutSessions[key] || [];
      weekWorkouts += daySessions.length;
      weekVolume += daySessions.reduce((sum, s) => sum + s.totalVolume, 0);
    }

    lines.push(`- Тренировок за неделю: ${weekWorkouts}`);
    lines.push(`- Тоннаж за неделю: ${weekVolume >= 1000 ? `${(weekVolume / 1000).toFixed(1)} т` : `${weekVolume} кг`}`);

    // Recent 5 workouts
    const allDates = Object.keys(workoutSessions).sort().reverse();
    const recentWorkouts: string[] = [];
    for (const date of allDates) {
      for (const session of workoutSessions[date]) {
        if (recentWorkouts.length >= 5) break;
        const exercises = session.exercises.map((ex) => ex.exerciseName).join(', ');
        recentWorkouts.push(`  ${date}: ${exercises} (${session.duration} мин, ${session.totalVolume} кг)`);
      }
      if (recentWorkouts.length >= 5) break;
    }

    if (recentWorkouts.length > 0) {
      lines.push('- Последние тренировки:');
      lines.push(...recentWorkouts);
    } else {
      lines.push('- Тренировок пока нет');
    }

    return lines.join('\n');
  }, [workoutSessions]);

  const foodContext = useMemo(() => {
    const days = [
      { label: 'Сегодня', key: todayKey() },
      { label: 'Вчера', key: format(subDays(new Date(), 1), 'yyyy-MM-dd') },
    ];
    const lines: string[] = [];

    for (const day of days) {
      const entry: DailyEntry | undefined = entries[day.key];
      if (!entry || entry.meals.length === 0) {
        lines.push(`${day.label}: нет данных`);
        continue;
      }

      const m = entry.totalMacros;
      lines.push(`${day.label} (${Math.round(m.calories)} ккал, Б:${Math.round(m.proteins)}г Ж:${Math.round(m.fats)}г У:${Math.round(m.carbs)}г):`);

      for (const meal of entry.meals) {
        const mealLabel = MEAL_TYPE_LABELS[meal.type as MealType] || meal.type;
        const itemNames = meal.items.map((i) => `${i.name} ${i.amount}`).join(', ');
        lines.push(`  ${mealLabel}: ${itemNames}`);
      }
    }

    return lines.join('\n');
  }, [entries]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setInput('');
    addMessage('user', text);
    setLoading(true);

    try {
      const chatHistory = messages.slice(-20).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const userContext: Record<string, string> = {
        NAME: profile.name || 'Пользователь',
        AGE: String(profile.age),
        GENDER: profile.gender === 'male' ? 'Мужской' : 'Женский',
        HEIGHT: String(profile.heightCm),
        WEIGHT: String(profile.weightKg),
        GOAL: GOAL_LABELS[profile.goal],
        TARGET_CALORIES: String(profile.targetCalories),
        TODAY_CALORIES: String(Math.round(todayEntry.totalMacros.calories)),
        TODAY_P: String(Math.round(todayEntry.totalMacros.proteins)),
        TODAY_F: String(Math.round(todayEntry.totalMacros.fats)),
        TODAY_C: String(Math.round(todayEntry.totalMacros.carbs)),
        WORKOUT_CONTEXT: workoutContext,
        FOOD_CONTEXT: foodContext,
      };

      const response = await sendChatMessage(text, chatHistory, userContext);
      addMessage('assistant', response);
    } catch (e: any) {
      addMessage('assistant', 'Извините, произошла ошибка. Попробуйте ещё раз.');
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    'Что мне поесть?',
    'Сколько калорий осталось?',
    'Составь меню на день',
    'Посоветуй тренировку',
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <Text style={styles.headerIconText}>🤖</Text>
          </View>
          <View>
            <Text style={styles.title}>ИИ-помощник</Text>
            <Text style={styles.headerSubtitle}>{isLoading ? 'Печатает...' : 'Онлайн'}</Text>
          </View>
        </View>
        {messages.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={clearHistory}>
            <Text style={styles.clearText}>Очистить</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ChatMessageComponent message={item} />}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <View style={styles.emptyIconCircle}>
              <Text style={styles.emptyIcon}>🤖</Text>
            </View>
            <Text style={styles.emptyTitle}>Фитнес-ассистент</Text>
            <Text style={styles.emptySubtitle}>
              Задайте вопрос о питании, тренировках или здоровом образе жизни
            </Text>
            <View style={styles.quickActions}>
              {quickActions.map((action) => (
                <TouchableOpacity
                  key={action}
                  style={styles.quickChip}
                  onPress={() => {
                    setInput(action);
                  }}
                >
                  <Text style={styles.quickText}>{action}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
      />

      {isLoading && (
        <View style={styles.typingIndicator}>
          <View style={styles.typingDots}>
            <View style={[styles.dot, styles.dot1]} />
            <View style={[styles.dot, styles.dot2]} />
            <View style={[styles.dot, styles.dot3]} />
          </View>
          <Text style={styles.typingText}>ИИ печатает...</Text>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Введите сообщение..."
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!input.trim() || isLoading) && styles.sendDisabled]}
            onPress={handleSend}
            disabled={!input.trim() || isLoading}
          >
            <Text style={styles.sendText}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIconText: {
    fontSize: 18,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '500',
    marginTop: 1,
  },
  clearButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  clearText: {
    fontSize: 13,
    color: colors.error,
    fontWeight: '600',
  },
  messageList: {
    paddingVertical: 12,
    flexGrow: 1,
  },
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    paddingTop: 80,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 21,
  },
  quickActions: {
    gap: 8,
    width: '100%',
  },
  quickChip: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  quickText: {
    fontSize: 14,
    color: colors.primaryLight,
    textAlign: 'center',
    fontWeight: '600',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 8,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    opacity: 0.6,
  },
  dot1: { opacity: 0.4 },
  dot2: { opacity: 0.6 },
  dot3: { opacity: 0.8 },
  typingText: {
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sendDisabled: {
    backgroundColor: colors.surfaceLight,
    shadowOpacity: 0,
    elevation: 0,
  },
  sendText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
});
