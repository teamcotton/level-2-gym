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

describe('cacheMiddleware', () => {
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

  describe('Redis Client Initialization', () => {
    it('should initialize cacheMiddleware when Redis credentials are configured', async () => {
      mockRedisUrl = 'https://test-redis.upstash.io'
      mockRedisToken = 'test-token-12345'

      const { cacheMiddleware } =
        await import('../../../../src/infrastructure/ai/middleware/cache.middleware.js')

      expect(cacheMiddleware).toBeDefined()
      expect(cacheMiddleware.specificationVersion).toBe('v3')
      expect(cacheMiddleware.wrapGenerate).toBeDefined()
      expect(cacheMiddleware.wrapStream).toBeDefined()
    })

    it('should not create Redis client when credentials are missing', async () => {
      mockRedisUrl = undefined
      mockRedisToken = undefined

      // Clear module cache to test fresh import
      vi.resetModules()

      const { cacheMiddleware } =
        await import('../../../../src/infrastructure/ai/middleware/cache.middleware.js')

      expect(cacheMiddleware).toBeDefined()
      // Redis client should not be instantiated when credentials are missing
      expect(mockRedis).not.toHaveBeenCalled()
    })

    it('should not create Redis client when credentials are obscured placeholders', async () => {
      mockRedisUrl = '[OBSCURED]'
      mockRedisToken = '[OBSCURED]'

      // Clear module cache to test fresh import
      vi.resetModules()

      const { cacheMiddleware } =
        await import('../../../../src/infrastructure/ai/middleware/cache.middleware.js')

      expect(cacheMiddleware).toBeDefined()
      // Redis client should not be instantiated when credentials are obscured
      expect(mockRedis).not.toHaveBeenCalled()
    })
  })
})
