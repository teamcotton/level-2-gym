// Mock next-auth/jwt as in existing tests
import { getToken } from 'next-auth/jwt'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import * as middlewareModule from '@/middleware.js'
import { __getRateLimiterSize, __resetRateLimiter, middleware } from '@/middleware.js'

vi.mock('next-auth/jwt', () => ({ getToken: vi.fn() }))

// We'll mock Upstash modules. `limitMock` controls the runtime return value.
const limitMock = vi.fn()
vi.mock('@upstash/ratelimit', () => {
  return {
    Ratelimit: class {
      constructor(_opts: unknown) {}
      static slidingWindow() {
        return () => {}
      }
      limit = (...args: unknown[]) => limitMock(...args)
    },
  }
})

vi.mock('@upstash/redis', () => ({
  Redis: class {
    constructor(_opts: unknown) {}
  },
}))

describe('Middleware Rate Limiting', () => {
  const baseUrl = 'http://localhost:3000'
  const origEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = {
      ...origEnv,
      NEXTAUTH_SECRET: 'test-secret',
      // no external rate-limit service required for in-memory limiter
      UPSTASH_REDIS_REST_URL: 'url',
      UPSTASH_REDIS_REST_TOKEN: 'token',
    }
    __resetRateLimiter()
  })

  afterEach(() => {
    process.env = origEnv
  })

  const createRequest = (pathname: string, method = 'GET') =>
    new Request(`${baseUrl}${pathname}`, { method })

  it.skip('allows requests under the rate limit and sets rate-limit headers', async () => {
    // Use in-memory limiter: first request should be allowed and include headers
    vi.mocked(getToken).mockResolvedValue(null)

    const req = createRequest('/api/test')
    const res = await middleware(req)

    expect(res.status).toBe(200)
    expect(res.headers.get('X-RateLimit-Limit')).toBe('10')
    // default max is 10, first request consumes 1 -> remaining should be 9
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('9')
    expect(res.headers.get('X-RateLimit-Reset')).toBeTruthy()
  })

  it.skip('blocks requests when over the limit with 429 and headers', async () => {
    // Consume the in-memory limiter up to its max, then assert the next request is blocked
    vi.mocked(getToken).mockResolvedValue(null)

    // consume default RATE_LIMIT_MAX (10) requests
    for (let i = 0; i < 10; i++) {
      const r = await middleware(createRequest('/api/test'))
      expect(r.status).toBe(200)
    }

    // now the next request should be blocked
    const blocked = await middleware(createRequest('/api/test'))
    expect(blocked.status).toBe(429)
    expect(blocked.headers.get('X-RateLimit-Limit')).toBe('10')
    expect(blocked.headers.get('X-RateLimit-Remaining')).toBe('0')
    expect(blocked.headers.get('X-RateLimit-Reset')).toBeTruthy()
  })

  it.skip('attaches rate-limit headers to redirect responses', async () => {
    // unauthenticated -> protected route triggers redirect and headers should be attached
    vi.mocked(getToken).mockResolvedValue(null)

    const req = createRequest('/admin', 'POST')
    const res = await middleware(req)

    expect(res.status).toBe(302)
    expect(res.headers.get('X-RateLimit-Limit')).toBe('10')
    // default max is 10; the single request consumes 1 -> remaining should be 9
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('9')
    expect(res.headers.get('X-RateLimit-Reset')).toBeTruthy()
  })

  it('removes expired keys from rateMap to prevent memory bloat', () => {
    // Set a very short window for testing
    process.env.RATE_LIMIT_WINDOW = '2'
    process.env.RATE_LIMIT_MAX = '5'

    const testKey = 'test:key:cleanup'
    let currentTime = Math.floor(Date.now() / 1000)

    // Mock nowSeconds to return controlled time
    const nowSecondsSpy = vi.spyOn(middlewareModule, 'nowSeconds')
    nowSecondsSpy.mockReturnValue(currentTime)

    // Make a request to add entry to rateMap
    const result1 = middlewareModule.checkAndUpdateRate(testKey)
    expect(result1.success).toBe(true)
    expect(__getRateLimiterSize()).toBe(1)

    // Advance time by 3 seconds (past the 2-second window)
    currentTime += 3
    nowSecondsSpy.mockReturnValue(currentTime)

    // Make another request - the old timestamp should be filtered out
    // and since filtered array is empty, the key should be deleted before adding new entry
    const result2 = middlewareModule.checkAndUpdateRate(testKey)
    expect(result2.success).toBe(true)

    // After cleanup and adding new entry, we should have 1 entry in the map
    expect(__getRateLimiterSize()).toBe(1)

    // Advance time again by 3 seconds
    currentTime += 3
    nowSecondsSpy.mockReturnValue(currentTime)

    // Make a request to a different key
    const result3 = middlewareModule.checkAndUpdateRate('test:key:different')
    expect(result3.success).toBe(true)
    expect(__getRateLimiterSize()).toBe(2)

    // Advance time by 3 more seconds
    currentTime += 3
    nowSecondsSpy.mockReturnValue(currentTime)

    // Access the first key again - it should be cleaned up and recreated
    const result4 = middlewareModule.checkAndUpdateRate(testKey)
    expect(result4.success).toBe(true)
    expect(__getRateLimiterSize()).toBe(2)

    // Restore the spy
    nowSecondsSpy.mockRestore()
  })
})
