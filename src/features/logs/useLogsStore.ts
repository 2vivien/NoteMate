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
          state.logs.unshift(log); // Add to beginning
          // Keep only last 200 logs
          if (state.logs.length > 200) {
            state.logs.pop();
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
            type: 'edit',
            userId: 'user-charlie',
            userName: 'Charlie',
            userColor: '#8b5cf6',
            message: 'inserted "selector"',
            details: 'line 8:12',
            timestamp: now - 5000,
          },
          {
            id: generateId(),
            type: 'edit',
            userId: 'user-alice',
            userName: 'Alice',
            userColor: '#10b981',
            message: 'changed value "replicas: 1" to "replicas: 3"',
            timestamp: now - 12000,
          },
          {
            id: generateId(),
            type: 'connect',
            userId: 'user-bob',
            userName: 'Bob',
            userColor: '#f59e0b',
            message: 'connected to session',
            timestamp: now - 40000,
          },
          {
            id: generateId(),
            type: 'system',
            message: 'Snapshot v2.3.9 saved successfully',
            timestamp: now - 65000,
          },
          {
            id: generateId(),
            type: 'sync',
            message: 'Initial document sync completed',
            timestamp: now - 200000,
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
