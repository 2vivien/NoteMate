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
  LogOut,
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
  const setConnected = useNetworkStore((state) => state.setConnected);

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
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [showPublishSuccess, setShowPublishSuccess] = useState(false);
  const [showOfflineWarning, setShowOfflineWarning] = useState(false);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Close popups when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.profile-popup-container') && !target.closest('.profile-avatar')) {
        setShowProfilePopup(false);
      }
    };
    globalThis.document.addEventListener('mousedown', handleClickOutside);
    return () => globalThis.document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handleDisconnect = () => {
    setConnected(false);
    setShowProfilePopup(false);
  };

  const handleReconnect = () => {
    setConnected(true);
    setShowProfilePopup(false);
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
    <header className="flex items-center justify-between border-b border-border-light dark:border-border-dark bg-sidebar-bg dark:bg-sidebar-dark px-2 md:px-4 py-2 h-14 shrink-0 overflow-hidden">
      {/* Left section */}
      <div className="flex items-center gap-2 md:gap-6 shrink-0">
        {/* Mobile Menu Toggle */}
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={onOpenUsers} className="h-9 w-9">
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
              className="h-7 w-32 md:w-48 text-xs md:text-sm"
            />
          ) : (
            <h1
              onClick={() => setIsEditing(true)}
              className="text-xs md:text-sm font-semibold tracking-tight text-text-main dark:text-slate-100 cursor-pointer hover:text-primary transition-colors truncate max-w-[80px] xs:max-w-[120px] md:max-w-none"
              title="Cliquer pour modifier"
            >
              {documentInfo.name}
            </h1>
          )}
        </div>

        {/* Unified Status indicator */}
        <motion.div
          initial={false}
          animate={{
            scale: isConnected ? [1, 1.02, 1] : 1,
            backgroundColor: showPacketLossAlert ? '#fee2e2' : '',
          }}
          transition={{ duration: 0.3 }}
          className={`flex items-center gap-1.5 md:gap-2 px-1.5 md:px-2.5 py-1 rounded-md text-[10px] md:text-xs font-semibold border transition-all shadow-sm ${!isConnected
            ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 border-red-100 dark:border-red-500/20'
            : isSyncing
              ? 'bg-blue-50 dark:bg-primary/20 text-primary dark:text-primary-foreground border-blue-100 dark:border-primary/30'
              : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-100 dark:border-emerald-500/20'
            }`}
        >
          <span className={`size-1.5 md:size-2 rounded-full ${!isConnected ? 'bg-red-500' :
            isSyncing ? 'bg-primary animate-pulse' : 'bg-emerald-500'
            }`} />
          <span className="inline">
            {!isConnected ? 'DÉCONNECTÉ' :
              isSyncing ? 'SYNCHRONISATION...' : `CONNECTÉ (${latency}ms)`}
          </span>
        </motion.div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-1 md:gap-2 shrink-0">
        {/* Undo/Redo - Always visible or at least more visible */}
        <div className="flex items-center gap-1 bg-gray-200/50 dark:bg-border-dark/30 p-1 rounded-lg shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={undo}
            disabled={!canUndo}
            className="h-7 w-7 md:h-8 md:w-8 hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary transition-all duration-200 active:scale-90 hover:scale-110 disabled:opacity-30"
            title="Annuler"
          >
            <Undo className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={redo}
            disabled={!canRedo}
            className="h-7 w-7 md:h-8 md:w-8 hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary transition-all duration-200 active:scale-90 hover:scale-110 disabled:opacity-30"
            title="Rétablir"
          >
            <Redo className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </Button>
        </div>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-8 w-8"
          title={theme === 'light' ? 'Passer au mode sombre' : 'Passer au mode clair'}
        >
          {theme === 'light' ? (
            <Moon className="w-4 h-4" />
          ) : (
            <Sun className="w-4 h-4" />
          )}
        </Button>

        {/* Mobile Chat Toggle */}
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={onOpenActivity} className="h-9 w-9 relative">
            <MessageSquare className="w-5 h-5" />
            <span className="absolute top-2 right-2 size-2 bg-primary rounded-full border border-white" />
          </Button>
        )}

        {/* Push changes button - Text hidden on small screens */}
        <Button
          onClick={handlePublish}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-2 md:px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium shadow-sm transition-colors"
        >
          <CloudUpload className="w-4 h-4" />
          <span className="hidden sm:inline">Publier</span>
        </Button>

        {/* Vivien avatar with profile popup */}
        <div className="relative">
          <button
            onClick={() => setShowProfilePopup(!showProfilePopup)}
            className="profile-avatar ml-1 md:ml-4 size-7 md:size-8 rounded-full border-2 border-white flex items-center justify-center text-white font-bold text-xs md:text-sm shadow-sm shrink-0 hover:ring-2 hover:ring-primary/50 transition-all"
            style={{ backgroundColor: '#10b981' }}
          >
            V
          </button>

          {/* Profile Popup */}
          <AnimatePresence>
            {showProfilePopup && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.15 }}
                className="profile-popup-container fixed right-2 md:right-4 top-14 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 z-[9999] overflow-hidden"
              >
                <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div
                      className="size-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: '#10b981' }}
                    >
                      V
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">Vivien</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {isConnected ? 'En ligne' : 'Hors ligne'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-2">
                  {isConnected ? (
                    <button
                      onClick={handleDisconnect}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Se déconnecter</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleReconnect}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Se reconnecter</span>
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
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
