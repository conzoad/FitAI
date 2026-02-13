import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatMessage, ChatAction } from '../models/types';

const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2);

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  addMessage: (role: 'user' | 'assistant', content: string, actions?: ChatAction[]) => void;
  setLoading: (loading: boolean) => void;
  clearHistory: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [],
      isLoading: false,

      addMessage: (role, content, actions) => {
        const message: ChatMessage = {
          id: generateId(),
          role,
          content,
          timestamp: new Date().toISOString(),
          ...(actions && actions.length > 0 ? { actions } : {}),
        };

        set((state) => ({
          messages: [...state.messages, message],
        }));
      },

      setLoading: (loading) => set({ isLoading: loading }),

      clearHistory: () => set({ messages: [] }),
    }),
    {
      name: 'chat-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        messages: state.messages,
      }),
    }
  )
);
