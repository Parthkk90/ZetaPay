/**
 * Redis Cache Service
 * Provides caching layer for improved performance and scalability
 */

import { createClient, RedisClientType } from 'redis';
import logger from '../utils/logger';

class RedisCacheService {
  private client: RedisClientType | null = null;
  private connected: boolean = false;
  private readonly DEFAULT_TTL = 3600; // 1 hour in seconds

  /**
   * Initialize Redis client
   */
  async connect(): Promise<void> {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      logger.warn('Redis URL not configured, caching disabled');
      return;
    }

    try {
      this.client = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              logger.error('Max Redis reconnection attempts reached');
              return new Error('Max reconnection attempts reached');
            }
            return retries * 100;
          },
        },
      });

      this.client.on('error', (err) => {
        logger.error('Redis Client Error:', err);
        this.connected = false;
      });

      this.client.on('connect', () => {
        logger.info('Redis client connecting...');
      });

      this.client.on('ready', () => {
        logger.info('Redis client ready');
        this.connected = true;
      });

      this.client.on('end', () => {
        logger.info('Redis client disconnected');
        this.connected = false;
      });

      await this.client.connect();
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.client && this.connected) {
      await this.client.quit();
      logger.info('Redis client disconnected');
    }
  }

  /**
   * Check if Redis is connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.client || !this.connected) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Error getting key ${key} from cache:`, error);
      return null;
    }
  }

  /**
   * Set value in cache with optional TTL
   */
  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    if (!this.client || !this.connected) {
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      const expirySeconds = ttl || this.DEFAULT_TTL;
      
      await this.client.setEx(key, expirySeconds, serialized);
      return true;
    } catch (error) {
      logger.error(`Error setting key ${key} in cache:`, error);
      return false;
    }
  }

  /**
   * Delete key from cache
   */
  async delete(key: string): Promise<boolean> {
    if (!this.client || !this.connected) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error(`Error deleting key ${key} from cache:`, error);
      return false;
    }
  }

  /**
   * Delete multiple keys matching a pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    if (!this.client || !this.connected) {
      return 0;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }
      
      await this.client.del(keys);
      return keys.length;
    } catch (error) {
      logger.error(`Error deleting pattern ${pattern} from cache:`, error);
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.client || !this.connected) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Error checking existence of key ${key}:`, error);
      return false;
    }
  }

  /**
   * Increment counter
   */
  async increment(key: string): Promise<number> {
    if (!this.client || !this.connected) {
      return 0;
    }

    try {
      return await this.client.incr(key);
    } catch (error) {
      logger.error(`Error incrementing key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Set expiry on existing key
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    if (!this.client || !this.connected) {
      return false;
    }

    try {
      await this.client.expire(key, ttl);
      return true;
    } catch (error) {
      logger.error(`Error setting expiry on key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    connected: boolean;
    keyCount: number;
    memoryUsed: string;
  }> {
    if (!this.client || !this.connected) {
      return {
        connected: false,
        keyCount: 0,
        memoryUsed: '0',
      };
    }

    try {
      const keys = await this.client.keys('*');
      const info = await this.client.info('memory');
      
      // Parse memory info
      const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
      const memoryUsed = memoryMatch ? memoryMatch[1] : '0';

      return {
        connected: true,
        keyCount: keys.length,
        memoryUsed,
      };
    } catch (error) {
      logger.error('Error getting cache stats:', error);
      return {
        connected: false,
        keyCount: 0,
        memoryUsed: '0',
      };
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<boolean> {
    if (!this.client || !this.connected) {
      return false;
    }

    try {
      await this.client.flushDb();
      logger.info('Cache cleared successfully');
      return true;
    } catch (error) {
      logger.error('Error clearing cache:', error);
      return false;
    }
  }
}

// Export singleton instance
export const cacheService = new RedisCacheService();

// Export class for testing
export { RedisCacheService };
