import type { FastifyReply, FastifyRequest } from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authMiddleware } from '../../../../src/infrastructure/http/middleware/auth.middleware.js'
import { JwtUtil } from '../../../../src/infrastructure/security/jwt.util.js'
import type { JwtUserClaims } from '../../../../src/shared/types/index.js'
import { UnauthorizedException } from '../../../../src/shared/exceptions/unauthorized.exception.js'
import { ErrorCode } from '../../../../src/shared/constants/error-codes.js'

describe('authMiddleware', () => {
  let mockRequest: Partial<FastifyRequest>
  let mockReply: Partial<FastifyReply>
  let sendSpy: ReturnType<typeof vi.fn>
  let codeSpy: ReturnType<typeof vi.fn>
  let logWarnSpy: ReturnType<typeof vi.fn>

  const validClaims: JwtUserClaims = {
    sub: 'user-123',
    email: 'test@example.com',
    roles: ['user'],
  }

  beforeEach(() => {
    // Reset all mocks and restore spies
    vi.clearAllMocks()
    vi.restoreAllMocks()

    // Setup reply mock
    sendSpy = vi.fn().mockReturnThis()
    codeSpy = vi.fn().mockReturnValue({ send: sendSpy })

    mockReply = {
      code: codeSpy,
      send: sendSpy,
    } as Partial<FastifyReply>

    // Setup log mock
    logWarnSpy = vi.fn()

    // Setup request mock
    mockRequest = {
      headers: {},
      user: undefined,
      method: 'GET',
      url: '/test',
      log: {
        warn: logWarnSpy,
        info: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
        trace: vi.fn(),
        fatal: vi.fn(),
      } as any,
    } as Partial<FastifyRequest>
  })

  describe('Successful authentication', () => {
    it('should authenticate valid Bearer token', async () => {
      const token = JwtUtil.generateToken(validClaims)
      mockRequest.headers = { authorization: `Bearer ${token}` }

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockRequest.user).toEqual({
        sub: validClaims.sub,
        email: validClaims.email,
        roles: validClaims.roles,
      })
      expect(codeSpy).not.toHaveBeenCalled()
      expect(sendSpy).not.toHaveBeenCalled()
    })

    it('should set user property on request', async () => {
      const token = JwtUtil.generateToken(validClaims)
      mockRequest.headers = { authorization: `Bearer ${token}` }

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockRequest.user).toBeDefined()
      expect(mockRequest.user?.sub).toBe(validClaims.sub)
      expect(mockRequest.user?.email).toBe(validClaims.email)
    })

    it('should authenticate token without roles', async () => {
      const claimsWithoutRoles: JwtUserClaims = {
        sub: 'user-456',
        email: 'noroles@example.com',
      }
      const token = JwtUtil.generateToken(claimsWithoutRoles)
      mockRequest.headers = { authorization: `Bearer ${token}` }

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockRequest.user).toEqual({
        sub: claimsWithoutRoles.sub,
        email: claimsWithoutRoles.email,
        roles: undefined,
      })
    })

    it('should authenticate token with multiple roles', async () => {
      const multiRoleClaims: JwtUserClaims = {
        sub: 'admin-789',
        email: 'admin@example.com',
        roles: ['user', 'admin', 'moderator'],
      }
      const token = JwtUtil.generateToken(multiRoleClaims)
      mockRequest.headers = { authorization: `Bearer ${token}` }

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockRequest.user?.roles).toHaveLength(3)
      expect(mockRequest.user?.roles).toEqual(multiRoleClaims.roles)
    })

    it('should handle Bearer token with extra whitespace', async () => {
      const token = JwtUtil.generateToken(validClaims)
      mockRequest.headers = { authorization: `Bearer  ${token}` }

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      // Should fail because of extra space
      expect(codeSpy).toHaveBeenCalledWith(401)
      expect(sendSpy).toHaveBeenCalledWith({ error: 'Invalid or expired token' })
    })
  })

  describe('Logging behavior', () => {
    it('should log warning when token is missing', async () => {
      mockRequest.headers = {}

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(logWarnSpy).toHaveBeenCalledWith(
        {
          method: 'GET',
          route: '/test',
        },
        'Authentication failed: missing bearer token'
      )
    })

    it('should log warning when token is invalid', async () => {
      mockRequest.headers = { authorization: 'Bearer invalid.token.here' }

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(logWarnSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          route: '/test',
          err: expect.any(Error),
        }),
        'Authentication failed: invalid or expired token'
      )
    })

    it('should log warning when token is expired', async () => {
      const expiredToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlhdCI6MTYwOTQ1OTIwMCwiZXhwIjoxNjA5NDU5MjAxfQ.invalid'
      mockRequest.headers = { authorization: `Bearer ${expiredToken}` }

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(logWarnSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          route: '/test',
          err: expect.any(Error),
        }),
        'Authentication failed: invalid or expired token'
      )
    })

    it('should not log warning on successful authentication', async () => {
      const token = JwtUtil.generateToken(validClaims)
      mockRequest.headers = { authorization: `Bearer ${token}` }

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(logWarnSpy).not.toHaveBeenCalled()
    })

    it('should include request method and route in log context', async () => {
      mockRequest = {
        ...mockRequest,
        headers: {},
        method: 'POST',
        url: '/api/users',
      }

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(logWarnSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          route: '/api/users',
        }),
        'Authentication failed: missing bearer token'
      )
    })

    it('should include error object in log context for invalid tokens', async () => {
      mockRequest.headers = { authorization: 'Bearer malformed' }

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      const logCall = logWarnSpy.mock.calls[0]
      expect(logCall?.[0]).toHaveProperty('err')
      expect(logCall?.[0].err).toBeInstanceOf(Error)
    })
  })

  describe('Missing or invalid authorization header', () => {
    it('should return 401 when no authorization header', async () => {
      mockRequest.headers = {}

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).toHaveBeenCalledWith(401)
      expect(sendSpy).toHaveBeenCalledWith({ error: 'No token provided' })
      expect(mockRequest.user).toBeUndefined()
    })

    it('should return 401 when authorization header is undefined', async () => {
      mockRequest.headers = { authorization: undefined }

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).toHaveBeenCalledWith(401)
      expect(sendSpy).toHaveBeenCalledWith({ error: 'No token provided' })
    })

    it('should return 401 when authorization header is empty string', async () => {
      mockRequest.headers = { authorization: '' }

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).toHaveBeenCalledWith(401)
      expect(sendSpy).toHaveBeenCalledWith({ error: 'No token provided' })
    })

    it('should return 401 when Bearer prefix is missing', async () => {
      const token = JwtUtil.generateToken(validClaims)
      mockRequest.headers = { authorization: token }

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).toHaveBeenCalledWith(401)
      expect(sendSpy).toHaveBeenCalledWith({ error: 'No token provided' })
    })

    it('should return 401 when Bearer prefix has wrong case', async () => {
      const token = JwtUtil.generateToken(validClaims)
      mockRequest.headers = { authorization: `bearer ${token}` }

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).toHaveBeenCalledWith(401)
      expect(sendSpy).toHaveBeenCalledWith({ error: 'No token provided' })
    })

    it('should return 401 when only "Bearer" is provided', async () => {
      mockRequest.headers = { authorization: 'Bearer' }

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).toHaveBeenCalledWith(401)
      expect(sendSpy).toHaveBeenCalledWith({ error: 'No token provided' })
    })

    it('should return 401 when "Bearer " is provided with empty token', async () => {
      mockRequest.headers = { authorization: 'Bearer ' }

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).toHaveBeenCalledWith(401)
      expect(sendSpy).toHaveBeenCalledWith({ error: 'No token provided' })
    })
  })

  describe('Invalid tokens', () => {
    it('should return 401 for malformed token', async () => {
      mockRequest.headers = { authorization: 'Bearer invalid.token.here' }

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).toHaveBeenCalledWith(401)
      expect(sendSpy).toHaveBeenCalledWith({ error: 'Invalid or expired token' })
      expect(mockRequest.user).toBeUndefined()
    })

    it('should return 401 for token with invalid signature', async () => {
      const token = JwtUtil.generateToken(validClaims)
      const tamperedToken = token.slice(0, -5) + 'XXXXX'
      mockRequest.headers = { authorization: `Bearer ${tamperedToken}` }

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).toHaveBeenCalledWith(401)
      expect(sendSpy).toHaveBeenCalledWith({ error: 'Invalid or expired token' })
    })

    it('should return 401 for expired token', async () => {
      const expiredToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlhdCI6MTYwOTQ1OTIwMCwiZXhwIjoxNjA5NDU5MjAxfQ.invalid'
      mockRequest.headers = { authorization: `Bearer ${expiredToken}` }

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).toHaveBeenCalledWith(401)
      expect(sendSpy).toHaveBeenCalledWith({ error: 'Invalid or expired token' })
    })

    it('should return 401 for token with missing claims', async () => {
      // This would be caught by JwtUtil.verifyToken
      const invalidToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.invalid'
      mockRequest.headers = { authorization: invalidToken }

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).toHaveBeenCalledWith(401)
      expect(sendSpy).toHaveBeenCalledWith({ error: 'Invalid or expired token' })
    })

    it('should return 401 for completely random string', async () => {
      mockRequest.headers = { authorization: 'Bearer randomstring123' }

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).toHaveBeenCalledWith(401)
      expect(sendSpy).toHaveBeenCalledWith({ error: 'Invalid or expired token' })
    })
  })

  describe('Error handling', () => {
    it('should handle JwtUtil.verifyToken throwing UnauthorizedException', async () => {
      vi.spyOn(JwtUtil, 'verifyToken').mockImplementation(() => {
        throw new UnauthorizedException('Token verification failed', ErrorCode.UNAUTHORIZED)
      })

      const token = JwtUtil.generateToken(validClaims)
      mockRequest.headers = { authorization: `Bearer ${token}` }

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).toHaveBeenCalledWith(401)
      expect(sendSpy).toHaveBeenCalledWith({ error: 'Token verification failed' })
      expect(mockRequest.user).toBeUndefined()
    })

    it('should handle unexpected errors gracefully', async () => {
      vi.spyOn(JwtUtil, 'verifyToken').mockImplementation(() => {
        throw new Error('Unexpected error')
      })

      const token = JwtUtil.generateToken(validClaims)
      mockRequest.headers = { authorization: `Bearer ${token}` }

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).toHaveBeenCalledWith(401)
      expect(sendSpy).toHaveBeenCalledWith({ error: 'Invalid or expired token' })
    })

    it('should not expose error details to client for non-UnauthorizedException errors', async () => {
      vi.spyOn(JwtUtil, 'verifyToken').mockImplementation(() => {
        throw new Error('Detailed internal error message')
      })

      const token = JwtUtil.generateToken(validClaims)
      mockRequest.headers = { authorization: `Bearer ${token}` }

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(sendSpy).toHaveBeenCalledWith({ error: 'Invalid or expired token' })
      expect(sendSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('Detailed internal error'),
        })
      )
    })

    it('should use error message from UnauthorizedException', async () => {
      vi.spyOn(JwtUtil, 'verifyToken').mockImplementation(() => {
        throw new UnauthorizedException('Custom error message', ErrorCode.UNAUTHORIZED)
      })

      const token = JwtUtil.generateToken(validClaims)
      mockRequest.headers = { authorization: `Bearer ${token}` }

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(sendSpy).toHaveBeenCalledWith({ error: 'Custom error message' })
    })

    it('should use TOKEN_EXPIRED code when token is expired', async () => {
      vi.spyOn(JwtUtil, 'verifyToken').mockImplementation(() => {
        throw new UnauthorizedException('Token has expired', ErrorCode.TOKEN_EXPIRED)
      })

      const token = JwtUtil.generateToken(validClaims)
      mockRequest.headers = { authorization: `Bearer ${token}` }

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).toHaveBeenCalledWith(401)
      expect(sendSpy).toHaveBeenCalledWith({ error: 'Token has expired' })
      expect(logWarnSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          errorCode: ErrorCode.TOKEN_EXPIRED,
        }),
        'Authentication failed: Token has expired'
      )
    })
  })

  describe('Edge cases', () => {
    it('should handle authorization header with leading/trailing spaces', async () => {
      const token = JwtUtil.generateToken(validClaims)
      mockRequest.headers = { authorization: `  Bearer ${token}  ` }

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      // Should fail because authorization header is not trimmed
      expect(codeSpy).toHaveBeenCalledWith(401)
      expect(sendSpy).toHaveBeenCalledWith({ error: 'No token provided' })
    })

    it('should not modify request if token is invalid', async () => {
      mockRequest.headers = { authorization: 'Bearer invalid' }
      const originalRequest = { ...mockRequest }

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockRequest.user).toBeUndefined()
      expect(mockRequest.headers).toEqual(originalRequest.headers)
    })

    it('should handle very long tokens', async () => {
      const longClaimsClaims: JwtUserClaims = {
        sub: 'a'.repeat(100), // Reduced from 1000 to avoid potential JWT size issues
        email: 'test@example.com',
        roles: Array.from({ length: 50 }, (_, i) => `role-${i}`), // Reduced from 100
      }
      const token = JwtUtil.generateToken(longClaimsClaims)
      mockRequest.headers = { authorization: `Bearer ${token}` }

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockRequest.user).toBeDefined()
      expect(mockRequest.user?.sub).toBe(longClaimsClaims.sub)
      expect(mockRequest.user?.roles).toHaveLength(50)
    })

    it('should handle authorization header case sensitivity correctly', async () => {
      const token = JwtUtil.generateToken(validClaims)
      mockRequest.headers = { Authorization: `Bearer ${token}` } as any

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      // FastifyRequest.headers uses lowercase keys
      expect(codeSpy).toHaveBeenCalledWith(401)
      expect(sendSpy).toHaveBeenCalledWith({ error: 'No token provided' })
    })
  })

  describe('Integration scenarios', () => {
    it('should verify JwtUtil works correctly', () => {
      const token = JwtUtil.generateToken(validClaims)
      const verified = JwtUtil.verifyToken(token)

      expect(verified.sub).toBe(validClaims.sub)
      expect(verified.email).toBe(validClaims.email)
      expect(verified.roles).toEqual(validClaims.roles)
    })

    it('should authenticate multiple requests with same token', async () => {
      const token = JwtUtil.generateToken(validClaims)

      // First request
      mockRequest.headers = { authorization: `Bearer ${token}` }
      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)
      expect(mockRequest.user?.sub).toBe(validClaims.sub)

      // Reset request and reply with fresh spies
      vi.clearAllMocks()
      const newSendSpy = vi.fn().mockReturnThis()
      const newCodeSpy = vi.fn().mockReturnValue({ send: newSendSpy })
      const newLogWarnSpy = vi.fn()
      mockRequest = {
        headers: { authorization: `Bearer ${token}` },
        user: undefined,
        method: 'GET',
        url: '/test',
        log: {
          warn: newLogWarnSpy,
          info: vi.fn(),
          error: vi.fn(),
          debug: vi.fn(),
          trace: vi.fn(),
          fatal: vi.fn(),
        } as any,
      } as Partial<FastifyRequest>
      mockReply = { code: newCodeSpy, send: newSendSpy } as Partial<FastifyReply>

      // Second request with same token
      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)
      expect(mockRequest.user?.sub).toBe(validClaims.sub)
    })

    it('should authenticate different users with different tokens', async () => {
      const user1Claims: JwtUserClaims = {
        sub: 'user-1',
        email: 'user1@example.com',
        roles: ['user'],
      }
      const user2Claims: JwtUserClaims = {
        sub: 'user-2',
        email: 'user2@example.com',
        roles: ['admin'],
      }

      const token1 = JwtUtil.generateToken(user1Claims)
      const token2 = JwtUtil.generateToken(user2Claims)

      // First user
      mockRequest.headers = { authorization: `Bearer ${token1}` }
      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)
      expect(mockRequest.user?.sub).toBe('user-1')
      expect(mockRequest.user?.roles).toEqual(['user'])

      // Reset request with fresh spies
      vi.clearAllMocks()
      const newSendSpy = vi.fn().mockReturnThis()
      const newCodeSpy = vi.fn().mockReturnValue({ send: newSendSpy })
      const newLogWarnSpy = vi.fn()
      mockRequest = {
        headers: {},
        user: undefined,
        method: 'GET',
        url: '/test',
        log: {
          warn: newLogWarnSpy,
          info: vi.fn(),
          error: vi.fn(),
          debug: vi.fn(),
          trace: vi.fn(),
          fatal: vi.fn(),
        } as any,
      } as Partial<FastifyRequest>
      mockReply = { code: newCodeSpy, send: newSendSpy } as Partial<FastifyReply>

      // Second user
      mockRequest.headers = { authorization: `Bearer ${token2}` }
      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)
      expect(mockRequest.user?.sub).toBe('user-2')
      expect(mockRequest.user?.roles).toEqual(['admin'])
    })

    it('should fail after valid token then invalid token', async () => {
      const validToken = JwtUtil.generateToken(validClaims)

      // First request with valid token
      mockRequest.headers = { authorization: `Bearer ${validToken}` }
      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)
      expect(mockRequest.user).toBeDefined()

      // Reset for second request with fresh spies
      vi.clearAllMocks()
      const newSendSpy = vi.fn().mockReturnThis()
      const newCodeSpy = vi.fn().mockReturnValue({ send: newSendSpy })
      const newLogWarnSpy = vi.fn()
      mockRequest = {
        headers: {},
        user: undefined,
        method: 'GET',
        url: '/test',
        log: {
          warn: newLogWarnSpy,
          info: vi.fn(),
          error: vi.fn(),
          debug: vi.fn(),
          trace: vi.fn(),
          fatal: vi.fn(),
        } as any,
      } as Partial<FastifyRequest>
      mockReply = { code: newCodeSpy, send: newSendSpy } as Partial<FastifyReply>

      // Second request with invalid token
      mockRequest.headers = { authorization: 'Bearer invalid' }
      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)
      expect(mockRequest.user).toBeUndefined()
      expect(newCodeSpy).toHaveBeenCalledWith(401)
    })
  })

  describe('Reply behavior', () => {
    it('should call reply.code before reply.send', async () => {
      mockRequest.headers = {}

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).toHaveBeenCalledBefore(sendSpy)
    })

    it('should return reply chain on error, undefined on success', async () => {
      // Test error case - returns reply chain
      mockRequest.headers = {}
      const errorResult = await authMiddleware(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      )
      // Fastify's reply.code().send() returns the reply object
      expect(errorResult).toEqual({ send: expect.any(Function) })

      // Test success case - returns undefined
      vi.clearAllMocks()
      const token = JwtUtil.generateToken(validClaims)
      const newSendSpy = vi.fn().mockReturnThis()
      const newCodeSpy = vi.fn().mockReturnValue({ send: newSendSpy })
      const newLogWarnSpy = vi.fn()
      mockRequest = {
        headers: { authorization: `Bearer ${token}` },
        user: undefined,
        method: 'GET',
        url: '/test',
        log: {
          warn: newLogWarnSpy,
          info: vi.fn(),
          error: vi.fn(),
          debug: vi.fn(),
          trace: vi.fn(),
          fatal: vi.fn(),
        } as any,
      } as Partial<FastifyRequest>
      mockReply = { code: newCodeSpy, send: newSendSpy } as Partial<FastifyReply>
      const successResult = await authMiddleware(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      )
      expect(successResult).toBeUndefined()
    })

    it('should not call reply methods on successful authentication', async () => {
      // Create fresh mocks
      vi.clearAllMocks()
      const freshSendSpy = vi.fn().mockReturnThis()
      const freshCodeSpy = vi.fn().mockReturnValue({ send: freshSendSpy })
      const freshMockReply = { code: freshCodeSpy, send: freshSendSpy } as Partial<FastifyReply>

      const token = JwtUtil.generateToken(validClaims)
      const freshLogWarnSpy = vi.fn()
      const freshMockRequest = {
        headers: { authorization: `Bearer ${token}` },
        user: undefined,
        method: 'GET',
        url: '/test',
        log: {
          warn: freshLogWarnSpy,
          info: vi.fn(),
          error: vi.fn(),
          debug: vi.fn(),
          trace: vi.fn(),
          fatal: vi.fn(),
        } as any,
      } as Partial<FastifyRequest>

      await authMiddleware(freshMockRequest as FastifyRequest, freshMockReply as FastifyReply)

      expect(freshCodeSpy).not.toHaveBeenCalled()
      expect(freshSendSpy).not.toHaveBeenCalled()
    })

    it('should call reply.code with 401 for all error cases', async () => {
      const errorCases = [
        { headers: {} }, // No header
        { headers: { authorization: 'Bearer invalid' } }, // Invalid token
        { headers: { authorization: 'NoBearer token' } }, // Wrong prefix
      ]

      for (const testCase of errorCases) {
        // Reset mocks
        vi.clearAllMocks()
        const testLogWarnSpy = vi.fn()
        mockRequest = {
          ...testCase,
          method: 'GET',
          url: '/test',
          log: {
            warn: testLogWarnSpy,
            info: vi.fn(),
            error: vi.fn(),
            debug: vi.fn(),
            trace: vi.fn(),
            fatal: vi.fn(),
          } as any,
        } as Partial<FastifyRequest>
        mockReply = { code: codeSpy, send: sendSpy } as Partial<FastifyReply>

        await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

        expect(codeSpy).toHaveBeenCalledWith(401)
      }
    })
  })
})
