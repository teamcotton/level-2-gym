import type { UIMessage } from 'ai'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock Upstash Redis
const mockGet = vi.fn()
const mockSet = vi.fn()
const mockRedis = vi.fn()

vi.mock('@upstash/redis', () => {
  return {
    Redis: class {
      constructor(config: { url: string; token: string }) {
        mockRedis(config)
      }

      get = mockGet
      set = mockSet
    },
  }
})

// Mock EnvConfig to provide test values
let mockRedisUrl: string | undefined
let mockRedisToken: string | undefined

vi.mock('../../../../src/infrastructure/config/env.config.js', () => {
  return {
    EnvConfig: {
      get UPSTASH_REDIS_REST_URL() {
        if (!mockRedisUrl) return undefined
        // Return a mock obscured object
        return {
          toString: () => mockRedisUrl!,
          valueOf: () => mockRedisUrl!,
        }
      },
      get UPSTASH_REDIS_REST_TOKEN() {
        if (!mockRedisToken) return undefined
        // Return a mock obscured object
        return {
          toString: () => mockRedisToken!,
          valueOf: () => mockRedisToken!,
        }
      },
    },
  }
})

// Also need to mock obscured.value() to extract the mock values
vi.mock('obscured', () => {
  return {
    obscured: {
      make: (value: string) => ({
        toString: () => value,
        valueOf: () => value,
      }),
      value: (obj: any) => {
        if (!obj) return undefined
        return obj.valueOf ? obj.valueOf() : obj
      },
    },
  }
})

// Mock logger
const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
  error: vi.fn(),
}

