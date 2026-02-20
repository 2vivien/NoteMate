import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEditorStore } from '@/features/editor/useEditorStore';
import { useNetworkStore } from '@/features/network/useNetworkStore';
import { useThemeStore } from '@/features/theme/useThemeStore';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FileText,
  Undo,
  Redo,
  CloudUpload,
  Sun,
  Moon,
  MessageSquare,
  Menu,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

interface HeaderProps {
  onOpenUsers?: () => void;
  onOpenActivity?: () => void;
}

export function Header({ onOpenUsers, onOpenActivity }: HeaderProps) {
  const isMobile = useIsMobile();
  const documentInfo = useEditorStore((state) => state.document);
  const setDocumentName = useEditorStore((state) => state.setDocumentName);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const localUndoStack = useEditorStore((state) => state.localUndoStack);
  const localRedoStack = useEditorStore((state) => state.localRedoStack);

  const isConnected = useNetworkStore((state) => state.isConnected);
  const isSyncing = useNetworkStore((state) => state.isSyncing);

  const packetLoss = useNetworkStore((state) => state.packetLoss);
  const latency = useNetworkStore((state) => state.latency);

  // showPacketLossAlert can now be derived from store or removed if redundant
  const showPacketLossAlert = packetLoss > 0 && !isConnected;

  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(documentInfo.name);
  const inputRef = useRef<HTMLInputElement>(null);

  // Popup states
  const [showPublishSuccess, setShowPublishSuccess] = useState(false);
  const [showOfflineWarning, setShowOfflineWarning] = useState(false);

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
      setEditValue(documentInfo.name);
      setIsEditing(false);
    }
  };

  const handlePublish = () => {
    if (!isConnected) {
      setShowOfflineWarning(true);
      setTimeout(() => setShowOfflineWarning(false), 3000);
    } else {
      setShowPublishSuccess(true);
      setTimeout(() => setShowPublishSuccess(false), 3000);
    }
  };

  const canUndo = localUndoStack.length > 0;
  const canRedo = localRedoStack.length > 0;

  return (
    <header className="flex items-center justify-between border-b border-border-light dark:border-border-dark bg-sidebar-bg dark:bg-sidebar-dark px-3 md:px-6 py-3 h-16 md:h-18 shrink-0">
      {/* Left section */}
      <div className="flex items-center gap-3 md:gap-6 shrink-0">
        {/* Mobile Menu Toggle */}
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={onOpenUsers} className="h-10 w-10 shrink-0">
            <Menu className="w-5 h-5" />
          </Button>
        )}

        {/* Document name */}
        <div className="flex items-center gap-2 overflow-hidden">
          <FileText className="w-5 h-5 text-primary shrink-0 hidden sm:block" />
          {isEditing ? (
            <Input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={handleKeyDown}
              className="h-8 w-36 md:w-52 text-sm"
            />
          ) : (
            <h1
              onClick={() => setIsEditing(true)}
              className="text-sm md:text-base font-semibold tracking-tight text-text-main dark:text-slate-100 cursor-pointer hover:text-primary transition-colors truncate max-w-[100px] xs:max-w-[150px] md:max-w-none"
              title="Cliquer pour modifier"
            >
              {documentInfo.name}
            </h1>
          )}
        </div>

        {/* Unified Status indicator - Compact on mobile, full on desktop */}
        <motion.div
          initial={false}
          animate={{
            scale: isConnected ? [1, 1.02, 1] : 1,
            backgroundColor: showPacketLossAlert ? '#fee2e2' : '',
          }}
          transition={{ duration: 0.3 }}
          title={!isConnected ? 'Déconnecté' : isSyncing ? 'Synchronisation...' : `Connecté (${latency}ms)`}
          className={`flex items-center gap-2 px-2 md:px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold border transition-all shadow-sm cursor-pointer ${!isConnected
            ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 border-red-100 dark:border-red-500/20'
            : isSyncing
              ? 'bg-blue-50 dark:bg-primary/20 text-primary dark:text-primary-foreground border-blue-100 dark:border-primary/30'
              : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-100 dark:border-emerald-500/20'
            }`}
        >
          {/* Mobile: Only colored dot */}
          <span className={`size-3 md:size-2.5 rounded-full ${!isConnected ? 'bg-red-500' :
            isSyncing ? 'bg-primary animate-pulse' : 'bg-emerald-500'
            }`} />
          {/* Desktop: Full text */}
          <span className="hidden md:inline">
            {!isConnected ? 'DÉCONNECTÉ' :
              isSyncing ? 'SYNCHRONISATION...' : `CONNECTÉ (${latency}ms)`}
          </span>
        </motion.div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        {/* Undo/Redo - Always visible */}
        <div className="flex items-center gap-1 bg-gray-200/50 dark:bg-border-dark/30 p-1 rounded-lg shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={undo}
            disabled={!canUndo}
            className="h-8 w-8 md:h-9 md:w-9 hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary transition-all duration-200 active:scale-90 hover:scale-110 disabled:opacity-30"
            title="Annuler"
          >
            <Undo className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={redo}
            disabled={!canRedo}
            className="h-8 w-8 md:h-9 md:w-9 hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary transition-all duration-200 active:scale-90 hover:scale-110 disabled:opacity-30"
            title="Rétablir"
          >
            <Redo className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
        </div>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-9 w-9 md:h-10 md:w-10"
          title={theme === 'light' ? 'Passer au mode sombre' : 'Passer au mode clair'}
        >
          {theme === 'light' ? (
            <Moon className="w-5 h-5" />
          ) : (
            <Sun className="w-5 h-5" />
          )}
        </Button>

        {/* Mobile Chat Toggle */}
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={onOpenActivity} className="h-10 w-10 relative">
            <MessageSquare className="w-5 h-5" />
            <span className="absolute top-2 right-2 size-2 bg-primary rounded-full border border-white" />
          </Button>
        )}

        {/* Push changes button */}
        <Button
          onClick={handlePublish}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-3 md:px-4 py-2 rounded-lg text-sm md:text-base font-medium shadow-sm transition-colors"
        >
          <CloudUpload className="w-4 h-4 md:w-5 md:h-5" />
          <span className="hidden sm:inline">Publier</span>
        </Button>
      </div>

      {/* Publish Success Toast */}
      <AnimatePresence>
        {showPublishSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-lg shadow-lg">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Document publié avec succès !</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Offline Warning Toast */}
      <AnimatePresence>
        {showOfflineWarning && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-lg shadow-lg">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">Vous êtes hors ligne. Reconnectez-vous pour publier.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
