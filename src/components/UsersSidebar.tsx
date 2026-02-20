import { motion, AnimatePresence } from 'framer-motion';
import { useUsersStore } from '@/features/users/useUsersStore';
import { useNetworkStore } from '@/features/network/useNetworkStore';
import { useThemeStore } from '@/features/theme/useThemeStore';
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Clock, LogOut, CheckCircle, Sun, Moon } from 'lucide-react';

const statusConfig = {
  online: { dot: 'bg-emerald-500', label: 'online' },
  typing: { dot: 'bg-emerald-500', label: 'typing' },
  idle: { dot: 'bg-amber-500', label: 'idle' },
  offline: { dot: 'bg-slate-400', label: 'offline' },
};

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}

function formatIdleTime(lastActivity: number): string {
  const idleSeconds = Math.floor((Date.now() - lastActivity) / 1000);
  if (idleSeconds < 60) {
    return 'Just now';
  } else if (idleSeconds < 3600) {
    return `${Math.floor(idleSeconds / 60)}m`;
  } else {
    return `${Math.floor(idleSeconds / 3600)}h`;
  }
}

export function UsersSidebar() {
  const isMobile = useIsMobile();
  const users = useUsersStore((state) => state.users);
  const currentUserId = useUsersStore((state) => state.currentUserId);
  const session = useNetworkStore((state) => state.session);
  const isConnected = useNetworkStore((state) => state.isConnected);
  const setConnected = useNetworkStore((state) => state.setConnected);

  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  // Si déconnecté, tous les utilisateurs apparaissent hors ligne
  const displayUsers = users.map((u) => ({
    ...u,
    status: isConnected ? u.status : 'offline' as const
  }));

  const onlineUsers = displayUsers.filter((u) => u.status !== 'offline');

  const handleDisconnect = () => {
    setConnected(false);
  };

  const handleReconnect = () => {
    setConnected(true);
  };

  return (
    <aside className="w-64 md:w-72 border-r border-border-light dark:border-border-dark bg-sidebar-bg dark:bg-sidebar-dark flex flex-col shrink-0 min-w-0">
      {/* Users list */}
      <div className="p-4 md:p-5 border-b border-border-light dark:border-border-dark">
        <div className="flex items-center justify-between mb-4 md:mb-5">
          <h2 className="text-xs md:text-sm font-bold uppercase tracking-wider text-text-muted dark:text-slate-500 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Collaborateurs ({onlineUsers.length})
          </h2>
          {/* Theme toggle - Only visible on mobile */}
          {isMobile && (
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
          )}
        </div>

        <div className="space-y-4 md:space-y-5">
          <AnimatePresence mode="popLayout">
            {displayUsers.map((user) => {
              const isCurrentUser = user.id === currentUserId;
              const status = statusConfig[user.status];
              const isTyping = user.status === 'typing';
              // Get first word of name
              const displayName = user.name.split(' ')[0];

              return (
                <motion.div
                  key={user.id}
                  layout
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`flex items-center justify-between group ${user.status === 'idle' ? 'opacity-75' : ''
                    }`}
                >
                  <div className="flex items-center gap-3 md:gap-4">
                    {/* Avatar Flat Design with status indicator */}
                    <div className="relative">
                      <div
                        className="size-10 md:size-12 rounded-full border-2 p-0.5 flex items-center justify-center text-white font-bold text-lg md:text-xl shadow-sm"
                        style={{ backgroundColor: user.color, borderColor: 'white' }}
                      >
                        {user.name.charAt(0)}
                      </div>
                      {/* Status dot */}
                      <div
                        className={`absolute bottom-0 right-0 size-3 md:size-3.5 ${status.dot} border-2 border-sidebar-bg dark:border-sidebar-dark rounded-full`}
                      />
                    </div>

                    {/* User info */}
                    <div>
                      <p className="text-sm md:text-base font-semibold text-text-main dark:text-slate-100 flex items-center gap-1">
                        {isCurrentUser ? 'Vous' : displayName}
                      </p>
                      <p
                        className={`text-[10px] md:text-xs font-mono italic ${isTyping
                          ? 'text-emerald-600 dark:text-emerald-500'
                          : user.status === 'offline'
                            ? 'text-red-500 dark:text-red-400'
                            : user.status === 'idle'
                              ? 'text-text-muted dark:text-slate-500'
                              : 'text-text-muted dark:text-slate-500'
                          }`}
                      >
                        {isTyping ? (
                          <span className="flex items-center gap-1">
                            écrit...
                            <motion.span
                              animate={{ opacity: [0, 1, 0] }}
                              transition={{ duration: 1, repeat: Infinity }}
                            >
                              ...
                            </motion.span>
                          </span>
                        ) : user.status === 'offline' ? (
                          'hors ligne'
                        ) : user.status === 'idle' ? (
                          `Inactif - ${formatIdleTime(user.lastActivity)}`
                        ) : (
                          'en ligne'
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Actions count */}
                  <Badge
                    variant="secondary"
                    className="text-[10px] md:text-xs bg-gray-200 dark:bg-border-dark text-text-muted dark:text-slate-400 font-mono px-1.5 md:px-2 py-0.5 md:py-1"
                  >
                    {user.actionsCount} ops
                  </Badge>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Session info and Disconnect button at bottom */}
      <div className="p-4 md:p-5 mt-auto mb-4 md:mb-6">
        <div className="bg-blue-50 dark:bg-primary/5 border border-blue-100 dark:border-primary/20 rounded-lg p-3 md:p-4">
          <p className="text-xs md:text-sm font-bold text-primary uppercase mb-2 md:mb-3">
            Session Info
          </p>
          <div className="space-y-1.5 md:space-y-2">
            <div className="flex justify-between text-[10px] md:text-xs text-text-muted dark:text-slate-400 font-mono">
              <span>Session ID:</span>
              <span className="text-text-main dark:text-slate-200 font-semibold">
                {session.id}
              </span>
            </div>
            <div className="flex justify-between text-[10px] md:text-xs text-text-muted dark:text-slate-400 font-mono">
              <span>Duration:</span>
              <span className="text-text-main dark:text-slate-200 font-semibold flex items-center gap-1">
                <Clock className="w-3 h-3 md:w-3.5 md:h-3.5" />
                {formatDuration(session.duration)}
              </span>
            </div>
          </div>
        </div>

        {/* Disconnect/Reconnect button */}
        <div className="mt-4 md:mt-5">
          {isConnected ? (
            <Button
              onClick={handleDisconnect}
              variant="outline"
              className="w-full flex items-center justify-center gap-2 text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20 text-xs md:text-sm"
            >
              <LogOut className="w-4 h-4" />
              Se déconnecter
            </Button>
          ) : (
            <Button
              onClick={handleReconnect}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs md:text-sm"
            >
              <CheckCircle className="w-4 h-4" />
              Se reconnecter
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}
