import { useRef, useCallback, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEditorStore } from '@/features/editor/useEditorStore';
import { useUsersStore } from '@/features/users/useUsersStore';
import { useLogsStore } from '@/features/logs/useLogsStore';
import { useNetworkStore } from '@/features/network/useNetworkStore';
import { useThemeStore } from '@/features/theme/useThemeStore';
import { Zap, WifiOff } from 'lucide-react';
import type { editor } from 'monaco-editor';

// Cursor decoration type

export function EditorPanel() {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof import('monaco-editor') | null>(null);
  const decorationsRef = useRef<Map<string, string[]>>(new Map());

  const content = useEditorStore((state) => state.content);
  const version = useEditorStore((state) => state.version);
  const setContent = useEditorStore((state) => state.setContent);
  const cursors = useEditorStore((state) => state.cursors);

  const users = useUsersStore((state) => state.users);
  const latency = useNetworkStore((state) => state.latency);
  const isConnected = useNetworkStore((state) => state.isConnected);
  const theme = useThemeStore((state) => state.theme);

  const [isEditorReady, setIsEditorReady] = useState(false);
  const vivienTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const vivienLogTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Handle editor mount
  const handleEditorDidMount = useCallback((editor: editor.IStandaloneCodeEditor, monaco: typeof import('monaco-editor')) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    setIsEditorReady(true);

    // Configure editor
    editor.updateOptions({
      fontSize: 14,
      fontFamily: 'Fira Code, monospace',
      lineNumbers: 'on',
      roundedSelection: false,
      scrollBeyondLastLine: false,
      minimap: { enabled: false },
      automaticLayout: true,
      padding: { top: 16 },
      renderWhitespace: 'selection',
      tabSize: 2,
      wordWrap: 'on',
    });

    // Add change listener for user input
    editor.onDidChangeModelContent((_event) => {
      const newValue = editor.getValue();
      if (newValue !== useEditorStore.getState().content) {
        setContent(newValue, true); // true for local change

        // --- Vivien's Typing Logic ---
        const vivienId = 'user-vivien';
        const userStore = useUsersStore.getState();

        // Set Vivien as typing in the store
        userStore.setUserTyping(vivienId, true);

        // Increment ops counter on every real keystroke
        userStore.incrementActions(vivienId);

        // Clear typing status after 2 seconds of inactivity
        if (vivienTypingTimeoutRef.current) clearTimeout(vivienTypingTimeoutRef.current);
        vivienTypingTimeoutRef.current = setTimeout(() => {
          useUsersStore.getState().setUserTyping(vivienId, false);
        }, 2000);

        // Add log for Vivien's edit (debounced)
        if (!vivienLogTimeoutRef.current) {
          useLogsStore.getState().addUserLog(
            'edit',
            vivienId,
            'Vivien',
            '#10b981',
            'a mis à jour les notes',
            `à la ligne ${editor.getPosition()?.lineNumber}`
          );

          vivienLogTimeoutRef.current = setTimeout(() => {
            vivienLogTimeoutRef.current = null;
          }, 4000);
        }
      }
    });

    // Track Vivien's cursor position in real-time
    editor.onDidChangeCursorPosition((e) => {
      const vivienId = 'user-vivien';
      useEditorStore.getState().setCursor({
        userId: vivienId,
        position: { lineNumber: e.position.lineNumber, column: e.position.column },
        latency: 0,
        visible: true
      });
    });
  }, [setContent]);

  // Update cursor decorations
  useEffect(() => {
    if (!isEditorReady || !editorRef.current || !monacoRef.current) return;

    const editor = editorRef.current;
    const monaco = monacoRef.current;

    // Remove old decorations
    decorationsRef.current.forEach((decorationIds) => {
      editor.deltaDecorations(decorationIds, []);
    });
    decorationsRef.current.clear();

    // Add new cursor decorations for each user EXCEPT Vivien (he has his native cursor)
    Object.values(cursors).forEach((cursor) => {
      if (cursor.userId === 'user-vivien') return;

      const user = users.find((u) => u.id === cursor.userId);
      if (!user || !cursor.visible) return;

      const { lineNumber, column } = cursor.position;

      const decoration = {
        range: new monaco.Range(lineNumber, column, lineNumber, column),
        options: {
          className: `cursor-decoration-${user.id}`,
          // We don't use beforeContent here anymore to avoid duplicate labels
          // as we use the SimulatedCursor component for smooth labels.
          overviewRuler: {
            color: user.color,
            position: monaco.editor.OverviewRulerLane.Center,
          },
          minimap: {
            color: user.color,
            position: monaco.editor.MinimapPosition.Inline,
          },
        },
      };

      const decorationIds = editor.deltaDecorations([], [decoration]);
      decorationsRef.current.set(user.id, decorationIds);
    });

    // Add cursor styles dynamically
    const style = document.createElement('style');
    style.id = 'monaco-cursor-styles';

    let cursorStyles = '';
    Object.values(cursors).forEach((cursor) => {
      if (cursor.userId === 'user-vivien') return;

      const user = users.find((u) => u.id === cursor.userId);
      if (!user) return;

      cursorStyles += `
        .cursor-decoration-${user.id} {
          border-left: 2px solid ${user.color} !important;
          width: 2px !important;
        }
        .cursor-before-${user.id}::before {
          content: '${user.name}';
          position: absolute;
          top: -20px;
          left: 0;
          background-color: ${user.color};
          color: white;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 3px;
          white-space: nowrap;
          z-index: 100;
        }
      `;
    });

    style.textContent = cursorStyles;

    const oldStyle = document.getElementById('monaco-cursor-styles');
    if (oldStyle) oldStyle.remove();
    if (cursorStyles) document.head.appendChild(style);

    return () => {
      const styleEl = document.getElementById('monaco-cursor-styles');
      if (styleEl) styleEl.remove();
    };
  }, [cursors, users, isEditorReady]);

  // Handle content changes from external sources
  useEffect(() => {
    if (editorRef.current && editorRef.current.getValue() !== content) {
      editorRef.current.setValue(content);
    }
  }, [content, version]); // Added version to dependency to catch bot updates reliably

  return (
    <section className="flex-1 bg-editor-bg dark:bg-background-dark flex flex-col relative min-w-0">
      {/* Offline warning banner */}
      <AnimatePresence>
        {!isConnected && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-center gap-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 px-4 py-3 text-amber-700 dark:text-amber-400 text-sm font-medium"
          >
            <WifiOff className="w-5 h-5" />
            <span>Vous êtes hors ligne</span>
            <span className="text-amber-600 dark:text-amber-500 hidden sm:inline">— Vos modifications ne seront pas synchronisées</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Monaco Editor */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          defaultLanguage="markdown"
          value={content}
          theme={theme === 'dark' ? 'vs-dark' : 'light'}
          onMount={handleEditorDidMount}
          options={{
            readOnly: false,
            wordWrap: 'on',
            lineNumbers: 'on',
            minimap: { enabled: false },
            fontSize: 16,
            fontFamily: 'Fira Code, monospace',
            padding: { top: 20, bottom: 20 }
          }}
        />
      </div>

      {/* Floating latency indicator - seulement visible quand connecté */}
      <AnimatePresence>
        {isConnected && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute bottom-6 right-6 flex items-center gap-2 bg-white/90 dark:bg-sidebar-dark/90 backdrop-blur border border-border-light dark:border-border-dark px-3 py-1.5 rounded-full text-xs text-text-muted dark:text-slate-400 shadow-sm z-20"
          >
            <Zap className="w-4 h-4 text-primary" />
            <span>Latence Réseau :</span>
            <motion.span
              key={latency}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-text-main dark:text-slate-100 font-mono font-semibold"
            >
              {latency}ms
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Simulated cursors overlay (for smooth animations) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
        {editorRef.current && Object.values(cursors).map((cursor) => {
          const user = users.find((u) => u.id === cursor.userId);
          if (!user || !cursor.visible) return null;

          return (
            <SimulatedCursor
              key={cursor.userId}
              user={user}
              cursor={cursor}
              editor={editorRef.current!}
              isLocalUser={user.id === 'user-vivien'}
            />
          );
        })}
      </div>
    </section>
  );
}

// Simulated cursor component with smooth animation
interface SimulatedCursorProps {
  user: {
    id: string;
    name: string;
    color: string;
  };
  cursor: {
    position: { lineNumber: number; column: number };
    latency: number;
  };
  editor: editor.IStandaloneCodeEditor;
  isLocalUser?: boolean;
}

function SimulatedCursor({ user, cursor, editor, isLocalUser }: SimulatedCursorProps) {
  const [pixelPos, setPixelPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const updatePosition = () => {
      const pos = editor.getScrolledVisiblePosition(cursor.position);
      if (pos) {
        // Precise alignment using Monaco's native coordinates
        setPixelPos({
          top: pos.top,
          left: pos.left + (isLocalUser ? 0 : 0) // Adjustment
        });
      }
    };

    updatePosition();
    const scrollListener = editor.onDidScrollChange(updatePosition);
    const layoutListener = editor.onDidLayoutChange(updatePosition);

    return () => {
      scrollListener.dispose();
      layoutListener.dispose();
    };
  }, [cursor.position, editor, isLocalUser]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{
        opacity: 1,
        top: pixelPos.top,
        left: pixelPos.left,
      }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 35,
        mass: 0.5,
      }}
      className="absolute pointer-events-none"
    >
      {/* Cursor line (hidden for local user as Monaco renders it) */}
      {!isLocalUser && (
        <div
          className="w-0.5 h-5"
          style={{ backgroundColor: user.color }}
        />
      )}

      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute -top-6 left-0 px-1.5 py-0.5 rounded text-white text-[9px] flex items-center gap-1 shadow-md z-10 whitespace-nowrap font-bold"
        style={{ backgroundColor: user.id === 'user-vivien' ? '#10b981' : user.color }}
      >
        {user.id === 'user-vivien' ? 'Vous' : user.name}
        <span className="opacity-90 font-mono text-[8.5px] bg-black/20 px-1 rounded-sm">
          {user.id === 'user-vivien' ? 1200 : cursor.latency}ms
        </span>
      </motion.div>
    </motion.div>
  );
}
