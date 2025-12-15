import { beforeEach, describe, expect, it, vi } from 'vitest'

import { registerUser } from '../../../application/actions/registerUser.js'

describe('registerUser', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    global.fetch = vi.fn()
  })

  describe('Successful Registration', () => {
    it('should successfully register a user with valid data', async () => {
      const mockResponse = {
        success: true,
        data: {
          userId: '123',
          email: 'test@example.com',
          name: 'Test User',
        },
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      }

      const result = await registerUser(userData)

      expect(result).toEqual(mockResponse)
      expect(global.fetch).toHaveBeenCalledTimes(1)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/register'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        })
      )
    })

    it('should use NEXT_PUBLIC_BASE_URL environment variable when available', async () => {
      const customBaseUrl = 'https://app.example.com'
      process.env.NEXT_PUBLIC_BASE_URL = customBaseUrl

      const mockResponse = {
        success: true,
        data: {
          userId: '456',
          email: 'user@example.com',
          name: 'Another User',
        },
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const userData = {
        email: 'user@example.com',
        name: 'Another User',
        password: 'securepass',
      }

      await registerUser(userData)

      expect(global.fetch).toHaveBeenCalledWith(`${customBaseUrl}/api/register`, expect.any(Object))

      delete process.env.NEXT_PUBLIC_BASE_URL
    })
  })

  describe('Failed Registration', () => {
    it('should handle registration failure with error message from API', async () => {
      const mockErrorResponse = {
        success: false,
        error: 'Email already exists',
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        json: async () => mockErrorResponse,
      })

      const userData = {
        email: 'existing@example.com',
        name: 'Test User',
        password: 'password123',
      }

      const result = await registerUser(userData)

      expect(result).toEqual({
        success: false,
        error: 'Email already exists',
      })
    })

    it('should return default error message when API response has no error property', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ success: false }),
      })

      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      }

      const result = await registerUser(userData)

      expect(result).toEqual({
        success: false,
        error: 'Registration failed',
      })
    })

    it('should handle network errors gracefully', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'))

      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      }

      const result = await registerUser(userData)

      expect(result).toEqual({
        success: false,
        error: 'Network error',
      })
    })

    it('should handle non-Error exceptions', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce('Unknown error')

      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      }

      const result = await registerUser(userData)

      expect(result).toEqual({
        success: false,
        error: 'An unexpected error occurred',
      })
    })
  })

  describe('Request Format', () => {
    it('should send data with correct Content-Type header', async () => {
      const mockResponse = {
        success: true,
        data: {
          userId: '789',
          email: 'test@example.com',
          name: 'Test User',
        },
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      }

      await registerUser(userData)

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      )
    })

    it('should stringify user data in request body', async () => {
      const mockResponse = {
        success: true,
        data: {
          userId: '101',
          email: 'test@example.com',
          name: 'Test User',
        },
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      }

      await registerUser(userData)

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify(userData),
        })
      )
    })
  })

  describe('Response Types', () => {
    it('should return response with success true and user data on successful registration', async () => {
      const mockResponse = {
        success: true,
        data: {
          userId: '202',
          email: 'newuser@example.com',
          name: 'New User',
        },
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const userData = {
        email: 'newuser@example.com',
        name: 'New User',
        password: 'securepassword',
      }

      const result = await registerUser(userData)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.userId).toBe('202')
      expect(result.data?.email).toBe('newuser@example.com')
      expect(result.data?.name).toBe('New User')
      expect(result.error).toBeUndefined()
    })

    it('should return response with success false and error message on failure', async () => {
      const mockErrorResponse = {
        success: false,
        error: 'Validation failed',
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        json: async () => mockErrorResponse,
      })

      const userData = {
        email: 'invalid',
        name: 'Test User',
        password: 'weak',
      }

      const result = await registerUser(userData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Validation failed')
      expect(result.data).toBeUndefined()
    })
  })
})
