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

  // History for local user (Vivien)
  localUndoStack: { content: string; position: { lineNumber: number; column: number } }[];
  localRedoStack: { content: string; position: { lineNumber: number; column: number } }[];
  lastSnapshotTime: number; // For debouncing

  // UI state
  isDirty: boolean;
  isSyncing: boolean;
}

interface EditorStoreActions {
  // Content actions
  setContent: (content: string, isLocal?: boolean) => void;
  applyOperation: (userId: string, position: { lineNumber: number; column: number }, text: string, type: 'insert' | 'delete', remoteVersion?: number) => void;

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

  // Sync actions
  markSynced: () => void;
  setSyncing: (syncing: boolean) => void;

  // Persistence
  loadFromStorage: () => void;
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
  localUndoStack: [],
  localRedoStack: [],
  lastSnapshotTime: 0,
  isDirty: false,
  isSyncing: false,
};

export const useEditorStore = create<EditorStoreState & EditorStoreActions>()(
  devtools(
    immer((set) => ({
      ...initialState,

      loadFromStorage: () => {
        const saved = localStorage.getItem('notemate_doc_content');
        if (saved) {
          set((state) => {
            state.content = saved;
            state.document.size = new Blob([saved]).size;
            state.localUndoStack = []; // Reset on load
            state.localRedoStack = [];
          });
        }
      },

      // Content actions
      setContent: (content, isLocal = true) => {
        set((state) => {
          const now = Date.now();
          const timeSinceLastSnapshot = now - state.lastSnapshotTime;
          const contentDiffers = state.content !== content;

          if (isLocal && contentDiffers) {
            // Save to undo stack if > 1s since last save or logical break
            const isLogicalBreak = content.length > state.content.length &&
              (content.endsWith(' ') || content.endsWith('\n') || content.endsWith('.'));

            if (timeSinceLastSnapshot > 1000 || isLogicalBreak || state.lastSnapshotTime === 0) {
              const vivienCursor = state.cursors['user-vivien'];
              state.localUndoStack.push({
                content: state.content,
                position: vivienCursor ? { ...vivienCursor.position } : { lineNumber: 1, column: 1 }
              });
              if (state.localUndoStack.length > 50) state.localUndoStack.shift();
              state.lastSnapshotTime = now;
              state.localRedoStack = []; // Clear redo on new atomic action
            }
          }

          state.content = content;
          state.isDirty = true;
          state.document.size = new Blob([content]).size;

          if (isLocal) {
            localStorage.setItem('notemate_doc_content', content);
          }
        });
      },

      applyOperation: (userId, position, text, type, remoteVersion) => {
        set((state) => {
          // Simplified OT: If remote version is behind, we might need transformation
          // For this simulation, we'll just apply it and bump our version

          const lines = state.content.split('\n');
          const lineIdx = Math.min(position.lineNumber - 1, lines.length - 1);
          const line = lines[lineIdx] || '';
          const colIdx = Math.min(position.column - 1, line.length);

          if (type === 'insert') {
            lines[lineIdx] = line.slice(0, colIdx) + text + line.slice(colIdx);
          } else if (type === 'delete') {
            // Delete characters behind or at the cursor
            const deleteCount = text.length || 1;
            lines[lineIdx] = line.slice(0, Math.max(0, colIdx - deleteCount)) + line.slice(colIdx);
          }

          state.content = lines.join('\n');

          // Collaborative History Update
          const applyRemoteToStack = (stack: { content: string; position: { lineNumber: number; column: number } }[]) => {
            for (let i = 0; i < stack.length; i++) {
              const snapLines = stack[i].content.split('\n');
              const sLineIdx = Math.min(position.lineNumber - 1, snapLines.length - 1);
              const sLine = snapLines[sLineIdx] || '';
              const sColIdx = Math.min(position.column - 1, sLine.length);

              if (type === 'insert') {
                snapLines[sLineIdx] = sLine.slice(0, sColIdx) + text + sLine.slice(sColIdx);
                // Adjust saved cursor horizontal position if on same line and after edit
                if (stack[i].position.lineNumber === position.lineNumber && stack[i].position.column >= position.column) {
                  stack[i].position.column += text.length;
                }
              } else if (type === 'delete') {
                const deleteCount = text.length || 1;
                snapLines[sLineIdx] = sLine.slice(0, Math.max(0, sColIdx - deleteCount)) + sLine.slice(sColIdx);
                if (stack[i].position.lineNumber === position.lineNumber && stack[i].position.column >= position.column) {
                  stack[i].position.column = Math.max(1, stack[i].position.column - deleteCount);
                }
              }
              stack[i].content = snapLines.join('\n');
            }
          };

          if (userId !== 'user-vivien') {
            applyRemoteToStack(state.localUndoStack);
            applyRemoteToStack(state.localRedoStack);
          }
          state.version = Math.max(state.version, (remoteVersion || 0)) + 1;
          state.isDirty = true;
          state.document.size = new Blob([state.content]).size;

          // Update the user's cursor position after typing
          const cursor = state.cursors[userId];
          if (cursor) {
            cursor.position.column += text.length;
          }

          // Persistence
          localStorage.setItem('notemate_doc_content', state.content);
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
          // If the cursor is from Vivien, we update it immediately
          if (cursor.userId === 'user-vivien') {
            state.cursors[cursor.userId] = cursor;
            return;
          }
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
          if (state.localUndoStack.length > 0) {
            const snap = state.localUndoStack.pop()!;
            const vivienCursor = state.cursors['user-vivien'];
            state.localRedoStack.push({
              content: state.content,
              position: vivienCursor ? { ...vivienCursor.position } : { lineNumber: 1, column: 1 }
            });
            state.content = snap.content;
            if (state.cursors['user-vivien']) {
              state.cursors['user-vivien'].position = snap.position;
            }
            state.isDirty = true;
            state.version++;
            localStorage.setItem('notemate_doc_content', snap.content);
          }
        });
      },

      redo: () => {
        set((state) => {
          if (state.localRedoStack.length > 0) {
            const snap = state.localRedoStack.pop()!;
            const vivienCursor = state.cursors['user-vivien'];
            state.localUndoStack.push({
              content: state.content,
              position: vivienCursor ? { ...vivienCursor.position } : { lineNumber: 1, column: 1 }
            });
            state.content = snap.content;
            if (state.cursors['user-vivien']) {
              state.cursors['user-vivien'].position = snap.position;
            }
            state.isDirty = true;
            state.version++;
            localStorage.setItem('notemate_doc_content', snap.content);
          }
        });
      },

      // Sync actions
      markSynced: () => {
        set((state) => {
          state.lastSync = Date.now();
          state.isDirty = false;
        });
      },

      setSyncing: (syncing) => {
        set((state) => {
          state.isSyncing = syncing;
        });
      },
    })),
    { name: 'EditorStore' }
  )
);
