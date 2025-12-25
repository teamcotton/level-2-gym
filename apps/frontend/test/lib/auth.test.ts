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
  withAuth,
  withRole,
} from '@/lib/auth.js'

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

// Mock auth-config
vi.mock('../../src/lib/auth-config.js', () => ({
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

  describe('withAuth', () => {
    it('should execute action with session when authenticated', async () => {
      const mockSession: Session = {
        accessToken: 'mock-jwt-token',
        user: { id: '123', email: 'test@example.com', roles: ['user'] },
        expires: '2025-12-31',
      }

      vi.mocked(getServerSession).mockResolvedValueOnce(mockSession)

      const mockAction = vi.fn().mockResolvedValue({ success: true })
      const wrappedAction = withAuth(mockAction)

      const result = await wrappedAction('arg1', 'arg2')

      expect(mockAction).toHaveBeenCalledWith(mockSession, 'arg1', 'arg2')
      expect(result).toEqual({ success: true })
    })

    it('should throw error when not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(null)

      const mockAction = vi.fn()
      const wrappedAction = withAuth(mockAction)

      await expect(wrappedAction()).rejects.toThrow('Unauthorized - Please sign in')
      expect(mockAction).not.toHaveBeenCalled()
    })

    it('should pass multiple arguments to wrapped action', async () => {
      const mockSession: Session = {
        accessToken: 'mock-jwt-token',
        user: { id: '123', email: 'test@example.com', roles: ['user'] },
        expires: '2025-12-31',
      }

      vi.mocked(getServerSession).mockResolvedValueOnce(mockSession)

      const mockAction = vi.fn().mockResolvedValue({ data: 'result' })
      const wrappedAction = withAuth(mockAction)

      const result = await wrappedAction({ id: 1 }, { name: 'test' }, [1, 2, 3])

      expect(mockAction).toHaveBeenCalledWith(mockSession, { id: 1 }, { name: 'test' }, [1, 2, 3])
      expect(result).toEqual({ data: 'result' })
    })

    it('should preserve action return type', async () => {
      const mockSession: Session = {
        accessToken: 'mock-jwt-token',
        user: { id: '123', email: 'test@example.com', roles: ['user'] },
        expires: '2025-12-31',
      }

      vi.mocked(getServerSession).mockResolvedValueOnce(mockSession)

      const mockAction = vi.fn().mockResolvedValue({ count: 42, items: ['a', 'b'] })
      const wrappedAction = withAuth(mockAction)

      const result = await wrappedAction()

      expect(result).toEqual({ count: 42, items: ['a', 'b'] })
    })

    it('should allow action to access session properties', async () => {
      const mockSession: Session = {
        accessToken: 'mock-jwt-token',
        user: { id: '456', email: 'admin@example.com', roles: ['admin'] },
        expires: '2025-12-31',
      }

      vi.mocked(getServerSession).mockResolvedValueOnce(mockSession)

      const action = async (session: Session) => {
        return {
          userId: session.user.id,
          token: session.accessToken,
          roles: session.user.roles,
        }
      }

      const wrappedAction = withAuth(action)
      const result = await wrappedAction()

      expect(result).toEqual({
        userId: '456',
        token: 'mock-jwt-token',
        roles: ['admin'],
      })
    })

    it('should propagate errors from wrapped action', async () => {
      const mockSession: Session = {
        accessToken: 'mock-jwt-token',
        user: { id: '123', email: 'test@example.com', roles: ['user'] },
        expires: '2025-12-31',
      }

      vi.mocked(getServerSession).mockResolvedValueOnce(mockSession)

      const mockAction = vi.fn().mockRejectedValue(new Error('Action failed'))
      const wrappedAction = withAuth(mockAction)

      await expect(wrappedAction()).rejects.toThrow('Action failed')
    })
  })

  describe('withRole', () => {
    it('should execute action when user has required role', async () => {
      const mockSession: Session = {
        accessToken: 'mock-jwt-token',
        user: { id: '123', email: 'admin@example.com', roles: ['admin'] },
        expires: '2025-12-31',
      }

      vi.mocked(getServerSession).mockResolvedValueOnce(mockSession)

      const mockAction = vi.fn().mockResolvedValue({ success: true })
      const wrappedAction = withRole('admin', mockAction)

      const result = await wrappedAction('data')

      expect(mockAction).toHaveBeenCalledWith(mockSession, 'data')
      expect(result).toEqual({ success: true })
    })

    it('should throw error when user does not have required role', async () => {
      const mockSession: Session = {
        accessToken: 'mock-jwt-token',
        user: { id: '123', email: 'user@example.com', roles: ['user'] },
        expires: '2025-12-31',
      }

      vi.mocked(getServerSession).mockResolvedValueOnce(mockSession)

      const mockAction = vi.fn()
      const wrappedAction = withRole('admin', mockAction)

      await expect(wrappedAction()).rejects.toThrow('Forbidden - Requires one of: admin')
      expect(mockAction).not.toHaveBeenCalled()
    })

    it('should throw error when not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(null)

      const mockAction = vi.fn()
      const wrappedAction = withRole('admin', mockAction)

      await expect(wrappedAction()).rejects.toThrow('Unauthorized - Please sign in')
      expect(mockAction).not.toHaveBeenCalled()
    })

    it('should accept array of required roles', async () => {
      const mockSession: Session = {
        accessToken: 'mock-jwt-token',
        user: { id: '123', email: 'moderator@example.com', roles: ['moderator'] },
        expires: '2025-12-31',
      }

      vi.mocked(getServerSession).mockResolvedValueOnce(mockSession)

      const mockAction = vi.fn().mockResolvedValue({ success: true })
      const wrappedAction = withRole(['admin', 'moderator'], mockAction)

      const result = await wrappedAction()

      expect(mockAction).toHaveBeenCalledWith(mockSession)
      expect(result).toEqual({ success: true })
    })

    it('should throw error when user has none of the required roles', async () => {
      const mockSession: Session = {
        accessToken: 'mock-jwt-token',
        user: { id: '123', email: 'user@example.com', roles: ['user'] },
        expires: '2025-12-31',
      }

      vi.mocked(getServerSession).mockResolvedValueOnce(mockSession)

      const mockAction = vi.fn()
      const wrappedAction = withRole(['admin', 'moderator'], mockAction)

      await expect(wrappedAction()).rejects.toThrow('Forbidden - Requires one of: admin, moderator')
      expect(mockAction).not.toHaveBeenCalled()
    })

    it('should execute when user has one of multiple required roles', async () => {
      const mockSession: Session = {
        accessToken: 'mock-jwt-token',
        user: { id: '123', email: 'admin@example.com', roles: ['admin', 'superuser'] },
        expires: '2025-12-31',
      }

      vi.mocked(getServerSession).mockResolvedValueOnce(mockSession)

      const mockAction = vi.fn().mockResolvedValue({ data: 'success' })
      const wrappedAction = withRole(['admin', 'moderator', 'editor'], mockAction)

      const result = await wrappedAction('arg1', 'arg2')

      expect(mockAction).toHaveBeenCalledWith(mockSession, 'arg1', 'arg2')
      expect(result).toEqual({ data: 'success' })
    })

    it('should handle user with no roles', async () => {
      const mockSession: Session = {
        accessToken: 'mock-jwt-token',
        user: { id: '123', email: 'user@example.com', roles: [] },
        expires: '2025-12-31',
      }

      vi.mocked(getServerSession).mockResolvedValueOnce(mockSession)

      const mockAction = vi.fn()
      const wrappedAction = withRole('admin', mockAction)

      await expect(wrappedAction()).rejects.toThrow('Forbidden - Requires one of: admin')
      expect(mockAction).not.toHaveBeenCalled()
    })

    it('should handle user with undefined roles', async () => {
      const mockSession: Session = {
        accessToken: 'mock-jwt-token',
        user: { id: '123', email: 'user@example.com', roles: undefined as unknown as string[] },
        expires: '2025-12-31',
      }

      vi.mocked(getServerSession).mockResolvedValueOnce(mockSession)

      const mockAction = vi.fn()
      const wrappedAction = withRole('admin', mockAction)

      await expect(wrappedAction()).rejects.toThrow('Forbidden - Requires one of: admin')
      expect(mockAction).not.toHaveBeenCalled()
    })

    it('should pass through action return value', async () => {
      const mockSession: Session = {
        accessToken: 'mock-jwt-token',
        user: { id: '123', email: 'admin@example.com', roles: ['admin'] },
        expires: '2025-12-31',
      }

      vi.mocked(getServerSession).mockResolvedValueOnce(mockSession)

      const action = async (session: Session, id: number) => {
        return { id, userId: session.user.id, count: 100 }
      }

      const wrappedAction = withRole('admin', action)
      const result = await wrappedAction(42)

      expect(result).toEqual({ id: 42, userId: '123', count: 100 })
    })

    it('should be case-sensitive for role matching', async () => {
      const mockSession: Session = {
        accessToken: 'mock-jwt-token',
        user: { id: '123', email: 'admin@example.com', roles: ['Admin'] },
        expires: '2025-12-31',
      }

      vi.mocked(getServerSession).mockResolvedValueOnce(mockSession)

      const mockAction = vi.fn()
      const wrappedAction = withRole('admin', mockAction)

      await expect(wrappedAction()).rejects.toThrow('Forbidden - Requires one of: admin')
      expect(mockAction).not.toHaveBeenCalled()
    })

    it('should propagate errors from wrapped action', async () => {
      const mockSession: Session = {
        accessToken: 'mock-jwt-token',
        user: { id: '123', email: 'admin@example.com', roles: ['admin'] },
        expires: '2025-12-31',
      }

      vi.mocked(getServerSession).mockResolvedValueOnce(mockSession)

      const mockAction = vi.fn().mockRejectedValue(new Error('Database error'))
      const wrappedAction = withRole('admin', mockAction)

      await expect(wrappedAction()).rejects.toThrow('Database error')
    })
  })
})
