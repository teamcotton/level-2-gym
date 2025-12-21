import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  __resetRateLimiter,
  checkAndUpdateRate,
  extractClientIp,
  nowSeconds,
} from '../middleware.js'

describe('nowSeconds', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns floor of Date.now() / 1000', () => {
    const ms = 1670000000123
    vi.setSystemTime(ms)
    expect(nowSeconds()).toBe(Math.floor(ms / 1000))
  })
})

describe('extractClientIp', () => {
  it('returns the rightmost non-trusted IP from X-Forwarded-For', () => {
    const request = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '203.0.113.1, 198.51.100.1, 127.0.0.1' },
    })
    // Should return 198.51.100.1 (rightmost non-trusted IP)
    expect(extractClientIp(request)).toBe('198.51.100.1')
  })

  it('returns the client IP when only one IP in X-Forwarded-For', () => {
    const request = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '203.0.113.1' },
    })
    expect(extractClientIp(request)).toBe('203.0.113.1')
  })

  it('falls back to X-Real-IP when X-Forwarded-For contains only trusted proxies', () => {
    const request = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '127.0.0.1', 'x-real-ip': '203.0.113.1' },
    })
    expect(extractClientIp(request)).toBe('203.0.113.1')
  })

  it('falls back to X-Real-IP when X-Forwarded-For is empty', () => {
    const request = new Request('http://localhost', {
      headers: { 'x-real-ip': '203.0.113.1' },
    })
    expect(extractClientIp(request)).toBe('203.0.113.1')
  })

  it('returns "unknown" when no IP headers are present', () => {
    const request = new Request('http://localhost', {})
    expect(extractClientIp(request)).toBe('unknown')
  })

  it('handles X-Forwarded-For with spaces correctly', () => {
    const request = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '203.0.113.1 ,  198.51.100.1  , 127.0.0.1' },
    })
    expect(extractClientIp(request)).toBe('198.51.100.1')
  })

  it('handles IPv6 addresses in X-Forwarded-For', () => {
    const request = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '2001:db8::1, ::1' },
    })
    expect(extractClientIp(request)).toBe('2001:db8::1')
  })

  it('returns "unknown" when X-Forwarded-For is empty string', () => {
    const request = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '' },
    })
    expect(extractClientIp(request)).toBe('unknown')
  })
})

describe('checkAndUpdateRate (in-memory sliding window)', () => {
  const key = 'test:key'
  const initialMs = 1670000000000

  beforeEach(() => {
    __resetRateLimiter()
    vi.useFakeTimers()
    vi.setSystemTime(initialMs)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('allows up to RATE_LIMIT_MAX requests and then blocks the next one', () => {
    // consume exactly the allowed number of requests
    for (let i = 0; i < 10; i++) {
      const r = checkAndUpdateRate(key)
      expect(r.success).toBe(true)
      expect(r.limit).toBe(10)
      // remaining should decrease as we consume
      expect(r.remaining).toBe(Math.max(0, 10 - (i + 1)))
    }

    // the 11th request should be blocked
    const blocked = checkAndUpdateRate(key)
    expect(blocked.success).toBe(false)
    expect(blocked.limit).toBe(10)
    expect(blocked.remaining).toBe(0)
    expect(blocked.resetAfter).toBeGreaterThanOrEqual(0)
  })

  it('allows requests again after the window has passed', () => {
    // hit the limit
    for (let i = 0; i < 10; i++) checkAndUpdateRate(key)
    const blocked = checkAndUpdateRate(key)
    expect(blocked.success).toBe(false)

    // advance time beyond the rate window (RATE_LIMIT_WINDOW is 10s)
    vi.setSystemTime(initialMs + (10 + 1) * 1000)

    const afterWindow = checkAndUpdateRate(key)
    expect(afterWindow.success).toBe(true)
    expect(afterWindow.limit).toBe(10)
    // after window resets, remaining should be 9 (one consumed)
    expect(afterWindow.remaining).toBe(9)
  })
})
