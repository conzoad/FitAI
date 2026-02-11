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
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  assistantContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 12,
  },
  userBubble: {
    backgroundColor: colors.chatUser,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: colors.chatAssistant,
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 21,
  },
  textWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  bold: {
    fontWeight: '700',
  },
  userText: {
    color: colors.text,
  },
});
