import { useEffect, useRef, useCallback } from 'react';
import { useUsersStore } from '@/features/users/useUsersStore';
import { useEditorStore } from '@/features/editor/useEditorStore';
import { useLogsStore } from '@/features/logs/useLogsStore';
import { useChatStore } from '@/features/chat/useChatStore';
import { useNetworkStore } from '@/features/network/useNetworkStore';
import { simulateNetwork, getRandomLatency } from '@/lib/simulateNetwork';
import { USER_ACTION_INTERVAL_MIN, USER_ACTION_INTERVAL_MAX, TYPING_DURATION_MIN, TYPING_DURATION_MAX } from '@/lib/constants';
import type { User, CursorPosition } from '@/types';

// Possible actions a simulated user can take
type UserAction = 'type' | 'move_cursor' | 'chat' | 'idle';

interface SimulatedAction {
  userId: string;
  action: UserAction;
  payload?: any;
}

const generateRandomAction = (user: User): SimulatedAction => {
  const actions: UserAction[] = ['type', 'move_cursor', 'chat', 'idle'];
  const weights = [0.3, 0.4, 0.2, 0.1]; // Probability weights
  
  const random = Math.random();
  let cumulativeWeight = 0;
  
  for (let i = 0; i < actions.length; i++) {
    cumulativeWeight += weights[i];
    if (random <= cumulativeWeight) {
      return { userId: user.id, action: actions[i] };
    }
  }
  
  return { userId: user.id, action: 'idle' };
};

const getRandomLine = (): number => {
  return Math.floor(Math.random() * 25) + 1;
};

const getRandomColumn = (): number => {
  return Math.floor(Math.random() * 40) + 1;
};

const chatMessages = [
  'Looking good!',
  'I will update the config.',
  'Can someone review this?',
  'The deployment is ready.',
  'Fixed the replica count.',
  'Adding the service definition now.',
  'Looks correct to me.',
  'Let me check the syntax.',
];

export function useSimulatedUsers() {
  const users = useUsersStore((state) => state.users);
  const setUserTyping = useUsersStore((state) => state.setUserTyping);
  const incrementActions = useUsersStore((state) => state.incrementActions);
  const setCursor = useEditorStore((state) => state.setCursor);
  const addLog = useLogsStore((state) => state.addUserLog);
  const addChatMessage = useChatStore((state) => state.addMessage);
  const setLatency = useNetworkStore((state) => state.setLatency);
  
  const intervalsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const typingTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const executeAction = useCallback(async (user: User, action: SimulatedAction) => {
    try {
      // Simulate network latency
      const latency = await simulateNetwork(() => getRandomLatency());
      setLatency(latency);

      switch (action.action) {
        case 'type': {
          // Set user as typing
          setUserTyping(user.id, true);
          
          // Add log entry
          const line = getRandomLine();
          const col = getRandomColumn();
          addLog(
            'edit',
            user.id,
            user.name,
            user.color,
            `edited content`,
            `line ${line}:${col}`
          );
          
          // Increment actions counter
          incrementActions(user.id);
          
          // Clear typing after random duration
          const typingDuration = TYPING_DURATION_MIN + Math.random() * (TYPING_DURATION_MAX - TYPING_DURATION_MIN);
          const existingTimeout = typingTimeoutsRef.current.get(user.id);
          if (existingTimeout) {
            clearTimeout(existingTimeout);
          }
          
          const timeout = setTimeout(() => {
            setUserTyping(user.id, false);
          }, typingDuration);
          
          typingTimeoutsRef.current.set(user.id, timeout);
          break;
        }

        case 'move_cursor': {
          const position: CursorPosition = {
            lineNumber: getRandomLine(),
            column: getRandomColumn(),
          };
          
          setCursor({
            userId: user.id,
            position,
            latency,
            visible: true,
          });
          
          incrementActions(user.id);
          break;
        }

        case 'chat': {
          const messageContent = chatMessages[Math.floor(Math.random() * chatMessages.length)];
          
          addChatMessage({
            id: Math.random().toString(36).substring(2, 9),
            userId: user.id,
            userName: user.name,
            userColor: user.color,
            content: messageContent,
            timestamp: Date.now(),
          });
          
          incrementActions(user.id);
          break;
        }

        case 'idle':
        default:
          // Do nothing, user is idle
          break;
      }
    } catch (error) {
      // Packet lost - log it
      console.log(`Packet lost for user ${user.name}`);
    }
  }, [setUserTyping, incrementActions, setCursor, addLog, addChatMessage, setLatency]);

  const scheduleNextAction = useCallback((user: User) => {
    const interval = USER_ACTION_INTERVAL_MIN + Math.random() * (USER_ACTION_INTERVAL_MAX - USER_ACTION_INTERVAL_MIN);
    
    const timeout = setTimeout(() => {
      const action = generateRandomAction(user);
      executeAction(user, action);
      
      // Schedule next action
      scheduleNextAction(user);
    }, interval);
    
    intervalsRef.current.set(user.id, timeout);
  }, [executeAction]);

  useEffect(() => {
    // Start simulation for all users except current user
    const simulatedUsers = users.filter((u) => u.id !== 'user-alice');
    
    simulatedUsers.forEach((user) => {
      scheduleNextAction(user);
    });

    return () => {
      // Cleanup all intervals
      intervalsRef.current.forEach((timeout) => clearTimeout(timeout));
      typingTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
      intervalsRef.current.clear();
      typingTimeoutsRef.current.clear();
    };
  }, [users, scheduleNextAction]);

  // Function to manually trigger an action (for testing)
  const triggerManualAction = useCallback((userId: string, action: UserAction) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      executeAction(user, { userId, action });
    }
  }, [users, executeAction]);

  return {
    triggerManualAction,
  };
}
