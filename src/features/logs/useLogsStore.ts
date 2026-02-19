import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { LogEntry, LogType } from '@/types';

interface LogsStoreState {
  logs: LogEntry[];
  filteredTypes: LogType[];
}

interface LogsStoreActions {
  // Log actions
  addLog: (log: LogEntry) => void;
  addSystemLog: (message: string, details?: string) => void;
  addUserLog: (type: LogType, userId: string, userName: string, userColor: string, message: string, details?: string) => void;
  clearLogs: () => void;

  // Filtering
  toggleFilter: (type: LogType) => void;
  clearFilters: () => void;

  // Get filtered logs
  getFilteredLogs: () => LogEntry[];

  // Initialize with sample logs
  initializeSampleLogs: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useLogsStore = create<LogsStoreState & LogsStoreActions>()(
  devtools(
    immer((set, get) => ({
      logs: [],
      filteredTypes: [],

      addLog: (log) => {
        set((state) => {
          state.logs.push(log); // Add to end (chronological order)
          // Keep only last 200 logs
          if (state.logs.length > 200) {
            state.logs.shift(); // Remove from beginning
          }
        });
      },

      addSystemLog: (message, details) => {
        const log: LogEntry = {
          id: generateId(),
          type: 'system',
          message,
          details,
          timestamp: Date.now(),
        };
        get().addLog(log);
      },

      addUserLog: (type, userId, userName, userColor, message, details) => {
        const log: LogEntry = {
          id: generateId(),
          type,
          userId,
          userName,
          userColor,
          message,
          details,
          timestamp: Date.now(),
        };
        get().addLog(log);
      },

      clearLogs: () => {
        set((state) => {
          state.logs = [];
        });
      },

      toggleFilter: (type) => {
        set((state) => {
          const index = state.filteredTypes.indexOf(type);
          if (index === -1) {
            state.filteredTypes.push(type);
          } else {
            state.filteredTypes.splice(index, 1);
          }
        });
      },

      clearFilters: () => {
        set((state) => {
          state.filteredTypes = [];
        });
      },

      getFilteredLogs: () => {
        const { logs, filteredTypes } = get();
        if (filteredTypes.length === 0) {
          return logs;
        }
        return logs.filter((log) => filteredTypes.includes(log.type));
      },

      initializeSampleLogs: () => {
        const now = Date.now();
        const sampleLogs: LogEntry[] = [
          {
            id: generateId(),
            type: 'sync',
            message: 'Synchronisation initiale du document terminée',
            timestamp: now - 200000,
          },
          {
            id: generateId(),
            type: 'system',
            message: 'Snapshot v2.3.9 sauvegardé avec succès',
            timestamp: now - 65000,
          },
          {
            id: generateId(),
            type: 'connect',
            userId: 'user-bob',
            userName: 'Bob',
            userColor: '#f59e0b',
            message: 'connecté à la session',
            timestamp: now - 40000,
          },
          {
            id: generateId(),
            type: 'edit',
            userId: 'user-vivien',
            userName: 'Vivien',
            userColor: '#10b981',
            message: 'a modifié la valeur "replicas: 1" en "replicas: 3"',
            timestamp: now - 12000,
          },
          {
            id: generateId(),
            type: 'edit',
            userId: 'user-charlie',
            userName: 'Charlie',
            userColor: '#8b5cf6',
            message: 'a inséré "selector"',
            details: 'ligne 8:12',
            timestamp: now - 5000,
          },
        ];

        set((state) => {
          state.logs = sampleLogs;
        });
      },
    })),
    { name: 'LogsStore' }
  )
);
