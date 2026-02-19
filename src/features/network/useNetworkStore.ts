import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { NetworkStats, SessionInfo } from '@/types';
import { SESSION_ID } from '@/lib/constants';

interface NetworkStoreState {
  // Connection status
  isConnected: boolean;
  isSyncing: boolean;

  // Network stats
  latency: number;
  packetLoss: number;
  ackRate: number;

  // Session info
  session: SessionInfo;

  // Simulated lag setting
  simulatedLag: number;
}

interface NetworkStoreActions {
  // Connection status
  setConnected: (connected: boolean) => void;
  setSyncing: (syncing: boolean) => void;

  // Network stats
  setLatency: (latency: number) => void;
  setPacketLoss: (packetLoss: number) => void;
  setAckRate: (ackRate: number) => void;

  // Simulated lag
  setSimulatedLag: (lag: number) => void;

  // Session
  updateSessionDuration: () => void;

  // Bulk update stats
  updateStats: (stats: Partial<NetworkStats>) => void;
}

export const useNetworkStore = create<NetworkStoreState & NetworkStoreActions>()(
  devtools(
    immer((set) => ({
      isConnected: true,
      isSyncing: false,
      latency: 500,
      packetLoss: 0.01,
      ackRate: 99.0,
      session: {
        id: SESSION_ID,
        duration: 0,
        startTime: Date.now(),
      },
      simulatedLag: 150,

      setConnected: (connected) => {
        set((state) => {
          state.isConnected = connected;
        });
      },

      setSyncing: (syncing) => {
        set((state) => {
          state.isSyncing = syncing;
        });
      },

      setLatency: (latency) => {
        set((state) => {
          state.latency = latency;
        });
      },

      setPacketLoss: (packetLoss) => {
        set((state) => {
          state.packetLoss = packetLoss;
        });
      },

      setAckRate: (ackRate) => {
        set((state) => {
          state.ackRate = ackRate;
        });
      },

      setSimulatedLag: (lag) => {
        set((state) => {
          state.simulatedLag = lag;
        });
      },

      updateSessionDuration: () => {
        set((state) => {
          state.session.duration = Math.floor(
            (Date.now() - state.session.startTime) / 1000
          );
        });
      },

      updateStats: (stats) => {
        set((state) => {
          if (stats.latency !== undefined) state.latency = stats.latency;
          if (stats.packetLoss !== undefined) state.packetLoss = stats.packetLoss;
          if (stats.ackRate !== undefined) state.ackRate = stats.ackRate;
          if (stats.isConnected !== undefined) state.isConnected = stats.isConnected;
          if (stats.isSyncing !== undefined) state.isSyncing = stats.isSyncing;
        });
      },
    })),
    { name: 'NetworkStore' }
  )
);
