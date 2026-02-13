import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ChatMessage as ChatMessageType, ChatAction } from '../models/types';
import { useWorkoutStore } from '../stores/useWorkoutStore';
import { darkColors } from '../theme/colors';
import { useColors } from '../theme/useColors';

interface Props {
  message: ChatMessageType;
}

function renderFormattedText(text: string, isUser: boolean, styles: ReturnType<typeof getStyles>) {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <Text key={`t-${lastIndex}`} style={[styles.text, isUser && styles.userText]}>
          {text.slice(lastIndex, match.index)}
        </Text>
      );
    }
    parts.push(
      <Text key={`b-${match.index}`} style={[styles.text, styles.bold, isUser && styles.userText]}>
        {match[1]}
      </Text>
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(
      <Text key={`t-${lastIndex}`} style={[styles.text, isUser && styles.userText]}>
        {text.slice(lastIndex)}
      </Text>
    );
  }

  return parts;
}

function ActionButton({ action }: { action: ChatAction }) {
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [applied, setApplied] = useState(false);
  const [programId, setProgramId] = useState<string | null>(null);
  const addProgram = useWorkoutStore((s) => s.addProgram);
  const addScheduledWorkout = useWorkoutStore((s) => s.addScheduledWorkout);
  const navigation = useNavigation<any>();

  const handlePress = () => {
    if (applied) return;

    if (action.type === 'addProgram') {
      const exercises = action.data.exercises.map((e) => ({
        exerciseId: e.exerciseId,
        targetSets: e.targetSets,
        targetReps: e.targetReps,
      }));
      addProgram(action.data.name, exercises);
      const programs = useWorkoutStore.getState().programs;
      setProgramId(programs[programs.length - 1]?.id || null);
    }

    if (action.type === 'scheduleWorkout') {
      const exercises = action.data.exercises.map((e) => ({
        exerciseId: e.exerciseId,
        targetSets: e.targetSets,
        targetReps: e.targetReps,
      }));
      addProgram(action.data.name, exercises);
      const programs = useWorkoutStore.getState().programs;
      const newProgram = programs[programs.length - 1];
      setProgramId(newProgram?.id || null);

      if (newProgram && action.data.scheduleDays) {
        for (const day of action.data.scheduleDays) {
          addScheduledWorkout(day, newProgram.id, newProgram.name);
        }
      }
    }

    setApplied(true);
  };

  const handleViewProgram = () => {
    if (programId) {
      navigation.navigate('WorkoutTab', {
        screen: 'ProgramDetail',
        params: { programId },
      });
    }
  };

  const icon = action.type === 'addProgram' ? '\u{1F4CB}' : '\u{1F4C5}';
  const label = action.type === 'addProgram'
    ? `${icon} ${action.label}`
    : `${icon} ${action.label}`;

  return (
    <View>
      <TouchableOpacity
        style={[styles.actionBtn, applied && styles.actionBtnApplied]}
        onPress={handlePress}
        disabled={applied}
        activeOpacity={0.7}
      >
        <Text style={[styles.actionBtnText, applied && styles.actionBtnTextApplied]}>
          {applied ? `\u2713 ${action.label}` : label}
        </Text>
      </TouchableOpacity>
      {applied && programId && (
        <TouchableOpacity
          style={styles.viewProgramBtn}
          onPress={handleViewProgram}
          activeOpacity={0.7}
        >
          <Text style={styles.viewProgramText}>Посмотреть →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function ChatMessage({ message }: Props) {
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const isUser = message.role === 'user';

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.assistantContainer]}>
      {!isUser && (
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{'\u{1F916}'}</Text>
        </View>
      )}
      <View style={styles.contentColumn}>
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          <Text style={styles.textWrap}>
            {renderFormattedText(message.content, isUser, styles)}
          </Text>
        </View>
        {!isUser && message.actions && message.actions.length > 0 && (
          <View style={styles.actionsContainer}>
            {message.actions.map((action, idx) => (
              <ActionButton key={idx} action={action} />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

function getStyles(c: typeof darkColors) {
  return StyleSheet.create({
    container: {
      marginVertical: 4,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 8,
    },
    userContainer: {
      justifyContent: 'flex-end',
      flexDirection: 'row',
    },
    assistantContainer: {
      justifyContent: 'flex-start',
      flexDirection: 'row',
    },
    avatarCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: c.surfaceLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 2,
    },
    avatarText: {
      fontSize: 14,
    },
    contentColumn: {
      maxWidth: '75%',
    },
    bubble: {
      borderRadius: 18,
      padding: 12,
      paddingHorizontal: 16,
    },
    userBubble: {
      backgroundColor: c.chatUser,
      borderBottomRightRadius: 6,
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 3,
    },
    assistantBubble: {
      backgroundColor: c.chatAssistant,
      borderBottomLeftRadius: 6,
      borderWidth: 1,
      borderColor: c.chatAssistantBorder,
    },
    text: {
      fontSize: 15,
      color: c.text,
      lineHeight: 22,
    },
    textWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    bold: {
      fontWeight: '700',
    },
    userText: {
      color: '#FFFFFF',
    },
    actionsContainer: {
      marginTop: 6,
      gap: 6,
    },
    actionBtn: {
      backgroundColor: 'rgba(162, 155, 254, 0.12)',
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: c.workout,
    },
    actionBtnApplied: {
      backgroundColor: 'rgba(85, 239, 196, 0.12)',
      borderColor: c.success,
    },
    actionBtnText: {
      fontSize: 14,
      fontWeight: '600',
      color: c.workout,
    },
    actionBtnTextApplied: {
      color: c.success,
    },
    viewProgramBtn: {
      marginTop: 4,
      paddingVertical: 8,
      paddingHorizontal: 14,
      backgroundColor: c.workoutLight,
      borderRadius: 10,
      alignItems: 'center',
    },
    viewProgramText: {
      fontSize: 13,
      fontWeight: '600',
      color: c.workout,
    },
  });
}
