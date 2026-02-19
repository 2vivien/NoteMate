import { useEffect, useRef } from 'react';
import { useNetworkStore } from '@/features/network/useNetworkStore';

export function useSessionTimer() {
  const updateSessionDuration = useNetworkStore((state) => state.updateSessionDuration);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Update session duration every second
    intervalRef.current = setInterval(() => {
      updateSessionDuration();
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [updateSessionDuration]);

  return null;
}