describe('createCacheService', () => {
  beforeEach(() => {
    // Reset mock values
    mockRedisUrl = undefined
    mockRedisToken = undefined

    // Clear all mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Service Creation', () => {
    it('should create cache service when Redis credentials are configured', async () => {
      mockRedisUrl = 'https://test-redis.upstash.io'
      mockRedisToken = 'test-token-12345'

      const { createCacheService } =
        await import('../../../../src/infrastructure/ai/middleware/cache.middleware.js')

      const service = createCacheService(mockLogger, 3600)

      expect(service).not.toBeNull()
      expect(service).toHaveProperty('get')
      expect(service).toHaveProperty('set')
      expect(mockLogger.info).toHaveBeenCalledWith('Redis cache service enabled', {
        expirationSeconds: 3600,
      })
    })

    it('should return null when UPSTASH_REDIS_REST_URL is not configured', async () => {
      mockRedisUrl = undefined
      mockRedisToken = 'test-token-12345'

      const { createCacheService } =
        await import('../../../../src/infrastructure/ai/middleware/cache.middleware.js')

      const service = createCacheService(mockLogger)

      expect(service).toBeNull()
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Redis cache disabled: UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not configured'
      )
    })

    it('should return null when UPSTASH_REDIS_REST_TOKEN is not configured', async () => {
      mockRedisUrl = 'https://test-redis.upstash.io'
      mockRedisToken = undefined

      const { createCacheService } =
        await import('../../../../src/infrastructure/ai/middleware/cache.middleware.js')

      const service = createCacheService(mockLogger)

      expect(service).toBeNull()
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Redis cache disabled: UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not configured'
      )
    })

    it('should return null when both Redis credentials are not configured', async () => {
      mockRedisUrl = undefined
      mockRedisToken = undefined

      const { createCacheService } =
        await import('../../../../src/infrastructure/ai/middleware/cache.middleware.js')

      const service = createCacheService(mockLogger)

      expect(service).toBeNull()
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Redis cache disabled: UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not configured'
      )
    })

    it('should use default expiration time of 3600 seconds', async () => {
      mockRedisUrl = 'https://test-redis.upstash.io'
      mockRedisToken = 'test-token-12345'

      const { createCacheService } =
        await import('../../../../src/infrastructure/ai/middleware/cache.middleware.js')

      createCacheService(mockLogger)

      expect(mockLogger.info).toHaveBeenCalledWith('Redis cache service enabled', {
        expirationSeconds: 3600,
      })
    })

    it('should accept custom expiration time', async () => {
      mockRedisUrl = 'https://test-redis.upstash.io'
      mockRedisToken = 'test-token-12345'

      const { createCacheService } =
        await import('../../../../src/infrastructure/ai/middleware/cache.middleware.js')

      createCacheService(mockLogger, 7200)

      expect(mockLogger.info).toHaveBeenCalledWith('Redis cache service enabled', {
        expirationSeconds: 7200,
      })
    })

    it('should initialize Redis client with correct configuration', async () => {
      const testUrl = 'https://test-redis.upstash.io'
      const testToken = 'test-token-12345'

      mockRedisUrl = testUrl
      mockRedisToken = testToken

      const { createCacheService } =
        await import('../../../../src/infrastructure/ai/middleware/cache.middleware.js')

      createCacheService(mockLogger)

      expect(mockRedis).toHaveBeenCalledWith({
        url: testUrl,
        token: testToken,
      })
    })
  })

  describe('CacheService.get', () => {
    const testMessages: UIMessage[] = [
      {
        role: 'user',
        parts: [{ type: 'text', text: 'What is the capital of France?' }],
        id: 'msg-1',
      } as any,
    ]

    it('should return cached response when cache hit', async () => {
      mockRedisUrl = 'https://test-redis.upstash.io'
      mockRedisToken = 'test-token-12345'

      const cachedResponse = 'The capital of France is Paris.'
      mockGet.mockResolvedValue(cachedResponse)

      const { createCacheService } =
        await import('../../../../src/infrastructure/ai/middleware/cache.middleware.js')

      const service = createCacheService(mockLogger)
      const result = await service?.get(testMessages)

      expect(result).toBe(cachedResponse)
      expect(mockGet).toHaveBeenCalledWith(`ai:chat:${JSON.stringify(testMessages)}`)
      expect(mockLogger.debug).toHaveBeenCalledWith('Cache HIT', {
        cacheKey: expect.stringContaining('ai:chat:'),
      })
    })

    it('should return null when cache miss', async () => {
      mockRedisUrl = 'https://test-redis.upstash.io'
      mockRedisToken = 'test-token-12345'

      mockGet.mockResolvedValue(null)

      const { createCacheService } =
        await import('../../../../src/infrastructure/ai/middleware/cache.middleware.js')

      const service = createCacheService(mockLogger)
      const result = await service?.get(testMessages)

      expect(result).toBeNull()
      expect(mockLogger.debug).toHaveBeenCalledWith('Cache MISS', {
        cacheKey: expect.stringContaining('ai:chat:'),
      })
    })

    it('should generate cache key from messages', async () => {
      mockRedisUrl = 'https://test-redis.upstash.io'
      mockRedisToken = 'test-token-12345'

      mockGet.mockResolvedValue(null)

      const { createCacheService } =
        await import('../../../../src/infrastructure/ai/middleware/cache.middleware.js')

      const service = createCacheService(mockLogger)
      await service?.get(testMessages)

      const expectedKey = `ai:chat:${JSON.stringify(testMessages)}`
      expect(mockGet).toHaveBeenCalledWith(expectedKey)
    })

    it('should handle Redis errors gracefully and return null', async () => {
      mockRedisUrl = 'https://test-redis.upstash.io'
      mockRedisToken = 'test-token-12345'

      const redisError = new Error('Redis connection failed')
      mockGet.mockRejectedValue(redisError)

      const { createCacheService } =
        await import('../../../../src/infrastructure/ai/middleware/cache.middleware.js')

      const service = createCacheService(mockLogger)
      const result = await service?.get(testMessages)

      expect(result).toBeNull()
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Redis cache error in get, returning null',
        redisError
      )
    })

    it('should truncate long cache keys in debug logs', async () => {
      mockRedisUrl = 'https://test-redis.upstash.io'
      mockRedisToken = 'test-token-12345'

      const longMessages: UIMessage[] = [
        {
          role: 'user',
          parts: [{ type: 'text', text: 'A'.repeat(200) }],
          id: 'msg-1',
        } as any,
      ]

      mockGet.mockResolvedValue(null)

      const { createCacheService } =
        await import('../../../../src/infrastructure/ai/middleware/cache.middleware.js')

      const service = createCacheService(mockLogger)
      await service?.get(longMessages)

      expect(mockLogger.debug).toHaveBeenCalledWith('Cache MISS', {
        cacheKey: expect.any(String),
      })

      // Verify cache key is truncated to 100 characters
      const logCall = mockLogger.debug.mock.calls[0]
      expect(logCall).toBeDefined()
      expect(logCall![1].cacheKey.length).toBe(100)
    })
  })

  describe('CacheService.set', () => {
    const testMessages: UIMessage[] = [
      {
        role: 'user',
        parts: [{ type: 'text', text: 'What is the capital of France?' }],
        id: 'msg-1',
      } as any,
    ]
    const testResponse = 'The capital of France is Paris.'

    it('should store response in cache with expiration', async () => {
      mockRedisUrl = 'https://test-redis.upstash.io'
      mockRedisToken = 'test-token-12345'

      mockSet.mockResolvedValue('OK')

      const { createCacheService } =
        await import('../../../../src/infrastructure/ai/middleware/cache.middleware.js')

      const service = createCacheService(mockLogger, 3600)
      await service?.set(testMessages, testResponse)

      const expectedKey = `ai:chat:${JSON.stringify(testMessages)}`
      expect(mockSet).toHaveBeenCalledWith(expectedKey, testResponse, { ex: 3600 })
      expect(mockLogger.debug).toHaveBeenCalledWith('Cached response', {
        cacheKey: expect.stringContaining('ai:chat:'),
        textLength: testResponse.length,
      })
    })

    it('should use custom expiration time when provided', async () => {
      mockRedisUrl = 'https://test-redis.upstash.io'
      mockRedisToken = 'test-token-12345'

      mockSet.mockResolvedValue('OK')

      const { createCacheService } =
        await import('../../../../src/infrastructure/ai/middleware/cache.middleware.js')

      const customExpiration = 7200
      const service = createCacheService(mockLogger, customExpiration)
      await service?.set(testMessages, testResponse)

      expect(mockSet).toHaveBeenCalledWith(expect.any(String), testResponse, {
        ex: customExpiration,
      })
    })

    it('should generate correct cache key', async () => {
      mockRedisUrl = 'https://test-redis.upstash.io'
      mockRedisToken = 'test-token-12345'

      mockSet.mockResolvedValue('OK')

      const { createCacheService } =
        await import('../../../../src/infrastructure/ai/middleware/cache.middleware.js')

      const service = createCacheService(mockLogger)
      await service?.set(testMessages, testResponse)

      const expectedKey = `ai:chat:${JSON.stringify(testMessages)}`
      expect(mockSet).toHaveBeenCalledWith(expectedKey, expect.any(String), expect.any(Object))
    })

    it('should handle Redis errors gracefully without throwing', async () => {
      mockRedisUrl = 'https://test-redis.upstash.io'
      mockRedisToken = 'test-token-12345'

      const redisError = new Error('Redis connection failed')
      mockSet.mockRejectedValue(redisError)

      const { createCacheService } =
        await import('../../../../src/infrastructure/ai/middleware/cache.middleware.js')

      const service = createCacheService(mockLogger)

      // Should not throw
      await expect(service!.set(testMessages, testResponse)).resolves.not.toThrow()

      expect(mockLogger.error).toHaveBeenCalledWith('Redis cache error in set', redisError)
    })

    it('should log response text length', async () => {
      mockRedisUrl = 'https://test-redis.upstash.io'
      mockRedisToken = 'test-token-12345'

      mockSet.mockResolvedValue('OK')

      const longResponse = 'A'.repeat(5000)

      const { createCacheService } =
        await import('../../../../src/infrastructure/ai/middleware/cache.middleware.js')

      const service = createCacheService(mockLogger)
      await service?.set(testMessages, longResponse)

      expect(mockLogger.debug).toHaveBeenCalledWith('Cached response', {
        cacheKey: expect.any(String),
        textLength: 5000,
      })
    })

    it('should truncate long cache keys in debug logs', async () => {
      mockRedisUrl = 'https://test-redis.upstash.io'
      mockRedisToken = 'test-token-12345'

      const longMessages: UIMessage[] = [
        {
          role: 'user',
          parts: [{ type: 'text', text: 'A'.repeat(200) }],
          id: 'msg-1',
        } as any,
      ]

      mockSet.mockResolvedValue('OK')

      const { createCacheService } =
        await import('../../../../src/infrastructure/ai/middleware/cache.middleware.js')

      const service = createCacheService(mockLogger)
      await service?.set(longMessages, testResponse)

      expect(mockLogger.debug).toHaveBeenCalledWith('Cached response', {
        cacheKey: expect.any(String),
        textLength: expect.any(Number),
      })

      // Verify cache key is truncated to 100 characters
      const logCall = mockLogger.debug.mock.calls[0]
      expect(logCall).toBeDefined()
      expect(logCall![1].cacheKey.length).toBe(100)
    })
  })

  describe('Integration Scenarios', () => {
    it('should handle cache miss followed by cache set', async () => {
      mockRedisUrl = 'https://test-redis.upstash.io'
      mockRedisToken = 'test-token-12345'

      const testMessages: UIMessage[] = [
        {
          role: 'user',
          parts: [{ type: 'text', text: 'What is TypeScript?' }],
          id: 'msg-1',
        } as any,
      ]
      const testResponse = 'TypeScript is a typed superset of JavaScript.'

      mockGet.mockResolvedValue(null)
      mockSet.mockResolvedValue('OK')

      const { createCacheService } =
        await import('../../../../src/infrastructure/ai/middleware/cache.middleware.js')

      const service = createCacheService(mockLogger)

      // First call - cache miss
      const firstResult = await service?.get(testMessages)
      expect(firstResult).toBeNull()

      // Store in cache
      await service?.set(testMessages, testResponse)

      // Verify set was called
      expect(mockSet).toHaveBeenCalledWith(expect.any(String), testResponse, expect.any(Object))
    })

    it('should handle multiple messages in conversation', async () => {
      mockRedisUrl = 'https://test-redis.upstash.io'
      mockRedisToken = 'test-token-12345'

      const conversationMessages: UIMessage[] = [
        { role: 'user', parts: [{ type: 'text', text: 'Hello' }], id: 'msg-1' } as any,
        { role: 'assistant', parts: [{ type: 'text', text: 'Hi there!' }], id: 'msg-2' } as any,
        { role: 'user', parts: [{ type: 'text', text: 'What is AI?' }], id: 'msg-3' } as any,
      ]

      mockGet.mockResolvedValue(null)

      const { createCacheService } =
        await import('../../../../src/infrastructure/ai/middleware/cache.middleware.js')

      const service = createCacheService(mockLogger)
      await service?.get(conversationMessages)

      const expectedKey = `ai:chat:${JSON.stringify(conversationMessages)}`
      expect(mockGet).toHaveBeenCalledWith(expectedKey)
    })

    it('should generate different cache keys for different message orders', async () => {
      mockRedisUrl = 'https://test-redis.upstash.io'
      mockRedisToken = 'test-token-12345'

      const messages1: UIMessage[] = [
        { role: 'user', parts: [{ type: 'text', text: 'First message' }], id: 'msg-1' } as any,
        { role: 'user', parts: [{ type: 'text', text: 'Second message' }], id: 'msg-2' } as any,
      ]

      const messages2: UIMessage[] = [
        { role: 'user', parts: [{ type: 'text', text: 'Second message' }], id: 'msg-2' } as any,
        { role: 'user', parts: [{ type: 'text', text: 'First message' }], id: 'msg-1' } as any,
      ]

      mockGet.mockResolvedValue(null)

      const { createCacheService } =
        await import('../../../../src/infrastructure/ai/middleware/cache.middleware.js')

      const service = createCacheService(mockLogger)

      await service?.get(messages1)
      const key1 = mockGet.mock.calls[0]?.[0]

      await service?.get(messages2)
      const key2 = mockGet.mock.calls[1]?.[0]

      // Keys should be different because message order is different
      expect(key1).toBeDefined()
      expect(key2).toBeDefined()
      expect(key1).not.toBe(key2)
    })
  })
})
