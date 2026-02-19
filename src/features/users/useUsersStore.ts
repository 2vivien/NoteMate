import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { User, UserStatus } from '@/types';
import { PRESET_USERS } from '@/lib/constants';

interface UsersStoreState {
  users: User[];
  currentUserId: string | null;
}

interface UsersStoreActions {
  // User management
  setUsers: (users: User[]) => void;
  addUser: (user: User) => void;
  removeUser: (userId: string) => void;
  
  // User status
  setUserStatus: (userId: string, status: UserStatus) => void;
  setUserTyping: (userId: string, typing: boolean) => void;
  
  // Actions counter
  incrementActions: (userId: string) => void;
  setActionsCount: (userId: string, count: number) => void;
  
  // Current user
  setCurrentUser: (userId: string) => void;
  
  // Initialize with preset users
  initializePresetUsers: () => void;
}

const createInitialUser = (preset: typeof PRESET_USERS[0]): User => ({
  ...preset,
  status: 'online',
  actionsCount: Math.floor(Math.random() * 200) + 50,
  lastActivity: Date.now(),
});

export const useUsersStore = create<UsersStoreState & UsersStoreActions>()(
  devtools(
    immer((set) => ({
      users: [],
      currentUserId: null,

      setUsers: (users) => {
        set((state) => {
          state.users = users;
        });
      },

      addUser: (user) => {
        set((state) => {
          const exists = state.users.find((u: User) => u.id === user.id);
          if (!exists) {
            state.users.push(user);
          }
        });
      },

      removeUser: (userId) => {
        set((state) => {
          state.users = state.users.filter((u: User) => u.id !== userId);
        });
      },

      setUserStatus: (userId, status) => {
        set((state) => {
          const user = state.users.find((u: User) => u.id === userId);
          if (user) {
            user.status = status;
            user.lastActivity = Date.now();
          }
        });
      },

      setUserTyping: (userId, typing) => {
        set((state) => {
          const user = state.users.find((u: User) => u.id === userId);
          if (user) {
            user.status = typing ? 'typing' : 'online';
            user.lastActivity = Date.now();
          }
        });
      },

      incrementActions: (userId) => {
        set((state) => {
          const user = state.users.find((u: User) => u.id === userId);
          if (user) {
            user.actionsCount++;
            user.lastActivity = Date.now();
          }
        });
      },

      setActionsCount: (userId, count) => {
        set((state) => {
          const user = state.users.find((u: User) => u.id === userId);
          if (user) {
            user.actionsCount = count;
          }
        });
      },

      setCurrentUser: (userId) => {
        set((state) => {
          state.currentUserId = userId;
        });
      },

      initializePresetUsers: () => {
        set((state) => {
          state.users = PRESET_USERS.map(createInitialUser);
          state.currentUserId = 'user-alice'; // Default current user
        });
      },
    })),
    { name: 'UsersStore' }
  )
);
