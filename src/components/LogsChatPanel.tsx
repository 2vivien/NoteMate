import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLogsStore } from '@/features/logs/useLogsStore';
import { useChatStore } from '@/features/chat/useChatStore';
import { useUsersStore } from '@/features/users/useUsersStore';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ClipboardList, MessageSquare, Send } from 'lucide-react';
import type { LogEntry, LogType, ChatMessage } from '@/types';

const logTypeColors: Record<LogType, string> = {
  edit: 'text-emerald-600 dark:text-emerald-400',
  cursor: 'text-blue-600 dark:text-blue-400',
  sync: 'text-purple-600 dark:text-purple-400',
  connect: 'text-amber-600 dark:text-amber-400',
  disconnect: 'text-red-600 dark:text-red-400',
  system: 'text-primary',
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

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return new Date(timestamp).toLocaleDateString();
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
  const currentUserId = useUsersStore((state) => state.currentUserId);

  const chatScrollRef = useRef<HTMLDivElement>(null);

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
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <aside className="w-80 border-l border-border-light dark:border-border-dark bg-sidebar-bg dark:bg-sidebar-dark flex flex-col shrink-0">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
        {/* Tab headers */}
        <div className="flex border-b border-border-light dark:border-border-dark h-11">
          <TabsList className="w-full h-full bg-transparent p-0">
            <TabsTrigger
              value="logs"
              className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-white dark:data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs font-semibold text-text-muted dark:text-slate-500 data-[state=active]:text-text-main dark:data-[state=active]:text-slate-100 flex items-center justify-center gap-2"
            >
              <ClipboardList className="w-4 h-4" />
              Activity Log
            </TabsTrigger>
            <TabsTrigger
              value="chat"
              className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-white dark:data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs font-semibold text-text-muted dark:text-slate-500 data-[state=active]:text-text-main dark:data-[state=active]:text-slate-100 flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Chat
              {unreadCount > 0 && activeTab !== 'chat' && (
                <span className="size-1.5 rounded-full bg-primary" />
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Activity Log content */}
        <TabsContent value="logs" className="flex-1 overflow-hidden m-0 mt-0 data-[state=inactive]:hidden">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-2">
              <AnimatePresence initial={false}>
                {logs.map((log) => (
                  <LogItem key={log.id} log={log} />
                ))}
              </AnimatePresence>
              
              {logs.length === 0 && (
                <div className="text-center text-text-muted dark:text-slate-500 text-sm py-8">
                  No activity yet
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Chat content */}
        <TabsContent value="chat" className="flex-1 overflow-hidden m-0 mt-0 data-[state=inactive]:hidden flex flex-col">
          <div ref={chatScrollRef} className="flex-1 overflow-auto p-3 space-y-3">
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
              <div className="text-center text-text-muted dark:text-slate-500 text-sm py-8">
                No messages yet
              </div>
            )}
          </div>

          {/* Chat input */}
          <div className="p-3 border-t border-border-light dark:border-border-dark bg-white dark:bg-transparent">
            <div className="relative">
              <Input
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message or /command..."
                className="w-full bg-sidebar-bg dark:bg-background-dark border-border-light dark:border-border-dark rounded-lg text-xs py-2 pl-3 pr-10 focus:ring-1 focus:ring-primary focus:border-primary"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSendMessage}
                disabled={!messageInput.trim()}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-primary hover:text-primary/80 disabled:opacity-30"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
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
      className="flex gap-3 text-[11px]"
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
            <span className={colorClass}>System</span>: {log.message}
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2 ${isCurrentUser ? 'flex-row-reverse' : ''}`}
    >
      {showAvatar && !isCurrentUser ? (
        <div
          className="size-7 rounded-full flex-shrink-0 overflow-hidden border"
          style={{ borderColor: message.userColor }}
        >
          <img
            src={`https://i.pravatar.cc/150?u=${message.userId}`}
            alt={message.userName}
            className="w-full h-full object-cover"
          />
        </div>
      ) : !isCurrentUser ? (
        <div className="size-7 flex-shrink-0" />
      ) : null}

      <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} max-w-[80%]`}>
        {showAvatar && (
          <span
            className="text-[10px] font-medium mb-0.5"
            style={{ color: message.userColor }}
          >
            {message.userName}
          </span>
        )}
        <div
          className={`px-3 py-1.5 rounded-lg text-xs ${
            isCurrentUser
              ? 'bg-primary text-white'
              : 'bg-gray-100 dark:bg-border-dark text-text-main dark:text-slate-200'
          }`}
        >
          {message.content}
        </div>
        <span className="text-[9px] text-text-muted dark:text-slate-500 mt-0.5">
          {formatRelativeTime(message.timestamp)}
        </span>
      </div>
    </motion.div>
  );
}
