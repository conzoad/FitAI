import React, { useRef, useState } from 'react';
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
import { sendChatMessage } from '../services/gemini';
import { GOAL_LABELS, EMPTY_MACROS } from '../utils/constants';
import { todayKey } from '../utils/dateHelpers';
import ChatMessageComponent from '../components/ChatMessage';
import { colors } from '../theme/colors';

export default function ChatScreen() {
  const { messages, isLoading, addMessage, setLoading, clearHistory } = useChatStore();
  const profile = useProfileStore((s) => s.profile);
  const entries = useDiaryStore((s) => s.entries);
  const todayEntry = entries[todayKey()] || { date: todayKey(), meals: [], totalMacros: EMPTY_MACROS };
  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList>(null);

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
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>ИИ-помощник</Text>
        {messages.length > 0 && (
          <TouchableOpacity onPress={clearHistory}>
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
            <Text style={styles.emptyIcon}>🤖</Text>
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
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!input.trim() || isLoading) && styles.sendDisabled]}
            onPress={handleSend}
            disabled={!input.trim() || isLoading}
          >
            <Text style={styles.sendText}>→</Text>
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
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  clearText: {
    fontSize: 14,
    color: colors.error,
  },
  messageList: {
    paddingVertical: 8,
    flexGrow: 1,
  },
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    paddingTop: 80,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  quickActions: {
    gap: 8,
    width: '100%',
  },
  quickChip: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickText: {
    fontSize: 14,
    color: colors.primary,
    textAlign: 'center',
    fontWeight: '500',
  },
  typingIndicator: {
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  typingText: {
    fontSize: 13,
    color: colors.textSecondary,
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
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendDisabled: {
    backgroundColor: colors.border,
  },
  sendText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
});
