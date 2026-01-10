import type { AIFetchChatResponseSchemaType } from '@norberts-spark/shared'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('fetchChatByIdAction', () => {
  let mockGetAuthToken: ReturnType<typeof vi.fn>
  let mockBackendRequest: ReturnType<typeof vi.fn>
  let mockLoggerWarn: ReturnType<typeof vi.fn>
  let mockLoggerError: ReturnType<typeof vi.fn>

  const TEST_CHAT_ID = '01942f8e-67a3-7b2c-9d4e-5f6a7b8c9d0e'
  const TEST_TOKEN = 'test-jwt-token'

  beforeEach(() => {
    // Reset modules to ensure fresh imports
    vi.resetModules()

    // Mock auth token getter
    mockGetAuthToken = vi.fn()
    vi.doMock('@/lib/auth.js', () => ({
      getAuthToken: mockGetAuthToken,
    }))

    // Mock backend request
    mockBackendRequest = vi.fn()
    vi.doMock('@/infrastructure/serverActions/baseServerAction.js', () => ({
      backendRequest: mockBackendRequest,
    }))

    // Mock logger
    mockLoggerWarn = vi.fn()
    mockLoggerError = vi.fn()
    vi.doMock('@/infrastructure/logging/logger.js', () => ({
      createLogger: vi.fn(() => ({
        warn: mockLoggerWarn,
        error: mockLoggerError,
        info: vi.fn(),
        debug: vi.fn(),
      })),
    }))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('successful requests', () => {
    it('should return chat data when authentication is successful', async () => {
      const mockResponse: AIFetchChatResponseSchemaType = {
        success: true,
        data: {
          id: TEST_CHAT_ID,
          messages: [
            { id: 'msg-1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] },
            { id: 'msg-2', role: 'assistant', parts: [{ type: 'text', text: 'Hi there!' }] },
          ],
        },
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(mockResponse)

      const { fetchChatByIdAction } =
        await import('@/infrastructure/serverActions/fetchChatById.server.js')

      const result = await fetchChatByIdAction(TEST_CHAT_ID)

      expect(result).toEqual(mockResponse)
      expect(mockGetAuthToken).toHaveBeenCalledOnce()
      expect(mockBackendRequest).toHaveBeenCalledWith({
        method: 'GET',
        endpoint: `/ai/fetchChat/${TEST_CHAT_ID}`,
        headers: {
          Authorization: `Bearer ${TEST_TOKEN}`,
        },
        timeoutMs: 10000,
      })
      expect(mockLoggerWarn).not.toHaveBeenCalled()
      expect(mockLoggerError).not.toHaveBeenCalled()
    })

    it('should return empty messages array when chat has no messages', async () => {
      const mockResponse: AIFetchChatResponseSchemaType = {
        success: true,
        data: {
          id: TEST_CHAT_ID,
          messages: [],
        },
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(mockResponse)

      const { fetchChatByIdAction } =
        await import('@/infrastructure/serverActions/fetchChatById.server.js')

      const result = await fetchChatByIdAction(TEST_CHAT_ID)

      expect(result).toEqual(mockResponse)
      expect(result.data.messages).toHaveLength(0)
    })

    it('should handle chat with single message', async () => {
      const mockResponse: AIFetchChatResponseSchemaType = {
        success: true,
        data: {
          id: TEST_CHAT_ID,
          messages: [{ id: 'msg-1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] }],
        },
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(mockResponse)

      const { fetchChatByIdAction } =
        await import('@/infrastructure/serverActions/fetchChatById.server.js')

      const result = await fetchChatByIdAction(TEST_CHAT_ID)

      expect(result).toEqual(mockResponse)
      expect(result.data.messages).toHaveLength(1)
    })

    it('should handle chat with multiple messages', async () => {
      const mockResponse: AIFetchChatResponseSchemaType = {
        success: true,
        data: {
          id: TEST_CHAT_ID,
          messages: [
            { id: 'msg-1', role: 'user', parts: [{ type: 'text', text: 'First message' }] },
            {
              id: 'msg-2',
              role: 'assistant',
              parts: [{ type: 'text', text: 'First response' }],
            },
            { id: 'msg-3', role: 'user', parts: [{ type: 'text', text: 'Second message' }] },
            {
              id: 'msg-4',
              role: 'assistant',
              parts: [{ type: 'text', text: 'Second response' }],
            },
          ],
        },
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(mockResponse)

      const { fetchChatByIdAction } =
        await import('@/infrastructure/serverActions/fetchChatById.server.js')

      const result = await fetchChatByIdAction(TEST_CHAT_ID)

      expect(result).toEqual(mockResponse)
      expect(result.data.messages).toHaveLength(4)
    })

    it('should handle chat with file attachments', async () => {
      const mockResponse: AIFetchChatResponseSchemaType = {
        success: true,
        data: {
          id: TEST_CHAT_ID,
          messages: [
            {
              id: 'msg-1',
              role: 'user',
              parts: [
                { type: 'text', text: 'Check this file' },
                { type: 'file', mediaType: 'image/png', url: 'data:image/png;base64,...' },
              ],
            },
          ],
        },
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(mockResponse)

      const { fetchChatByIdAction } =
        await import('@/infrastructure/serverActions/fetchChatById.server.js')

      const result = await fetchChatByIdAction(TEST_CHAT_ID)

      expect(result).toEqual(mockResponse)
      expect((result.data.messages[0] as any)?.parts).toHaveLength(2)
    })
  })

  describe('authentication failures', () => {
    it('should return empty response when no auth token available', async () => {
      mockGetAuthToken.mockResolvedValue(null)

      const { fetchChatByIdAction } =
        await import('@/infrastructure/serverActions/fetchChatById.server.js')

      const result = await fetchChatByIdAction(TEST_CHAT_ID)

      expect(result).toEqual({ success: false, data: { id: TEST_CHAT_ID, messages: [] } })
      expect(mockLoggerWarn).toHaveBeenCalledWith('No auth token available in fetchChatByIdAction')
      expect(mockBackendRequest).not.toHaveBeenCalled()
    })

    it('should return empty response when auth token is undefined', async () => {
      mockGetAuthToken.mockResolvedValue(undefined)

      const { fetchChatByIdAction } =
        await import('@/infrastructure/serverActions/fetchChatById.server.js')

      const result = await fetchChatByIdAction(TEST_CHAT_ID)

      expect(result).toEqual({ success: false, data: { id: TEST_CHAT_ID, messages: [] } })
      expect(mockLoggerWarn).toHaveBeenCalled()
      expect(mockBackendRequest).not.toHaveBeenCalled()
    })

    it('should return empty response when auth token is empty string', async () => {
      mockGetAuthToken.mockResolvedValue('')

      const { fetchChatByIdAction } =
        await import('@/infrastructure/serverActions/fetchChatById.server.js')

      const result = await fetchChatByIdAction(TEST_CHAT_ID)

      expect(result).toEqual({ success: false, data: { id: TEST_CHAT_ID, messages: [] } })
      expect(mockLoggerWarn).toHaveBeenCalled()
      expect(mockBackendRequest).not.toHaveBeenCalled()
    })
  })

  describe('backend request failures', () => {
    it('should return empty response when backend request throws error', async () => {
      const mockError = new Error('Network error')
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(mockError)

      const { fetchChatByIdAction } =
        await import('@/infrastructure/serverActions/fetchChatById.server.js')

      const result = await fetchChatByIdAction(TEST_CHAT_ID)

      expect(result).toEqual({ success: false, data: { id: TEST_CHAT_ID, messages: [] } })
      expect(mockLoggerError).toHaveBeenCalledWith('fetchChatByIdAction error', mockError)
    })

    it('should handle 401 unauthorized error', async () => {
      const mockError = Object.assign(new Error('Unauthorized'), {
        status: 401,
        body: { message: 'Invalid token' },
      })
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(mockError)

      const { fetchChatByIdAction } =
        await import('@/infrastructure/serverActions/fetchChatById.server.js')

      const result = await fetchChatByIdAction(TEST_CHAT_ID)

      expect(result).toEqual({ success: false, data: { id: TEST_CHAT_ID, messages: [] } })
      expect(mockLoggerError).toHaveBeenCalledWith('fetchChatByIdAction error', mockError)
    })

    it('should handle 403 forbidden error', async () => {
      const mockError = Object.assign(new Error('Forbidden'), {
        status: 403,
        body: { message: 'Access denied to this chat' },
      })
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(mockError)

      const { fetchChatByIdAction } =
        await import('@/infrastructure/serverActions/fetchChatById.server.js')

      const result = await fetchChatByIdAction(TEST_CHAT_ID)

      expect(result).toEqual({ success: false, data: { id: TEST_CHAT_ID, messages: [] } })
      expect(mockLoggerError).toHaveBeenCalledWith('fetchChatByIdAction error', mockError)
    })

    it('should handle 404 not found error', async () => {
      const mockError = Object.assign(new Error('Not found'), {
        status: 404,
        body: { message: 'Chat not found' },
      })
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(mockError)

      const { fetchChatByIdAction } =
        await import('@/infrastructure/serverActions/fetchChatById.server.js')

      const result = await fetchChatByIdAction(TEST_CHAT_ID)

      expect(result).toEqual({ success: false, data: { id: TEST_CHAT_ID, messages: [] } })
      expect(mockLoggerError).toHaveBeenCalled()
    })

    it('should handle 500 internal server error', async () => {
      const mockError = Object.assign(new Error('Internal server error'), {
        status: 500,
        body: { message: 'Database connection failed' },
      })
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(mockError)

      const { fetchChatByIdAction } =
        await import('@/infrastructure/serverActions/fetchChatById.server.js')

      const result = await fetchChatByIdAction(TEST_CHAT_ID)

      expect(result).toEqual({ success: false, data: { id: TEST_CHAT_ID, messages: [] } })
      expect(mockLoggerError).toHaveBeenCalledWith('fetchChatByIdAction error', mockError)
    })

    it('should handle timeout error', async () => {
      const mockError = Object.assign(new Error('Request timeout'), {
        cause: 'AbortError',
      })
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(mockError)

      const { fetchChatByIdAction } =
        await import('@/infrastructure/serverActions/fetchChatById.server.js')

      const result = await fetchChatByIdAction(TEST_CHAT_ID)

      expect(result).toEqual({ success: false, data: { id: TEST_CHAT_ID, messages: [] } })
      expect(mockLoggerError).toHaveBeenCalledWith('fetchChatByIdAction error', mockError)
    })

    it('should handle network error without status', async () => {
      const mockError = new Error('Network connection lost')
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(mockError)

      const { fetchChatByIdAction } =
        await import('@/infrastructure/serverActions/fetchChatById.server.js')

      const result = await fetchChatByIdAction(TEST_CHAT_ID)

      expect(result).toEqual({ success: false, data: { id: TEST_CHAT_ID, messages: [] } })
      expect(mockLoggerError).toHaveBeenCalledWith('fetchChatByIdAction error', mockError)
    })
  })

  describe('backend response handling', () => {
    it('should handle response with success: false', async () => {
      const mockResponse: AIFetchChatResponseSchemaType = {
        success: false,
        data: {
          id: TEST_CHAT_ID,
          messages: [],
        },
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(mockResponse)

      const { fetchChatByIdAction } =
        await import('@/infrastructure/serverActions/fetchChatById.server.js')

      const result = await fetchChatByIdAction(TEST_CHAT_ID)

      expect(result).toEqual(mockResponse)
      expect(result.success).toBe(false)
      expect(result.data.messages).toEqual([])
    })

    it('should pass through backend response as-is', async () => {
      const mockResponse: AIFetchChatResponseSchemaType = {
        success: true,
        data: {
          id: TEST_CHAT_ID,
          messages: [
            { id: 'msg-1', role: 'user', parts: [{ type: 'text', text: 'Test' }] },
            { id: 'msg-2', role: 'assistant', parts: [{ type: 'text', text: 'Response' }] },
          ],
        },
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(mockResponse)

      const { fetchChatByIdAction } =
        await import('@/infrastructure/serverActions/fetchChatById.server.js')

      const result = await fetchChatByIdAction(TEST_CHAT_ID)

      // Should not modify response, just pass through
      expect(result).toEqual(mockResponse)
      expect(result).toBe(mockResponse)
    })
  })

  describe('request parameters', () => {
    it('should correctly format endpoint with chatId', async () => {
      const customChatId = '99999999-9999-9999-9999-999999999999'
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue({
        success: true,
        data: { id: customChatId, messages: [] },
      })

      const { fetchChatByIdAction } =
        await import('@/infrastructure/serverActions/fetchChatById.server.js')

      await fetchChatByIdAction(customChatId)

      expect(mockBackendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: `/ai/fetchChat/${customChatId}`,
        })
      )
    })

    it('should include Authorization header with Bearer token', async () => {
      const customToken = 'custom-jwt-token-abc123'
      mockGetAuthToken.mockResolvedValue(customToken)
      mockBackendRequest.mockResolvedValue({
        success: true,
        data: { id: TEST_CHAT_ID, messages: [] },
      })

      const { fetchChatByIdAction } =
        await import('@/infrastructure/serverActions/fetchChatById.server.js')

      await fetchChatByIdAction(TEST_CHAT_ID)

      expect(mockBackendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: {
            Authorization: `Bearer ${customToken}`,
          },
        })
      )
    })

    it('should use GET method', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue({
        success: true,
        data: { id: TEST_CHAT_ID, messages: [] },
      })

      const { fetchChatByIdAction } =
        await import('@/infrastructure/serverActions/fetchChatById.server.js')

      await fetchChatByIdAction(TEST_CHAT_ID)

      expect(mockBackendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
        })
      )
    })

    it('should use 10 second timeout', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue({
        success: true,
        data: { id: TEST_CHAT_ID, messages: [] },
      })

      const { fetchChatByIdAction } =
        await import('@/infrastructure/serverActions/fetchChatById.server.js')

      await fetchChatByIdAction(TEST_CHAT_ID)

      expect(mockBackendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          timeoutMs: 10000,
        })
      )
    })
  })

  describe('edge cases', () => {
    it('should handle chat with complex message structure', async () => {
      const mockResponse: AIFetchChatResponseSchemaType = {
        success: true,
        data: {
          id: TEST_CHAT_ID,
          messages: [
            {
              id: 'msg-1',
              role: 'user',
              parts: [
                { type: 'text', text: 'Complex message' },
                { type: 'reasoning', text: 'Some reasoning' },
                { type: 'data', data: { key: 'value' } },
              ],
            },
          ],
        },
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(mockResponse)

      const { fetchChatByIdAction } =
        await import('@/infrastructure/serverActions/fetchChatById.server.js')

      const result = await fetchChatByIdAction(TEST_CHAT_ID)

      expect(result).toEqual(mockResponse)
      expect((result.data.messages[0] as any)?.parts).toHaveLength(3)
    })

    it('should preserve chatId in error response', async () => {
      const differentChatId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
      mockGetAuthToken.mockResolvedValue(null)

      const { fetchChatByIdAction } =
        await import('@/infrastructure/serverActions/fetchChatById.server.js')

      const result = await fetchChatByIdAction(differentChatId)

      expect(result.data.id).toBe(differentChatId)
    })
  })
})
