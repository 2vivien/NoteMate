import { useRef, useCallback, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEditorStore } from '@/features/editor/useEditorStore';
import { useUsersStore } from '@/features/users/useUsersStore';
import { useNetworkStore } from '@/features/network/useNetworkStore';
import { useThemeStore } from '@/features/theme/useThemeStore';
import { Zap } from 'lucide-react';
import type { editor } from 'monaco-editor';

// Cursor decoration type

export function EditorPanel() {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof import('monaco-editor') | null>(null);
  const decorationsRef = useRef<Map<string, string[]>>(new Map());
  
  const content = useEditorStore((state) => state.content);
  const setContent = useEditorStore((state) => state.setContent);
  const cursors = useEditorStore((state) => state.cursors);
  
  const users = useUsersStore((state) => state.users);
  const latency = useNetworkStore((state) => state.latency);
  const theme = useThemeStore((state) => state.theme);
  
  const [isEditorReady, setIsEditorReady] = useState(false);

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

    // Add change listener for undo/redo
    editor.onDidChangeModelContent(() => {
      const newValue = editor.getValue();
      if (newValue !== content) {
        setContent(newValue);
      }
    });
  }, [content, setContent]);

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

    // Add new cursor decorations for each user
    cursors.forEach((cursor) => {
      const user = users.find((u) => u.id === cursor.userId);
      if (!user || !cursor.visible) return;

      const { lineNumber, column } = cursor.position;

      // Create cursor decoration
      const decoration = {
        range: new monaco.Range(lineNumber, column, lineNumber, column),
        options: {
          className: `cursor-decoration-${user.id}`,
          beforeContentClassName: `cursor-before-${user.id}`,
          afterContentClassName: `cursor-after-${user.id}`,
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
    cursors.forEach((cursor) => {
      const user = users.find((u) => u.id === cursor.userId);
      if (!user) return;
      
      cursorStyles += `
        .cursor-decoration-${user.id} {
          background-color: ${user.color}40 !important;
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
    
    // Remove old style if exists
    const oldStyle = document.getElementById('monaco-cursor-styles');
    if (oldStyle) {
      oldStyle.remove();
    }
    
    if (cursorStyles) {
      document.head.appendChild(style);
    }

    return () => {
      const styleEl = document.getElementById('monaco-cursor-styles');
      if (styleEl) {
        styleEl.remove();
      }
    };
  }, [cursors, users, isEditorReady]);

  // Handle content changes from external sources
  useEffect(() => {
    if (editorRef.current && editorRef.current.getValue() !== content) {
      editorRef.current.setValue(content);
    }
  }, [content]);

  return (
    <section className="flex-1 bg-editor-bg dark:bg-background-dark flex flex-col relative">
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
          }}
        />
      </div>

      {/* Floating latency indicator */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="absolute bottom-6 right-6 flex items-center gap-2 bg-white/90 dark:bg-sidebar-dark/90 backdrop-blur border border-border-light dark:border-border-dark px-3 py-1.5 rounded-full text-xs text-text-muted dark:text-slate-400 shadow-sm"
        >
          <Zap className="w-4 h-4 text-primary" />
          <span>Network Latency:</span>
          <motion.span
            key={latency}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-text-main dark:text-slate-100 font-mono font-semibold"
          >
            {latency}ms
          </motion.span>
        </motion.div>
      </AnimatePresence>

      {/* Simulated cursors overlay (for smooth animations) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from(cursors.entries()).map(([userId, cursor]) => {
          const user = users.find((u) => u.id === userId);
          if (!user || !cursor.visible) return null;

          return (
            <SimulatedCursor
              key={userId}
              user={user}
              cursor={cursor}
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
}

function SimulatedCursor({ user, cursor }: SimulatedCursorProps) {
  // Convert line/column to approximate pixel position
  // This is a simplified approximation
  const lineHeight = 21; // Monaco default line height
  const charWidth = 8.4; // Approximate char width for 14px monospace
  
  const top = (cursor.position.lineNumber - 1) * lineHeight + 16; // + padding
  const left = cursor.position.column * charWidth + 48; // + line numbers width

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ 
        opacity: 1,
        top,
        left,
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
        mass: 0.5,
      }}
      className="absolute pointer-events-none"
      style={{ top, left }}
    >
      {/* Cursor line */}
      <div
        className="w-0.5 h-5"
        style={{ backgroundColor: user.color }}
      />
      
      {/* Cursor label */}
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute -top-6 left-0 px-1.5 py-0.5 rounded text-white text-[10px] flex items-center gap-1 shadow-md z-10 whitespace-nowrap"
        style={{ backgroundColor: user.color }}
      >
        {user.name}
        <span className="opacity-70">{cursor.latency}ms</span>
      </motion.div>
    </motion.div>
  );
}
