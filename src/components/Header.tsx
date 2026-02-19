import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useEditorStore } from '@/features/editor/useEditorStore';
import { useNetworkStore } from '@/features/network/useNetworkStore';
import { useThemeStore } from '@/features/theme/useThemeStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  FileText, 
  Undo, 
  Redo, 
  CloudUpload, 
  RefreshCw,
  Sun,
  Moon,
} from 'lucide-react';

export function Header() {
  const document = useEditorStore((state) => state.document);
  const setDocumentName = useEditorStore((state) => state.setDocumentName);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const historyIndex = useEditorStore((state) => state.historyIndex);
  const history = useEditorStore((state) => state.history);
  
  const isConnected = useNetworkStore((state) => state.isConnected);
  const isSyncing = useNetworkStore((state) => state.isSyncing);
  const packetLoss = useNetworkStore((state) => state.packetLoss);
  
  // Local state for packet loss alert
  const [showPacketLossAlert, setShowPacketLossAlert] = useState(false);
  
  // Listen for changes in packet loss (this is a simplified trigger for simulation)
  useEffect(() => {
    // Check for packet loss every 2 seconds instead of 5
    const interval = setInterval(() => {
      // Simulate a detection (higher probability for demo)
      if (Math.random() < 0.2) { 
        setShowPacketLossAlert(true);
        setTimeout(() => setShowPacketLossAlert(false), 800);
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(document.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSaveName = () => {
    if (editValue.trim()) {
      setDocumentName(editValue.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      setEditValue(document.name);
      setIsEditing(false);
    }
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <header className="flex items-center justify-between border-b border-border-light dark:border-border-dark bg-sidebar-bg dark:bg-sidebar-dark px-4 py-2 h-14 shrink-0">
      {/* Left section */}
      <div className="flex items-center gap-6">
        {/* Document name */}
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          {isEditing ? (
            <Input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={handleKeyDown}
              className="h-7 w-48 text-sm"
            />
          ) : (
            <h1
              onClick={() => setIsEditing(true)}
              className="text-sm font-semibold tracking-tight text-text-main dark:text-slate-100 cursor-pointer hover:text-primary transition-colors"
              title="Click to edit"
            >
              {document.name}
            </h1>
          )}
        </div>

        {/* Status indicators */}
        <div className="flex items-center gap-4 border-l border-border-light dark:border-border-dark pl-6">
          {/* Connection status */}
          <motion.div
            initial={false}
            animate={{ 
              scale: isConnected ? [1, 1.05, 1] : 1,
              backgroundColor: showPacketLossAlert ? '#fee2e2' : '', // Tailwind red-100
            }}
            transition={{ duration: 0.3 }}
            className={`flex items-center gap-2 px-2 py-1 rounded text-xs font-medium border transition-colors ${
              showPacketLossAlert
                ? 'bg-red-100 dark:bg-red-500/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/40'
                : isConnected
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-100 dark:border-emerald-500/20'
                : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 border-red-100 dark:border-red-500/20'
            }`}
          >
            <span className={`size-2 rounded-full ${showPacketLossAlert ? 'bg-red-500 animate-bounce' : isConnected ? 'bg-emerald-500' : 'bg-red-500'} ${isConnected ? 'animate-pulse' : ''}`} />
            {showPacketLossAlert ? 'Packet Loss' : isConnected ? 'Connected' : 'Disconnected'}
          </motion.div>

          {/* Sync status */}
          {isSyncing && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-2 px-2 py-1 rounded bg-blue-50 dark:bg-primary/10 text-primary text-xs font-medium border border-blue-100 dark:border-primary/20"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Synchronisation
            </motion.div>
          )}
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Undo/Redo */}
        <div className="flex items-center gap-1 bg-gray-200/50 dark:bg-border-dark/30 p-1 rounded-lg">
          <Button
            variant="ghost"
            size="icon"
            onClick={undo}
            disabled={!canUndo}
            className="h-7 w-7 hover:bg-white dark:hover:bg-border-dark disabled:opacity-30"
            title="Annuler"
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={redo}
            disabled={!canRedo}
            className="h-7 w-7 hover:bg-white dark:hover:bg-border-dark disabled:opacity-30"
            title="Rétablir"
          >
            <Redo className="w-4 h-4" />
          </Button>
        </div>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-8 w-8 ml-1"
          title={theme === 'light' ? 'Passer au mode sombre' : 'Passer au mode clair'}
        >
          {theme === 'light' ? (
            <Moon className="w-4 h-4" />
          ) : (
            <Sun className="w-4 h-4" />
          )}
        </Button>

        {/* Push changes button */}
        <Button
          className="ml-2 flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm transition-colors"
        >
          <CloudUpload className="w-4 h-4" />
          Publier
        </Button>

        {/* Vivien avatar Flat Design */}
        <div 
          className="ml-4 size-8 rounded-full border-2 border-white flex items-center justify-center text-white font-bold text-sm shadow-sm"
          style={{ backgroundColor: '#10b981' }} // Vivien's color
        >
          V
        </div>
      </div>
    </header>
  );
}
