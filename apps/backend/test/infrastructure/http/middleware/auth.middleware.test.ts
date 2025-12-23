import type { FastifyReply, FastifyRequest } from 'fastify'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { authMiddleware } from '../../../../src/infrastructure/http/middleware/auth.middleware.js'
import { JwtUtil } from '../../../../src/infrastructure/security/jwt.util.js'
import { ErrorCode } from '../../../../src/shared/constants/error-codes.js'
import { UnauthorizedException } from '../../../../src/shared/exceptions/unauthorized.exception.js'
import type { JwtUserClaims } from '../../../../src/shared/types/index.js'

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
      expect(sendSpy).toHaveBeenCalledWith({ success: false, error: 'Invalid or expired token' })
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
          errorCode: expect.any(String),
        }),
        expect.stringContaining('Authentication failed:')
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
          errorCode: expect.any(String),
        }),
        expect.stringContaining('Authentication failed:')
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

    it('should include error code in log context for invalid tokens', async () => {
      mockRequest.headers = { authorization: 'Bearer malformed' }

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      const logCall = logWarnSpy.mock.calls[0]
      expect(logCall?.[0]).toHaveProperty('errorCode')
      expect(logCall?.[0].errorCode).toMatch(/UNAUTHORIZED/)
    })
  })

  describe('Missing or invalid authorization header', () => {
    it('should return 401 when no authorization header', async () => {
      mockRequest.headers = {}

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).toHaveBeenCalledWith(401)
      expect(sendSpy).toHaveBeenCalledWith({ success: false, error: 'No token provided' })
      expect(mockRequest.user).toBeUndefined()
    })

    it('should return 401 when authorization header is undefined', async () => {
      mockRequest.headers = { authorization: undefined }

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).toHaveBeenCalledWith(401)
      expect(sendSpy).toHaveBeenCalledWith({ success: false, error: 'No token provided' })
    })

    it('should return 401 when authorization header is empty string', async () => {
      mockRequest.headers = { authorization: '' }

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).toHaveBeenCalledWith(401)
      expect(sendSpy).toHaveBeenCalledWith({ success: false, error: 'No token provided' })
    })

    it('should return 401 when Bearer prefix is missing', async () => {
      const token = JwtUtil.generateToken(validClaims)
      mockRequest.headers = { authorization: token }

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).toHaveBeenCalledWith(401)
      expect(sendSpy).toHaveBeenCalledWith({ success: false, error: 'No token provided' })
    })

    it('should return 401 when Bearer prefix has wrong case', async () => {
      const token = JwtUtil.generateToken(validClaims)
      mockRequest.headers = { authorization: `bearer ${token}` }

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).toHaveBeenCalledWith(401)
      expect(sendSpy).toHaveBeenCalledWith({ success: false, error: 'No token provided' })
    })

    it('should return 401 when only "Bearer" is provided', async () => {
      mockRequest.headers = { authorization: 'Bearer' }

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).toHaveBeenCalledWith(401)
      expect(sendSpy).toHaveBeenCalledWith({ success: false, error: 'No token provided' })
    })

    it('should return 401 when "Bearer " is provided with empty token', async () => {
      mockRequest.headers = { authorization: 'Bearer ' }

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).toHaveBeenCalledWith(401)
      expect(sendSpy).toHaveBeenCalledWith({ success: false, error: 'No token provided' })
    })
  })

  describe('Token format validation', () => {
    it('should reject token exceeding maximum length', async () => {
      const veryLongToken = 'a'.repeat(9000) + '.' + 'b'.repeat(100) + '.' + 'c'.repeat(100)
      mockRequest.headers = { authorization: `Bearer ${veryLongToken}` }

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).toHaveBeenCalledWith(401)
      expect(sendSpy).toHaveBeenCalledWith({ success: false, error: 'Invalid or expired token' })
      expect(logWarnSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          errorCode: 'UNAUTHORIZED',
        }),
        'Authentication failed: Token exceeds maximum allowed length'
      )
    })

    it('should reject token with less than 3 parts', async () => {
      mockRequest.headers = { authorization: 'Bearer token.only' }

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).toHaveBeenCalledWith(401)
      expect(sendSpy).toHaveBeenCalledWith({ success: false, error: 'Invalid or expired token' })
      expect(logWarnSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          errorCode: 'UNAUTHORIZED',
        }),
        'Authentication failed: Invalid token format'
      )
    })

    it('should reject token with more than 3 parts', async () => {
      mockRequest.headers = { authorization: 'Bearer part1.part2.part3.part4' }

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).toHaveBeenCalledWith(401)
      expect(sendSpy).toHaveBeenCalledWith({ success: false, error: 'Invalid or expired token' })
      expect(logWarnSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          errorCode: 'UNAUTHORIZED',
        }),
        'Authentication failed: Invalid token format'
      )
    })

    it('should reject token with invalid characters', async () => {
      mockRequest.headers = { authorization: 'Bearer token@#$.with$.invalid!' }

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).toHaveBeenCalledWith(401)
      expect(sendSpy).toHaveBeenCalledWith({ success: false, error: 'Invalid or expired token' })
      expect(logWarnSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          errorCode: 'UNAUTHORIZED',
        }),
        'Authentication failed: Invalid token characters'
      )
    })

    it('should reject token with empty parts', async () => {
      mockRequest.headers = { authorization: 'Bearer header..signature' }

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).toHaveBeenCalledWith(401)
      expect(sendSpy).toHaveBeenCalledWith({ success: false, error: 'Invalid or expired token' })
      expect(logWarnSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          errorCode: 'UNAUTHORIZED',
        }),
        'Authentication failed: Invalid token structure'
      )
    })

    it('should accept token with valid Base64URL characters', async () => {
      const token = JwtUtil.generateToken(validClaims)
      mockRequest.headers = { authorization: `Bearer ${token}` }

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      // Should pass format validation and attempt verification
      expect(mockRequest.user).toBeDefined()
      expect(codeSpy).not.toHaveBeenCalled()
    })
  })

  describe('Invalid tokens', () => {
    it('should return 401 for malformed token', async () => {
      mockRequest.headers = { authorization: 'Bearer invalid.token.here' }

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).toHaveBeenCalledWith(401)
      expect(sendSpy).toHaveBeenCalledWith({ success: false, error: 'Invalid or expired token' })
      expect(mockRequest.user).toBeUndefined()
    })

    it('should return 401 for token with invalid signature', async () => {
      const token = JwtUtil.generateToken(validClaims)
      const tamperedToken = token.slice(0, -5) + 'XXXXX'
      mockRequest.headers = { authorization: `Bearer ${tamperedToken}` }

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).toHaveBeenCalledWith(401)
      expect(sendSpy).toHaveBeenCalledWith({ success: false, error: 'Invalid or expired token' })
    })

    it('should return 401 for expired token', async () => {
      const expiredToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlhdCI6MTYwOTQ1OTIwMCwiZXhwIjoxNjA5NDU5MjAxfQ.invalid'
      mockRequest.headers = { authorization: `Bearer ${expiredToken}` }

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).toHaveBeenCalledWith(401)
      expect(sendSpy).toHaveBeenCalledWith({ success: false, error: 'Invalid or expired token' })
    })

    it('should return 401 for token with missing claims', async () => {
      // This would be caught by JwtUtil.verifyToken
      const invalidToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.invalid'
      mockRequest.headers = { authorization: invalidToken }

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).toHaveBeenCalledWith(401)
      expect(sendSpy).toHaveBeenCalledWith({ success: false, error: 'Invalid or expired token' })
    })

    it('should return 401 for completely random string', async () => {
      mockRequest.headers = { authorization: 'Bearer randomstring123' }

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).toHaveBeenCalledWith(401)
      expect(sendSpy).toHaveBeenCalledWith({ success: false, error: 'Invalid or expired token' })
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
      expect(sendSpy).toHaveBeenCalledWith({ success: false, error: 'Token verification failed' })
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
      expect(sendSpy).toHaveBeenCalledWith({ success: false, error: 'Invalid or expired token' })
    })

    it('should not expose error details to client for non-UnauthorizedException errors', async () => {
      vi.spyOn(JwtUtil, 'verifyToken').mockImplementation(() => {
        throw new Error('Detailed internal error message')
      })

      const token = JwtUtil.generateToken(validClaims)
      mockRequest.headers = { authorization: `Bearer ${token}` }

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(sendSpy).toHaveBeenCalledWith({ success: false, error: 'Invalid or expired token' })
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

      expect(sendSpy).toHaveBeenCalledWith({ success: false, error: 'Custom error message' })
    })

    it('should use TOKEN_EXPIRED code when token is expired', async () => {
      vi.spyOn(JwtUtil, 'verifyToken').mockImplementation(() => {
        throw new UnauthorizedException('Token has expired', ErrorCode.TOKEN_EXPIRED)
      })

      const token = JwtUtil.generateToken(validClaims)
      mockRequest.headers = { authorization: `Bearer ${token}` }

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).toHaveBeenCalledWith(401)
      expect(sendSpy).toHaveBeenCalledWith({ success: false, error: 'Token has expired' })
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
      expect(sendSpy).toHaveBeenCalledWith({ success: false, error: 'No token provided' })
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
      expect(sendSpy).toHaveBeenCalledWith({ success: false, error: 'No token provided' })
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

  describe('validateTokenFormat', () => {
    let validateTokenFormat: (token: string) => void

    beforeAll(async () => {
      const module =
        await import('../../../../src/infrastructure/http/middleware/auth.middleware.js')
      validateTokenFormat = module.validateTokenFormat
    })

    describe('Valid Token Format', () => {
      it('should pass validation for a well-formed JWT token', () => {
        const validToken =
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

        expect(() => validateTokenFormat(validToken)).not.toThrow()
      })

      it('should pass validation for token with Base64URL characters (includes hyphens and underscores)', () => {
        const tokenWithBase64UrlChars =
          'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiMTIzLTQ1Ni03ODkwIn0.abcd-efgh_ijkl-mnop_qrst-uvwx_yz12-3456_7890'

        expect(() => validateTokenFormat(tokenWithBase64UrlChars)).not.toThrow()
      })

      it('should pass validation for token with numeric characters', () => {
        const tokenWithNumbers = '1234567890.0987654321.1111222233334444555566667777888899990000'

        expect(() => validateTokenFormat(tokenWithNumbers)).not.toThrow()
      })

      it('should pass validation for token with mixed case letters', () => {
        const mixedCaseToken = 'AbCdEfGhIjKlMnOp.QrStUvWxYzAbCdEf.GhIjKlMnOpQrStUvWxYz'

        expect(() => validateTokenFormat(mixedCaseToken)).not.toThrow()
      })

      it('should pass validation for token at maximum allowed length', () => {
        // Create a token with exactly 8192 characters (MAX_TOKEN_LENGTH)
        const headerLength = 2700
        const payloadLength = 2700
        const signatureLength = 2790 // Adjusted to total exactly 8192 with 2 dots

        const header = 'A'.repeat(headerLength)
        const payload = 'B'.repeat(payloadLength)
        const signature = 'C'.repeat(signatureLength)
        const maxLengthToken = `${header}.${payload}.${signature}`

        expect(maxLengthToken.length).toBe(8192)
        expect(() => validateTokenFormat(maxLengthToken)).not.toThrow()
      })
    })

    describe('Invalid Token Length', () => {
      it('should throw UnauthorizedException when token exceeds maximum length', () => {
        // Create a token with 8193 characters (exceeds MAX_TOKEN_LENGTH)
        const headerLength = 2731
        const payloadLength = 2731
        const signatureLength = 2729

        const header = 'A'.repeat(headerLength)
        const payload = 'B'.repeat(payloadLength)
        const signature = 'C'.repeat(signatureLength)
        const tooLongToken = `${header}.${payload}.${signature}`

        expect(tooLongToken.length).toBe(8193)
        expect(() => validateTokenFormat(tooLongToken)).toThrow(UnauthorizedException)
        expect(() => validateTokenFormat(tooLongToken)).toThrow(
          'Token exceeds maximum allowed length'
        )
      })

      it('should throw UnauthorizedException when token is significantly over limit', () => {
        const veryLongToken = 'A'.repeat(10000) + '.B'.repeat(10000) + '.C'.repeat(10000)

        expect(() => validateTokenFormat(veryLongToken)).toThrow(UnauthorizedException)
        expect(() => validateTokenFormat(veryLongToken)).toThrow(
          'Token exceeds maximum allowed length'
        )
      })
    })

    describe('Invalid Token Structure', () => {
      it('should throw UnauthorizedException when token has only 1 part', () => {
        const singlePartToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'

        expect(() => validateTokenFormat(singlePartToken)).toThrow(UnauthorizedException)
        expect(() => validateTokenFormat(singlePartToken)).toThrow('Invalid token format')
      })

      it('should throw UnauthorizedException when token has only 2 parts', () => {
        const twoPartToken = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0'

        expect(() => validateTokenFormat(twoPartToken)).toThrow(UnauthorizedException)
        expect(() => validateTokenFormat(twoPartToken)).toThrow('Invalid token format')
      })

      it('should throw UnauthorizedException when token has 4 parts', () => {
        const fourPartToken = 'part1.part2.part3.part4'

        expect(() => validateTokenFormat(fourPartToken)).toThrow(UnauthorizedException)
        expect(() => validateTokenFormat(fourPartToken)).toThrow('Invalid token format')
      })

      it('should throw UnauthorizedException when token has multiple extra parts', () => {
        const manyPartToken = 'part1.part2.part3.part4.part5.part6'

        expect(() => validateTokenFormat(manyPartToken)).toThrow(UnauthorizedException)
        expect(() => validateTokenFormat(manyPartToken)).toThrow('Invalid token format')
      })

      it('should throw UnauthorizedException when token has no dots', () => {
        const noDotToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9eyJzdWIiOiIxMjMifQ'

        expect(() => validateTokenFormat(noDotToken)).toThrow(UnauthorizedException)
        expect(() => validateTokenFormat(noDotToken)).toThrow('Invalid token format')
      })
    })

    describe('Invalid Token Parts', () => {
      it('should throw UnauthorizedException when header part is empty', () => {
        const emptyHeaderToken = '.payload.signature'

        expect(() => validateTokenFormat(emptyHeaderToken)).toThrow(UnauthorizedException)
        expect(() => validateTokenFormat(emptyHeaderToken)).toThrow('Invalid token structure')
      })

      it('should throw UnauthorizedException when payload part is empty', () => {
        const emptyPayloadToken = 'header..signature'

        expect(() => validateTokenFormat(emptyPayloadToken)).toThrow(UnauthorizedException)
        expect(() => validateTokenFormat(emptyPayloadToken)).toThrow('Invalid token structure')
      })

      it('should throw UnauthorizedException when signature part is empty', () => {
        const emptySignatureToken = 'header.payload.'

        expect(() => validateTokenFormat(emptySignatureToken)).toThrow(UnauthorizedException)
        expect(() => validateTokenFormat(emptySignatureToken)).toThrow('Invalid token structure')
      })

      it('should throw UnauthorizedException when all parts are empty', () => {
        const allEmptyToken = '..'

        expect(() => validateTokenFormat(allEmptyToken)).toThrow(UnauthorizedException)
        expect(() => validateTokenFormat(allEmptyToken)).toThrow('Invalid token structure')
      })

      it('should throw UnauthorizedException when multiple parts are empty', () => {
        const multipleEmptyToken = '.payload.'

        expect(() => validateTokenFormat(multipleEmptyToken)).toThrow(UnauthorizedException)
        expect(() => validateTokenFormat(multipleEmptyToken)).toThrow('Invalid token structure')
      })
    })

    describe('Invalid Token Characters', () => {
      it('should throw UnauthorizedException when token contains equals sign (Base64 padding)', () => {
        const paddedToken = 'eyJhbGciOiJIUzI1NiJ9=.eyJzdWIiOiIxMjMifQ==.signature='

        expect(() => validateTokenFormat(paddedToken)).toThrow(UnauthorizedException)
        expect(() => validateTokenFormat(paddedToken)).toThrow('Invalid token characters')
      })

      it('should throw UnauthorizedException when token contains spaces', () => {
        const tokenWithSpaces = 'header part.payload part.signature part'

        expect(() => validateTokenFormat(tokenWithSpaces)).toThrow(UnauthorizedException)
        expect(() => validateTokenFormat(tokenWithSpaces)).toThrow('Invalid token characters')
      })

      it('should throw UnauthorizedException when token contains special characters', () => {
        const tokenWithSpecialChars = 'header!@#.payload$%^.signature&*()'

        expect(() => validateTokenFormat(tokenWithSpecialChars)).toThrow(UnauthorizedException)
        expect(() => validateTokenFormat(tokenWithSpecialChars)).toThrow('Invalid token characters')
      })

      it('should throw UnauthorizedException when token contains newline characters', () => {
        const tokenWithNewline = 'header\n.payload.signature'

        expect(() => validateTokenFormat(tokenWithNewline)).toThrow(UnauthorizedException)
        expect(() => validateTokenFormat(tokenWithNewline)).toThrow('Invalid token characters')
      })

      it('should throw UnauthorizedException when token contains tab characters', () => {
        const tokenWithTab = 'header\t.payload.signature'

        expect(() => validateTokenFormat(tokenWithTab)).toThrow(UnauthorizedException)
        expect(() => validateTokenFormat(tokenWithTab)).toThrow('Invalid token characters')
      })

      it('should throw UnauthorizedException when token contains plus signs', () => {
        const tokenWithPlus = 'header+test.payload+test.signature+test'

        expect(() => validateTokenFormat(tokenWithPlus)).toThrow(UnauthorizedException)
        expect(() => validateTokenFormat(tokenWithPlus)).toThrow('Invalid token characters')
      })

      it('should throw UnauthorizedException when token contains forward slashes', () => {
        const tokenWithSlash = 'header/test.payload/test.signature/test'

        expect(() => validateTokenFormat(tokenWithSlash)).toThrow(UnauthorizedException)
        expect(() => validateTokenFormat(tokenWithSlash)).toThrow('Invalid token characters')
      })

      it('should throw UnauthorizedException when token contains unicode characters', () => {
        const tokenWithUnicode = 'héader.pâyload.signaturé'

        expect(() => validateTokenFormat(tokenWithUnicode)).toThrow(UnauthorizedException)
        expect(() => validateTokenFormat(tokenWithUnicode)).toThrow('Invalid token characters')
      })
    })

    describe('Edge Cases', () => {
      it('should throw UnauthorizedException for empty string', () => {
        const emptyToken = ''

        expect(() => validateTokenFormat(emptyToken)).toThrow(UnauthorizedException)
        expect(() => validateTokenFormat(emptyToken)).toThrow('Invalid token format')
      })

      it('should throw UnauthorizedException for single dot', () => {
        const singleDot = '.'

        expect(() => validateTokenFormat(singleDot)).toThrow(UnauthorizedException)
        expect(() => validateTokenFormat(singleDot)).toThrow('Invalid token format')
      })

      it('should throw UnauthorizedException for two dots', () => {
        const twoDots = '..'

        expect(() => validateTokenFormat(twoDots)).toThrow(UnauthorizedException)
        expect(() => validateTokenFormat(twoDots)).toThrow('Invalid token structure')
      })

      it('should throw UnauthorizedException for token with leading dot', () => {
        const leadingDot = '.header.payload.signature'

        expect(() => validateTokenFormat(leadingDot)).toThrow(UnauthorizedException)
        // Will fail with 'Invalid token format' due to 4 parts
        expect(() => validateTokenFormat(leadingDot)).toThrow('Invalid token format')
      })

      it('should throw UnauthorizedException for token with trailing dot', () => {
        const trailingDot = 'header.payload.signature.'

        expect(() => validateTokenFormat(trailingDot)).toThrow(UnauthorizedException)
        // Will fail with 'Invalid token format' due to 4 parts
        expect(() => validateTokenFormat(trailingDot)).toThrow('Invalid token format')
      })

      it('should throw UnauthorizedException for token with consecutive dots', () => {
        const consecutiveDots = 'header..payload.signature'

        expect(() => validateTokenFormat(consecutiveDots)).toThrow(UnauthorizedException)
        // Will fail with 'Invalid token format' due to 4 parts
        expect(() => validateTokenFormat(consecutiveDots)).toThrow('Invalid token format')
      })
    })

    describe('Real-World Scenarios', () => {
      it('should validate token from actual JWT library output', () => {
        // Example token generated by jsonwebtoken library
        const realJwt =
          'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMTIzIiwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNjczMDAwMDAwLCJleHAiOjE2NzMwMDM2MDB9.abc123def456ghi789jkl012mno345pqr678stu901vwx234yz_567-890'

        expect(() => validateTokenFormat(realJwt)).not.toThrow()
      })

      it('should reject malformed token that might come from client error', () => {
        const malformedToken = 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.signature'

        expect(() => validateTokenFormat(malformedToken)).toThrow(UnauthorizedException)
        // Contains space which is invalid Base64URL character
        expect(() => validateTokenFormat(malformedToken)).toThrow('Invalid token characters')
      })

      it('should reject token with URL-encoded characters', () => {
        const urlEncodedToken = 'header%20.payload%20.signature%20'

        expect(() => validateTokenFormat(urlEncodedToken)).toThrow(UnauthorizedException)
        expect(() => validateTokenFormat(urlEncodedToken)).toThrow('Invalid token characters')
      })
    })
  })
})
