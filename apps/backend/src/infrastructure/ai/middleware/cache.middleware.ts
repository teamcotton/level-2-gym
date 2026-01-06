import { Redis } from '@upstash/redis'
import type { UIMessage } from 'ai'
import { EnvConfig } from '../../config/env.config.js'
import type { LoggerPort } from '../../../application/ports/logger.port.js'
import { obscured } from 'obscured'

/**
 * AI response cache service using Upstash Redis
 *
 * Provides caching functionality for AI provider responses to reduce costs and improve response times.
 * Uses Redis for distributed caching across instances.
 *
 * Features:
 * - Caches AI text responses with configurable expiration
 * - Uses message history as cache key for accurate cache hits
 * - Automatically handles Redis connection errors gracefully
 *
 * @example
 * ```typescript
 * const cacheService = createCacheService(logger)
 * const cached = await cacheService.get(messages)
 * if (cached) {
 *   return cached // Return cached response
 * }
 * // ... call AI model ...
 * await cacheService.set(messages, responseText)
 * ```
 */

export interface CacheService {
  get(messages: UIMessage[]): Promise<string | null>
  set(messages: UIMessage[], text: string): Promise<void>
}

/**
 * Create a cache service instance with Redis configuration
 *
 * @param logger - Logger instance for debugging cache hits/misses
 * @param cacheExpirationSeconds - How long to cache responses (default: 3600 = 1 hour)
 * @returns CacheService instance or null if Redis is not configured
 */
export function createCacheService(
  logger: LoggerPort,
  cacheExpirationSeconds: number = 3600
): CacheService | null {
  const redisUrl = EnvConfig.UPSTASH_REDIS_REST_URL?.toString()
  const redisToken = EnvConfig.UPSTASH_REDIS_REST_TOKEN?.toString()

  // If Redis credentials are not configured, return null
  if (!redisUrl || !redisToken || redisUrl === '[OBSCURED]' || redisToken === '[OBSCURED]') {
    logger.warn(
      'Redis cache disabled: UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not configured'
    )
    return null
  }

  const redis = new Redis({
    url: obscured.value(EnvConfig.UPSTASH_REDIS_REST_URL),
    token: obscured.value(EnvConfig.UPSTASH_REDIS_REST_TOKEN),
  })

  logger.info('Redis cache service enabled', {
    expirationSeconds: cacheExpirationSeconds,
  })

  return {
    /**
     * Get cached response for given message history
     */
    async get(messages: UIMessage[]): Promise<string | null> {
      try {
        const cacheKey = `ai:chat:${JSON.stringify(messages)}`
        const cached = await redis.get<string>(cacheKey)

        if (cached !== null) {
          logger.debug('Cache HIT', {
            cacheKey: cacheKey.substring(0, 100),
          })
          return cached
        }

        logger.debug('Cache MISS', {
          cacheKey: cacheKey.substring(0, 100),
        })
        return null
      } catch (error) {
        logger.error('Redis cache error in get, returning null', error as Error)
        return null
      }
    },

    /**
     * Store AI response in cache
     */
    async set(messages: UIMessage[], text: string): Promise<void> {
      try {
        const cacheKey = `ai:chat:${JSON.stringify(messages)}`
        await redis.set(cacheKey, text, { ex: cacheExpirationSeconds })
        logger.debug('Cached response', {
          cacheKey: cacheKey.substring(0, 100),
          textLength: text.length,
        })
      } catch (error) {
        logger.error('Redis cache error in set', error as Error)
        // Don't throw - caching is not critical
      }
    },
  }
}
