import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLogsStore } from '@/features/logs/useLogsStore';
import { useChatStore } from '@/features/chat/useChatStore';
import { useUsersStore } from '@/features/users/useUsersStore';
import { useNetworkStore } from '@/features/network/useNetworkStore';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ClipboardList, MessageSquare, Send, WifiOff } from 'lucide-react';
import type { LogEntry, LogType, ChatMessage } from '@/types';

const logTypeColors: Record<LogType, string> = {
  edit: 'text-emerald-600 dark:text-emerald-400',
  cursor: 'text-blue-600 dark:text-blue-400',
  sync: 'text-purple-600 dark:text-purple-400',
  connect: 'text-amber-600 dark:text-amber-400',
  disconnect: 'text-red-600 dark:text-red-400',
  system: 'text-primary',
  chat: 'text-sky-600 dark:text-sky-400',
};

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toTimeString().split(' ')[0];
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 60) {
    return 'just now';
  } else if (minutes < 3600) {
    return `${Math.floor(minutes)}m`;
  } else {
    return `${Math.floor(hours)}h`;
  }
}

export function LogsChatPanel() {
  const [activeTab, setActiveTab] = useState('logs');
  const [messageInput, setMessageInput] = useState('');

  const logs = useLogsStore((state) => state.logs);
  const messages = useChatStore((state) => state.messages);
  const unreadCount = useChatStore((state) => state.unreadCount);
  const clearUnread = useChatStore((state) => state.clearUnread);
  const addMessage = useChatStore((state) => state.addMessage);

  const users = useUsersStore((state) => state.users);
  const setUserTyping = useUsersStore((state) => state.setUserTyping);
  const currentUserId = useUsersStore((state) => state.currentUserId);

  const isConnected = useNetworkStore((state) => state.isConnected);

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const logsScrollRef = useRef<HTMLDivElement>(null);

  // Clear unread when switching to chat tab
  useEffect(() => {
    if (activeTab === 'chat') {
      clearUnread();
    }
  }, [activeTab, clearUnread]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current && activeTab === 'chat') {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, activeTab]);

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (logsScrollRef.current && activeTab === 'logs') {
      logsScrollRef.current.scrollTop = logsScrollRef.current.scrollHeight;
    }
  }, [logs, activeTab]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !currentUserId) return;

    const currentUser = users.find((u) => u.id === currentUserId);
    if (!currentUser) return;

    const newMessage: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      userId: currentUserId,
      userName: currentUser.name,
      userColor: currentUser.color,
      content: messageInput.trim(),
      timestamp: Date.now(),
    };

    addMessage(newMessage);
    setMessageInput('');
    setUserTyping(currentUserId, false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMessageInput(val);

    if (currentUserId) {
      if (val.trim()) {
        setUserTyping(currentUserId, true);
      } else {
        setUserTyping(currentUserId, false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <aside className="w-80 md:w-96 border-l border-border-light dark:border-border-dark bg-sidebar-bg dark:bg-sidebar-dark flex flex-col shrink-0 min-w-0 h-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full min-h-0">
        {/* Tab headers */}
        <div className="flex border-b border-border-light dark:border-border-dark h-12 md:h-14 shrink-0">
          <TabsList className="w-full h-full bg-transparent p-0">
            <TabsTrigger
              value="logs"
              className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-white dark:data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs md:text-sm font-semibold text-text-muted dark:text-slate-500 data-[state=active]:text-text-main dark:data-[state=active]:text-slate-100 flex items-center justify-center gap-2"
            >
              <ClipboardList className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">Journal d'activité</span>
              <span className="sm:hidden">Journal</span>
            </TabsTrigger>
            <TabsTrigger
              value="chat"
              className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-white dark:data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs md:text-sm font-semibold text-text-muted dark:text-slate-500 data-[state=active]:text-text-main dark:data-[state=active]:text-slate-100 flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4 md:w-5 md:h-5" />
              Chat
              {unreadCount > 0 && activeTab !== 'chat' && (
                <span className="size-2 rounded-full bg-primary" />
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Activity Log content */}
        <TabsContent value="logs" className="flex-1 m-0 mt-0 data-[state=inactive]:hidden min-h-0">
          {!isConnected ? (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center">
              <WifiOff className="w-12 h-12 md:w-16 md:h-16 text-gray-400 dark:text-slate-600 mb-4" />
              <p className="text-sm md:text-base font-medium text-text-muted dark:text-slate-500">
                Vous êtes hors ligne
              </p>
              <p className="text-xs md:text-sm text-text-muted dark:text-slate-500 mt-1">
                Les logs d'activité ne sont pas disponibles
              </p>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div ref={logsScrollRef} className="p-3 md:p-4 space-y-2 md:space-y-3">
                <AnimatePresence initial={false}>
                  {logs.map((log) => (
                    <LogItem key={log.id} log={log} />
                  ))}
                </AnimatePresence>

                {logs.length === 0 && (
                  <div className="text-center text-text-muted dark:text-slate-500 text-sm md:text-base py-8">
                    Aucune activité pour le moment
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        {/* Chat content */}
        <TabsContent value="chat" className="flex-1 m-0 mt-0 data-[state=inactive]:hidden flex flex-col min-h-0">
          {!isConnected ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <WifiOff className="w-12 h-12 md:w-16 md:h-16 text-gray-400 dark:text-slate-600 mb-4" />
              <p className="text-sm md:text-base font-medium text-text-muted dark:text-slate-500">
                Vous êtes hors ligne
              </p>
              <p className="text-xs md:text-sm text-text-muted dark:text-slate-500 mt-1">
                Le chat n'est pas disponible
              </p>
            </div>
          ) : (
            <>
              {/* Messages area - scrollable */}
              <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 min-h-0">
                <AnimatePresence initial={false}>
                  {messages.map((message, index) => {
                    const isCurrentUser = message.userId === currentUserId;
                    const showAvatar = index === 0 || messages[index - 1].userId !== message.userId;

                    return (
                      <ChatMessageItem
                        key={message.id}
                        message={message}
                        isCurrentUser={isCurrentUser}
                        showAvatar={showAvatar}
                      />
                    );
                  })}
                </AnimatePresence>

                {messages.length === 0 && (
                  <div className="text-center text-text-muted dark:text-slate-500 text-sm md:text-base py-8">
                    Aucun message
                  </div>
                )}
              </div>

              {/* Chat input - always visible at bottom */}
              <div className="shrink-0 p-3 md:p-4 border-t border-border-light dark:border-border-dark bg-white dark:bg-sidebar-dark">
                <div className="relative">
                  <Input
                    value={messageInput}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Écrire un message..."
                    className="w-full bg-sidebar-bg dark:bg-background-dark border-border-light dark:border-border-dark rounded-lg text-sm py-2.5 md:py-3 pl-3 md:pl-4 pr-10 md:pr-12 focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                    className="absolute right-1.5 md:right-2 top-1/2 -translate-y-1/2 h-7 w-7 md:h-8 md:w-8 text-primary hover:text-primary/80 disabled:opacity-30"
                  >
                    <Send className="w-4 h-4 md:w-5 md:h-5" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </aside>
  );
}

// Log item component
function LogItem({ log }: { log: LogEntry }) {
  const colorClass = logTypeColors[log.type];

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className="flex gap-3 text-sm"
    >
      <span className="text-gray-400 dark:text-slate-600 shrink-0 font-mono">
        {formatTime(log.timestamp)}
      </span>
      <p className="text-text-main dark:text-slate-300">
        {log.userName ? (
          <>
            <span className={colorClass} style={{ color: log.userColor }}>
              {log.userName}
            </span>{' '}
            {log.message}
            {log.details && (
              <span className="text-primary dark:text-primary/80 font-semibold">
                {' '}
                {log.details}
              </span>
            )}
          </>
        ) : (
          <>
            <span className={colorClass}>Système</span>: {log.message}
            {log.details && (
              <span className="text-primary dark:text-primary/80 font-semibold">
                {' '}
                {log.details}
              </span>
            )}
          </>
        )}
      </p>
    </motion.div>
  );
}

// Chat message component
interface ChatMessageItemProps {
  message: ChatMessage;
  isCurrentUser: boolean;
  showAvatar: boolean;
}

function ChatMessageItem({ message, isCurrentUser, showAvatar }: ChatMessageItemProps) {
  // Get first word of name
  const displayName = message.userName.split(' ')[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2 md:gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}
    >
      {showAvatar && !isCurrentUser ? (
        <div
          className="size-8 md:size-9 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-xs md:text-sm shadow-sm"
          style={{ backgroundColor: message.userColor }}
        >
          {message.userName.charAt(0)}
        </div>
      ) : !isCurrentUser ? (
        <div className="size-8 md:size-9 flex-shrink-0" />
      ) : null}

      <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} max-w-[75%] md:max-w-[80%]`}>
        {showAvatar && (
          <span
            className="text-[10px] md:text-xs font-medium mb-0.5 md:mb-1"
            style={{ color: message.userColor }}
          >
            {isCurrentUser ? 'Vous' : displayName}
          </span>
        )}
        <div
          className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm transition-colors ${isCurrentUser
            ? 'bg-primary text-white shadow-sm'
            : 'text-text-main dark:text-slate-100 border border-black/5 dark:border-white/5'
            }`}
          style={!isCurrentUser ? {
            backgroundColor: `${message.userColor}20`, // 20 = 12.5% opacity for pastel effect
          } : undefined}
        >
          {message.content}
        </div>
        <span className="text-[10px] md:text-xs text-text-muted dark:text-slate-500 mt-0.5 md:mt-1">
          {formatRelativeTime(message.timestamp)}
        </span>
      </div>
    </motion.div>
  );
}
