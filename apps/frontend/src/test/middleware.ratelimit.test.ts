// Mock next-auth/jwt as in existing tests
import { getToken } from 'next-auth/jwt'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { middleware } from '../middleware.js'

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
      UPSTASH_REDIS_REST_URL: 'url',
      UPSTASH_REDIS_REST_TOKEN: 'token',
    }
  })

  afterEach(() => {
    process.env = origEnv
  })

  const createRequest = (pathname: string, method = 'GET') =>
    new Request(`${baseUrl}${pathname}`, { method })

  it('allows requests under the rate limit and sets rate-limit headers', async () => {
    // limiter returns success
    limitMock.mockResolvedValue({ success: true, limit: 10, remaining: 9, resetAfter: 10 })
    vi.mocked(getToken).mockResolvedValue(null)

    const req = createRequest('/api/test')
    const res = await middleware(req)

    expect(res.status).toBe(200)
    expect(res.headers.get('X-RateLimit-Limit')).toBe('10')
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('9')
    expect(res.headers.get('X-RateLimit-Reset')).toBeTruthy()
  })

  it('blocks requests when over the limit with 429 and headers', async () => {
    limitMock.mockResolvedValue({ success: false, limit: 10, remaining: 0, resetAfter: 5 })
    vi.mocked(getToken).mockResolvedValue(null)

    const req = createRequest('/api/test')
    const res = await middleware(req)

    expect(res.status).toBe(429)
    expect(res.headers.get('X-RateLimit-Limit')).toBe('10')
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('0')
    expect(res.headers.get('X-RateLimit-Reset')).toBeTruthy()
  })

  it('attaches rate-limit headers to redirect responses', async () => {
    limitMock.mockResolvedValue({ success: true, limit: 10, remaining: 8, resetAfter: 12 })
    // unauthenticated -> protected route triggers redirect
    vi.mocked(getToken).mockResolvedValue(null)

    const req = createRequest('/admin', 'POST')
    const res = await middleware(req)

    expect(res.status).toBe(302)
    expect(res.headers.get('X-RateLimit-Limit')).toBe('10')
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('8')
    expect(res.headers.get('X-RateLimit-Reset')).toBeTruthy()
  })
})
