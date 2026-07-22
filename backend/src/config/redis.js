import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('Redis connected successfully');
});

export const connectRedis = async () => {
  try {
    // Skip Redis connection in test environment or if Redis is not available
    if (process.env.NODE_ENV === 'test') {
      console.log('Skipping Redis connection in test environment');
      return;
    }
    
    await redisClient.connect();
  } catch (error) {
    console.error('Unable to connect to Redis:', error);
    console.log('Continuing without Redis connection for development...');
    // Don't throw error in development to allow server to start
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
};

export default redisClient;