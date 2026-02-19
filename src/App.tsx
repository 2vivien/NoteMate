import { useEffect } from 'react';
import { Header } from '@/components/Header';
import { UsersSidebar } from '@/components/UsersSidebar';
import { EditorPanel } from '@/components/EditorPanel';
import { LogsChatPanel } from '@/components/LogsChatPanel';
import { FooterConsole } from '@/components/FooterConsole';
import { useThemeStore } from '@/features/theme/useThemeStore';
import { useUsersStore } from '@/features/users/useUsersStore';
import { useLogsStore } from '@/features/logs/useLogsStore';
import { useChatStore } from '@/features/chat/useChatStore';
import { useSimulatedUsers } from '@/hooks/useSimulatedUsers';
import { useSessionTimer } from '@/hooks/useSessionTimer';
import { Toaster } from '@/components/ui/sonner';

function App() {
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
      {/* Header */}
      <Header />

      {/* Main content area */}
      <main className="flex grow overflow-hidden">
        {/* Left sidebar - Users */}
        <UsersSidebar />

        {/* Center - Editor */}
        <EditorPanel />

        {/* Right sidebar - Logs & Chat */}
        <LogsChatPanel />
      </main>

      {/* Footer - Debug console */}
      <FooterConsole />

      {/* Toast notifications */}
      <Toaster />
    </div>
  );
}

export default App;
