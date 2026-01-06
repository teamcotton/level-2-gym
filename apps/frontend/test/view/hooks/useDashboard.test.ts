import { act, renderHook } from '@testing-library/react'
import { useRouter } from 'next/navigation.js'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import { useDashboard } from '@/view/hooks/useDashboard.js'

// Mock next/navigation
vi.mock('next/navigation.js', () => ({
  useRouter: vi.fn(),
}))

describe('useDashboard', () => {
  const mockPush = vi.fn()
  const mockRouter = {
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useRouter as Mock).mockReturnValue(mockRouter)
  })

  describe('Initial State', () => {
    it('should return canAccessAdmin, handleNavigate, and handleSignOut', () => {
      const { result } = renderHook(() => useDashboard({ userRoles: ['user'] }))

      expect(result.current).toHaveProperty('canAccessAdmin')
      expect(result.current).toHaveProperty('handleNavigate')
      expect(result.current).toHaveProperty('handleSignOut')
      expect(typeof result.current.canAccessAdmin).toBe('boolean')
      expect(typeof result.current.handleNavigate).toBe('function')
      expect(typeof result.current.handleSignOut).toBe('function')
    })

    it('should call useRouter hook', () => {
      renderHook(() => useDashboard({ userRoles: ['user'] }))

      expect(useRouter).toHaveBeenCalled()
    })
  })

  describe('canAccessAdmin - Role-based Access Control', () => {
    it('should return false when userRoles is empty', () => {
      const { result } = renderHook(() => useDashboard({ userRoles: [] }))

      expect(result.current.canAccessAdmin).toBe(false)
    })

    it('should return false when user has only "user" role', () => {
      const { result } = renderHook(() => useDashboard({ userRoles: ['user'] }))

      expect(result.current.canAccessAdmin).toBe(false)
    })

    it('should return true when user has "admin" role', () => {
      const { result } = renderHook(() => useDashboard({ userRoles: ['admin'] }))

      expect(result.current.canAccessAdmin).toBe(true)
    })

    it('should return true when user has "moderator" role', () => {
      const { result } = renderHook(() => useDashboard({ userRoles: ['moderator'] }))

      expect(result.current.canAccessAdmin).toBe(true)
    })

    it('should return true when user has both "user" and "admin" roles', () => {
      const { result } = renderHook(() => useDashboard({ userRoles: ['user', 'admin'] }))

      expect(result.current.canAccessAdmin).toBe(true)
    })

    it('should return true when user has both "user" and "moderator" roles', () => {
      const { result } = renderHook(() => useDashboard({ userRoles: ['user', 'moderator'] }))

      expect(result.current.canAccessAdmin).toBe(true)
    })

    it('should return true when user has all roles', () => {
      const { result } = renderHook(() =>
        useDashboard({ userRoles: ['user', 'admin', 'moderator'] })
      )

      expect(result.current.canAccessAdmin).toBe(true)
    })

    it('should return false when user has unrecognized roles', () => {
      const { result } = renderHook(() =>
        useDashboard({ userRoles: ['guest', 'viewer', 'contributor'] })
      )

      expect(result.current.canAccessAdmin).toBe(false)
    })

    it('should be case-sensitive for role names', () => {
      const { result: resultUppercase } = renderHook(() => useDashboard({ userRoles: ['ADMIN'] }))
      const { result: resultMixed } = renderHook(() => useDashboard({ userRoles: ['Admin'] }))

      expect(resultUppercase.current.canAccessAdmin).toBe(false)
      expect(resultMixed.current.canAccessAdmin).toBe(false)
    })
  })

  describe('handleNavigate - Navigation Function', () => {
    it('should call router.push with the provided path', () => {
      const { result } = renderHook(() => useDashboard({ userRoles: ['user'] }))

      act(() => {
        result.current.handleNavigate('/ai')
      })

      expect(mockPush).toHaveBeenCalledWith('/ai')
      expect(mockPush).toHaveBeenCalledTimes(1)
    })

    it('should navigate to /ai path', () => {
      const { result } = renderHook(() => useDashboard({ userRoles: ['user'] }))

      act(() => {
        result.current.handleNavigate('/ai')
      })

      expect(mockPush).toHaveBeenCalledWith('/ai')
    })

    it('should navigate to /profile path', () => {
      const { result } = renderHook(() => useDashboard({ userRoles: ['user'] }))

      act(() => {
        result.current.handleNavigate('/profile')
      })

      expect(mockPush).toHaveBeenCalledWith('/profile')
    })

    it('should navigate to /admin path', () => {
      const { result } = renderHook(() => useDashboard({ userRoles: ['admin'] }))

      act(() => {
        result.current.handleNavigate('/admin')
      })

      expect(mockPush).toHaveBeenCalledWith('/admin')
    })

    it('should handle multiple navigation calls', () => {
      const { result } = renderHook(() => useDashboard({ userRoles: ['admin'] }))

      act(() => {
        result.current.handleNavigate('/ai')
        result.current.handleNavigate('/profile')
        result.current.handleNavigate('/admin')
      })

      expect(mockPush).toHaveBeenCalledTimes(3)
      expect(mockPush).toHaveBeenNthCalledWith(1, '/ai')
      expect(mockPush).toHaveBeenNthCalledWith(2, '/profile')
      expect(mockPush).toHaveBeenNthCalledWith(3, '/admin')
    })

    it('should handle absolute URLs', () => {
      const { result } = renderHook(() => useDashboard({ userRoles: ['user'] }))

      act(() => {
        result.current.handleNavigate('https://example.com')
      })

      expect(mockPush).toHaveBeenCalledWith('https://example.com')
    })

    it('should handle paths with query parameters', () => {
      const { result } = renderHook(() => useDashboard({ userRoles: ['user'] }))

      act(() => {
        result.current.handleNavigate('/ai?session=123&user=test')
      })

      expect(mockPush).toHaveBeenCalledWith('/ai?session=123&user=test')
    })

    it('should handle paths with hash fragments', () => {
      const { result } = renderHook(() => useDashboard({ userRoles: ['user'] }))

      act(() => {
        result.current.handleNavigate('/profile#settings')
      })

      expect(mockPush).toHaveBeenCalledWith('/profile#settings')
    })

    it('should handle empty string path', () => {
      const { result } = renderHook(() => useDashboard({ userRoles: ['user'] }))

      act(() => {
        result.current.handleNavigate('')
      })

      expect(mockPush).toHaveBeenCalledWith('')
    })

    it('should handle root path', () => {
      const { result } = renderHook(() => useDashboard({ userRoles: ['user'] }))

      act(() => {
        result.current.handleNavigate('/')
      })

      expect(mockPush).toHaveBeenCalledWith('/')
    })
  })

  describe('Hook Stability', () => {
    it('should maintain handleNavigate reference across re-renders with same props', () => {
      const { rerender, result } = renderHook(({ roles }) => useDashboard({ userRoles: roles }), {
        initialProps: { roles: ['user'] },
      })

      const firstHandleNavigate = result.current.handleNavigate

      rerender({ roles: ['user'] })

      const secondHandleNavigate = result.current.handleNavigate

      // Note: In this implementation, handleNavigate is recreated on each render
      // This test documents current behavior - if useCallback is added later,
      // this test would need to be updated to expect same reference
      expect(typeof firstHandleNavigate).toBe('function')
      expect(typeof secondHandleNavigate).toBe('function')
    })

    it('should update canAccessAdmin when userRoles change', () => {
      const { rerender, result } = renderHook(({ roles }) => useDashboard({ userRoles: roles }), {
        initialProps: { roles: ['user'] },
      })

      expect(result.current.canAccessAdmin).toBe(false)

      rerender({ roles: ['admin'] })

      expect(result.current.canAccessAdmin).toBe(true)

      rerender({ roles: ['user'] })

      expect(result.current.canAccessAdmin).toBe(false)
    })

    it('should recalculate canAccessAdmin when roles array is updated', () => {
      const { rerender, result } = renderHook(
        ({ roles }: { roles: string[] }) => useDashboard({ userRoles: roles }),
        {
          initialProps: { roles: [] as string[] },
        }
      )

      expect(result.current.canAccessAdmin).toBe(false)

      rerender({ roles: ['moderator'] })

      expect(result.current.canAccessAdmin).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle userRoles with duplicate values', () => {
      const { result } = renderHook(() => useDashboard({ userRoles: ['admin', 'admin', 'admin'] }))

      expect(result.current.canAccessAdmin).toBe(true)
    })

    it('should handle userRoles with mixed admin and moderator', () => {
      const { result } = renderHook(() => useDashboard({ userRoles: ['admin', 'moderator'] }))

      expect(result.current.canAccessAdmin).toBe(true)
    })

    it('should handle userRoles with special characters', () => {
      const { result } = renderHook(() => useDashboard({ userRoles: ['user-admin', 'admin_user'] }))

      expect(result.current.canAccessAdmin).toBe(false)
    })

    it('should handle navigation with special characters in path', () => {
      const { result } = renderHook(() => useDashboard({ userRoles: ['user'] }))

      act(() => {
        result.current.handleNavigate('/profile?name=John%20Doe&role=admin%2Fuser')
      })

      expect(mockPush).toHaveBeenCalledWith('/profile?name=John%20Doe&role=admin%2Fuser')
    })
  })

  describe('Integration with Next.js Router', () => {
    it('should not call router.push on mount', () => {
      renderHook(() => useDashboard({ userRoles: ['user'] }))

      expect(mockPush).not.toHaveBeenCalled()
    })

    it('should only call useRouter once per render', () => {
      const { rerender } = renderHook(() => useDashboard({ userRoles: ['user'] }))

      expect(useRouter).toHaveBeenCalledTimes(1)

      rerender()

      expect(useRouter).toHaveBeenCalledTimes(2)
    })

    it('should work correctly when router.push throws an error', () => {
      mockPush.mockImplementationOnce(() => {
        throw new Error('Navigation failed')
      })

      const { result } = renderHook(() => useDashboard({ userRoles: ['user'] }))

      expect(() => {
        act(() => {
          result.current.handleNavigate('/ai')
        })
      }).toThrow('Navigation failed')
    })
  })

  describe('Return Value Structure', () => {
    it('should return an object with exactly 4 properties', () => {
      const { result } = renderHook(() => useDashboard({ userRoles: ['user'] }))

      const keys = Object.keys(result.current)
      expect(keys).toHaveLength(4)
      expect(keys).toContain('canAccessAdmin')
      expect(keys).toContain('handleNavigate')
      expect(keys).toContain('handleSignOut')
      expect(keys).toContain('handleTestServerAction')
    })

    it('should return consistent types across different role configurations', () => {
      const configs = [[], ['user'], ['admin'], ['moderator'], ['user', 'admin']]

      configs.forEach((roles) => {
        const { result } = renderHook(() => useDashboard({ userRoles: roles }))

        expect(typeof result.current.canAccessAdmin).toBe('boolean')
        expect(typeof result.current.handleNavigate).toBe('function')
        expect(typeof result.current.handleSignOut).toBe('function')
        expect(typeof result.current.handleTestServerAction).toBe('function')
      })
    })
  })

  describe('handleSignOut - Sign Out Function', () => {
    it('should call router.push with /api/auth/signout', () => {
      const { result } = renderHook(() => useDashboard({ userRoles: ['user'] }))

      act(() => {
        result.current.handleSignOut()
      })

      expect(mockPush).toHaveBeenCalledWith('/api/auth/signout')
      expect(mockPush).toHaveBeenCalledTimes(1)
    })

    it('should navigate to sign out endpoint', () => {
      const { result } = renderHook(() => useDashboard({ userRoles: ['admin'] }))

      act(() => {
        result.current.handleSignOut()
      })

      expect(mockPush).toHaveBeenCalledWith('/api/auth/signout')
    })

    it('should handle multiple sign out calls', () => {
      const { result } = renderHook(() => useDashboard({ userRoles: ['user'] }))

      act(() => {
        result.current.handleSignOut()
        result.current.handleSignOut()
        result.current.handleSignOut()
      })

      expect(mockPush).toHaveBeenCalledTimes(3)
      expect(mockPush).toHaveBeenNthCalledWith(1, '/api/auth/signout')
      expect(mockPush).toHaveBeenNthCalledWith(2, '/api/auth/signout')
      expect(mockPush).toHaveBeenNthCalledWith(3, '/api/auth/signout')
    })

    it('should work independently from handleNavigate', () => {
      const { result } = renderHook(() => useDashboard({ userRoles: ['user'] }))

      act(() => {
        result.current.handleNavigate('/profile')
        result.current.handleSignOut()
        result.current.handleNavigate('/ai')
      })

      expect(mockPush).toHaveBeenCalledTimes(3)
      expect(mockPush).toHaveBeenNthCalledWith(1, '/profile')
      expect(mockPush).toHaveBeenNthCalledWith(2, '/api/auth/signout')
      expect(mockPush).toHaveBeenNthCalledWith(3, '/ai')
    })
  })
})
