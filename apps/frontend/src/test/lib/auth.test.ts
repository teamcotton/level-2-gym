import type { Session } from 'next-auth'
import { getServerSession } from 'next-auth'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getAuthSession,
  getAuthToken,
  hasAllRoles,
  hasAnyRole,
  hasRole,
  requireAuth,
  requireRole,
} from '../../lib/auth.js'

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

// Mock auth-config
vi.mock('../../lib/auth-config.js', () => ({
  authOptions: {},
}))

describe('Auth Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAuthToken', () => {
    it('should return access token when session exists', async () => {
      const mockSession = {
        accessToken: 'mock-jwt-token',
        user: { id: '123', email: 'test@example.com', roles: ['user'] },
        expires: '2025-12-31',
      }

      vi.mocked(getServerSession).mockResolvedValueOnce(mockSession)

      const token = await getAuthToken()

      expect(token).toBe('mock-jwt-token')
      expect(getServerSession).toHaveBeenCalledTimes(1)
    })

    it('should return null when session does not exist', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(null)

      const token = await getAuthToken()

      expect(token).toBeNull()
    })

    it('should return null when session exists but has no accessToken', async () => {
      const mockSession = {
        user: { id: '123', email: 'test@example.com', roles: ['user'] },
        expires: '2025-12-31',
      }

      vi.mocked(getServerSession).mockResolvedValueOnce(mockSession as Session)

      const token = await getAuthToken()

      expect(token).toBeNull()
    })
  })

  describe('getAuthSession', () => {
    it('should return session when authenticated', async () => {
      const mockSession = {
        accessToken: 'mock-jwt-token',
        user: { id: '123', email: 'test@example.com', roles: ['user'] },
        expires: '2025-12-31',
      }

      vi.mocked(getServerSession).mockResolvedValueOnce(mockSession)

      const session = await getAuthSession()

      expect(session).toEqual(mockSession)
      expect(getServerSession).toHaveBeenCalledTimes(1)
    })

    it('should return null when not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(null)

      const session = await getAuthSession()

      expect(session).toBeNull()
    })
  })

  describe('hasRole', () => {
    it('should return true when user has the required role', async () => {
      const mockSession = {
        accessToken: 'mock-jwt-token',
        user: { id: '123', email: 'test@example.com', roles: ['admin', 'user'] },
        expires: '2025-12-31',
      }

      vi.mocked(getServerSession).mockResolvedValueOnce(mockSession)

      const result = await hasRole('admin')

      expect(result).toBe(true)
    })

    it('should return false when user does not have the required role', async () => {
      const mockSession = {
        accessToken: 'mock-jwt-token',
        user: { id: '123', email: 'test@example.com', roles: ['user'] },
        expires: '2025-12-31',
      }

      vi.mocked(getServerSession).mockResolvedValueOnce(mockSession)

      const result = await hasRole('admin')

      expect(result).toBe(false)
    })

    it('should return false when session does not exist', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(null)

      const result = await hasRole('admin')

      expect(result).toBe(false)
    })

    it('should return false when user has no roles', async () => {
      const mockSession = {
        accessToken: 'mock-jwt-token',
        user: { id: '123', email: 'test@example.com', roles: [] },
        expires: '2025-12-31',
      }

      vi.mocked(getServerSession).mockResolvedValueOnce(mockSession)

      const result = await hasRole('admin')

      expect(result).toBe(false)
    })

    it('should return false when roles property is undefined', async () => {
      const mockSession = {
        accessToken: 'mock-jwt-token',
        user: { id: '123', email: 'test@example.com' },
        expires: '2025-12-31',
      }

      vi.mocked(getServerSession).mockResolvedValueOnce(mockSession as Session)

      const result = await hasRole('admin')

      expect(result).toBe(false)
    })
  })

  describe('hasAnyRole', () => {
    it('should return true when user has at least one of the required roles', async () => {
      const mockSession = {
        accessToken: 'mock-jwt-token',
        user: { id: '123', email: 'test@example.com', roles: ['moderator', 'user'] },
        expires: '2025-12-31',
      }

      vi.mocked(getServerSession).mockResolvedValueOnce(mockSession)

      const result = await hasAnyRole(['admin', 'moderator'])

      expect(result).toBe(true)
    })

    it('should return false when user has none of the required roles', async () => {
      const mockSession = {
        accessToken: 'mock-jwt-token',
        user: { id: '123', email: 'test@example.com', roles: ['user'] },
        expires: '2025-12-31',
      }

      vi.mocked(getServerSession).mockResolvedValueOnce(mockSession)

      const result = await hasAnyRole(['admin', 'moderator'])

      expect(result).toBe(false)
    })

    it('should return false when session does not exist', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(null)

      const result = await hasAnyRole(['admin', 'moderator'])

      expect(result).toBe(false)
    })

    it('should return false when user has no roles', async () => {
      const mockSession = {
        accessToken: 'mock-jwt-token',
        user: { id: '123', email: 'test@example.com', roles: [] },
        expires: '2025-12-31',
      }

      vi.mocked(getServerSession).mockResolvedValueOnce(mockSession)

      const result = await hasAnyRole(['admin', 'moderator'])

      expect(result).toBe(false)
    })

    it('should return true when user has multiple matching roles', async () => {
      const mockSession = {
        accessToken: 'mock-jwt-token',
        user: { id: '123', email: 'test@example.com', roles: ['admin', 'moderator', 'user'] },
        expires: '2025-12-31',
      }

      vi.mocked(getServerSession).mockResolvedValueOnce(mockSession)

      const result = await hasAnyRole(['admin', 'moderator'])

      expect(result).toBe(true)
    })

    it('should handle empty required roles array', async () => {
      const mockSession = {
        accessToken: 'mock-jwt-token',
        user: { id: '123', email: 'test@example.com', roles: ['user'] },
        expires: '2025-12-31',
      }

      vi.mocked(getServerSession).mockResolvedValueOnce(mockSession)

      const result = await hasAnyRole([])

      expect(result).toBe(false)
    })
  })

  describe('hasAllRoles', () => {
    it('should return true when user has all of the required roles', async () => {
      const mockSession = {
        accessToken: 'mock-jwt-token',
        user: { id: '123', email: 'test@example.com', roles: ['admin', 'moderator', 'user'] },
        expires: '2025-12-31',
      }

      vi.mocked(getServerSession).mockResolvedValueOnce(mockSession)

      const result = await hasAllRoles(['admin', 'moderator'])

      expect(result).toBe(true)
    })

    it('should return false when user is missing at least one required role', async () => {
      const mockSession = {
        accessToken: 'mock-jwt-token',
        user: { id: '123', email: 'test@example.com', roles: ['admin', 'user'] },
        expires: '2025-12-31',
      }

      vi.mocked(getServerSession).mockResolvedValueOnce(mockSession)

      const result = await hasAllRoles(['admin', 'moderator'])

      expect(result).toBe(false)
    })

    it('should return false when session does not exist', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(null)

      const result = await hasAllRoles(['admin', 'moderator'])

      expect(result).toBe(false)
    })

    it('should return false when user has no roles', async () => {
      const mockSession = {
        accessToken: 'mock-jwt-token',
        user: { id: '123', email: 'test@example.com', roles: [] },
        expires: '2025-12-31',
      }

      vi.mocked(getServerSession).mockResolvedValueOnce(mockSession)

      const result = await hasAllRoles(['admin', 'moderator'])

      expect(result).toBe(false)
    })

    it('should return true when checking for empty required roles array', async () => {
      const mockSession = {
        accessToken: 'mock-jwt-token',
        user: { id: '123', email: 'test@example.com', roles: ['user'] },
        expires: '2025-12-31',
      }

      vi.mocked(getServerSession).mockResolvedValueOnce(mockSession)

      const result = await hasAllRoles([])

      expect(result).toBe(true)
    })

    it('should return false when roles property is undefined', async () => {
      const mockSession = {
        accessToken: 'mock-jwt-token',
        user: { id: '123', email: 'test@example.com' },
        expires: '2025-12-31',
      }

      vi.mocked(getServerSession).mockResolvedValueOnce(mockSession as Session)

      const result = await hasAllRoles(['admin'])

      expect(result).toBe(false)
    })
  })

  describe('requireAuth', () => {
    it('should return session when authenticated', async () => {
      const mockSession = {
        accessToken: 'mock-jwt-token',
        user: { id: '123', email: 'test@example.com', roles: ['user'] },
        expires: '2025-12-31',
      }

      vi.mocked(getServerSession).mockResolvedValueOnce(mockSession)

      const session = await requireAuth()

      expect(session).toEqual(mockSession)
      expect(getServerSession).toHaveBeenCalledTimes(1)
    })

    it('should throw error when not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(null)

      await expect(requireAuth()).rejects.toThrow('Unauthorized - Please sign in')
    })
  })

  describe('requireRole', () => {
    it('should return session when user has the required role', async () => {
      const mockSession = {
        accessToken: 'mock-jwt-token',
        user: { id: '123', email: 'test@example.com', roles: ['admin', 'user'] },
        expires: '2025-12-31',
      }

      vi.mocked(getServerSession).mockResolvedValueOnce(mockSession)

      const session = await requireRole('admin')

      expect(session).toEqual(mockSession)
      expect(getServerSession).toHaveBeenCalledTimes(1)
    })

    it('should throw error when user does not have the required role', async () => {
      const mockSession = {
        accessToken: 'mock-jwt-token',
        user: { id: '123', email: 'test@example.com', roles: ['user'] },
        expires: '2025-12-31',
      }

      vi.mocked(getServerSession).mockResolvedValueOnce(mockSession)

      await expect(requireRole('admin')).rejects.toThrow('Forbidden - Requires admin role')
    })

    it('should throw error when not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(null)

      await expect(requireRole('admin')).rejects.toThrow('Unauthorized - Please sign in')
    })

    it('should throw error when user has no roles', async () => {
      const mockSession = {
        accessToken: 'mock-jwt-token',
        user: { id: '123', email: 'test@example.com', roles: [] },
        expires: '2025-12-31',
      }

      vi.mocked(getServerSession).mockResolvedValueOnce(mockSession)

      await expect(requireRole('admin')).rejects.toThrow('Forbidden - Requires admin role')
    })

    it('should throw error when roles property is undefined', async () => {
      const mockSession = {
        accessToken: 'mock-jwt-token',
        user: { id: '123', email: 'test@example.com' },
        expires: '2025-12-31',
      }

      vi.mocked(getServerSession).mockResolvedValueOnce(mockSession as Session)

      await expect(requireRole('admin')).rejects.toThrow('Forbidden - Requires admin role')
    })

    it('should handle special characters in role names', async () => {
      const mockSession = {
        accessToken: 'mock-jwt-token',
        user: { id: '123', email: 'test@example.com', roles: ['super-admin'] },
        expires: '2025-12-31',
      }

      vi.mocked(getServerSession).mockResolvedValueOnce(mockSession)

      const session = await requireRole('super-admin')

      expect(session).toEqual(mockSession)
    })

    it('should be case-sensitive for role matching', async () => {
      const mockSession = {
        accessToken: 'mock-jwt-token',
        user: { id: '123', email: 'test@example.com', roles: ['Admin'] },
        expires: '2025-12-31',
      }

      vi.mocked(getServerSession).mockResolvedValueOnce(mockSession)

      await expect(requireRole('admin')).rejects.toThrow('Forbidden - Requires admin role')
    })

    it('should return session when user has multiple roles including required one', async () => {
      const mockSession = {
        accessToken: 'mock-jwt-token',
        user: {
          id: '123',
          email: 'test@example.com',
          roles: ['user', 'moderator', 'admin', 'superuser'],
        },
        expires: '2025-12-31',
      }

      vi.mocked(getServerSession).mockResolvedValueOnce(mockSession)

      const session = await requireRole('moderator')

      expect(session).toEqual(mockSession)
    })
  })
})
