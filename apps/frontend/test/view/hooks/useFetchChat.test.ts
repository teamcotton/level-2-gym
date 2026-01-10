import type { AIFetchChatResponseSchemaType } from '@norberts-spark/shared'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import React, { type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Import the mocked function
import { fetchChatByIdAction } from '@/infrastructure/serverActions/fetchChatById.server.js'
import { useFetchChat } from '@/view/hooks/useFetchChat.js'

// Mock the server action
vi.mock('@/infrastructure/serverActions/fetchChatById.server.js', () => ({
  fetchChatByIdAction: vi.fn(),
}))

describe('useFetchChat', () => {
  let queryClient: QueryClient

  const TEST_CHAT_ID = '01942f8e-67a3-7b2c-9d4e-5f6a7b8c9d0e'

  // Helper to create a wrapper with QueryClient
  const createWrapper = () => {
    const TestWrapper = ({ children }: { children: ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children)
    return TestWrapper
  }

  beforeEach(() => {
    // Create a fresh QueryClient for each test to ensure isolation
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false, // Disable retries for tests
        },
      },
    })
    vi.clearAllMocks()
  })

  describe('successful fetch', () => {
    it('should fetch chat data when chatId is provided', async () => {
      const mockChatData: AIFetchChatResponseSchemaType = {
        success: true,
        data: {
          id: TEST_CHAT_ID,
          messages: [
            { id: 'msg-1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] },
            { id: 'msg-2', role: 'assistant', parts: [{ type: 'text', text: 'Hi there!' }] },
          ],
        },
      }

      vi.mocked(fetchChatByIdAction).mockResolvedValue(mockChatData)

      const { result } = renderHook(() => useFetchChat(TEST_CHAT_ID), {
        wrapper: createWrapper(),
      })

      // Initially should be loading
      expect(result.current.isLoading).toBe(true)
      expect(result.current.data).toBeUndefined()

      // Wait for the query to complete
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Should have fetched the data
      expect(result.current.data).toEqual(mockChatData.data)
      expect(result.current.data?.id).toBe(TEST_CHAT_ID)
      expect(result.current.data?.messages).toHaveLength(2)
      expect(fetchChatByIdAction).toHaveBeenCalledWith(TEST_CHAT_ID)
      expect(fetchChatByIdAction).toHaveBeenCalledTimes(1)
    })

    it('should return empty messages array when chat has no messages', async () => {
      const mockChatData: AIFetchChatResponseSchemaType = {
        success: true,
        data: {
          id: TEST_CHAT_ID,
          messages: [],
        },
      }

      vi.mocked(fetchChatByIdAction).mockResolvedValue(mockChatData)

      const { result } = renderHook(() => useFetchChat(TEST_CHAT_ID), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data?.messages).toEqual([])
      expect(result.current.data?.messages).toHaveLength(0)
    })

    it('should cache results and not refetch immediately', async () => {
      const mockChatData: AIFetchChatResponseSchemaType = {
        success: true,
        data: {
          id: TEST_CHAT_ID,
          messages: [{ id: 'msg-1', role: 'user', parts: [{ type: 'text', text: 'Test' }] }],
        },
      }

      vi.mocked(fetchChatByIdAction).mockResolvedValue(mockChatData)

      const { rerender, result } = renderHook(() => useFetchChat(TEST_CHAT_ID), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // First call should have happened
      expect(fetchChatByIdAction).toHaveBeenCalledTimes(1)

      // Rerender with same chatId
      rerender()

      // Should still be only 1 call due to caching (staleTime: 1 minute)
      expect(fetchChatByIdAction).toHaveBeenCalledTimes(1)
    })

    it('should use correct query key with chatId', async () => {
      const mockChatData: AIFetchChatResponseSchemaType = {
        success: true,
        data: { id: TEST_CHAT_ID, messages: [] },
      }

      vi.mocked(fetchChatByIdAction).mockResolvedValue(mockChatData)

      const { result } = renderHook(() => useFetchChat(TEST_CHAT_ID), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Check that the query is cached with the correct key
      const cachedData = queryClient.getQueryData(['chat', TEST_CHAT_ID])
      expect(cachedData).toEqual(mockChatData.data)
    })
  })

  describe('query disabled when chatId is null', () => {
    it('should not fetch when chatId is null', async () => {
      const { result } = renderHook(() => useFetchChat(null), {
        wrapper: createWrapper(),
      })

      // Should not be loading or have any data
      expect(result.current.isLoading).toBe(false)
      expect(result.current.data).toBeUndefined()
      expect(result.current.isSuccess).toBe(false)

      // Should not have called the action
      expect(fetchChatByIdAction).not.toHaveBeenCalled()
    })

    it('should remain idle when chatId is null', async () => {
      const { result } = renderHook(() => useFetchChat(null), {
        wrapper: createWrapper(),
      })

      // Wait a bit to ensure nothing happens
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(result.current.status).toBe('pending')
      expect(result.current.fetchStatus).toBe('idle')
      expect(fetchChatByIdAction).not.toHaveBeenCalled()
    })

    it('should fetch when chatId changes from null to a value', async () => {
      const mockChatData: AIFetchChatResponseSchemaType = {
        success: true,
        data: { id: TEST_CHAT_ID, messages: [] },
      }

      vi.mocked(fetchChatByIdAction).mockResolvedValue(mockChatData)

      const { rerender, result } = renderHook(
        ({ chatId }: { chatId: string | null }) => useFetchChat(chatId),
        {
          wrapper: createWrapper(),
          initialProps: { chatId: null as string | null },
        }
      )

      // Initially should not fetch
      expect(fetchChatByIdAction).not.toHaveBeenCalled()
      expect(result.current.data).toBeUndefined()

      // Change chatId to a value
      rerender({ chatId: TEST_CHAT_ID as string | null })

      // Should now fetch
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(fetchChatByIdAction).toHaveBeenCalledWith(TEST_CHAT_ID)
      expect(result.current.data).toEqual(mockChatData.data)
    })
  })

  describe('error handling', () => {
    it('should handle fetch errors gracefully', async () => {
      const mockError = new Error('Network error')
      vi.mocked(fetchChatByIdAction).mockRejectedValue(mockError)

      const { result } = renderHook(() => useFetchChat(TEST_CHAT_ID), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(mockError)
      expect(result.current.data).toBeUndefined()
    })

    it('should handle server action returning success: false', async () => {
      const mockResponse: AIFetchChatResponseSchemaType = {
        success: false,
        data: {
          id: TEST_CHAT_ID,
          messages: [],
        },
      }

      vi.mocked(fetchChatByIdAction).mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useFetchChat(TEST_CHAT_ID), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Even with success: false, the query succeeds (server action doesn't throw)
      // The component can check response.success to handle this
      expect(result.current.data).toEqual(mockResponse.data)
      expect(result.current.data?.messages).toEqual([])
    })

    it('should handle 404 not found error', async () => {
      const mockError = Object.assign(new Error('Chat not found'), {
        status: 404,
      })
      vi.mocked(fetchChatByIdAction).mockRejectedValue(mockError)

      const { result } = renderHook(() => useFetchChat(TEST_CHAT_ID), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(mockError)
    })

    it('should handle timeout errors', async () => {
      const mockError = Object.assign(new Error('Request timeout'), {
        cause: 'AbortError',
      })
      vi.mocked(fetchChatByIdAction).mockRejectedValue(mockError)

      const { result } = renderHook(() => useFetchChat(TEST_CHAT_ID), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(mockError)
    })
  })

  describe('different chat IDs', () => {
    it('should fetch different data when chatId changes', async () => {
      const chatId1 = '01942f8e-67a3-7b2c-9d4e-5f6a7b8c9d0e'
      const chatId2 = '01942f8e-67a4-7c3d-8e5f-6a7b8c9d0e1f'

      const mockData1: AIFetchChatResponseSchemaType = {
        success: true,
        data: {
          id: chatId1,
          messages: [{ id: 'msg-1', role: 'user', parts: [{ type: 'text', text: 'Chat 1' }] }],
        },
      }

      const mockData2: AIFetchChatResponseSchemaType = {
        success: true,
        data: {
          id: chatId2,
          messages: [{ id: 'msg-2', role: 'user', parts: [{ type: 'text', text: 'Chat 2' }] }],
        },
      }

      vi.mocked(fetchChatByIdAction)
        .mockResolvedValueOnce(mockData1)
        .mockResolvedValueOnce(mockData2)

      const { rerender, result } = renderHook(
        ({ chatId }: { chatId: string | null }) => useFetchChat(chatId),
        {
          wrapper: createWrapper(),
          initialProps: { chatId: chatId1 },
        }
      )

      // Wait for first fetch
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data?.id).toBe(chatId1)
      expect(fetchChatByIdAction).toHaveBeenCalledWith(chatId1)

      // Change to different chatId
      rerender({ chatId: chatId2 })

      // Should fetch new data
      await waitFor(() => {
        expect(result.current.data?.id).toBe(chatId2)
      })

      expect(fetchChatByIdAction).toHaveBeenCalledWith(chatId2)
      expect(fetchChatByIdAction).toHaveBeenCalledTimes(2)
    })

    it('should use separate cache for different chatIds', async () => {
      const chatId1 = '01942f8e-67a3-7b2c-9d4e-5f6a7b8c9d0e'
      const chatId2 = '01942f8e-67a4-7c3d-8e5f-6a7b8c9d0e1f'

      const mockData1: AIFetchChatResponseSchemaType = {
        success: true,
        data: { id: chatId1, messages: [] },
      }

      const mockData2: AIFetchChatResponseSchemaType = {
        success: true,
        data: { id: chatId2, messages: [] },
      }

      vi.mocked(fetchChatByIdAction)
        .mockResolvedValueOnce(mockData1)
        .mockResolvedValueOnce(mockData2)

      // Render first hook instance
      const { result: result1 } = renderHook(() => useFetchChat(chatId1), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result1.current.isSuccess).toBe(true)
      })

      // Render second hook instance with different chatId
      const { result: result2 } = renderHook(() => useFetchChat(chatId2), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result2.current.isSuccess).toBe(true)
      })

      // Both should have their own cached data
      const cachedData1 = queryClient.getQueryData(['chat', chatId1])
      const cachedData2 = queryClient.getQueryData(['chat', chatId2])

      expect(cachedData1).toEqual(mockData1.data)
      expect(cachedData2).toEqual(mockData2.data)
      expect(cachedData1).not.toEqual(cachedData2)
    })
  })

  describe('staleTime configuration', () => {
    it('should respect 1 minute staleTime', async () => {
      const mockChatData: AIFetchChatResponseSchemaType = {
        success: true,
        data: { id: TEST_CHAT_ID, messages: [] },
      }

      vi.mocked(fetchChatByIdAction).mockResolvedValue(mockChatData)

      const { result } = renderHook(() => useFetchChat(TEST_CHAT_ID), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Check that staleTime is set (query state should be fresh)
      const queryState = queryClient.getQueryState(['chat', TEST_CHAT_ID])
      expect(queryState?.dataUpdatedAt).toBeGreaterThan(0)

      // Data should be considered fresh for 1 minute
      expect(result.current.isStale).toBe(false)
    })
  })
})
