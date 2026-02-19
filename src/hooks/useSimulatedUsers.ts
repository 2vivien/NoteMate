import { useEffect, useRef, useCallback } from 'react';
import { useUsersStore } from '@/features/users/useUsersStore';
import { useEditorStore } from '@/features/editor/useEditorStore';
import { useLogsStore } from '@/features/logs/useLogsStore';
import { useChatStore } from '@/features/chat/useChatStore';
import { useNetworkStore } from '@/features/network/useNetworkStore';
import { simulateNetwork, getRandomLatency } from '@/lib/simulateNetwork';

// Realistic scenario for a collaborative session
const SCENARIO = [
  { time: 2000, user: 'user-bob', type: 'chat', content: 'Hi Alice! Ready to start the project kickoff notes?' },
  { time: 5000, user: 'user-charlie', type: 'chat', content: 'Hey guys. I have the agenda ready in my head.' },
  { time: 9000, user: 'user-bob', type: 'move_cursor', line: 12, col: 1 },
  { time: 11000, user: 'user-bob', type: 'type', content: '- Finalize the tech stack choice' },
  { time: 15000, user: 'user-charlie', type: 'move_cursor', line: 13, col: 1 },
  { time: 17000, user: 'user-charlie', type: 'type', content: '- Review the budget for cloud hosting' },
  { time: 22000, user: 'user-bob', type: 'chat', content: 'Alice, what do you think about the UI design phase?' },
  { time: 28000, user: 'user-charlie', type: 'type', content: ' (Status: High Priority)' },
  { time: 35000, user: 'user-bob', type: 'chat', content: 'I like the progress we are making here.' },
  { time: 42000, user: 'user-charlie', type: 'move_cursor', line: 16, col: 1 },
  { time: 45000, user: 'user-charlie', type: 'type', content: '* Note: Use Next.js for the frontend.' },
];

export function useSimulatedUsers() {
  const users = useUsersStore((state) => state.users);
  const setUserTyping = useUsersStore((state) => state.setUserTyping);
  const incrementActions = useUsersStore((state) => state.incrementActions);
  const setCursor = useEditorStore((state) => state.setCursor);
  const addLog = useLogsStore((state) => state.addUserLog);
  const addChatMessage = useChatStore((state) => state.addMessage);
  const setLatency = useNetworkStore((state) => state.setLatency);
  
  // Stable refs and callbacks to satisfy React's Rules of Hooks
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const isInitializedRef = useRef(false);

  const executeScenarioStep = useCallback(async (step: any) => {
    const user = useUsersStore.getState().users.find((u) => u.id === step.user);
    if (!user) return;

    try {
      const latency = await simulateNetwork(() => getRandomLatency());
      setLatency(latency);

      if (step.type === 'chat') {
          addChatMessage({
            id: Math.random().toString(36).substring(2, 9),
            userId: user.id,
            userName: user.name,
            userColor: user.color,
            content: step.content,
            timestamp: Date.now(),
          });
          incrementActions(user.id);
      } else if (step.type === 'type') {
          setUserTyping(user.id, true);
          
          const cursors = useEditorStore.getState().cursors;
          const currentCursor = (cursors as any)[user.id] || {
            userId: user.id,
            position: { lineNumber: 1, column: 1 },
            visible: true,
            latency
          };

          useEditorStore.getState().applyOperation(
            user.id,
            currentCursor.position,
            step.content,
            'insert'
          );
          
          addLog('edit', user.id, user.name, user.color, `wrote: "${step.content}"`, `at line ${currentCursor.position.lineNumber}`);
          incrementActions(user.id);
          
          setTimeout(() => setUserTyping(user.id, false), 1500);
      } else if (step.type === 'move_cursor') {
          setCursor({
            userId: user.id,
            position: { lineNumber: step.line, column: step.col },
            latency,
            visible: true,
          });
          incrementActions(user.id);
      }
    } catch (error) {
      console.log(`Packet lost for user ${user.id}`);
    }
  }, [setUserTyping, incrementActions, setCursor, addLog, addChatMessage, setLatency]);

  useEffect(() => {
    // Run only once
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    // Initial cursors
    const simulatedUsers = useUsersStore.getState().users.filter((u) => u.id !== 'user-alice');
    simulatedUsers.forEach((user, index) => {
      setCursor({
        userId: user.id,
        position: { lineNumber: 5 + index, column: 1 },
        latency: 45,
        visible: true,
      });
    });

    // Run Scenario
    SCENARIO.forEach((step) => {
      const timeout = setTimeout(() => {
        executeScenarioStep(step);
      }, step.time);
      timeoutsRef.current.push(timeout);
    });

    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };
  }, [executeScenarioStep, setCursor]);

  return {
    triggerManualAction: () => {},
  };
}
