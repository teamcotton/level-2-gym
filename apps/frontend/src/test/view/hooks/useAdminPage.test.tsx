import type { GridPaginationModel } from '@mui/x-data-grid'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { findAllUsers } from '@/application/actions/findAllUsers.js'
import type { User } from '@/domain/user/user.js'
import { useAdminPage } from '@/view/hooks/useAdminPage.js'

/**
 * Tests for useAdminPage hook
 *
 * Note: This hook uses TanStack Query's useUsers hook internally for data fetching.
 * AbortController/request cancellation tests are not included here because:
 * 1. TanStack Query manages request cancellation automatically (library-tested)
 * 2. Signal passing verification is covered in useUsers.test.tsx
 * 3. These tests focus on useAdminPage's specific responsibilities:
 *    pagination state, search state, and data orchestration
 */

// Mock the findAllUsers action
vi.mock('@/application/actions/findAllUsers.js')

const mockFindAllUsers = vi.mocked(findAllUsers)

// Helper function to create a QueryClientProvider wrapper
function createWrapper(client?: QueryClient) {
  const queryClient =
    client ||
    new QueryClient({
      defaultOptions: {
        queries: {
          retry: false, // NOTE: This is overridden by useUsers hook which has retry: 2
        },
        mutations: {
          retry: false,
        },
      },
    })

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useAdminPage', () => {
  const mockUsers: readonly User[] = [
    {
      id: '1',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin',
      createdAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: '2',
      email: 'user@example.com',
      name: 'Regular User',
      role: 'user',
      createdAt: '2024-01-02T00:00:00.000Z',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should initialize with empty users array', async () => {
      mockFindAllUsers.mockResolvedValueOnce({
        success: true,
        users: [],
        total: 0,
      })

      const { result } = renderHook(() => useAdminPage(), { wrapper: createWrapper() })

      await waitFor(() => {
        expect(result.current.users).toEqual([])
      })
    })

    it('should initialize with loading state as true', async () => {
      mockFindAllUsers.mockResolvedValueOnce({
        success: true,
        users: mockUsers,
        total: 2,
      })

      const { result } = renderHook(() => useAdminPage(), { wrapper: createWrapper() })

      expect(result.current.loading).toBe(true)
    })

    it('should initialize with no error', async () => {
      mockFindAllUsers.mockResolvedValueOnce({
        success: true,
        users: mockUsers,
        total: 2,
      })

      const { result } = renderHook(() => useAdminPage(), { wrapper: createWrapper() })
      await waitFor(() => {
        expect(result.current.error).toBeNull()
      })
    })

    it('should initialize with empty search query', () => {
      mockFindAllUsers.mockResolvedValueOnce({
        success: true,
        users: mockUsers,
        total: 2,
      })

      const { result } = renderHook(() => useAdminPage(), { wrapper: createWrapper() })

      expect(result.current.searchQuery).toBe('')
    })

    it('should initialize with default pagination model', () => {
      mockFindAllUsers.mockResolvedValueOnce({
        success: true,
        users: mockUsers,
        total: 2,
      })

      const { result } = renderHook(() => useAdminPage(), { wrapper: createWrapper() })

      expect(result.current.paginationModel).toEqual({
        page: 0,
        pageSize: 10,
      })
    })

    it('should initialize with rowCount as 0', async () => {
      mockFindAllUsers.mockResolvedValueOnce({
        success: true,
        users: mockUsers,
        total: 2,
      })

      const { result } = renderHook(() => useAdminPage(), { wrapper: createWrapper() })

      await waitFor(() => {
        expect(result.current.rowCount).toBe(0)
      })
    })

    it('should initialize with admin role', () => {
      mockFindAllUsers.mockResolvedValueOnce({
        success: true,
        users: mockUsers,
        total: 2,
      })

      const { result } = renderHook(() => useAdminPage(), { wrapper: createWrapper() })

      expect(result.current.currentUserRole).toBe('admin')
    })

    it('should provide all required handlers', () => {
      mockFindAllUsers.mockResolvedValueOnce({
        success: true,
        users: mockUsers,
        total: 2,
      })

      const { result } = renderHook(() => useAdminPage(), { wrapper: createWrapper() })

      expect(result.current.handleSearchChange).toBeDefined()
      expect(result.current.handlePaginationChange).toBeDefined()
      expect(typeof result.current.handleSearchChange).toBe('function')
      expect(typeof result.current.handlePaginationChange).toBe('function')
    })
  })

  describe('Data Fetching - Success Cases', () => {
    it('should fetch users on mount with default pagination', async () => {
      mockFindAllUsers.mockResolvedValueOnce({
        success: true,
        users: mockUsers,
        total: 2,
      })

      renderHook(() => useAdminPage(), { wrapper: createWrapper() })

      await waitFor(() => {
        expect(mockFindAllUsers).toHaveBeenCalledTimes(1)
        expect(mockFindAllUsers).toHaveBeenCalledWith(
          expect.objectContaining({
            limit: 10,
            offset: 0,
          })
        )
      })
    })

    it('should update users state after successful fetch', async () => {
      mockFindAllUsers.mockResolvedValueOnce({
        success: true,
        users: mockUsers,
        total: 2,
      })

      const { result } = renderHook(() => useAdminPage(), { wrapper: createWrapper() })

      await waitFor(() => {
        expect(result.current.users).toEqual(mockUsers)
      })
    })

    it('should update rowCount after successful fetch', async () => {
      mockFindAllUsers.mockResolvedValueOnce({
        success: true,
        users: mockUsers,
        total: 2,
      })

      const { result } = renderHook(() => useAdminPage(), { wrapper: createWrapper() })

      await waitFor(() => {
        expect(result.current.rowCount).toBe(2)
      })
    })

    it('should set loading to false after successful fetch', async () => {
      mockFindAllUsers.mockResolvedValueOnce({
        success: true,
        users: mockUsers,
        total: 2,
      })

      const { result } = renderHook(() => useAdminPage(), { wrapper: createWrapper() })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
    })

    it('should clear any previous errors after successful fetch', async () => {
      // First call fails (plus 2 retries = 3 total calls)
      mockFindAllUsers.mockResolvedValue({
        success: false,
        users: [],
        total: 0,
        error: 'Network error',
      })

      const { result } = renderHook(() => useAdminPage(), { wrapper: createWrapper() })

      await waitFor(
        () => {
          expect(result.current.error).toBe('Network error')
        },
        { timeout: 5000 }
      )

      // Clear the mock and set up success response
      mockFindAllUsers.mockClear()
      mockFindAllUsers.mockResolvedValue({
        success: true,
        users: mockUsers,
        total: 2,
      })

      // Trigger re-fetch by changing pagination
      act(() => {
        result.current.handlePaginationChange({ page: 1, pageSize: 10 })
      })

      await waitFor(() => {
        expect(result.current.error).toBeNull()
      })
    })

    it('should handle empty user list', async () => {
      mockFindAllUsers.mockResolvedValueOnce({
        success: true,
        users: [],
        total: 0,
      })

      const { result } = renderHook(() => useAdminPage(), { wrapper: createWrapper() })

      await waitFor(() => {
        expect(result.current.users).toEqual([])
        expect(result.current.rowCount).toBe(0)
        expect(result.current.loading).toBe(false)
        expect(result.current.error).toBeNull()
      })
    })

    it('should handle large user list', async () => {
      const largeUserList: User[] = Array.from({ length: 100 }, (_, i) => ({
        id: `${i + 1}`,
        email: `user${i + 1}@example.com`,
        name: `User ${i + 1}`,
        role: i % 3 === 0 ? 'admin' : i % 3 === 1 ? 'moderator' : 'user',
        createdAt: '2024-01-01T00:00:00.000Z',
      })) as User[]

      mockFindAllUsers.mockResolvedValueOnce({
        success: true,
        users: largeUserList,
        total: 100,
      })

      const { result } = renderHook(() => useAdminPage(), { wrapper: createWrapper() })

      await waitFor(() => {
        expect(result.current.users).toHaveLength(100)
        expect(result.current.rowCount).toBe(100)
      })
    })
  })

  describe('Data Fetching - Error Cases', () => {
    it('should handle fetch failure with error message', async () => {
      // Mock failure for all retry attempts - useUsers hook has retry: 2, so 3 total attempts
      // We use mockResolvedValue (not mockResolvedValueOnce) to cover initial + 2 retry attempts
      mockFindAllUsers.mockResolvedValue({
        success: false,
        users: [],
        total: 0,
        error: 'Failed to fetch users from server',
      })

      const { result } = renderHook(() => useAdminPage(), { wrapper: createWrapper() })

      // Wait for the query to complete all retries (5000ms timeout accounts for retry delays)
      await waitFor(
        () => {
          expect(result.current.loading).toBe(false)
        },
        { timeout: 10000 }
      )

      // Now check the error
      expect(result.current.error).toBe('Failed to fetch users from server')
    })

    it('should clear users on fetch failure', async () => {
      mockFindAllUsers.mockResolvedValueOnce({
        success: false,
        users: [],
        total: 0,
        error: 'Network error',
      })

      const { result } = renderHook(() => useAdminPage(), { wrapper: createWrapper() })

      await waitFor(() => {
        expect(result.current.users).toEqual([])
      })
    })

    it('should reset rowCount to 0 on fetch failure', async () => {
      mockFindAllUsers.mockResolvedValueOnce({
        success: false,
        users: [],
        total: 0,
        error: 'Server error',
      })

      const { result } = renderHook(() => useAdminPage(), { wrapper: createWrapper() })

      await waitFor(() => {
        expect(result.current.rowCount).toBe(0)
      })
    })

    it('should set loading to false after fetch failure', async () => {
      // Mock failure for all retry attempts (initial + 2 retries = 3 total)
      mockFindAllUsers.mockResolvedValue({
        success: false,
        users: [],
        total: 0,
        error: 'Failed to load',
      })

      const { result } = renderHook(() => useAdminPage(), { wrapper: createWrapper() })

      await waitFor(
        () => {
          expect(result.current.loading).toBe(false)
        },
        { timeout: 5000 }
      )
    })

    it('should use fallback error message when error is undefined', async () => {
      // Mock failure for all retry attempts (initial + 2 retries = 3 total)
      mockFindAllUsers.mockResolvedValue({
        success: false,
        users: [],
        total: 0,
      })

      const { result } = renderHook(() => useAdminPage(), { wrapper: createWrapper() })

      await waitFor(
        () => {
          expect(result.current.error).toBe('Failed to fetch users')
        },
        { timeout: 5000 }
      )
    })

    it('should handle network timeout error', async () => {
      // Mock failure for all retry attempts (initial + 2 retries = 3 total)
      mockFindAllUsers.mockResolvedValue({
        success: false,
        users: [],
        total: 0,
        error: 'Request timeout after 30 seconds',
      })

      const { result } = renderHook(() => useAdminPage(), { wrapper: createWrapper() })

      await waitFor(
        () => {
          expect(result.current.error).toBe('Request timeout after 30 seconds')
          expect(result.current.users).toEqual([])
          expect(result.current.loading).toBe(false)
        },
        { timeout: 5000 }
      )
    })

    it('should handle 404 error', async () => {
      // Mock failure for all retry attempts (initial + 2 retries = 3 total)
      mockFindAllUsers.mockResolvedValue({
        success: false,
        users: [],
        total: 0,
        error: 'HTTP 404: Resource not found',
      })

      const { result } = renderHook(() => useAdminPage(), { wrapper: createWrapper() })

      await waitFor(
        () => {
          expect(result.current.error).toBe('HTTP 404: Resource not found')
        },
        { timeout: 5000 }
      )
    })

    it('should handle 500 server error', async () => {
      // Mock failure for all retry attempts (initial + 2 retries = 3 total)
      mockFindAllUsers.mockResolvedValue({
        success: false,
        users: [],
        total: 0,
        error: 'HTTP 500: Internal server error',
      })

      const { result } = renderHook(() => useAdminPage(), { wrapper: createWrapper() })

      await waitFor(
        () => {
          expect(result.current.error).toBe('HTTP 500: Internal server error')
        },
        { timeout: 5000 }
      )
    })
  })

  describe('Pagination Handling', () => {
    it('should update pagination model when handlePaginationChange is called', async () => {
      mockFindAllUsers.mockResolvedValue({
        success: true,
        users: mockUsers,
        total: 2,
      })

      const { result } = renderHook(() => useAdminPage(), { wrapper: createWrapper() })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const newModel: GridPaginationModel = { page: 1, pageSize: 20 }

      act(() => {
        result.current.handlePaginationChange(newModel)
      })

      await waitFor(() => {
        expect(result.current.paginationModel).toEqual(newModel)
      })
    })

    it('should trigger new fetch when pagination changes', async () => {
      mockFindAllUsers.mockResolvedValue({
        success: true,
        users: mockUsers,
        total: 2,
      })

      const { result } = renderHook(() => useAdminPage(), { wrapper: createWrapper() })

      await waitFor(() => {
        expect(mockFindAllUsers).toHaveBeenCalledTimes(1)
      })

      act(() => {
        result.current.handlePaginationChange({ page: 1, pageSize: 10 })
      })

      await waitFor(() => {
        expect(mockFindAllUsers).toHaveBeenCalledTimes(2)
      })
    })

    it('should calculate correct offset when page changes', async () => {
      mockFindAllUsers.mockResolvedValue({
        success: true,
        users: mockUsers,
        total: 2,
      })

      const { result } = renderHook(() => useAdminPage(), { wrapper: createWrapper() })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.handlePaginationChange({ page: 2, pageSize: 10 })
      })

      await waitFor(() => {
        expect(mockFindAllUsers).toHaveBeenCalledWith(
          expect.objectContaining({
            limit: 10,
            offset: 20, // page 2 * pageSize 10
          })
        )
      })
    })

    it('should use correct limit when pageSize changes', async () => {
      mockFindAllUsers.mockResolvedValue({
        success: true,
        users: mockUsers,
        total: 2,
      })

      const { result } = renderHook(() => useAdminPage(), { wrapper: createWrapper() })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.handlePaginationChange({ page: 0, pageSize: 25 })
      })

      await waitFor(() => {
        expect(mockFindAllUsers).toHaveBeenCalledWith(
          expect.objectContaining({
            limit: 25,
            offset: 0,
          })
        )
      })
    })

    it('should handle pagination to page 3 with custom page size', async () => {
      mockFindAllUsers.mockResolvedValue({
        success: true,
        users: mockUsers,
        total: 100,
      })

      const { result } = renderHook(() => useAdminPage(), { wrapper: createWrapper() })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.handlePaginationChange({ page: 3, pageSize: 15 })
      })

      await waitFor(() => {
        expect(mockFindAllUsers).toHaveBeenCalledWith(
          expect.objectContaining({
            limit: 15,
            offset: 45, // page 3 * pageSize 15
          })
        )
      })
    })

    it('should set loading to true while fetching new page', async () => {
      mockFindAllUsers.mockResolvedValue({
        success: true,
        users: mockUsers,
        total: 2,
      })

      const { result } = renderHook(() => useAdminPage(), { wrapper: createWrapper() })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.handlePaginationChange({ page: 1, pageSize: 10 })
      })

      // Should be loading immediately after pagination change
      await waitFor(() => {
        expect(result.current.loading).toBe(true)
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
    })

    it('should handle rapid pagination changes', async () => {
      mockFindAllUsers.mockResolvedValue({
        success: true,
        users: mockUsers,
        total: 100,
      })

      const { result } = renderHook(() => useAdminPage(), { wrapper: createWrapper() })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.handlePaginationChange({ page: 1, pageSize: 10 })
        result.current.handlePaginationChange({ page: 2, pageSize: 10 })
        result.current.handlePaginationChange({ page: 3, pageSize: 10 })
      })

      // Should eventually call with the last pagination model
      await waitFor(() => {
        expect(result.current.paginationModel).toEqual({ page: 3, pageSize: 10 })
      })
    })
  })

  describe('Search Handling', () => {
    it('should update search query when handleSearchChange is called', async () => {
      mockFindAllUsers.mockResolvedValue({
        success: true,
        users: mockUsers,
        total: 2,
      })

      const { result } = renderHook(() => useAdminPage(), { wrapper: createWrapper() })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.handleSearchChange('test query')
      })

      await waitFor(() => {
        expect(result.current.searchQuery).toBe('test query')
      })
    })

    it('should update search query with empty string', async () => {
      mockFindAllUsers.mockResolvedValue({
        success: true,
        users: mockUsers,
        total: 2,
      })

      const { result } = renderHook(() => useAdminPage(), { wrapper: createWrapper() })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.handleSearchChange('search')
      })

      expect(result.current.searchQuery).toBe('search')

      act(() => {
        result.current.handleSearchChange('')
      })

      expect(result.current.searchQuery).toBe('')
    })

    it('should handle special characters in search query', async () => {
      mockFindAllUsers.mockResolvedValue({
        success: true,
        users: mockUsers,
        total: 2,
      })

      const { result } = renderHook(() => useAdminPage(), { wrapper: createWrapper() })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.handleSearchChange('test@example.com')
      })

      expect(result.current.searchQuery).toBe('test@example.com')
    })

    it('should not trigger new fetch when search query changes', () => {
      mockFindAllUsers.mockResolvedValue({
        success: true,
        users: mockUsers,
        total: 2,
      })

      const { result } = renderHook(() => useAdminPage(), { wrapper: createWrapper() })

      expect(mockFindAllUsers).toHaveBeenCalledTimes(1)

      act(() => {
        result.current.handleSearchChange('search query')
      })

      // Search is client-side, so no new fetch

      expect(mockFindAllUsers).toHaveBeenCalledTimes(1)
    })

    it('should handle multiple rapid search changes', async () => {
      mockFindAllUsers.mockResolvedValue({
        success: true,
        users: mockUsers,
        total: 2,
      })

      const { result } = renderHook(() => useAdminPage(), { wrapper: createWrapper() })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.handleSearchChange('a')
        result.current.handleSearchChange('ad')
        result.current.handleSearchChange('adm')
        result.current.handleSearchChange('admin')
      })

      await waitFor(() => {
        expect(result.current.searchQuery).toBe('admin')
      })
    })
  })

  describe('Integration - Pagination and Data Fetching', () => {
    it('should preserve search query when pagination changes', async () => {
      mockFindAllUsers.mockResolvedValue({
        success: true,
        users: mockUsers,
        total: 2,
      })

      const { result } = renderHook(() => useAdminPage(), { wrapper: createWrapper() })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.handleSearchChange('test search')
      })

      await waitFor(() => {
        expect(result.current.searchQuery).toBe('test search')
      })

      act(() => {
        result.current.handlePaginationChange({ page: 1, pageSize: 10 })
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.searchQuery).toBe('test search')
    })

    it('should maintain pagination model across failed fetches', async () => {
      mockFindAllUsers.mockResolvedValue({
        success: true,
        users: mockUsers,
        total: 2,
      })

      const { result } = renderHook(() => useAdminPage(), { wrapper: createWrapper() })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Clear and set up failure for all retry attempts
      mockFindAllUsers.mockClear()
      mockFindAllUsers.mockResolvedValue({
        success: false,
        users: [],
        total: 0,
        error: 'Network error',
      })

      act(() => {
        result.current.handlePaginationChange({ page: 1, pageSize: 20 })
      })

      await waitFor(
        () => {
          expect(result.current.loading).toBe(false)
        },
        { timeout: 5000 }
      )

      await waitFor(() => {
        expect(result.current.paginationModel).toEqual({ page: 1, pageSize: 20 })
        expect(result.current.error).toBe('Network error')
      })
    })

    it('should handle successful fetch after failed fetch', async () => {
      // Mock failure for all retry attempts (initial + 2 retries = 3 total)
      mockFindAllUsers.mockResolvedValue({
        success: false,
        users: [],
        total: 0,
        error: 'Initial error',
      })

      const { result } = renderHook(() => useAdminPage(), { wrapper: createWrapper() })

      await waitFor(
        () => {
          expect(result.current.error).toBe('Initial error')
        },
        { timeout: 5000 }
      )

      // Clear and set up success response
      mockFindAllUsers.mockClear()
      mockFindAllUsers.mockResolvedValue({
        success: true,
        users: mockUsers,
        total: 2,
      })

      act(() => {
        result.current.handlePaginationChange({ page: 1, pageSize: 10 })
      })

      await waitFor(() => {
        expect(result.current.error).toBeNull()
        expect(result.current.users).toEqual(mockUsers)
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle pagination with page 0', async () => {
      mockFindAllUsers.mockResolvedValue({
        success: true,
        users: mockUsers,
        total: 2,
      })

      const { result } = renderHook(() => useAdminPage(), { wrapper: createWrapper() })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.handlePaginationChange({ page: 0, pageSize: 10 })
      })

      await waitFor(() => {
        expect(mockFindAllUsers).toHaveBeenCalledWith(
          expect.objectContaining({
            limit: 10,
            offset: 0,
          })
        )
      })
    })

    it('should handle very large page size', async () => {
      mockFindAllUsers.mockResolvedValue({
        success: true,
        users: mockUsers,
        total: 2,
      })

      const { result } = renderHook(() => useAdminPage(), { wrapper: createWrapper() })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.handlePaginationChange({ page: 0, pageSize: 1000 })
      })

      await waitFor(() => {
        expect(mockFindAllUsers).toHaveBeenCalledWith(
          expect.objectContaining({
            limit: 1000,
            offset: 0,
          })
        )
      })
    })

    it('should handle pageSize of 1', async () => {
      mockFindAllUsers.mockResolvedValue({
        success: true,
        users: [mockUsers[0]!],
        total: 2,
      })

      const { result } = renderHook(() => useAdminPage(), { wrapper: createWrapper() })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.handlePaginationChange({ page: 0, pageSize: 1 })
      })

      await waitFor(() => {
        expect(mockFindAllUsers).toHaveBeenCalledWith(
          expect.objectContaining({
            limit: 1,
            offset: 0,
          })
        )
      })
    })

    it('should handle very long search query', async () => {
      mockFindAllUsers.mockResolvedValue({
        success: true,
        users: mockUsers,
        total: 2,
      })

      const { result } = renderHook(() => useAdminPage(), { wrapper: createWrapper() })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const longQuery = 'a'.repeat(1000)

      act(() => {
        result.current.handleSearchChange(longQuery)
      })

      await waitFor(() => {
        expect(result.current.searchQuery).toBe(longQuery)
      })
    })

    it('should handle search query with unicode characters', async () => {
      mockFindAllUsers.mockResolvedValue({
        success: true,
        users: mockUsers,
        total: 2,
      })

      const { result } = renderHook(() => useAdminPage(), { wrapper: createWrapper() })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.handleSearchChange('用户名称 🔍')
      })

      await waitFor(() => {
        expect(result.current.searchQuery).toBe('用户名称 🔍')
      })
    })
  })
})
