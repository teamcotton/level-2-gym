import { beforeEach, describe, expect, it, vi } from 'vitest'

import { findAllUsers } from '../../../application/actions/findAllUsers.js'

describe('findAllUsers', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    global.fetch = vi.fn()
  })

  describe('Successful User Fetching', () => {
    it('should successfully fetch users with pagination parameters', async () => {
      const mockResponse = {
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
        json: async () => mockResponse,
      })

      const params = { limit: 10, offset: 0 }
      const result = await findAllUsers(params)

      expect(result.success).toBe(true)
      expect(result.users).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(result.error).toBeUndefined()
      expect(global.fetch).toHaveBeenCalledTimes(1)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/users?limit=10&offset=0'),
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        })
      )
    })

    it('should map userId to id for MUI DataGrid compatibility', async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            userId: '789',
            email: 'user@example.com',
            name: 'User Name',
            role: 'moderator',
            createdAt: '2024-01-03T00:00:00.000Z',
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
        json: async () => mockResponse,
      })

      const result = await findAllUsers({ limit: 10, offset: 0 })

      expect(result.success).toBe(true)
      expect(result.users[0]).toHaveProperty('id', '789')
      expect(result.users[0]).toHaveProperty('name', 'User Name')
      expect(result.users[0]).toHaveProperty('email', 'user@example.com')
      expect(result.users[0]).toHaveProperty('role', 'moderator')
      expect(result.users[0]).toHaveProperty('createdAt', '2024-01-03T00:00:00.000Z')
    })

    it('should handle pagination with different limit and offset', async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            userId: '101',
            email: 'page2@example.com',
            name: 'Page 2 User',
            role: 'user',
            createdAt: '2024-01-04T00:00:00.000Z',
          },
        ],
        pagination: {
          total: 50,
          limit: 25,
          offset: 25,
        },
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await findAllUsers({ limit: 25, offset: 25 })

      expect(result.success).toBe(true)
      expect(result.total).toBe(50)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/users?limit=25&offset=25'),
        expect.any(Object)
      )
    })

    it('should handle empty user list', async () => {
      const mockResponse = {
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
        json: async () => mockResponse,
      })

      const result = await findAllUsers({ limit: 10, offset: 0 })

      expect(result.success).toBe(true)
      expect(result.users).toEqual([])
      expect(result.total).toBe(0)
      expect(result.error).toBeUndefined()
    })

    it('should use NEXT_PUBLIC_BASE_URL environment variable when available', async () => {
      const customBaseUrl = 'https://app.example.com'
      process.env.NEXT_PUBLIC_BASE_URL = customBaseUrl

      const mockResponse = {
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
        json: async () => mockResponse,
      })

      await findAllUsers({ limit: 10, offset: 0 })

      expect(global.fetch).toHaveBeenCalledWith(
        `${customBaseUrl}/api/users?limit=10&offset=0`,
        expect.any(Object)
      )

      delete process.env.NEXT_PUBLIC_BASE_URL
    })

    it('should use default base URL when NEXT_PUBLIC_BASE_URL is not set', async () => {
      delete process.env.NEXT_PUBLIC_BASE_URL

      const mockResponse = {
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
        json: async () => mockResponse,
      })

      await findAllUsers({ limit: 10, offset: 0 })

      expect(global.fetch).toHaveBeenCalledWith(
        'https://localhost:4321/api/users?limit=10&offset=0',
        expect.any(Object)
      )
    })
  })

  describe('Failed User Fetching', () => {
    it('should handle 404 with specific error message about API URL', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ success: false, error: 'Not found' }),
      })

      const result = await findAllUsers({ limit: 10, offset: 0 })

      expect(result.success).toBe(false)
      expect(result.users).toEqual([])
      expect(result.total).toBe(0)
      expect(result.error).toContain('Failed to find users')
      expect(result.error).toContain('404')
      expect(result.error).toContain('Not Found')
      expect(result.error).toContain('Please check your API URL in the .env file')
    })

    it('should handle 500 internal server error', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ success: false, error: 'Server error' }),
      })

      const result = await findAllUsers({ limit: 10, offset: 0 })

      expect(result.success).toBe(false)
      expect(result.users).toEqual([])
      expect(result.total).toBe(0)
      expect(result.error).toContain('500')
      expect(result.error).toContain('Internal Server Error')
    })

    it('should handle network errors gracefully', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'))

      const result = await findAllUsers({ limit: 10, offset: 0 })

      expect(result.success).toBe(false)
      expect(result.users).toEqual([])
      expect(result.total).toBe(0)
      expect(result.error).toContain('Network error or server unavailable')
    })

    it('should handle non-Error exceptions', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce('Unknown error')

      const result = await findAllUsers({ limit: 10, offset: 0 })

      expect(result.success).toBe(false)
      expect(result.users).toEqual([])
      expect(result.total).toBe(0)
      expect(result.error).toContain('Network error or server unavailable')
    })

    it('should handle timeout errors', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Request timeout')
      )

      const result = await findAllUsers({ limit: 10, offset: 0 })

      expect(result.success).toBe(false)
      expect(result.users).toEqual([])
      expect(result.total).toBe(0)
      expect(result.error).toBeDefined()
    })
  })

  describe('Request Format', () => {
    it('should send request with correct HTTP method', async () => {
      const mockResponse = {
        success: true,
        data: [],
        pagination: { total: 0, limit: 10, offset: 0 },
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      await findAllUsers({ limit: 10, offset: 0 })

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'GET',
        })
      )
    })

    it('should send request with correct Content-Type header', async () => {
      const mockResponse = {
        success: true,
        data: [],
        pagination: { total: 0, limit: 10, offset: 0 },
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      await findAllUsers({ limit: 10, offset: 0 })

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      )
    })

    it('should send request with no-store cache directive', async () => {
      const mockResponse = {
        success: true,
        data: [],
        pagination: { total: 0, limit: 10, offset: 0 },
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      await findAllUsers({ limit: 10, offset: 0 })

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          cache: 'no-store',
        })
      )
    })
  })

  describe('Response Data Mapping', () => {
    it('should handle response with missing pagination data', async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            userId: '999',
            email: 'test@example.com',
            name: 'Test',
            role: 'user',
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        pagination: {
          total: undefined,
          limit: 10,
          offset: 0,
        },
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await findAllUsers({ limit: 10, offset: 0 })

      expect(result.success).toBe(true)
      expect(result.total).toBe(0)
    })

    it('should handle response with null or undefined data array', async () => {
      const mockResponse = {
        success: true,
        data: null,
        pagination: {
          total: 0,
          limit: 10,
          offset: 0,
        },
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await findAllUsers({ limit: 10, offset: 0 })

      expect(result.success).toBe(true)
      expect(result.users).toEqual([])
    })

    it('should correctly type user roles as admin, moderator, or user', async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            userId: '1',
            email: 'admin@example.com',
            name: 'Admin',
            role: 'admin',
            createdAt: '2024-01-01T00:00:00.000Z',
          },
          {
            userId: '2',
            email: 'mod@example.com',
            name: 'Moderator',
            role: 'moderator',
            createdAt: '2024-01-02T00:00:00.000Z',
          },
          {
            userId: '3',
            email: 'user@example.com',
            name: 'User',
            role: 'user',
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
        json: async () => mockResponse,
      })

      const result = await findAllUsers({ limit: 10, offset: 0 })

      expect(result.success).toBe(true)
      expect(result.users[0]?.role).toBe('admin')
      expect(result.users[1]?.role).toBe('moderator')
      expect(result.users[2]?.role).toBe('user')
    })

    it('should preserve all user fields in the mapped result', async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            userId: '555',
            email: 'detailed@example.com',
            name: 'Detailed User',
            role: 'user',
            createdAt: '2024-06-15T14:30:00.000Z',
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
        json: async () => mockResponse,
      })

      const result = await findAllUsers({ limit: 10, offset: 0 })

      expect(result.success).toBe(true)
      expect(result.users[0]).toEqual({
        id: '555',
        email: 'detailed@example.com',
        name: 'Detailed User',
        role: 'user',
        createdAt: '2024-06-15T14:30:00.000Z',
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero limit parameter', async () => {
      const mockResponse = {
        success: true,
        data: [],
        pagination: { total: 0, limit: 0, offset: 0 },
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await findAllUsers({ limit: 0, offset: 0 })

      expect(result.success).toBe(true)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=0&offset=0'),
        expect.any(Object)
      )
    })

    it('should handle large offset parameter', async () => {
      const mockResponse = {
        success: true,
        data: [],
        pagination: { total: 100, limit: 10, offset: 1000 },
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await findAllUsers({ limit: 10, offset: 1000 })

      expect(result.success).toBe(true)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=10&offset=1000'),
        expect.any(Object)
      )
    })

    it('should handle very large user lists', async () => {
      const largeUserList = Array.from({ length: 100 }, (_, i) => ({
        userId: `user-${i}`,
        email: `user${i}@example.com`,
        name: `User ${i}`,
        role: 'user',
        createdAt: '2024-01-01T00:00:00.000Z',
      }))

      const mockResponse = {
        success: true,
        data: largeUserList,
        pagination: { total: 1000, limit: 100, offset: 0 },
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await findAllUsers({ limit: 100, offset: 0 })

      expect(result.success).toBe(true)
      expect(result.users).toHaveLength(100)
      expect(result.total).toBe(1000)
    })
  })
})
