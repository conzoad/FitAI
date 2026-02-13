import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChatMessage as ChatMessageType } from '../models/types';
import { colors } from '../theme/colors';

interface Props {
  message: ChatMessageType;
}

function renderFormattedText(text: string, isUser: boolean) {
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

export default function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.assistantContainer]}>
      {!isUser && (
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>🤖</Text>
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        <Text style={styles.textWrap}>
          {renderFormattedText(message.content, isUser)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  avatarText: {
    fontSize: 14,
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: 18,
    padding: 12,
    paddingHorizontal: 16,
  },
  userBubble: {
    backgroundColor: colors.chatUser,
    borderBottomRightRadius: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  assistantBubble: {
    backgroundColor: colors.chatAssistant,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: colors.chatAssistantBorder,
  },
  text: {
    fontSize: 15,
    color: colors.text,
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
});
