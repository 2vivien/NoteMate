// User types
export type UserStatus = 'online' | 'typing' | 'idle' | 'offline';

export interface User {
  id: string;
  name: string;
  color: string;
  status: UserStatus;
  actionsCount: number;
  avatar?: string;
  lastActivity: number;
}

// Cursor types
export interface CursorPosition {
  lineNumber: number;
  column: number;
}

export interface Cursor {
  userId: string;
  position: CursorPosition;
  latency: number;
  visible: boolean;
}

// Chat types
export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userColor: string;
  content: string;
  timestamp: number;
}

// Log types
export type LogType = 'edit' | 'cursor' | 'sync' | 'connect' | 'disconnect' | 'system' | 'chat';

export interface LogEntry {
  id: string;
  type: LogType;
  userId?: string;
  userName?: string;
  userColor?: string;
  message: string;
  details?: string;
  timestamp: number;
}

// Editor types
export interface EditorState {
  content: string;
  version: number;
  lastSync: number;
}

// Network types
export interface NetworkStats {
  latency: number;
  packetLoss: number;
  ackRate: number;
  isConnected: boolean;
  isSyncing: boolean;
}

// Document types
export interface DocumentInfo {
  name: string;
  size: number;
  encoding: string;
  language: string;
}

// Session types
export interface SessionInfo {
  id: string;
  duration: number;
  startTime: number;
}
