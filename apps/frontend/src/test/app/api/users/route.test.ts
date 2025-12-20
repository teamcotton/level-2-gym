import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GET } from '@/app/api/users/route.js'
import type { PaginatedUsersResponse } from '@/domain/user/user.js'

describe('GET /api/users', () => {
  const mockEnv = {
    BACKEND_AI_CALLBACK_URL_DEV: 'https://api.example.com',
  }

  beforeEach(() => {
    vi.resetAllMocks()
    global.fetch = vi.fn()
    process.env.BACKEND_AI_CALLBACK_URL_DEV = mockEnv.BACKEND_AI_CALLBACK_URL_DEV
  })

  describe('Successful User Retrieval', () => {
    it('should successfully retrieve users and return 200', async () => {
      const mockBackendResponse = {
        success: true,
        data: [
          {
            userId: '123',
            email: 'test@example.com',
            name: 'Test User',
            role: 'user',
            createdAt: '2024-01-01T00:00:00.000Z',
          },
          {
            userId: '456',
            email: 'admin@example.com',
            name: 'Admin User',
            role: 'admin',
            createdAt: '2024-01-02T00:00:00.000Z',
          },
        ],
        pagination: {
          total: 2,
          limit: 10,
          offset: 0,
        },
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockBackendResponse,
      })

      const request = new Request('https://localhost:4321/api/users', {
        method: 'GET',
      })

      const response = await GET(request)
      const result = (await response.json()) as PaginatedUsersResponse

      expect(response.status).toBe(200)
      expect(result).toEqual(mockBackendResponse)
      expect(global.fetch).toHaveBeenCalledTimes(1)
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        })
      )
    })

    it('should use BACKEND_AI_CALLBACK_URL_DEV environment variable', async () => {
      process.env.BACKEND_AI_CALLBACK_URL_DEV = 'https://custom-api.example.com'

      const mockBackendResponse = {
        success: true,
        data: [],
        pagination: {
          total: 0,
          limit: 10,
          offset: 0,
        },
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockBackendResponse,
      })

      const request = new Request('https://localhost:4321/api/users', {
        method: 'GET',
      })

      await GET(request)

      expect(global.fetch).toHaveBeenCalledWith(
        'https://custom-api.example.com/users',
        expect.any(Object)
      )
    })

    it('should handle empty user list', async () => {
      const mockBackendResponse = {
        success: true,
        data: [],
        pagination: {
          total: 0,
          limit: 10,
          offset: 0,
        },
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockBackendResponse,
      })

      const request = new Request('https://localhost:4321/api/users', {
        method: 'GET',
      })

      const response = await GET(request)
      const result = (await response.json()) as PaginatedUsersResponse

      expect(response.status).toBe(200)
      expect(result.data).toEqual([])
      expect(result.pagination.total).toBe(0)
    })
  })

  describe('Pagination Parameters', () => {
    it('should forward limit parameter to backend API', async () => {
      const mockBackendResponse = {
        success: true,
        data: [],
        pagination: {
          total: 0,
          limit: 5,
          offset: 0,
        },
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockBackendResponse,
      })

      const request = new Request('https://localhost:4321/api/users?limit=5', {
        method: 'GET',
      })

      await GET(request)

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/users?limit=5',
        expect.any(Object)
      )
    })

    it('should forward offset parameter to backend API', async () => {
      const mockBackendResponse = {
        success: true,
        data: [],
        pagination: {
          total: 0,
          limit: 10,
          offset: 20,
        },
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockBackendResponse,
      })

      const request = new Request('https://localhost:4321/api/users?offset=20', {
        method: 'GET',
      })

      await GET(request)

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/users?offset=20',
        expect.any(Object)
      )
    })

    it('should forward both limit and offset parameters', async () => {
      const mockBackendResponse = {
        success: true,
        data: [],
        pagination: {
          total: 100,
          limit: 20,
          offset: 40,
        },
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockBackendResponse,
      })

      const request = new Request('https://localhost:4321/api/users?limit=20&offset=40', {
        method: 'GET',
      })

      await GET(request)

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/users?limit=20&offset=40',
        expect.any(Object)
      )
    })

    it('should handle pagination with zero values', async () => {
      const mockBackendResponse = {
        success: true,
        data: [],
        pagination: {
          total: 0,
          limit: 0,
          offset: 0,
        },
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockBackendResponse,
      })

      const request = new Request('https://localhost:4321/api/users?limit=0&offset=0', {
        method: 'GET',
      })

      await GET(request)

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/users?limit=0&offset=0',
        expect.any(Object)
      )
    })

    it('should make request without query string when no pagination params provided', async () => {
      const mockBackendResponse = {
        success: true,
        data: [],
        pagination: {
          total: 0,
          limit: 10,
          offset: 0,
        },
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockBackendResponse,
      })

      const request = new Request('https://localhost:4321/api/users', {
        method: 'GET',
      })

      await GET(request)

      expect(global.fetch).toHaveBeenCalledWith('https://api.example.com/users', expect.any(Object))
    })
  })

  describe('Error Handling', () => {
    it('should return 500 when BACKEND_AI_CALLBACK_URL_DEV is not configured', async () => {
      delete process.env.BACKEND_AI_CALLBACK_URL_DEV

      const request = new Request('https://localhost:4321/api/users', {
        method: 'GET',
      })

      const response = await GET(request)
      const result = (await response.json()) as { success: boolean; error: string }

      expect(response.status).toBe(500)
      expect(result).toEqual({
        success: false,
        error: 'Backend API URL not configured',
      })
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should handle backend API failure and return error status', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ success: false, error: 'Not found' }),
      })

      const request = new Request('https://localhost:4321/api/users', {
        method: 'GET',
      })

      const response = await GET(request)
      const result = (await response.json()) as { success: boolean; error: string }

      expect(response.status).toBe(404)
      expect(result).toEqual({
        success: false,
        error: 'User API request failed with status 404',
      })
    })

    it('should handle 500 error from backend', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ success: false, error: 'Internal server error' }),
      })

      const request = new Request('https://localhost:4321/api/users', {
        method: 'GET',
      })

      const response = await GET(request)
      const result = (await response.json()) as { success: boolean; error: string }

      expect(response.status).toBe(500)
      expect(result.success).toBe(false)
      expect(result.error).toContain('500')
    })

    it('should handle network errors gracefully', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'))

      const request = new Request('https://localhost:4321/api/users', {
        method: 'GET',
      })

      const response = await GET(request)
      const result = (await response.json()) as { success: boolean; error: string }

      expect(response.status).toBe(500)
      expect(result).toEqual({
        success: false,
        error: 'Network error',
      })
    })

    it('should handle non-Error exceptions', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce('String error')

      const request = new Request('https://localhost:4321/api/users', {
        method: 'GET',
      })

      const response = await GET(request)
      const result = (await response.json()) as { success: boolean; error: string }

      expect(response.status).toBe(500)
      expect(result).toEqual({
        success: false,
        error: 'An unexpected error occurred',
      })
    })

    it('should handle timeout errors', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Request timeout')
      )

      const request = new Request('https://localhost:4321/api/users', {
        method: 'GET',
      })

      const response = await GET(request)
      const result = (await response.json()) as { success: boolean; error: string }

      expect(response.status).toBe(500)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Request timeout')
    })
  })

  describe('HTTP Response Codes', () => {
    it('should return 200 for successful request', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: [],
          pagination: { total: 0, limit: 10, offset: 0 },
        }),
      })

      const request = new Request('https://localhost:4321/api/users', {
        method: 'GET',
      })

      const response = await GET(request)

      expect(response.status).toBe(200)
    })

    it('should preserve backend status code on error', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ success: false, error: 'Forbidden' }),
      })

      const request = new Request('https://localhost:4321/api/users', {
        method: 'GET',
      })

      const response = await GET(request)

      expect(response.status).toBe(403)
    })

    it('should return 500 for unexpected errors', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Unexpected error')
      )

      const request = new Request('https://localhost:4321/api/users', {
        method: 'GET',
      })

      const response = await GET(request)

      expect(response.status).toBe(500)
    })
  })

  describe('Local Development with Self-Signed Certificates', () => {
    it('should detect localhost HTTPS as local development', async () => {
      process.env.BACKEND_AI_CALLBACK_URL_DEV = 'https://localhost:3001'

      const mockBackendResponse = {
        success: true,
        data: [],
        pagination: {
          total: 0,
          limit: 10,
          offset: 0,
        },
      }

      // Mock node-fetch for local HTTPS
      const mockNodeFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockBackendResponse,
      })

      const mockHttpsAgent = vi.fn()

      // Mock dynamic imports
      vi.doMock('node-fetch', () => ({
        default: mockNodeFetch,
      }))

      vi.doMock('https', () => ({
        Agent: mockHttpsAgent,
      }))

      const request = new Request('https://localhost:4321/api/users', {
        method: 'GET',
      })

      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mockNodeFetch).toHaveBeenCalledWith(
        'https://localhost:3001/users',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      )
    })

    it('should detect 127.0.0.1 HTTPS as local development', async () => {
      process.env.BACKEND_AI_CALLBACK_URL_DEV = 'https://127.0.0.1:3001'

      const mockBackendResponse = {
        success: true,
        data: [],
        pagination: {
          total: 0,
          limit: 10,
          offset: 0,
        },
      }

      // Mock node-fetch for local HTTPS
      const mockNodeFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockBackendResponse,
      })

      const mockHttpsAgent = vi.fn()

      // Mock dynamic imports
      vi.doMock('node-fetch', () => ({
        default: mockNodeFetch,
      }))

      vi.doMock('https', () => ({
        Agent: mockHttpsAgent,
      }))

      const request = new Request('https://localhost:4321/api/users', {
        method: 'GET',
      })

      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mockNodeFetch).toHaveBeenCalledWith(
        'https://127.0.0.1:3001/users',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      )
    })

    it('should use regular fetch for non-local HTTPS URLs', async () => {
      process.env.BACKEND_AI_CALLBACK_URL_DEV = 'https://api.example.com'

      const mockBackendResponse = {
        success: true,
        data: [],
        pagination: {
          total: 0,
          limit: 10,
          offset: 0,
        },
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockBackendResponse,
      })

      const request = new Request('https://localhost:4321/api/users', {
        method: 'GET',
      })

      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          method: 'GET',
          cache: 'no-store',
        })
      )
    })

    it('should use regular fetch for localhost HTTP (not HTTPS)', async () => {
      process.env.BACKEND_AI_CALLBACK_URL_DEV = 'http://localhost:3001'

      const mockBackendResponse = {
        success: true,
        data: [],
        pagination: {
          total: 0,
          limit: 10,
          offset: 0,
        },
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockBackendResponse,
      })

      const request = new Request('https://localhost:4321/api/users', {
        method: 'GET',
      })

      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/users',
        expect.objectContaining({
          method: 'GET',
          cache: 'no-store',
        })
      )
    })
  })

  describe('Response Data Structure', () => {
    it('should return response with success, data, and pagination fields', async () => {
      const mockBackendResponse = {
        success: true,
        data: [
          {
            userId: '123',
            email: 'user@example.com',
            name: 'User Name',
            role: 'user',
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        pagination: {
          total: 1,
          limit: 10,
          offset: 0,
        },
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockBackendResponse,
      })

      const request = new Request('https://localhost:4321/api/users', {
        method: 'GET',
      })

      const response = await GET(request)
      const result = (await response.json()) as PaginatedUsersResponse

      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('pagination')
      expect(result.success).toBe(true)
      expect(Array.isArray(result.data)).toBe(true)
      expect(result.pagination).toHaveProperty('total')
      expect(result.pagination).toHaveProperty('limit')
      expect(result.pagination).toHaveProperty('offset')
    })

    it('should preserve all user fields from backend response', async () => {
      const mockUser = {
        userId: '123',
        email: 'detailed@example.com',
        name: 'Detailed User',
        role: 'moderator',
        createdAt: '2024-01-01T12:34:56.789Z',
      }

      const mockBackendResponse = {
        success: true,
        data: [mockUser],
        pagination: {
          total: 1,
          limit: 10,
          offset: 0,
        },
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockBackendResponse,
      })

      const request = new Request('https://localhost:4321/api/users', {
        method: 'GET',
      })

      const response = await GET(request)
      const result = (await response.json()) as PaginatedUsersResponse

      expect(result.data[0]).toEqual(mockUser)
    })

    it('should handle multiple users in response', async () => {
      const mockBackendResponse = {
        success: true,
        data: [
          {
            userId: '1',
            email: 'user1@example.com',
            name: 'User One',
            role: 'user',
            createdAt: '2024-01-01T00:00:00.000Z',
          },
          {
            userId: '2',
            email: 'user2@example.com',
            name: 'User Two',
            role: 'admin',
            createdAt: '2024-01-02T00:00:00.000Z',
          },
          {
            userId: '3',
            email: 'user3@example.com',
            name: 'User Three',
            role: 'moderator',
            createdAt: '2024-01-03T00:00:00.000Z',
          },
        ],
        pagination: {
          total: 3,
          limit: 10,
          offset: 0,
        },
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockBackendResponse,
      })

      const request = new Request('https://localhost:4321/api/users', {
        method: 'GET',
      })

      const response = await GET(request)
      const result = (await response.json()) as PaginatedUsersResponse

      expect(result.data).toHaveLength(3)
      expect(result.pagination.total).toBe(3)
    })
  })

  describe('Cache Control', () => {
    it('should use no-store cache directive for non-local requests', async () => {
      process.env.BACKEND_AI_CALLBACK_URL_DEV = 'https://api.example.com'

      const mockBackendResponse = {
        success: true,
        data: [],
        pagination: {
          total: 0,
          limit: 10,
          offset: 0,
        },
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockBackendResponse,
      })

      const request = new Request('https://localhost:4321/api/users', {
        method: 'GET',
      })

      await GET(request)

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          cache: 'no-store',
        })
      )
    })

    it('should include Content-Type header in request', async () => {
      const mockBackendResponse = {
        success: true,
        data: [],
        pagination: {
          total: 0,
          limit: 10,
          offset: 0,
        },
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockBackendResponse,
      })

      const request = new Request('https://localhost:4321/api/users', {
        method: 'GET',
      })

      await GET(request)

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
        })
      )
    })
  })
})
