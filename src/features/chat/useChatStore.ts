import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { ChatMessage } from '@/types';
import { useLogsStore } from '../logs/useLogsStore';

interface ChatStoreState {
  messages: ChatMessage[];
  unreadCount: number;
  isTyping: Map<string, boolean>;
}

interface ChatStoreActions {
  // Message actions
  addMessage: (message: ChatMessage) => void;
  removeMessage: (messageId: string) => void;
  clearMessages: () => void;

  // Typing indicators
  setTyping: (userId: string, typing: boolean) => void;

  // Unread count
  incrementUnread: () => void;
  clearUnread: () => void;

  // Initialize with sample messages
  initializeSampleMessages: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

const sampleMessages: ChatMessage[] = [
  {
    id: generateId(),
    userId: 'user-charlie',
    userName: 'Charlie',
    userColor: '#8b5cf6',
    content: 'Je viens de mettre à jour le nombre de replicas à 3',
    timestamp: Date.now() - 300000,
  },
  {
    id: generateId(),
    userId: 'user-vivien',
    userName: 'Vivien',
    userColor: '#10b981',
    content: 'Parfait ! La configuration de déploiement est prête.',
    timestamp: Date.now() - 240000,
  },
  {
    id: generateId(),
    userId: 'user-bob',
    userName: 'Bob',
    userColor: '#f59e0b',
    content: 'Je vais vérifier la configuration du service ensuite.',
    timestamp: Date.now() - 180000,
  },
];

export const useChatStore = create<ChatStoreState & ChatStoreActions>()(
  devtools(
    immer((set) => ({
      messages: [],
      unreadCount: 0,
      isTyping: new Map(),

      addMessage: (message) => {
        set((state) => {
          state.messages.push(message);
          state.unreadCount++;
          // Keep only last 100 messages
          if (state.messages.length > 100) {
            state.messages.shift();
          }
        });

        // Sync with Logs: Add chat activity to the main log
        useLogsStore.getState().addUserLog(
          'chat',
          message.userId,
          message.userName,
          message.userColor,
          'a dit :',
          `"${message.content}"`
        );
      },

      removeMessage: (messageId) => {
        set((state) => {
          state.messages = state.messages.filter((m: ChatMessage) => m.id !== messageId);
        });
      },

      clearMessages: () => {
        set((state) => {
          state.messages = [];
        });
      },

      setTyping: (userId, typing) => {
        set((state) => {
          state.isTyping.set(userId, typing);
        });
      },

      incrementUnread: () => {
        set((state) => {
          state.unreadCount++;
        });
      },

      clearUnread: () => {
        set((state) => {
          state.unreadCount = 0;
        });
      },

      initializeSampleMessages: () => {
        set((state) => {
          state.messages = [...sampleMessages];
        });
      },
    })),
    { name: 'ChatStore' }
  )
);
