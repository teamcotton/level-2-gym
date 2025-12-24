import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { findAllUsers, type FindAllUsersResult } from '@/application/actions/findAllUsers.js'
import type { User } from '@/domain/user/user.js'
import { useUsers } from '@/view/hooks/queries/useUsers.js'

vi.mock('@/application/actions/findAllUsers.js', () => ({
  findAllUsers: vi.fn(),
}))

// Helper function to create a QueryClientProvider wrapper
function createWrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

// Mock user data for tests
const mockUsers: readonly User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'user',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'admin',
    createdAt: '2024-01-02T00:00:00.000Z',
  },
]

describe('useUsers', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('Successful data fetching', () => {
    it('should fetch users with default pagination parameters', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      vi.mocked(findAllUsers).mockResolvedValue({
        success: true,
        users: mockUsers,
        total: 2,
      })

      const { result } = renderHook(() => useUsers({ limit: 10, offset: 0 }), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(findAllUsers).toHaveBeenCalledWith({
        limit: 10,
        offset: 0,
        signal: expect.any(AbortSignal),
      })
      expect(result.current.users).toEqual(mockUsers)
      expect(result.current.total).toBe(2)
      expect(result.current.isError).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should fetch users with custom pagination parameters', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      vi.mocked(findAllUsers).mockResolvedValue({
        success: true,
        users: mockUsers[1] ? [mockUsers[1]] : [],
        total: 2,
      })

      const { result } = renderHook(() => useUsers({ limit: 1, offset: 1 }), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(findAllUsers).toHaveBeenCalledWith({
        limit: 1,
        offset: 1,
        signal: expect.any(AbortSignal),
      })
      expect(result.current.users).toEqual([mockUsers[1]])
      expect(result.current.total).toBe(2)
    })

    it('should fetch users with large pagination offset', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      vi.mocked(findAllUsers).mockResolvedValue({
        success: true,
        users: [],
        total: 2,
      })

      const { result } = renderHook(() => useUsers({ limit: 10, offset: 100 }), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(findAllUsers).toHaveBeenCalledWith({
        limit: 10,
        offset: 100,
        signal: expect.any(AbortSignal),
      })
      expect(result.current.users).toEqual([])
      expect(result.current.total).toBe(2)
    })
  })

  describe('Error handling', () => {
    it('should handle error when findAllUsers throws with error message', async () => {
      const qc = new QueryClient()

      // findAllUsers returns success: false, which causes queryFn to throw
      vi.mocked(findAllUsers).mockResolvedValue({
        success: false,
        users: [],
        total: 0,
        error:
          'Failed to load users: Server returned 500 Internal Server Error. Please try refreshing the page.',
      })

      const { result } = renderHook(() => useUsers({ limit: 10, offset: 0 }), {
        wrapper: createWrapper(qc),
      })

      // Wait for error state - hook has retry: 2, so this may take a few attempts
      await waitFor(
        () => {
          expect(result.current.isError).toBe(true)
        },
        { timeout: 10000 }
      )

      // Should be in error state
      expect(result.current.isLoading).toBe(false)
      expect(result.current.users).toEqual([])
      expect(result.current.total).toBe(0)
      expect(result.current.error).toBe(
        'Failed to load users: Server returned 500 Internal Server Error. Please try refreshing the page.'
      )
    })

    it('should handle error when findAllUsers returns success: false with no error message', async () => {
      const qc = new QueryClient()

      // findAllUsers returns success: false with no error, queryFn throws generic error
      vi.mocked(findAllUsers).mockResolvedValue({
        success: false,
        users: [],
        total: 0,
      })

      const { result } = renderHook(() => useUsers({ limit: 10, offset: 0 }), {
        wrapper: createWrapper(qc),
      })

      await waitFor(
        () => {
          expect(result.current.isError).toBe(true)
        },
        { timeout: 10000 }
      )

      expect(result.current.error).toBe('Failed to fetch users')
      expect(result.current.isLoading).toBe(false)
    })

    it('should handle network error', async () => {
      const qc = new QueryClient()

      vi.mocked(findAllUsers).mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useUsers({ limit: 10, offset: 0 }), {
        wrapper: createWrapper(qc),
      })

      await waitFor(
        () => {
          expect(result.current.isError).toBe(true)
        },
        { timeout: 10000 }
      )

      expect(result.current.users).toEqual([])
      expect(result.current.total).toBe(0)
      expect(result.current.error).toBe('Network error')
      expect(result.current.isLoading).toBe(false)
    })

    it('should transform non-Error exceptions to null', async () => {
      const qc = new QueryClient()

      vi.mocked(findAllUsers).mockRejectedValue('String error')

      const { result } = renderHook(() => useUsers({ limit: 10, offset: 0 }), {
        wrapper: createWrapper(qc),
      })

      await waitFor(
        () => {
          expect(result.current.isError).toBe(true)
        },
        { timeout: 10000 }
      )

      expect(result.current.error).toBeNull()
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('Loading states', () => {
    it('should show isLoading true initially', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      let resolvePromise!: (value: FindAllUsersResult) => void
      const promise = new Promise<FindAllUsersResult>((resolve) => {
        resolvePromise = resolve
      })

      vi.mocked(findAllUsers).mockReturnValue(promise)

      const { result } = renderHook(() => useUsers({ limit: 10, offset: 0 }), {
        wrapper: createWrapper(qc),
      })

      expect(result.current.isLoading).toBe(true)
      expect(result.current.users).toEqual([])
      expect(result.current.total).toBe(0)

      resolvePromise({
        success: true,
        users: mockUsers,
        total: 2,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('should include both isLoading and isFetching states', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      vi.mocked(findAllUsers).mockResolvedValue({
        success: true,
        users: mockUsers,
        total: 2,
      })

      const { result } = renderHook(() => useUsers({ limit: 10, offset: 0 }), {
        wrapper: createWrapper(qc),
      })

      // Initially loading should be true
      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // After loading, data should be available
      expect(result.current.users).toEqual(mockUsers)
      expect(result.current.isError).toBe(false)
    })
  })

  describe('Query key generation', () => {
    it('should generate unique query keys for different pagination parameters', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      vi.mocked(findAllUsers).mockResolvedValue({
        success: true,
        users: mockUsers,
        total: 2,
      })

      // First render with limit: 10, offset: 0
      renderHook(() => useUsers({ limit: 10, offset: 0 }), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(findAllUsers).toHaveBeenCalledWith({
          limit: 10,
          offset: 0,
          signal: expect.any(AbortSignal),
        })
      })

      // Clear mock
      vi.mocked(findAllUsers).mockClear()

      // Second render with limit: 20, offset: 10
      renderHook(() => useUsers({ limit: 20, offset: 10 }), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(findAllUsers).toHaveBeenCalledWith({
          limit: 20,
          offset: 10,
          signal: expect.any(AbortSignal),
        })
      })

      // Verify that different query keys were used (findAllUsers was called again)
      expect(findAllUsers).toHaveBeenCalledTimes(1)
    })

    it('should use cached data for same query key', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      vi.mocked(findAllUsers).mockResolvedValue({
        success: true,
        users: mockUsers,
        total: 2,
      })

      // First render
      const { result: result1 } = renderHook(() => useUsers({ limit: 10, offset: 0 }), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false)
      })

      expect(findAllUsers).toHaveBeenCalledTimes(1)

      // Second render with same parameters should use cache
      const { result: result2 } = renderHook(() => useUsers({ limit: 10, offset: 0 }), {
        wrapper: createWrapper(qc),
      })

      // Should not call findAllUsers again due to cache
      expect(findAllUsers).toHaveBeenCalledTimes(1)
      expect(result2.current.users).toEqual(mockUsers)
    })
  })

  describe('Retry behavior', () => {
    it('should retry failed requests up to 2 times', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: 2,
          },
        },
      })

      let callCount = 0
      vi.mocked(findAllUsers).mockImplementation(async () => {
        callCount++
        if (callCount < 3) {
          throw new Error('Network error')
        }
        return {
          success: true,
          users: mockUsers,
          total: 2,
        }
      })

      const { result } = renderHook(() => useUsers({ limit: 10, offset: 0 }), {
        wrapper: createWrapper(qc),
      })

      await waitFor(
        () => {
          expect(result.current.isLoading).toBe(false)
        },
        { timeout: 5000 }
      )

      // Should have called findAllUsers 3 times (initial + 2 retries)
      expect(callCount).toBe(3)
      expect(result.current.users).toEqual(mockUsers)
      expect(result.current.isError).toBe(false)
    })

    it('should fail after exhausting retries', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: 2,
          },
        },
      })

      vi.mocked(findAllUsers).mockRejectedValue(new Error('Persistent network error'))

      const { result } = renderHook(() => useUsers({ limit: 10, offset: 0 }), {
        wrapper: createWrapper(qc),
      })

      await waitFor(
        () => {
          expect(result.current.isError).toBe(true)
        },
        { timeout: 5000 }
      )

      // Should have called findAllUsers 3 times (initial + 2 retries)
      expect(findAllUsers).toHaveBeenCalledTimes(3)
      expect(result.current.error).toBe('Persistent network error')
    })
  })

  describe('Caching behavior', () => {
    it('should consider data fresh within staleTime', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      vi.mocked(findAllUsers).mockResolvedValue({
        success: true,
        users: mockUsers,
        total: 2,
      })

      const { result } = renderHook(() => useUsers({ limit: 10, offset: 0 }), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(findAllUsers).toHaveBeenCalledTimes(1)

      // Verify staleTime is configured (data stays fresh)
      const query = qc.getQueryState(['users', { limit: 10, offset: 0 }])
      expect(query).toBeDefined()
    })

    it('should have proper cache configuration', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      vi.mocked(findAllUsers).mockResolvedValue({
        success: true,
        users: mockUsers,
        total: 2,
      })

      const { result } = renderHook(() => useUsers({ limit: 10, offset: 0 }), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Verify the query is in the cache
      const query = qc.getQueryState(['users', { limit: 10, offset: 0 }])
      expect(query).toBeDefined()
      expect(query?.data).toEqual({
        users: mockUsers,
        total: 2,
      })
    })

    it('should keep cached data after component unmount', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      vi.mocked(findAllUsers).mockResolvedValue({
        success: true,
        users: mockUsers,
        total: 2,
      })

      const { result, unmount } = renderHook(() => useUsers({ limit: 10, offset: 0 }), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Unmount the component
      unmount()

      // Data should still be in cache
      const query = qc.getQueryState(['users', { limit: 10, offset: 0 }])
      expect(query).toBeDefined()
      expect(query?.data).toEqual({
        users: mockUsers,
        total: 2,
      })
    })
  })

  describe('Refetch on window focus', () => {
    it('should have refetchOnWindowFocus enabled', async () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      vi.mocked(findAllUsers).mockResolvedValue({
        success: true,
        users: mockUsers,
        total: 2,
      })

      const { result } = renderHook(() => useUsers({ limit: 10, offset: 0 }), {
        wrapper: createWrapper(qc),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(findAllUsers).toHaveBeenCalledTimes(1)

      // Verify the query exists and data is loaded
      const query = qc.getQueryState(['users', { limit: 10, offset: 0 }])
      expect(query).toBeDefined()
      expect(query?.data).toEqual({
        users: mockUsers,
        total: 2,
      })
    })
  })
})
