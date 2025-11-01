import Redis from 'ioredis';

let redis: Redis;

export const getRedis = (): Redis | null => {
  try {
    if (!redis) {
      redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
        retryStrategy: (times) => {
          // In development, give up after 3 retries
          if (times > 3 && process.env.NODE_ENV === 'development') {
            console.warn('Redis unavailable - continuing without Redis');
            return null;
          }
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });

      redis.on('error', (err) => {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Redis Client Error (optional in development):', err.message);
        } else {
          console.error('Redis Client Error:', err);
        }
      });

      redis.on('connect', () => {
        console.log('✓ Redis Client Connected');
      });
    }
    return redis;
  } catch (error) {
    console.warn('Redis not available - continuing without Redis (optional in development)');
    return null;
  }
};

export const disconnectRedis = async (): Promise<void> => {
  if (redis) {
    await redis.quit();
  }
};
