/**
 * Redis Resilient Client - Wrapper with automatic fallback to in-memory cache
 *
 * This module provides a resilient Redis client that gracefully degrades to
 * in-memory storage when Redis is unavailable, ensuring the application
 * continues to function even during Redis outages.
 *
 * Features:
 * - Automatic fallback to in-memory cache
 * - Transparent API compatible with redis client
 * - Configurable TTL for memory cache
 * - Automatic cleanup of expired entries
 * - Logging of Redis availability status
 */

const { getClient } = require('./redisClient');
const { logger } = require('../logger/logger');

/**
 * In-memory cache fallback when Redis is unavailable
 */
class MemoryCache {
  constructor() {
    this.cache = new Map();
    this.expirations = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Cleanup every minute
  }

  /**
   * Set a value with optional TTL
   * @param {string} key - Cache key
   * @param {string} value - Value to store (should be string for Redis compatibility)
   * @param {number} ttl - Time to live in seconds
   */
  set(key, value, ttl = null) {
    this.cache.set(key, value);
    if (ttl) {
      const expiresAt = Date.now() + ttl * 1000;
      this.expirations.set(key, expiresAt);
    }
  }

  /**
   * Get a value from cache
   * @param {string} key - Cache key
   * @returns {string|null} - Cached value or null if not found/expired
   */
  get(key) {
    // Check if expired
    const expiresAt = this.expirations.get(key);
    if (expiresAt && Date.now() > expiresAt) {
      this.cache.delete(key);
      this.expirations.delete(key);
      return null;
    }

    return this.cache.get(key) || null;
  }

  /**
   * Delete a value from cache
   * @param {string} key - Cache key
   */
  del(key) {
    this.cache.delete(key);
    this.expirations.delete(key);
  }

  /**
   * Check if key exists and is not expired
   * @param {string} key - Cache key
   * @returns {boolean} - True if key exists and not expired
   */
  exists(key) {
    const expiresAt = this.expirations.get(key);
    if (expiresAt && Date.now() > expiresAt) {
      this.cache.delete(key);
      this.expirations.delete(key);
      return false;
    }
    return this.cache.has(key);
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, expiresAt] of this.expirations.entries()) {
      if (now > expiresAt) {
        this.cache.delete(key);
        this.expirations.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.debug(
        {
          component: 'MemoryCache',
          cleanedCount,
          remainingEntries: this.cache.size,
        },
        'Cleaned up expired cache entries'
      );
    }
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
    this.expirations.clear();
  }

  /**
   * Get cache size
   * @returns {number} - Number of entries in cache
   */
  size() {
    return this.cache.size;
  }

  /**
   * Destroy the cache and cleanup interval
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

// Singleton instance
const memoryCache = new MemoryCache();

/**
 * Resilient Redis Client with automatic fallback
 */
class ResilientRedisClient {
  constructor() {
    this.redisAvailable = false;
    this.lastRedisCheck = 0;
    this.checkInterval = 30000; // Check Redis availability every 30 seconds
    this.usingFallback = false;
  }

  /**
   * Get Redis client with fallback handling
   * @returns {Promise<Object|null>} - Redis client or null if unavailable
   */
  async getRedisClient() {
    const now = Date.now();

    // Don't check too frequently
    if (now - this.lastRedisCheck < this.checkInterval) {
      return this.redisAvailable ? await getClient() : null;
    }

    this.lastRedisCheck = now;

    try {
      const client = await getClient();
      if (client && client.isOpen) {
        if (!this.redisAvailable) {
          logger.info({ component: 'ResilientRedisClient' }, 'Redis connection restored');
          this.usingFallback = false;
        }
        this.redisAvailable = true;
        return client;
      }
    } catch (error) {
      if (this.redisAvailable) {
        logger.warn(
          {
            component: 'ResilientRedisClient',
            error: error.message,
          },
          'Redis unavailable, falling back to memory cache'
        );
      }
      this.redisAvailable = false;
      this.usingFallback = true;
    }

    return null;
  }

  /**
   * Set a value with automatic fallback
   * @param {string} key - Cache key
   * @param {string} value - Value to store
   * @param {Object} options - Options (EX for TTL in seconds)
   * @returns {Promise<string>} - "OK" on success
   */
  async set(key, value, options = {}) {
    const client = await this.getRedisClient();

    if (client) {
      try {
        // Parse options for both old and new syntax
        if (options.EX) {
          return await client.setEx(key, options.EX, value);
        } else if (options.PX) {
          return await client.pSetEx(key, options.PX, value);
        } else {
          return await client.set(key, value);
        }
      } catch (error) {
        logger.warn(
          {
            component: 'ResilientRedisClient',
            operation: 'set',
            key,
            error: error.message,
          },
          'Redis set failed, using memory fallback'
        );
      }
    }

    // Fallback to memory cache
    const ttl = options.EX || (options.PX ? options.PX / 1000 : null);
    memoryCache.set(key, value, ttl);
    return 'OK';
  }

