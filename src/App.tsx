import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { UsersSidebar } from '@/components/UsersSidebar';
import { EditorPanel } from '@/components/EditorPanel';
import { LogsChatPanel } from '@/components/LogsChatPanel';
import { FooterConsole } from '@/components/FooterConsole';
import { useThemeStore } from '@/features/theme/useThemeStore';
import { useEditorStore } from '@/features/editor/useEditorStore';
import { useUsersStore } from '@/features/users/useUsersStore';
import { useLogsStore } from '@/features/logs/useLogsStore';
import { useChatStore } from '@/features/chat/useChatStore';
import { useSimulatedUsers } from '@/hooks/useSimulatedUsers';
import { useSessionTimer } from '@/hooks/useSessionTimer';
import { useIsMobile } from '@/hooks/use-mobile';
import { Toaster } from '@/components/ui/sonner';
import { Sheet, SheetContent } from '@/components/ui/sheet';

function App() {
  const isMobile = useIsMobile();
  const [mobilePanel, setMobilePanel] = useState<'users' | 'activity' | null>(null);

  const initTheme = useThemeStore((state) => state.initTheme);
  const initializePresetUsers = useUsersStore((state) => state.initializePresetUsers);
  const initializeSampleLogs = useLogsStore((state) => state.initializeSampleLogs);
  const initializeSampleMessages = useChatStore((state) => state.initializeSampleMessages);

  // Initialize theme
  useEffect(() => {
    initTheme();
  }, [initTheme]);

  // Initialize data
  useEffect(() => {
    useEditorStore.getState().loadFromStorage();
    initializePresetUsers();
    initializeSampleLogs();
    initializeSampleMessages();
  }, [initializePresetUsers, initializeSampleLogs, initializeSampleMessages]);

  // Start simulation
  useSimulatedUsers();

  // Start session timer
  useSessionTimer();

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-sidebar-bg dark:bg-background-dark font-display text-text-main dark:text-slate-100">
      {/* Header with mobile controls */}
      <Header
        onOpenUsers={() => setMobilePanel('users')}
        onOpenActivity={() => setMobilePanel('activity')}
      />

      {/* Main content area */}
      <main className="flex grow overflow-hidden relative">
        {/* Desktop Sidebars (hidden on mobile) */}
        {!isMobile && <UsersSidebar />}

        {/* Center - Editor (always visible) */}
        <EditorPanel />

        {!isMobile && <LogsChatPanel />}

        {/* Mobile Overlays (using Sheets for native feel) */}
        <Sheet open={mobilePanel === 'users'} onOpenChange={(open) => !open && setMobilePanel(null)}>
          <SheetContent side="left" className="p-0 w-72 border-r-0 h-full">
            <UsersSidebar />
          </SheetContent>
        </Sheet>

        <Sheet open={mobilePanel === 'activity'} onOpenChange={(open) => !open && setMobilePanel(null)}>
          <SheetContent side="right" className="p-0 w-80 border-l-0 h-full max-h-full">
            <LogsChatPanel />
          </SheetContent>
        </Sheet>
      </main>

      {/* Footer - Reduced on mobile */}
      <FooterConsole />

      {/* Toast notifications */}
      <Toaster />
    </div>
  );
}

export default App;
