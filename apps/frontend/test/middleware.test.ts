import { getToken } from 'next-auth/jwt'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { __resetRateLimiter, middleware } from '@/middleware.js'

import { createMockToken } from './helpers/index.js'

// Mock next-auth/jwt
vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn(),
}))

describe('Middleware', () => {
  const baseUrl = 'http://localhost:3000'
  const mockEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...mockEnv, NEXTAUTH_SECRET: 'test-secret' }
  })

  afterEach(() => {
    process.env = mockEnv
  })

  /**
   * Helper to create a mock Request object
   */
  const createRequest = (pathname: string): Request => {
    return new Request(`${baseUrl}${pathname}`)
  }

  describe('Protected Routes - Unauthenticated', () => {
    beforeEach(() => {
      vi.mocked(getToken).mockResolvedValue(null)
    })

    it('should redirect unauthenticated user from /admin to /signin with callbackUrl', async () => {
      const request = createRequest('/admin')
      const response = await middleware(request)

      expect(response.status).toBe(302)
      expect(response.headers.get('location')).toBe(`${baseUrl}/signin?callbackUrl=%2Fadmin`)
    })

    it('should redirect unauthenticated user from /admin/users to /signin with callbackUrl', async () => {
      const request = createRequest('/admin/users')
      const response = await middleware(request)

      expect(response.status).toBe(302)
      expect(response.headers.get('location')).toBe(
        `${baseUrl}/signin?callbackUrl=%2Fadmin%2Fusers`
      )
    })

    it('should redirect unauthenticated user from /dashboard to /signin with callbackUrl', async () => {
      const request = createRequest('/dashboard')
      const response = await middleware(request)

      expect(response.status).toBe(302)
      expect(response.headers.get('location')).toBe(`${baseUrl}/signin?callbackUrl=%2Fdashboard`)
    })

    it('should redirect unauthenticated user from /dashboard/settings to /signin with callbackUrl', async () => {
      const request = createRequest('/dashboard/settings')
      const response = await middleware(request)

      expect(response.status).toBe(302)
      expect(response.headers.get('location')).toBe(
        `${baseUrl}/signin?callbackUrl=%2Fdashboard%2Fsettings`
      )
    })

    it('should redirect unauthenticated user from /profile to /signin with callbackUrl', async () => {
      const request = createRequest('/profile')
      const response = await middleware(request)

      expect(response.status).toBe(302)
      expect(response.headers.get('location')).toBe(`${baseUrl}/signin?callbackUrl=%2Fprofile`)
    })

    it('should redirect unauthenticated user from /profile/edit to /signin with callbackUrl', async () => {
      const request = createRequest('/profile/edit')
      const response = await middleware(request)

      expect(response.status).toBe(302)
      expect(response.headers.get('location')).toBe(
        `${baseUrl}/signin?callbackUrl=%2Fprofile%2Fedit`
      )
    })

    it('should preserve complex paths with query params in callbackUrl', async () => {
      const request = createRequest('/admin/users?page=2&sort=name')
      const response = await middleware(request)

      expect(response.status).toBe(302)
      expect(response.headers.get('location')).toContain('callbackUrl=%2Fadmin%2Fusers')
    })
  })

  describe('Protected Routes - Authenticated', () => {
    beforeEach(() => {
      vi.mocked(getToken).mockResolvedValue(createMockToken())
    })

    it('should allow authenticated user to access /admin', async () => {
      const request = createRequest('/admin')
      const response = await middleware(request)

      expect(response.status).toBe(200)
    })

    it('should allow authenticated user to access /admin/users', async () => {
      const request = createRequest('/admin/users')
      const response = await middleware(request)

      expect(response.status).toBe(200)
    })

    it('should allow authenticated user to access /dashboard', async () => {
      const request = createRequest('/dashboard')
      const response = await middleware(request)

      expect(response.status).toBe(200)
    })

    it('should allow authenticated user to access /dashboard/settings', async () => {
      const request = createRequest('/dashboard/settings')
      const response = await middleware(request)

      expect(response.status).toBe(200)
    })

    it('should allow authenticated user to access /profile', async () => {
      const request = createRequest('/profile')
      const response = await middleware(request)

      expect(response.status).toBe(200)
    })

    it('should allow authenticated user to access /profile/edit', async () => {
      const request = createRequest('/profile/edit')
      const response = await middleware(request)

      expect(response.status).toBe(200)
    })
  })

  describe('Auth Routes - Unauthenticated', () => {
    beforeEach(() => {
      vi.mocked(getToken).mockResolvedValue(null)
    })

    it('should allow unauthenticated user to access /signin', async () => {
      const request = createRequest('/signin')
      const response = await middleware(request)

      expect(response.status).toBe(200)
    })

    it('should allow unauthenticated user to access /register', async () => {
      const request = createRequest('/register')
      const response = await middleware(request)

      expect(response.status).toBe(200)
    })
  })

  describe('Auth Routes - Authenticated', () => {
    beforeEach(() => {
      vi.mocked(getToken).mockResolvedValue(createMockToken())
    })

    it('should redirect authenticated user from /signin to /dashboard', async () => {
      const request = createRequest('/signin')
      const response = await middleware(request)

      expect(response.status).toBe(302)
      expect(response.headers.get('location')).toBe(`${baseUrl}/dashboard`)
    })

    it('should redirect authenticated user from /register to /dashboard', async () => {
      const request = createRequest('/register')
      const response = await middleware(request)

      expect(response.status).toBe(302)
      expect(response.headers.get('location')).toBe(`${baseUrl}/dashboard`)
    })

    it('should ignore query parameters when redirecting from /signin', async () => {
      const request = createRequest('/signin?callbackUrl=%2Fadmin')
      const response = await middleware(request)

      expect(response.status).toBe(302)
      expect(response.headers.get('location')).toBe(`${baseUrl}/dashboard`)
    })
  })

  describe('Public Routes', () => {
    it('should allow unauthenticated user to access /', async () => {
      vi.mocked(getToken).mockResolvedValue(null)
      const request = createRequest('/')
      const response = await middleware(request)

      expect(response.status).toBe(200)
    })

    it('should allow authenticated user to access /', async () => {
      vi.mocked(getToken).mockResolvedValue(createMockToken())
      const request = createRequest('/')
      const response = await middleware(request)

      expect(response.status).toBe(200)
    })

    it('should allow unauthenticated user to access /about', async () => {
      vi.mocked(getToken).mockResolvedValue(null)
      const request = createRequest('/about')
      const response = await middleware(request)

      expect(response.status).toBe(200)
    })

    it('should allow authenticated user to access /about', async () => {
      vi.mocked(getToken).mockResolvedValue(createMockToken())
      const request = createRequest('/about')
      const response = await middleware(request)

      expect(response.status).toBe(200)
    })

    it('should allow unauthenticated user to access /contact', async () => {
      vi.mocked(getToken).mockResolvedValue(null)
      const request = createRequest('/contact')
      const response = await middleware(request)

      expect(response.status).toBe(200)
    })
  })

  describe('getToken Integration', () => {
    it('should call getToken with correct parameters', async () => {
      vi.mocked(getToken).mockResolvedValue(null)
      const request = createRequest('/admin')

      await middleware(request)

      expect(getToken).toHaveBeenCalledWith({
        req: request,
        secret: 'test-secret',
      })
    })

    it('should handle getToken returning a valid token', async () => {
      const mockToken = createMockToken()
      vi.mocked(getToken).mockResolvedValue(mockToken)
      const request = createRequest('/admin')

      const response = await middleware(request)

      expect(response.status).toBe(200)
    })

    it('should handle getToken returning null', async () => {
      vi.mocked(getToken).mockResolvedValue(null)
      const request = createRequest('/admin')

      const response = await middleware(request)

      expect(response.status).toBe(302)
    })

    it('should handle getToken returning undefined', async () => {
      vi.mocked(getToken).mockResolvedValue(undefined as unknown as null)
      const request = createRequest('/admin')

      const response = await middleware(request)

      expect(response.status).toBe(302)
    })
  })

  describe('Edge Cases', () => {
    it('should handle paths with trailing slashes', async () => {
      vi.mocked(getToken).mockResolvedValue(null)
      const request = createRequest('/admin/')

      const response = await middleware(request)

      expect(response.status).toBe(302)
      expect(response.headers.get('location')).toBe(`${baseUrl}/signin?callbackUrl=%2Fadmin%2F`)
    })

    it('should handle case-sensitive paths correctly', async () => {
      vi.mocked(getToken).mockResolvedValue(null)
      const request = createRequest('/Admin')

      // /Admin should be treated as public (case-sensitive)
      const response = await middleware(request)

      expect(response.status).toBe(200)
    })

    it('should handle deeply nested protected paths', async () => {
      vi.mocked(getToken).mockResolvedValue(null)
      const request = createRequest('/admin/users/123/edit')

      const response = await middleware(request)

      expect(response.status).toBe(302)
      expect(response.headers.get('location')).toContain(
        'callbackUrl=%2Fadmin%2Fusers%2F123%2Fedit'
      )
    })

    it('should handle paths that start with protected route name but are different', async () => {
      vi.mocked(getToken).mockResolvedValue(null)
      const request = createRequest('/administrators')

      // /administrators should NOT be treated as /admin (no trailing slash),
      // so it remains public and should be allowed through.
      const response = await middleware(request)

      expect(response.status).toBe(200)
    })

    it('should handle empty token object', async () => {
      vi.mocked(getToken).mockResolvedValue({} as never)
      const request = createRequest('/admin')

      const response = await middleware(request)

      // Empty token object is truthy, so user is considered authenticated
      expect(response.status).toBe(200)
    })

    it('should handle paths with special characters', async () => {
      vi.mocked(getToken).mockResolvedValue(null)
      const request = createRequest('/admin/users?name=John%20Doe&age=30')

      const response = await middleware(request)

      expect(response.status).toBe(302)
      expect(response.headers.get('location')).toContain('signin')
      expect(response.headers.get('location')).toContain('callbackUrl')
    })

    it('should handle different base URLs correctly', async () => {
      vi.mocked(getToken).mockResolvedValue(null)
      const customBaseUrl = 'https://example.com'
      const request = new Request(`${customBaseUrl}/admin`)

      const response = await middleware(request)

      expect(response.status).toBe(302)
      expect(response.headers.get('location')).toBe(`${customBaseUrl}/signin?callbackUrl=%2Fadmin`)
    })
  })

  describe('Error Handling', () => {
    it('should handle getToken throwing an error', async () => {
      vi.mocked(getToken).mockRejectedValue(new Error('Token validation failed'))
      const request = createRequest('/admin')

      await expect(middleware(request)).rejects.toThrow('Token validation failed')
    })

    it('should handle invalid NEXTAUTH_SECRET', async () => {
      process.env.NEXTAUTH_SECRET = undefined
      vi.mocked(getToken).mockResolvedValue(null)
      const request = createRequest('/admin')

      const response = await middleware(request)

      expect(getToken).toHaveBeenCalledWith({
        req: request,
        secret: undefined,
      })
      // Middleware should still work (getToken handles validation)
      expect(response.status).toBe(302)
    })
  })

  describe('Response Headers', () => {
    it('should return proper redirect response with location header for protected route', async () => {
      vi.mocked(getToken).mockResolvedValue(null)
      const request = createRequest('/admin')

      const response = await middleware(request)

      expect(response).toBeInstanceOf(Response)
      expect(response.status).toBe(302)
      expect(response.headers.has('location')).toBe(true)
    })

    it('should return proper redirect response for authenticated user on auth route', async () => {
      vi.mocked(getToken).mockResolvedValue(createMockToken())
      const request = createRequest('/signin')

      const response = await middleware(request)

      expect(response).toBeInstanceOf(Response)
      expect(response.status).toBe(302)
      expect(response.headers.has('location')).toBe(true)
    })

    it('should return proper response with 200 status for allowed routes', async () => {
      vi.mocked(getToken).mockResolvedValue(null)
      const request = createRequest('/')

      const response = await middleware(request)

      expect(response).toBeInstanceOf(Response)
      expect(response.status).toBe(200)
    })
  })

  describe('Rate Limiting - Authenticated', () => {
    it.skip('should apply rate limiting to authenticated users using user-scoped keys', async () => {
      // Arrange: authenticated token and fresh rate limiter
      vi.mocked(getToken).mockResolvedValue(createMockToken())
      __resetRateLimiter()

      // Make 10 allowed API requests as the authenticated user
      for (let i = 0; i < 10; i++) {
        const req = new Request(`${baseUrl}/api/test`, { method: 'GET' })
        const res = await middleware(req)
        expect(res.status).toBe(200)
        // headers should include rate-limit info
        expect(res.headers.get('X-RateLimit-Limit')).toBe('10')
      }

      // The 11th request should be rejected with 429 and proper headers
      const blockedReq = new Request(`${baseUrl}/api/test`, { method: 'GET' })
      const blockedRes = await middleware(blockedReq)
      expect(blockedRes.status).toBe(429)
      expect(blockedRes.headers.get('X-RateLimit-Limit')).toBe('10')
      expect(blockedRes.headers.get('X-RateLimit-Remaining')).toBe('0')
      expect(blockedRes.headers.has('X-RateLimit-Reset')).toBe(true)
    })
  })

  describe('Route Pattern Matching', () => {
    it('should correctly identify /admin as protected route', async () => {
      vi.mocked(getToken).mockResolvedValue(null)
      const request = createRequest('/admin')

      const response = await middleware(request)

      expect(response.status).toBe(302) // Redirected because not authenticated
    })

    it('should correctly identify /dashboard as protected route', async () => {
      vi.mocked(getToken).mockResolvedValue(null)
      const request = createRequest('/dashboard')

      const response = await middleware(request)

      expect(response.status).toBe(302) // Redirected because not authenticated
    })

    it('should correctly identify /profile as protected route', async () => {
      vi.mocked(getToken).mockResolvedValue(null)
      const request = createRequest('/profile')

      const response = await middleware(request)

      expect(response.status).toBe(302) // Redirected because not authenticated
    })

    it('should correctly identify /signin as auth route', async () => {
      vi.mocked(getToken).mockResolvedValue(createMockToken())
      const request = createRequest('/signin')

      const response = await middleware(request)

      expect(response.status).toBe(302) // Redirected because authenticated
    })

    it('should correctly identify /register as auth route', async () => {
      vi.mocked(getToken).mockResolvedValue(createMockToken())
      const request = createRequest('/register')

      const response = await middleware(request)

      expect(response.status).toBe(302) // Redirected because authenticated
    })

    it('should treat unknown routes as public', async () => {
      vi.mocked(getToken).mockResolvedValue(null)
      const request = createRequest('/unknown-route')

      const response = await middleware(request)

      expect(response.status).toBe(200) // Allowed as public route
    })
  })
})
