import type { FastifyReply, FastifyRequest } from 'fastify'
import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { UserId } from '../../../../src/domain/value-objects/userID.js'
import { auditContextMiddleware } from '../../../../src/infrastructure/http/middleware/audit-context.middleware.js'
import type { JwtUserClaims } from '../../../../src/shared/types/index.js'

describe('auditContextMiddleware', () => {
  let mockRequest: Partial<FastifyRequest>
  let mockReply: Partial<FastifyReply>

  beforeEach(() => {
    vi.clearAllMocks()

    mockReply = {} as Partial<FastifyReply>

    mockRequest = {
      headers: {},
      ip: '127.0.0.1',
      user: undefined,
    } as Partial<FastifyRequest>
  })

  describe('with authenticated user', () => {
    it('should attach audit context with user ID from JWT claims', async () => {
      const userId = new UserId(uuidv7()).getValue()
      const mockUser: JwtUserClaims = {
        sub: userId,
        email: 'test@example.com',
        roles: ['user'],
      }

      mockRequest.user = mockUser
      ;(mockRequest as any).ip = '192.168.1.100'
      mockRequest.headers = {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      }

      await auditContextMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockRequest.auditContext).toEqual({
        userId,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      })
    })

    it('should extract userId from request.user.sub', async () => {
      const userId = new UserId(uuidv7()).getValue()
      mockRequest.user = {
        sub: userId,
        email: 'admin@example.com',
        roles: ['admin'],
      }

      await auditContextMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockRequest.auditContext?.userId).toBe(userId)
    })

    it('should capture IP address from request.ip', async () => {
      const userId = new UserId(uuidv7()).getValue()
      mockRequest.user = { sub: userId, email: 'user@test.com', roles: ['user'] }
      ;(mockRequest as any).ip = '203.0.113.42'

      await auditContextMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockRequest.auditContext?.ipAddress).toBe('203.0.113.42')
    })

    it('should capture user agent from request headers', async () => {
      const userId = new UserId(uuidv7()).getValue()
      mockRequest.user = { sub: userId, email: 'user@test.com', roles: ['user'] }
      mockRequest.headers = {
        'user-agent': 'Chrome/91.0.4472.124',
      }

      await auditContextMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockRequest.auditContext?.userAgent).toBe('Chrome/91.0.4472.124')
    })
  })

  describe('without authenticated user', () => {
    it('should set userId to null when no user is authenticated', async () => {
      mockRequest.user = undefined
      ;(mockRequest as any).ip = '10.0.0.1'
      mockRequest.headers = { 'user-agent': 'Test Agent' }

      await auditContextMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockRequest.auditContext?.userId).toBeNull()
      expect(mockRequest.auditContext?.ipAddress).toBe('10.0.0.1')
      expect(mockRequest.auditContext?.userAgent).toBe('Test Agent')
    })

    it('should handle missing user object gracefully', async () => {
      delete mockRequest.user
      ;(mockRequest as any).ip = '172.16.0.1'

      await auditContextMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockRequest.auditContext?.userId).toBeNull()
    })

    it('should set userId to null when user.sub is undefined', async () => {
      mockRequest.user = { email: 'test@example.com', roles: ['user'] } as any

      await auditContextMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockRequest.auditContext?.userId).toBeNull()
    })
  })

  describe('user agent handling', () => {
    it('should set userAgent to null when header is missing', async () => {
      const userId = new UserId(uuidv7()).getValue()
      mockRequest.user = { sub: userId, email: 'test@example.com', roles: ['user'] }
      mockRequest.headers = {}

      await auditContextMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockRequest.auditContext?.userAgent).toBeNull()
    })

    it('should set userAgent to null when header is undefined', async () => {
      const userId = new UserId(uuidv7()).getValue()
      mockRequest.user = { sub: userId, email: 'test@example.com', roles: ['user'] }
      mockRequest.headers = { 'user-agent': undefined }

      await auditContextMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockRequest.auditContext?.userAgent).toBeNull()
    })

    it('should handle empty string user agent', async () => {
      const userId = new UserId(uuidv7()).getValue()
      mockRequest.user = { sub: userId, email: 'test@example.com', roles: ['user'] }
      mockRequest.headers = { 'user-agent': '' }

      await auditContextMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockRequest.auditContext?.userAgent).toBe('')
    })

    it('should handle various browser user agents', async () => {
      const userId = new UserId(uuidv7()).getValue()
      const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
        'Mozilla/5.0 (X11; Linux x86_64) Firefox/89.0',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X)',
      ]

      for (const userAgent of userAgents) {
        mockRequest.user = { sub: userId, email: 'test@example.com', roles: ['user'] }
        mockRequest.headers = { 'user-agent': userAgent }

        await auditContextMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

        expect(mockRequest.auditContext?.userAgent).toBe(userAgent)
      }
    })

    it('should handle curl user agent', async () => {
      const userId = new UserId(uuidv7()).getValue()
      mockRequest.user = { sub: userId, email: 'test@example.com', roles: ['user'] }
      mockRequest.headers = { 'user-agent': 'curl/7.68.0' }

      await auditContextMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockRequest.auditContext?.userAgent).toBe('curl/7.68.0')
    })
  })

  describe('IP address handling', () => {
    it('should capture IPv4 address', async () => {
      const userId = new UserId(uuidv7()).getValue()
      mockRequest.user = { sub: userId, email: 'test@example.com', roles: ['user'] }
      ;(mockRequest as any).ip = '192.168.1.1'

      await auditContextMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockRequest.auditContext?.ipAddress).toBe('192.168.1.1')
    })

    it('should capture IPv6 address', async () => {
      const userId = new UserId(uuidv7()).getValue()
      mockRequest.user = { sub: userId, email: 'test@example.com', roles: ['user'] }
      ;(mockRequest as any).ip = '2001:0db8:85a3:0000:0000:8a2e:0370:7334'

      await auditContextMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockRequest.auditContext?.ipAddress).toBe('2001:0db8:85a3:0000:0000:8a2e:0370:7334')
    })

    it('should capture localhost IP', async () => {
      const userId = new UserId(uuidv7()).getValue()
      mockRequest.user = { sub: userId, email: 'test@example.com', roles: ['user'] }
      ;(mockRequest as any).ip = '127.0.0.1'

      await auditContextMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockRequest.auditContext?.ipAddress).toBe('127.0.0.1')
    })

    it('should capture IPv6 localhost', async () => {
      const userId = new UserId(uuidv7()).getValue()
      mockRequest.user = { sub: userId, email: 'test@example.com', roles: ['user'] }
      ;(mockRequest as any).ip = '::1'

      await auditContextMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockRequest.auditContext?.ipAddress).toBe('::1')
    })

    it('should handle proxy forwarded IP addresses', async () => {
      const userId = new UserId(uuidv7()).getValue()
      mockRequest.user = { sub: userId, email: 'test@example.com', roles: ['user'] }
      ;(mockRequest as any).ip = '203.0.113.195' // Public IP behind proxy

      await auditContextMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockRequest.auditContext?.ipAddress).toBe('203.0.113.195')
    })
  })

  describe('complete audit context', () => {
    it('should create complete context with all fields', async () => {
      const userId = new UserId(uuidv7()).getValue()
      mockRequest.user = {
        sub: userId,
        email: 'complete@example.com',
        roles: ['admin', 'user'],
      }
      ;(mockRequest as any).ip = '198.51.100.42'
      mockRequest.headers = {
        'user-agent': 'Mozilla/5.0 (complete test)',
      }

      await auditContextMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockRequest.auditContext).toEqual({
        userId,
        ipAddress: '198.51.100.42',
        userAgent: 'Mozilla/5.0 (complete test)',
      })
      expect(mockRequest.auditContext).toHaveProperty('userId')
      expect(mockRequest.auditContext).toHaveProperty('ipAddress')
      expect(mockRequest.auditContext).toHaveProperty('userAgent')
    })

    it('should create context with minimal fields for anonymous request', async () => {
      mockRequest.user = undefined
      ;(mockRequest as any).ip = '10.0.0.1'
      mockRequest.headers = {}

      await auditContextMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockRequest.auditContext).toEqual({
        userId: null,
        ipAddress: '10.0.0.1',
        userAgent: null,
      })
    })

    it('should attach auditContext to request object', async () => {
      const userId = new UserId(uuidv7()).getValue()
      mockRequest.user = { sub: userId, email: 'test@example.com', roles: ['user'] }

      expect(mockRequest.auditContext).toBeUndefined()

      await auditContextMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockRequest.auditContext).toBeDefined()
      expect(mockRequest).toHaveProperty('auditContext')
    })

    it('should overwrite existing auditContext if present', async () => {
      const oldUserId = new UserId(uuidv7()).getValue()
      const newUserId = new UserId(uuidv7()).getValue()

      mockRequest.auditContext = {
        userId: oldUserId,
        ipAddress: '1.1.1.1',
        userAgent: 'Old Agent',
      }

      mockRequest.user = { sub: newUserId, email: 'new@example.com', roles: ['user'] }
      ;(mockRequest as any).ip = '2.2.2.2'
      mockRequest.headers = { 'user-agent': 'New Agent' }

      await auditContextMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockRequest.auditContext?.userId).toBe(newUserId)
      expect(mockRequest.auditContext?.ipAddress).toBe('2.2.2.2')
      expect(mockRequest.auditContext?.userAgent).toBe('New Agent')
    })
  })

  describe('edge cases', () => {
    it('should handle null IP address', async () => {
      const userId = new UserId(uuidv7()).getValue()
      mockRequest.user = { sub: userId, email: 'test@example.com', roles: ['user'] }
      ;(mockRequest as any).ip = null as any

      await auditContextMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockRequest.auditContext?.ipAddress).toBeNull()
    })

    it('should handle undefined IP address', async () => {
      const userId = new UserId(uuidv7()).getValue()
      mockRequest.user = { sub: userId, email: 'test@example.com', roles: ['user'] }
      ;(mockRequest as any).ip = undefined as any

      await auditContextMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockRequest.auditContext?.ipAddress).toBeUndefined()
    })

    it('should resolve with void', async () => {
      const userId = new UserId(uuidv7()).getValue()
      mockRequest.user = { sub: userId, email: 'test@example.com', roles: ['user'] }

      const result = await auditContextMiddleware(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      )

      expect(result).toBeUndefined()
    })

    it('should not throw errors', async () => {
      const userId = new UserId(uuidv7()).getValue()
      mockRequest.user = { sub: userId, email: 'test@example.com', roles: ['user'] }

      await expect(
        auditContextMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)
      ).resolves.not.toThrow()
    })

    it('should handle very long user agent strings', async () => {
      const userId = new UserId(uuidv7()).getValue()
      mockRequest.user = { sub: userId, email: 'test@example.com', roles: ['user'] }
      const longUserAgent = 'A'.repeat(1000)
      mockRequest.headers = { 'user-agent': longUserAgent }

      await auditContextMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockRequest.auditContext?.userAgent).toBe(longUserAgent)
      expect(mockRequest.auditContext?.userAgent?.length).toBe(1000)
    })

    it('should handle special characters in user agent', async () => {
      const userId = new UserId(uuidv7()).getValue()
      mockRequest.user = { sub: userId, email: 'test@example.com', roles: ['user'] }
      mockRequest.headers = {
        'user-agent': 'Test/1.0 (特殊文字; émojis 🚀; symbols <>&")',
      }

      await auditContextMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockRequest.auditContext?.userAgent).toBe(
        'Test/1.0 (特殊文字; émojis 🚀; symbols <>&")'
      )
    })
  })

  describe('different user roles', () => {
    it('should handle admin user', async () => {
      const userId = new UserId(uuidv7()).getValue()
      mockRequest.user = {
        sub: userId,
        email: 'admin@example.com',
        roles: ['admin'],
      }

      await auditContextMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockRequest.auditContext?.userId).toBe(userId)
    })

    it('should handle user with multiple roles', async () => {
      const userId = new UserId(uuidv7()).getValue()
      mockRequest.user = {
        sub: userId,
        email: 'multi@example.com',
        roles: ['user', 'admin', 'moderator'],
      }

      await auditContextMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockRequest.auditContext?.userId).toBe(userId)
    })

    it('should handle user with no roles', async () => {
      const userId = new UserId(uuidv7()).getValue()
      mockRequest.user = {
        sub: userId,
        email: 'noroles@example.com',
        roles: [],
      }

      await auditContextMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockRequest.auditContext?.userId).toBe(userId)
    })

    it('should handle user with undefined roles', async () => {
      const userId = new UserId(uuidv7()).getValue()
      mockRequest.user = {
        sub: userId,
        email: 'undefroles@example.com',
        roles: undefined,
      }

      await auditContextMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockRequest.auditContext?.userId).toBe(userId)
    })
  })

  describe('integration scenarios', () => {
    it('should work for authenticated user creating a resource', async () => {
      const userId = new UserId(uuidv7()).getValue()
      mockRequest.user = {
        sub: userId,
        email: 'creator@example.com',
        roles: ['user'],
      }
      ;(mockRequest as any).ip = '192.168.1.50'
      mockRequest.headers = { 'user-agent': 'Mozilla/5.0 (Create Action)' }

      await auditContextMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockRequest.auditContext).toMatchObject({
        userId,
        ipAddress: '192.168.1.50',
        userAgent: 'Mozilla/5.0 (Create Action)',
      })
    })

    it('should work for authenticated user updating a resource', async () => {
      const userId = new UserId(uuidv7()).getValue()
      mockRequest.user = {
        sub: userId,
        email: 'updater@example.com',
        roles: ['user'],
      }
      ;(mockRequest as any).ip = '192.168.1.51'
      mockRequest.headers = { 'user-agent': 'Mozilla/5.0 (Update Action)' }

      await auditContextMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockRequest.auditContext?.userId).toBe(userId)
    })

    it('should work for authenticated user deleting a resource', async () => {
      const userId = new UserId(uuidv7()).getValue()
      mockRequest.user = {
        sub: userId,
        email: 'deleter@example.com',
        roles: ['admin'],
      }
      ;(mockRequest as any).ip = '192.168.1.52'
      mockRequest.headers = { 'user-agent': 'Mozilla/5.0 (Delete Action)' }

      await auditContextMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockRequest.auditContext?.userId).toBe(userId)
    })

    it('should work for system/background tasks (no user)', async () => {
      mockRequest.user = undefined
      ;(mockRequest as any).ip = '127.0.0.1'
      mockRequest.headers = { 'user-agent': 'System/1.0' }

      await auditContextMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockRequest.auditContext?.userId).toBeNull()
      expect(mockRequest.auditContext?.ipAddress).toBe('127.0.0.1')
      expect(mockRequest.auditContext?.userAgent).toBe('System/1.0')
    })
  })
})
