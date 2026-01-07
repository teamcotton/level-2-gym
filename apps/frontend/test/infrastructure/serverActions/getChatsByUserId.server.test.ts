import type { AIUserIdResponseSchemaType } from '@norberts-spark/shared'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('getChatsByUserIdAction', () => {
  let mockGetAuthToken: ReturnType<typeof vi.fn>
  let mockBackendRequest: ReturnType<typeof vi.fn>
  let mockLoggerWarn: ReturnType<typeof vi.fn>
  let mockLoggerError: ReturnType<typeof vi.fn>

  const TEST_USER_ID = '01234567-89ab-cdef-0123-456789abcdef'
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
    it('should return chat IDs when authentication is successful', async () => {
      const mockResponse: AIUserIdResponseSchemaType = {
        success: true,
        data: [
          '01942f8e-67a3-7b2c-9d4e-5f6a7b8c9d0e',
          '01942f8e-67a4-7c3d-8e5f-6a7b8c9d0e1f',
          '01942f8e-67a5-7d4e-9f6a-7b8c9d0e1f2a',
        ],
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(mockResponse)

      const { getChatsByUserIdAction } =
        await import('@/infrastructure/serverActions/getChatsByUserId.server.js')

      const result = await getChatsByUserIdAction(TEST_USER_ID)

      expect(result).toEqual(mockResponse)
      expect(mockGetAuthToken).toHaveBeenCalledOnce()
      expect(mockBackendRequest).toHaveBeenCalledWith({
        method: 'GET',
        endpoint: `/ai/chats/${TEST_USER_ID}`,
        headers: {
          Authorization: `Bearer ${TEST_TOKEN}`,
        },
        timeoutMs: 10000,
      })
      expect(mockLoggerWarn).not.toHaveBeenCalled()
      expect(mockLoggerError).not.toHaveBeenCalled()
    })

    it('should return empty array when user has no chats', async () => {
      const mockResponse: AIUserIdResponseSchemaType = {
        success: true,
        data: [],
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(mockResponse)

      const { getChatsByUserIdAction } =
        await import('@/infrastructure/serverActions/getChatsByUserId.server.js')

      const result = await getChatsByUserIdAction(TEST_USER_ID)

      expect(result).toEqual(mockResponse)
      expect(result.data).toHaveLength(0)
    })

    it('should handle single chat ID', async () => {
      const mockResponse: AIUserIdResponseSchemaType = {
        success: true,
        data: ['single-chat-id'],
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(mockResponse)

      const { getChatsByUserIdAction } =
        await import('@/infrastructure/serverActions/getChatsByUserId.server.js')

      const result = await getChatsByUserIdAction(TEST_USER_ID)

      expect(result).toEqual(mockResponse)
      expect(result.data).toHaveLength(1)
    })
  })

  describe('authentication failures', () => {
    it('should return empty response when no auth token available', async () => {
      mockGetAuthToken.mockResolvedValue(null)

      const { getChatsByUserIdAction } =
        await import('@/infrastructure/serverActions/getChatsByUserId.server.js')

      const result = await getChatsByUserIdAction(TEST_USER_ID)

      expect(result).toEqual({ success: false, data: [] })
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        'No auth token available in getChatsByUserIdAction'
      )
      expect(mockBackendRequest).not.toHaveBeenCalled()
    })

    it('should return empty response when auth token is undefined', async () => {
      mockGetAuthToken.mockResolvedValue(undefined)

      const { getChatsByUserIdAction } =
        await import('@/infrastructure/serverActions/getChatsByUserId.server.js')

      const result = await getChatsByUserIdAction(TEST_USER_ID)

      expect(result).toEqual({ success: false, data: [] })
      expect(mockLoggerWarn).toHaveBeenCalled()
      expect(mockBackendRequest).not.toHaveBeenCalled()
    })

    it('should return empty response when auth token is empty string', async () => {
      mockGetAuthToken.mockResolvedValue('')

      const { getChatsByUserIdAction } =
        await import('@/infrastructure/serverActions/getChatsByUserId.server.js')

      const result = await getChatsByUserIdAction(TEST_USER_ID)

      expect(result).toEqual({ success: false, data: [] })
      expect(mockLoggerWarn).toHaveBeenCalled()
      expect(mockBackendRequest).not.toHaveBeenCalled()
    })
  })

  describe('backend request failures', () => {
    it('should return empty response when backend request throws error', async () => {
      const mockError = new Error('Network error')
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(mockError)

      const { getChatsByUserIdAction } =
        await import('@/infrastructure/serverActions/getChatsByUserId.server.js')

      const result = await getChatsByUserIdAction(TEST_USER_ID)

      expect(result).toEqual({ success: false, data: [] })
      expect(mockLoggerError).toHaveBeenCalledWith('getChatsByUserIdAction error', mockError)
    })

    it('should handle 401 unauthorized error', async () => {
      const mockError = Object.assign(new Error('Unauthorized'), {
        status: 401,
        body: { message: 'Invalid token' },
      })
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(mockError)

      const { getChatsByUserIdAction } =
        await import('@/infrastructure/serverActions/getChatsByUserId.server.js')

      const result = await getChatsByUserIdAction(TEST_USER_ID)

      expect(result).toEqual({ success: false, data: [] })
      expect(mockLoggerError).toHaveBeenCalledWith('getChatsByUserIdAction error', mockError)
    })

    it('should handle 404 not found error', async () => {
      const mockError = Object.assign(new Error('Not found'), {
        status: 404,
        body: { message: 'User not found' },
      })
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(mockError)

      const { getChatsByUserIdAction } =
        await import('@/infrastructure/serverActions/getChatsByUserId.server.js')

      const result = await getChatsByUserIdAction(TEST_USER_ID)

      expect(result).toEqual({ success: false, data: [] })
      expect(mockLoggerError).toHaveBeenCalled()
    })

    it('should handle 500 internal server error', async () => {
      const mockError = Object.assign(new Error('Internal server error'), {
        status: 500,
        body: { message: 'Database connection failed' },
      })
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(mockError)

      const { getChatsByUserIdAction } =
        await import('@/infrastructure/serverActions/getChatsByUserId.server.js')

      const result = await getChatsByUserIdAction(TEST_USER_ID)

      expect(result).toEqual({ success: false, data: [] })
      expect(mockLoggerError).toHaveBeenCalledWith('getChatsByUserIdAction error', mockError)
    })

    it('should handle timeout error', async () => {
      const mockError = Object.assign(new Error('Request timeout'), {
        cause: 'AbortError',
      })
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(mockError)

      const { getChatsByUserIdAction } =
        await import('@/infrastructure/serverActions/getChatsByUserId.server.js')

      const result = await getChatsByUserIdAction(TEST_USER_ID)

      expect(result).toEqual({ success: false, data: [] })
      expect(mockLoggerError).toHaveBeenCalledWith('getChatsByUserIdAction error', mockError)
    })

    it('should handle network error without status', async () => {
      const mockError = new Error('Network connection lost')
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(mockError)

      const { getChatsByUserIdAction } =
        await import('@/infrastructure/serverActions/getChatsByUserId.server.js')

      const result = await getChatsByUserIdAction(TEST_USER_ID)

      expect(result).toEqual({ success: false, data: [] })
      expect(mockLoggerError).toHaveBeenCalledWith('getChatsByUserIdAction error', mockError)
    })
  })

  describe('backend response handling', () => {
    it('should handle response with success: false', async () => {
      const mockResponse: AIUserIdResponseSchemaType = {
        success: false,
        data: [],
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(mockResponse)

      const { getChatsByUserIdAction } =
        await import('@/infrastructure/serverActions/getChatsByUserId.server.js')

      const result = await getChatsByUserIdAction(TEST_USER_ID)

      expect(result).toEqual(mockResponse)
      expect(result.success).toBe(false)
      expect(result.data).toEqual([])
    })

    it('should pass through backend response as-is', async () => {
      const mockResponse: AIUserIdResponseSchemaType = {
        success: true,
        data: ['id1', 'id2', 'id3', 'id4', 'id5'],
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(mockResponse)

      const { getChatsByUserIdAction } =
        await import('@/infrastructure/serverActions/getChatsByUserId.server.js')

      const result = await getChatsByUserIdAction(TEST_USER_ID)

      // Should not modify response, just pass through
      expect(result).toEqual(mockResponse)
      expect(result).toBe(mockResponse)
    })
  })

  describe('request parameters', () => {
    it('should correctly format endpoint with userId', async () => {
      const customUserId = '99999999-9999-9999-9999-999999999999'
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue({ success: true, data: [] })

      const { getChatsByUserIdAction } =
        await import('@/infrastructure/serverActions/getChatsByUserId.server.js')

      await getChatsByUserIdAction(customUserId)

      expect(mockBackendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: `/ai/chats/${customUserId}`,
        })
      )
    })

    it('should include Authorization header with Bearer token', async () => {
      const customToken = 'custom-jwt-token-12345'
      mockGetAuthToken.mockResolvedValue(customToken)
      mockBackendRequest.mockResolvedValue({ success: true, data: [] })

      const { getChatsByUserIdAction } =
        await import('@/infrastructure/serverActions/getChatsByUserId.server.js')

      await getChatsByUserIdAction(TEST_USER_ID)

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
      mockBackendRequest.mockResolvedValue({ success: true, data: [] })

      const { getChatsByUserIdAction } =
        await import('@/infrastructure/serverActions/getChatsByUserId.server.js')

      await getChatsByUserIdAction(TEST_USER_ID)

      expect(mockBackendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
        })
      )
    })

    it('should set timeout to 10000ms', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue({ success: true, data: [] })

      const { getChatsByUserIdAction } =
        await import('@/infrastructure/serverActions/getChatsByUserId.server.js')

      await getChatsByUserIdAction(TEST_USER_ID)

      expect(mockBackendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          timeoutMs: 10000,
        })
      )
    })
  })

  describe('edge cases', () => {
    it('should handle getAuthToken throwing error', async () => {
      const authError = new Error('Session expired')
      mockGetAuthToken.mockRejectedValue(authError)

      const { getChatsByUserIdAction } =
        await import('@/infrastructure/serverActions/getChatsByUserId.server.js')

      const result = await getChatsByUserIdAction(TEST_USER_ID)

      expect(result).toEqual({ success: false, data: [] })
      expect(mockLoggerError).toHaveBeenCalledWith('getChatsByUserIdAction error', authError)
    })

    it('should handle very long chat ID arrays', async () => {
      const longArray = Array.from({ length: 1000 }, (_, i) => `chat-id-${i}`)
      const mockResponse: AIUserIdResponseSchemaType = {
        success: true,
        data: longArray,
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(mockResponse)

      const { getChatsByUserIdAction } =
        await import('@/infrastructure/serverActions/getChatsByUserId.server.js')

      const result = await getChatsByUserIdAction(TEST_USER_ID)

      expect(result).toEqual(mockResponse)
      expect(result.data).toHaveLength(1000)
    })

    it('should handle special characters in userId', async () => {
      const specialUserId = '01234567-89ab-cdef-0123-456789abcdef' // UUID v7 format
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue({ success: true, data: [] })

      const { getChatsByUserIdAction } =
        await import('@/infrastructure/serverActions/getChatsByUserId.server.js')

      await getChatsByUserIdAction(specialUserId)

      expect(mockBackendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: `/ai/chats/${specialUserId}`,
        })
      )
    })
  })
})
