import { createClient } from 'redis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Local in-memory fallback for development when local Redis is offline
const memoryCache = new Map<string, string>();
const memoryExpirations = new Map<string, NodeJS.Timeout>();

const realClient = createClient({
  url: REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      // Gracefully slow down retries to prevent console spamming
      if (retries > 3) {
        return 30000; // Retry every 30s
      }
      return 2000; // Retry every 2s initially
    }
  }
});

let isRedisConnected = false;
let warningLogged = false;

realClient.on('error', () => {
  if (!isRedisConnected && !warningLogged) {
    console.warn('Redis is offline. Server will run with silent in-memory fallback cache for development.');
    warningLogged = true;
  }
});

realClient.on('connect', () => {
  isRedisConnected = true;
  warningLogged = false;
  console.log('Redis connected successfully');
});

realClient.on('end', () => {
  isRedisConnected = false;
});

// Auto-connect on startup
realClient.connect().catch(() => {
  if (!warningLogged) {
    console.warn('Could not establish initial connection to Redis. Local memory fallback is active.');
    warningLogged = true;
  }
});

// Export a proxy/wrapper that perfectly matches redisClient usage
export const redisClient = {
  isOpen: false,
  get: async (key: string): Promise<string | null> => {
    if (isRedisConnected && realClient.isOpen) {
      try {
        return await realClient.get(key);
      } catch {
        return memoryCache.get(key) || null;
      }
    }
    return memoryCache.get(key) || null;
  },
  setEx: async (key: string, seconds: number, value: string): Promise<string | null> => {
    if (isRedisConnected && realClient.isOpen) {
      try {
        await realClient.setEx(key, seconds, value);
        return 'OK';
      } catch {
        // Fallback
      }
    }
    // Memory fallback storage
    memoryCache.set(key, value);
    if (memoryExpirations.has(key)) {
      clearTimeout(memoryExpirations.get(key)!);
    }
    const timeout = setTimeout(() => {
      memoryCache.delete(key);
      memoryExpirations.delete(key);
    }, seconds * 1000);
    memoryExpirations.set(key, timeout);
    return 'OK';
  },
  on: (event: string, listener: (...args: any[]) => void) => {
    realClient.on(event, listener);
    return redisClient;
  },
  connect: async () => {
    // Already auto-connecting
  }
} as any;

export default redisClient;
