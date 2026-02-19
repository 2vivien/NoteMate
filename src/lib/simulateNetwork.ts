export const getRandomLatency = (min = 100, max = 1500) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

export const simulateNetwork = <T>(
  fn: () => T,
  options: { latency?: number; packetLoss?: number } = {}
): Promise<T> => {
  const { latency = getRandomLatency(), packetLoss = 0.01 } = options;

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const isDropped = Math.random() < packetLoss;
      if (isDropped) {
        reject(new Error('Packet dropped'));
      } else {
        resolve(fn());
      }
    }, latency);
  });
};

/**
 * Simulates a network request with latency but no packet loss
 * Useful for operations that should always succeed
 * @param fn Function to execute
 * @returns Promise that resolves with the result after latency
 */
export async function simulateNetworkReliable<T>(fn: () => T): Promise<T> {
  const latency = getRandomLatency();
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(fn());
    }, latency);
  });
}

/**
 * Formats latency for display
 * @param latency Latency in ms
 * @returns Formatted string
 */
export function formatLatency(latency: number): string {
  return `${latency}ms`;
}
