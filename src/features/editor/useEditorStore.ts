import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Cursor, DocumentInfo } from '@/types';
import { DEFAULT_CONTENT, DEFAULT_DOCUMENT_NAME } from '@/lib/constants';

interface EditorStoreState {
  // Editor state
  content: string;
  version: number;
  lastSync: number;
  
  // Document info
  document: DocumentInfo;
  
  // Cursors
  cursors: Record<string, Cursor>;
  
  // History for undo/redo
  history: string[];
  historyIndex: number;
  
  // UI state
  isDirty: boolean;
}

interface EditorStoreActions {
  // Content actions
  setContent: (content: string) => void;
  applyOperation: (userId: string, position: { lineNumber: number; column: number }, text: string, type: 'insert' | 'delete') => void;
  updateContent: (changes: { range: any; text: string }) => void;
  
  // Document actions
  setDocumentName: (name: string) => void;
  updateDocumentSize: () => void;
  
  // Cursor actions
  setCursor: (cursor: Cursor) => void;
  removeCursor: (userId: string) => void;
  updateCursorLatency: (userId: string, latency: number) => void;
  
  // History actions
  undo: () => void;
  redo: () => void;
  saveSnapshot: () => void;
  
  // Sync actions
  markSynced: () => void;
}

const initialState: EditorStoreState = {
  content: DEFAULT_CONTENT,
  version: 1,
  lastSync: Date.now(),
  document: {
    name: DEFAULT_DOCUMENT_NAME,
    size: new Blob([DEFAULT_CONTENT]).size,
    encoding: 'UTF-8',
    language: 'markdown',
  },
  cursors: {},
  history: [DEFAULT_CONTENT],
  historyIndex: 0,
  isDirty: false,
};

export const useEditorStore = create<EditorStoreState & EditorStoreActions>()(
  devtools(
    immer((set) => ({
      ...initialState,

      // Content actions
      setContent: (content) => {
        set((state) => {
          state.content = content;
          state.isDirty = true;
          state.document.size = new Blob([content]).size;
        });
      },

      applyOperation: (userId, position, text, type) => {
        set((state) => {
          const lines = state.content.split('\n');
          const lineIdx = Math.min(position.lineNumber - 1, lines.length - 1);
          const line = lines[lineIdx] || '';
          const colIdx = Math.min(position.column - 1, line.length);

          if (type === 'insert') {
            lines[lineIdx] = line.slice(0, colIdx) + text + line.slice(colIdx);
          } else if (type === 'delete') {
            lines[lineIdx] = line.slice(0, Math.max(0, colIdx - text.length)) + line.slice(colIdx);
          }

          state.content = lines.join('\n');
          state.version++;
          state.isDirty = true;
          state.document.size = new Blob([state.content]).size;
          
          // Update the user's cursor position after typing
          const cursor = state.cursors[userId];
          if (cursor) {
            cursor.position.column += text.length;
          }
        });
      },

      updateContent: (changes) => {
        set((state) => {
          // Simple text replacement - in real app would use proper diff
          state.content = changes.text;
          state.isDirty = true;
          state.document.size = new Blob([state.content]).size;
        });
      },

      // Document actions
      setDocumentName: (name) => {
        set((state) => {
          state.document.name = name;
        });
      },

      updateDocumentSize: () => {
        set((state) => {
          state.document.size = new Blob([state.content]).size;
        });
      },

      // Cursor actions
      setCursor: (cursor) => {
        set((state) => {
          state.cursors[cursor.userId] = cursor;
        });
      },

      removeCursor: (userId) => {
        set((state) => {
          delete state.cursors[userId];
        });
      },

      updateCursorLatency: (userId, latency) => {
        set((state) => {
          const cursor = state.cursors[userId];
          if (cursor) {
            cursor.latency = latency;
          }
        });
      },

      // History actions
      undo: () => {
        set((state) => {
          if (state.historyIndex > 0) {
            state.historyIndex--;
            state.content = state.history[state.historyIndex];
            state.isDirty = true;
            state.version++;
          }
        });
      },

      redo: () => {
        set((state) => {
          if (state.historyIndex < state.history.length - 1) {
            state.historyIndex++;
            state.content = state.history[state.historyIndex];
            state.isDirty = true;
            state.version++;
          }
        });
      },

      saveSnapshot: () => {
        set((state) => {
          // Only save if the current content is different from the last snapshot
          if (state.content === state.history[state.historyIndex]) return;

          // Remove any future history if we're not at the end
          if (state.historyIndex < state.history.length - 1) {
            state.history = state.history.slice(0, state.historyIndex + 1);
          }
          
          state.history.push(state.content);
          state.historyIndex++;
          
          // Limit history size to 50 versions
          if (state.history.length > 50) {
            state.history.shift();
            state.historyIndex--;
          }
        });
      },

      // Sync actions
      markSynced: () => {
        set((state) => {
          state.lastSync = Date.now();
          state.isDirty = false;
          state.version++;
        });
      },
    })),
    { name: 'EditorStore' }
  )
);
