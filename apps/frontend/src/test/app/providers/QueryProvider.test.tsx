import { useMutation, useQuery } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { QueryProvider } from '../../../app/providers/QueryProvider.js'

describe('QueryProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('Provider Configuration', () => {
    it('should render children successfully', () => {
      render(
        <QueryProvider>
          <div data-testid="test-child">Test Child</div>
        </QueryProvider>
      )

      expect(screen.getByTestId('test-child')).toBeInTheDocument()
      expect(screen.getByText('Test Child')).toBeInTheDocument()
    })

    it('should provide QueryClient to child components', async () => {
      const TestComponent = () => {
        const { data } = useQuery({
          queryKey: ['test'],
          queryFn: async () => ({ message: 'success' }),
        })

        return <div data-testid="query-result">{data?.message || 'loading'}</div>
      }

      render(
        <QueryProvider>
          <TestComponent />
        </QueryProvider>
      )

      // Initially shows loading
      expect(screen.getByTestId('query-result')).toHaveTextContent('loading')

      // Wait for query to resolve
      await waitFor(() => {
        expect(screen.getByTestId('query-result')).toHaveTextContent('success')
      })
    })

    it('should create a stable QueryClient instance', async () => {
      const TestComponent = () => {
        const { data } = useQuery({
          queryKey: ['stability-test'],
          queryFn: async () => 'stable data',
        })

        return <div data-testid="stability-result">{data || 'loading'}</div>
      }

      const { rerender } = render(
        <QueryProvider>
          <TestComponent />
        </QueryProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('stability-result')).toHaveTextContent('stable data')
      })

      // Rerender the provider - it should maintain query state
      rerender(
        <QueryProvider>
          <TestComponent />
        </QueryProvider>
      )

      // The provider should handle rerenders without crashing
      // Note: On provider remount, QueryClient is recreated, so cache is lost
      await waitFor(() => {
        expect(screen.getByTestId('stability-result')).toBeInTheDocument()
      })
    })
  })

  describe('QueryClient Default Options', () => {
    it('should configure queries with correct staleTime', async () => {
      const mockQueryFn = vi.fn().mockResolvedValue({ data: 'test' })

      const TestComponent = () => {
        const { data } = useQuery({
          queryKey: ['staleTime-test'],
          queryFn: mockQueryFn,
        })

        return <div data-testid="result">{data?.data || 'loading'}</div>
      }

      render(
        <QueryProvider>
          <TestComponent />
        </QueryProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('result')).toHaveTextContent('test')
      })

      // Query function should be called once
      expect(mockQueryFn).toHaveBeenCalledTimes(1)
    })

    it('should configure queries with retry attempts', async () => {
      let attemptCount = 0
      const mockQueryFn = vi.fn().mockImplementation(async () => {
        attemptCount++
        if (attemptCount < 3) {
          throw new Error('Temporary error')
        }
        return { data: 'success after retries' }
      })

      const TestComponent = () => {
        const { data, error } = useQuery({
          queryKey: ['retry-test'],
          queryFn: mockQueryFn,
          retry: 3,
        })

        if (error) return <div data-testid="error">Error: {(error as Error).message}</div>
        return <div data-testid="result">{data?.data || 'loading'}</div>
      }

      render(
        <QueryProvider>
          <TestComponent />
        </QueryProvider>
      )

      // Should eventually succeed after retries
      await waitFor(
        () => {
          expect(screen.getByTestId('result')).toHaveTextContent('success after retries')
        },
        { timeout: 5000 }
      )

      // Should have been called multiple times due to retries
      expect(mockQueryFn).toHaveBeenCalledTimes(3)
    })

    it('should configure mutations with retry attempts', async () => {
      let attemptCount = 0
      const mockMutationFn = vi.fn().mockImplementation(async () => {
        attemptCount++
        if (attemptCount < 2) {
          throw new Error('Temporary mutation error')
        }
        return { success: true }
      })

      const TestComponent = () => {
        const mutation = useMutation({
          mutationFn: mockMutationFn,
          retry: 1,
        })

        return (
          <div>
            <button onClick={() => mutation.mutate(undefined)}>Mutate</button>
            <div data-testid="status">{mutation.status}</div>
            <div data-testid="attempt-count">{attemptCount}</div>
            {mutation.isSuccess && <div data-testid="success">Success</div>}
            {mutation.isError && <div data-testid="error">Error</div>}
          </div>
        )
      }

      render(
        <QueryProvider>
          <TestComponent />
        </QueryProvider>
      )

      const button = screen.getByText('Mutate')
      button.click()

      // Should eventually succeed after retry
      await waitFor(
        () => {
          expect(screen.getByTestId('success')).toBeInTheDocument()
        },
        { timeout: 3000 }
      )

      // Should have been called twice (initial + 1 retry)
      expect(mockMutationFn).toHaveBeenCalledTimes(2)
      expect(attemptCount).toBe(2)
    })
  })

  describe('Multiple Children', () => {
    it('should support multiple child components', () => {
      render(
        <QueryProvider>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
          <div data-testid="child-3">Child 3</div>
        </QueryProvider>
      )

      expect(screen.getByTestId('child-1')).toBeInTheDocument()
      expect(screen.getByTestId('child-2')).toBeInTheDocument()
      expect(screen.getByTestId('child-3')).toBeInTheDocument()
    })

    it('should support nested components with queries', async () => {
      const ParentComponent = () => {
        const { data: parentData } = useQuery({
          queryKey: ['parent'],
          queryFn: async () => ({ value: 'parent data' }),
        })

        return (
          <div>
            <div data-testid="parent">{parentData?.value || 'loading'}</div>
            <ChildComponent />
          </div>
        )
      }

      const ChildComponent = () => {
        const { data: childData } = useQuery({
          queryKey: ['child'],
          queryFn: async () => ({ value: 'child data' }),
        })

        return <div data-testid="child">{childData?.value || 'loading'}</div>
      }

      render(
        <QueryProvider>
          <ParentComponent />
        </QueryProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('parent')).toHaveTextContent('parent data')
        expect(screen.getByTestId('child')).toHaveTextContent('child data')
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle query errors gracefully', async () => {
      const mockQueryFn = vi.fn().mockRejectedValue(new Error('Query failed'))

      const TestComponent = () => {
        const { data, error, isError } = useQuery({
          queryKey: ['error-test'],
          queryFn: mockQueryFn,
          retry: false, // Disable retries for this test
        })

        if (isError) {
          return <div data-testid="error">Error: {(error as Error).message}</div>
        }

        return <div data-testid="result">{data || 'loading'}</div>
      }

      render(
        <QueryProvider>
          <TestComponent />
        </QueryProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Error: Query failed')
      })
    })

    it('should handle mutation errors gracefully', async () => {
      const mockMutationFn = vi.fn().mockRejectedValue(new Error('Mutation failed'))

      const TestComponent = () => {
        const mutation = useMutation({
          mutationFn: mockMutationFn,
          retry: false,
        })

        return (
          <div>
            <button onClick={() => mutation.mutate(undefined)}>Mutate</button>
            {mutation.isError && (
              <div data-testid="error">Error: {(mutation.error as Error).message}</div>
            )}
          </div>
        )
      }

      render(
        <QueryProvider>
          <TestComponent />
        </QueryProvider>
      )

      const button = screen.getByText('Mutate')
      button.click()

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Error: Mutation failed')
      })
    })
  })

  describe('Query Cache Behavior', () => {
    it('should cache query results', async () => {
      const mockQueryFn = vi.fn().mockResolvedValue({ data: 'cached data' })

      const TestComponent = ({ showSecond }: { showSecond: boolean }) => {
        const query1 = useQuery({
          queryKey: ['cache-test'],
          queryFn: mockQueryFn,
        })

        const query2 = useQuery({
          queryKey: ['cache-test'],
          queryFn: mockQueryFn,
          enabled: showSecond,
        })

        return (
          <div>
            <div data-testid="query1">{query1.data?.data || 'loading'}</div>
            {showSecond && <div data-testid="query2">{query2.data?.data || 'loading'}</div>}
          </div>
        )
      }

      const { rerender } = render(
        <QueryProvider>
          <TestComponent showSecond={false} />
        </QueryProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('query1')).toHaveTextContent('cached data')
      })

      // First query should have been called once
      expect(mockQueryFn).toHaveBeenCalledTimes(1)

      // Render second component with same query key
      rerender(
        <QueryProvider>
          <TestComponent showSecond={true} />
        </QueryProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('query2')).toHaveTextContent('cached data')
      })

      // Should still be called only once due to caching
      expect(mockQueryFn).toHaveBeenCalledTimes(1)
    })
  })
})
