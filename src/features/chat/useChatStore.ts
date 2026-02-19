import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { ChatMessage } from '@/types';

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
    content: 'Just updated the replica count to 3',
    timestamp: Date.now() - 300000,
  },
  {
    id: generateId(),
    userId: 'user-alice',
    userName: 'Alice',
    userColor: '#10b981',
    content: 'Looks good! The deployment config is ready.',
    timestamp: Date.now() - 240000,
  },
  {
    id: generateId(),
    userId: 'user-bob',
    userName: 'Bob',
    userColor: '#f59e0b',
    content: 'I will review the service configuration next.',
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
          // Keep only last 100 messages
          if (state.messages.length > 100) {
            state.messages.shift();
          }
        });
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
