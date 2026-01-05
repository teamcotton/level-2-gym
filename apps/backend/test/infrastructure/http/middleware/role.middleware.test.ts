import type { FastifyReply, FastifyRequest } from 'fastify'
import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { UserId } from '../../../../src/domain/value-objects/userID.js'
import { requireRole } from '../../../../src/infrastructure/http/middleware/role.middleware.js'
import type { JwtUserClaims } from '../../../../src/shared/types/index.js'

// Helper function to create mock user claims with proper UserIdType
function createMockUserClaims(email: string, roles?: string[], userId?: string): JwtUserClaims {
  return {
    sub: new UserId(userId || uuidv7()).getValue(),
    email,
    roles,
  }
}

describe('requireRole middleware', () => {
  let mockRequest: Partial<FastifyRequest>
  let mockReply: Partial<FastifyReply>
  let sendSpy: ReturnType<typeof vi.fn>
  let codeSpy: ReturnType<typeof vi.fn>
  let logInfoSpy: ReturnType<typeof vi.fn>
  let logWarnSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    sendSpy = vi.fn().mockReturnThis()
    codeSpy = vi.fn().mockReturnValue({ send: sendSpy })
    logInfoSpy = vi.fn()
    logWarnSpy = vi.fn()

    mockRequest = {
      headers: {},
      method: 'GET',
      url: '/users',
      log: {
        info: logInfoSpy,
        warn: logWarnSpy,
        error: vi.fn(),
        debug: vi.fn(),
        trace: vi.fn(),
        fatal: vi.fn(),
        child: vi.fn(),
        silent: vi.fn(),
      } as any,
    }

    mockReply = {
      code: codeSpy as any,
      send: sendSpy as any,
    }
  })

  describe('Authentication checks', () => {
    it('should return 401 when user is not authenticated', async () => {
      const middleware = requireRole(['admin', 'moderator'])
      await middleware.call(null as any, mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).toHaveBeenCalledWith(401)
      expect(sendSpy).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required',
      })
      expect(logWarnSpy).toHaveBeenCalled()
    })

    it('should log appropriate context when authentication is missing', async () => {
      const middleware = requireRole(['admin'])
      await middleware.call(null as any, mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(logWarnSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          route: '/users',
          requiredRoles: ['admin'],
        }),
        'Role check failed: User not authenticated'
      )
    })
  })

  describe('Role authorization', () => {
    it('should allow access when user has required role', async () => {
      const userId = uuidv7()
      mockRequest.user = createMockUserClaims('admin@example.com', ['admin'], userId)

      const middleware = requireRole(['admin'])
      await middleware.call(null as any, mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).not.toHaveBeenCalled()
      expect(sendSpy).not.toHaveBeenCalled()
      expect(logInfoSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          userId,
          userRoles: ['admin'],
        }),
        'Role check passed'
      )
    })

    it('should allow access when user has one of multiple required roles', async () => {
      mockRequest.user = createMockUserClaims('moderator@example.com', ['moderator', 'user'])

      const middleware = requireRole(['admin', 'moderator'])
      await middleware.call(null as any, mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).not.toHaveBeenCalled()
      expect(sendSpy).not.toHaveBeenCalled()
      expect(logInfoSpy).toHaveBeenCalled()
    })

    it('should allow access when user has admin role and moderator is required', async () => {
      mockRequest.user = createMockUserClaims('admin@example.com', ['admin'])

      const middleware = requireRole(['admin', 'moderator'])
      await middleware.call(null as any, mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).not.toHaveBeenCalled()
      expect(sendSpy).not.toHaveBeenCalled()
    })

    it('should deny access when user lacks required role', async () => {
      const userId = uuidv7()
      mockRequest.user = createMockUserClaims('user@example.com', ['user'], userId)

      const middleware = requireRole(['admin', 'moderator'])
      await middleware.call(null as any, mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).toHaveBeenCalledWith(403)
      expect(sendSpy).toHaveBeenCalledWith({
        success: false,
        error: 'Access denied. Required roles: admin, moderator',
      })
      expect(logWarnSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          userRoles: ['user'],
          requiredRoles: ['admin', 'moderator'],
        }),
        'Role check failed: Insufficient permissions'
      )
    })

    it('should deny access when user has no roles', async () => {
      mockRequest.user = createMockUserClaims('noroles@example.com', [])

      const middleware = requireRole(['admin'])
      await middleware.call(null as any, mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).toHaveBeenCalledWith(403)
      expect(sendSpy).toHaveBeenCalledWith({
        success: false,
        error: 'Access denied. Required roles: admin',
      })
    })

    it('should deny access when user roles property is undefined', async () => {
      mockRequest.user = createMockUserClaims('noroles@example.com')

      const middleware = requireRole(['admin'])
      await middleware.call(null as any, mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).toHaveBeenCalledWith(403)
      expect(sendSpy).toHaveBeenCalledWith({
        success: false,
        error: 'Access denied. Required roles: admin',
      })
    })
  })

  describe('Multiple roles scenarios', () => {
    it('should handle single role requirement', async () => {
      mockRequest.user = createMockUserClaims('admin@example.com', ['admin', 'user', 'moderator'])

      const middleware = requireRole(['admin'])
      await middleware.call(null as any, mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).not.toHaveBeenCalled()
      expect(logInfoSpy).toHaveBeenCalled()
    })

    it('should handle multiple required roles with user having multiple roles', async () => {
      mockRequest.user = createMockUserClaims('superuser@example.com', [
        'admin',
        'moderator',
        'user',
      ])

      const middleware = requireRole(['admin', 'moderator', 'editor'])
      await middleware.call(null as any, mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).not.toHaveBeenCalled()
    })

    it('should correctly identify when none of multiple roles match', async () => {
      mockRequest.user = createMockUserClaims('guest@example.com', ['guest', 'viewer'])

      const middleware = requireRole(['admin', 'moderator', 'editor'])
      await middleware.call(null as any, mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).toHaveBeenCalledWith(403)
      expect(sendSpy).toHaveBeenCalledWith({
        success: false,
        error: 'Access denied. Required roles: admin, moderator, editor',
      })
    })
  })

  describe('Edge cases', () => {
    it('should throw error when requiredRoles is an empty array', () => {
      expect(() => requireRole([])).toThrow(
        'requireRole: requiredRoles must be a non-empty array. ' +
          'Empty arrays are not allowed as they would deny all access. ' +
          'If you need to allow all authenticated users, do not use this middleware.'
      )
    })

    it('should throw error when requiredRoles is null or undefined', () => {
      expect(() => requireRole(null as any)).toThrow(
        'requireRole: requiredRoles must be a non-empty array'
      )
      expect(() => requireRole(undefined as any)).toThrow(
        'requireRole: requiredRoles must be a non-empty array'
      )
    })

    it('should handle very long role names', async () => {
      const longRole = 'a'.repeat(200)
      mockRequest.user = createMockUserClaims('user@example.com', [longRole])

      const middleware = requireRole([longRole])
      await middleware.call(null as any, mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).not.toHaveBeenCalled()
      expect(logInfoSpy).toHaveBeenCalled()
    })

    it('should handle case-sensitive role matching', async () => {
      mockRequest.user = createMockUserClaims('user@example.com', ['Admin']) // Capital A

      const middleware = requireRole(['admin']) // lowercase a
      await middleware.call(null as any, mockRequest as FastifyRequest, mockReply as FastifyReply)

      // Should not match due to case sensitivity
      expect(codeSpy).toHaveBeenCalledWith(403)
    })

    it('should preserve request context through middleware chain', async () => {
      mockRequest.user = createMockUserClaims('user@example.com', ['admin'])

      const originalUser = mockRequest.user

      const middleware = requireRole(['admin'])
      await middleware.call(null as any, mockRequest as FastifyRequest, mockReply as FastifyReply)

      // User object should remain unchanged
      expect(mockRequest.user).toBe(originalUser)
    })
  })

  describe('Logging behavior', () => {
    it('should log route information from routerPath when available', async () => {
      const requestWithRouterPath = {
        ...mockRequest,
        routerPath: '/users',
      } as any as FastifyRequest

      const middleware = requireRole(['admin'])
      await middleware.call(null as any, requestWithRouterPath, mockReply as FastifyReply)

      expect(logWarnSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          route: '/users',
        }),
        expect.any(String)
      )
    })

    it('should fall back to url when routerPath is not available', async () => {
      const requestWithUrl = {
        ...mockRequest,
      } as any as FastifyRequest

      const middleware = requireRole(['admin'])
      await middleware.call(null as any, requestWithUrl, mockReply as FastifyReply)

      expect(logWarnSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          route: '/users',
        }),
        expect.any(String)
      )
    })
  })
})
