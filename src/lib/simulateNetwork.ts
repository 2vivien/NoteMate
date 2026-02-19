import { MIN_LATENCY, MAX_LATENCY, PACKET_LOSS_RATE } from './constants';

/**
 * Simulates network latency with random delay between MIN_LATENCY and MAX_LATENCY
 * @returns Promise that resolves after the simulated latency
 */
export function simulateLatency(): Promise<number> {
  const latency = MIN_LATENCY + Math.random() * (MAX_LATENCY - MIN_LATENCY);
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(Math.round(latency));
    }, latency);
  });
}

/**
 * Simulates packet loss based on PACKET_LOSS_RATE
 * @returns true if packet should be dropped, false otherwise
 */
export function shouldDropPacket(): boolean {
  return Math.random() < PACKET_LOSS_RATE;
}

/**
 * Simulates a network request with latency and potential packet loss
 * @param fn Function to execute if packet is not dropped
 * @returns Promise that resolves with the result or rejects if packet is dropped
 */
export async function simulateNetwork<T>(fn: () => T): Promise<T> {
  await simulateLatency();
  
  if (shouldDropPacket()) {
    throw new Error('Packet lost');
  }
  
  return fn();
}

/**
 * Simulates a network request with latency but no packet loss
 * Useful for operations that should always succeed
 * @param fn Function to execute
 * @returns Promise that resolves with the result after latency
 */
export async function simulateNetworkReliable<T>(fn: () => T): Promise<T> {
  await simulateLatency();
  return fn();
}

/**
 * Gets a random latency value without waiting
 * @returns Random latency in ms
 */
export function getRandomLatency(): number {
  return Math.round(MIN_LATENCY + Math.random() * (MAX_LATENCY - MIN_LATENCY));
}

/**
 * Formats latency for display
 * @param latency Latency in ms
 * @returns Formatted string
 */
export function formatLatency(latency: number): string {
  return `${latency}ms`;
}
