import { motion, AnimatePresence } from 'framer-motion';
import { useUsersStore } from '@/features/users/useUsersStore';
import { useNetworkStore } from '@/features/network/useNetworkStore';
import { Badge } from '@/components/ui/badge';
import { Users, Clock } from 'lucide-react';

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
  const users = useUsersStore((state) => state.users);
  const currentUserId = useUsersStore((state) => state.currentUserId);
  const session = useNetworkStore((state) => state.session);
  const isConnected = useNetworkStore((state) => state.isConnected);

  // Si déconnecté, tous les utilisateurs apparaissent hors ligne
  const displayUsers = users.map((u) => ({
    ...u,
    status: isConnected ? u.status : 'offline' as const
  }));

  const onlineUsers = displayUsers.filter((u) => u.status !== 'offline');

  return (
    <aside className="w-64 border-r border-border-light dark:border-border-dark bg-sidebar-bg dark:bg-sidebar-dark flex flex-col shrink-0">
      {/* Users list */}
      <div className="p-4 border-b border-border-light dark:border-border-dark">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-text-muted dark:text-slate-500 mb-4 flex items-center gap-2">
          <Users className="w-3.5 h-3.5" />
          Collaborateurs ({onlineUsers.length})
        </h2>

        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {displayUsers.map((user) => {
              const isCurrentUser = user.id === currentUserId;
              const status = statusConfig[user.status];
              const isTyping = user.status === 'typing';

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
                  <div className="flex items-center gap-3">
                    {/* Avatar Flat Design with status indicator */}
                    <div className="relative">
                      <div
                        className="size-10 rounded-full border-2 p-0.5 flex items-center justify-center text-white font-bold text-lg shadow-sm"
                        style={{ backgroundColor: user.color, borderColor: 'white' }}
                      >
                        {user.name.charAt(0)}
                      </div>
                      {/* Status dot */}
                      <div
                        className={`absolute bottom-0 right-0 size-3 ${status.dot} border-2 border-sidebar-bg dark:border-sidebar-dark rounded-full`}
                      />
                    </div>

                    {/* User info */}
                    <div>
                      <p className="text-sm font-semibold text-text-main dark:text-slate-100 flex items-center gap-1">
                        {isCurrentUser ? 'Vous' : user.name}
                      </p>
                      <p
                        className={`text-[10px] font-mono italic ${isTyping
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
                    className="text-[10px] bg-gray-200 dark:bg-border-dark text-text-muted dark:text-slate-400 font-mono px-1.5 py-0.5"
                  >
                    {user.actionsCount} ops
                  </Badge>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Session info */}
      <div className="p-4 mt-auto">
        <div className="bg-blue-50 dark:bg-primary/5 border border-blue-100 dark:border-primary/20 rounded-lg p-3">
          <p className="text-[11px] font-bold text-primary uppercase mb-2">
            Session Info
          </p>
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-text-muted dark:text-slate-400 font-mono">
              <span>Session ID:</span>
              <span className="text-text-main dark:text-slate-200 font-semibold">
                {session.id}
              </span>
            </div>
            <div className="flex justify-between text-[10px] text-text-muted dark:text-slate-400 font-mono">
              <span>Duration:</span>
              <span className="text-text-main dark:text-slate-200 font-semibold flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDuration(session.duration)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