  /**
   * Set a value with expiration (seconds)
   * @param {string} key - Cache key
   * @param {number} seconds - TTL in seconds
   * @param {string} value - Value to store
   * @returns {Promise<string>} - "OK" on success
   */
  async setEx(key, seconds, value) {
    return this.set(key, value, { EX: seconds });
  }

  /**
   * Get a value with automatic fallback
   * @param {string} key - Cache key
   * @returns {Promise<string|null>} - Cached value or null
   */
  async get(key) {
    const client = await this.getRedisClient();

    if (client) {
      try {
        return await client.get(key);
      } catch (error) {
        logger.warn(
          {
            component: 'ResilientRedisClient',
            operation: 'get',
            key,
            error: error.message,
          },
          'Redis get failed, using memory fallback'
        );
      }
    }

    // Fallback to memory cache
    return memoryCache.get(key);
  }

  /**
   * Delete a value with automatic fallback
   * @param {string} key - Cache key
   * @returns {Promise<number>} - Number of keys deleted
   */
  async del(key) {
    const client = await this.getRedisClient();

    if (client) {
      try {
        return await client.del(key);
      } catch (error) {
        logger.warn(
          {
            component: 'ResilientRedisClient',
            operation: 'del',
            key,
            error: error.message,
          },
          'Redis del failed, using memory fallback'
        );
      }
    }

    // Fallback to memory cache
    memoryCache.del(key);
    return 1;
  }

  /**
   * Check if key exists with automatic fallback
   * @param {string} key - Cache key
   * @returns {Promise<number>} - 1 if exists, 0 otherwise
   */
  async exists(key) {
    const client = await this.getRedisClient();

    if (client) {
      try {
        return await client.exists(key);
      } catch (error) {
        logger.warn(
          {
            component: 'ResilientRedisClient',
            operation: 'exists',
            key,
            error: error.message,
          },
          'Redis exists failed, using memory fallback'
        );
      }
    }

    // Fallback to memory cache
    return memoryCache.exists(key) ? 1 : 0;
  }

  /**
   * Increment a value with automatic fallback
   * @param {string} key - Cache key
   * @returns {Promise<number>} - New value after increment
   */
  async incr(key) {
    const client = await this.getRedisClient();

    if (client) {
      try {
        return await client.incr(key);
      } catch (error) {
        logger.warn(
          {
            component: 'ResilientRedisClient',
            operation: 'incr',
            key,
            error: error.message,
          },
          'Redis incr failed, using memory fallback'
        );
      }
    }

    // Fallback to memory cache
    const current = parseInt(memoryCache.get(key) || '0', 10);
    const newValue = current + 1;
    memoryCache.set(key, newValue.toString());
    return newValue;
  }

  /**
   * Set expiration on key
   * @param {string} key - Cache key
   * @param {number} seconds - TTL in seconds
   * @returns {Promise<number>} - 1 if set, 0 otherwise
   */
  async expire(key, seconds) {
    const client = await this.getRedisClient();

    if (client) {
      try {
        return await client.expire(key, seconds);
      } catch (error) {
        logger.warn(
          {
            component: 'ResilientRedisClient',
            operation: 'expire',
            key,
            error: error.message,
          },
          'Redis expire failed, using memory fallback'
        );
      }
    }

    // Fallback to memory cache
    const value = memoryCache.get(key);
    if (value !== null) {
      memoryCache.set(key, value, seconds);
      return 1;
    }
    return 0;
  }

  /**
   * Check if currently using fallback mode
   * @returns {boolean} - True if using memory fallback
   */
  isUsingFallback() {
    return this.usingFallback;
  }

  /**
   * Get fallback cache statistics
   * @returns {Object} - Cache statistics
   */
  getFallbackStats() {
    return {
      usingFallback: this.usingFallback,
      redisAvailable: this.redisAvailable,
      memoryCacheSize: memoryCache.size(),
      lastRedisCheck: new Date(this.lastRedisCheck).toISOString(),
    };
  }
}

// Export singleton instance
const resilientRedisClient = new ResilientRedisClient();

module.exports = {
  resilientRedisClient,
  memoryCache, // Export for testing/monitoring
};
