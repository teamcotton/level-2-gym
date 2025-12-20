import { beforeEach, describe, expect, it, vi } from 'vitest'

import { POST } from '../../../../../src/app/api/register/route.js'

describe('POST /api/register', () => {
  const mockEnv = {
    BACKEND_AI_CALLBACK_URL_DEV: 'https://api.example.com',
  }

  beforeEach(() => {
    vi.resetAllMocks()
    global.fetch = vi.fn()
    process.env.BACKEND_AI_CALLBACK_URL_DEV = mockEnv.BACKEND_AI_CALLBACK_URL_DEV
  })

  describe('Successful Registration', () => {
    it('should successfully register a user and return 200', async () => {
      const mockBackendResponse = {
        success: true,
        data: {
          userId: '123',
          email: 'test@example.com',
          name: 'Test User',
        },
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockBackendResponse,
      })

      const requestBody = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      }

      const request = new Request('https://localhost:4321/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result).toEqual(mockBackendResponse)
      expect(global.fetch).toHaveBeenCalledTimes(1)
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/users/register',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      )
    })

    it('should forward user data to backend API', async () => {
      const mockBackendResponse = {
        success: true,
        data: {
          userId: '456',
          email: 'user@test.com',
          name: 'Another User',
        },
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockBackendResponse,
      })

      const requestBody = {
        email: 'user@test.com',
        name: 'Another User',
        password: 'securepass',
      }

      const request = new Request('https://localhost:4321/api/register', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      await POST(request)

      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
      const fetchBody = JSON.parse(fetchCall![1].body as string)

      expect(fetchBody).toEqual({
        email: 'user@test.com',
        name: 'Another User',
        password: 'securepass',
      })
    })

    it('should use BACKEND_AI_CALLBACK_URL_DEV environment variable', async () => {
      process.env.BACKEND_AI_CALLBACK_URL_DEV = 'https://custom-api.example.com'

      const mockBackendResponse = {
        success: true,
        data: {
          userId: '789',
          email: 'custom@example.com',
          name: 'Custom User',
        },
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockBackendResponse,
      })

      const request = new Request('https://localhost:4321/api/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'custom@example.com',
          name: 'Custom User',
          password: 'pass123',
        }),
      })

      await POST(request)

      expect(global.fetch).toHaveBeenCalledWith(
        'https://custom-api.example.com/users/register',
        expect.any(Object)
      )
    })
  })

  describe('Error Handling', () => {
    it('should return 500 when BACKEND_AI_CALLBACK_URL_DEV is not configured', async () => {
      delete process.env.BACKEND_AI_CALLBACK_URL_DEV

      const request = new Request('https://localhost:4321/api/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          name: 'Test User',
          password: 'password123',
        }),
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result).toEqual({
        success: false,
        error: 'Backend API URL not configured',
      })
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should handle backend API failure with error message', async () => {
      const mockErrorResponse = {
        success: false,
        error: 'Email already exists',
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => mockErrorResponse,
      })

      const request = new Request('https://localhost:4321/api/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'duplicate@example.com',
          name: 'Duplicate User',
          password: 'password123',
        }),
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result).toEqual({
        success: false,
        error: 'Email already exists',
      })
    })

    it('should return default error message when backend response has no error property', async () => {
      const mockErrorResponse = {
        success: false,
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => mockErrorResponse,
      })

      const request = new Request('https://localhost:4321/api/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          name: 'Test User',
          password: 'password123',
        }),
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result).toEqual({
        success: false,
        error: 'An unexpected error occurred',
      })
    })

    it('should handle network errors gracefully', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'))

      const request = new Request('https://localhost:4321/api/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          name: 'Test User',
          password: 'password123',
        }),
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result).toEqual({
        success: false,
        error: 'An unexpected error occurred',
      })
    })

    it('should handle backend connection refused with 503 status', async () => {
      const connectionError = new Error('fetch failed')
      Object.assign(connectionError, {
        cause: {
          code: 'ECONNREFUSED',
        },
      })
      ;(global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(connectionError)

      const request = new Request('https://localhost:4321/api/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          name: 'Test User',
          password: 'password123',
        }),
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(503)
      expect(result).toEqual({
        success: false,
        error: 'Unable to connect to backend service. Please ensure the backend server is running.',
      })
    })

    it('should handle ECONNREFUSED error in cause property', async () => {
      const connectionError = new Error('connect ECONNREFUSED 127.0.0.1:3000')
      Object.assign(connectionError, {
        cause: {
          code: 'ECONNREFUSED',
          errno: -61,
          syscall: 'connect',
        },
      })
      ;(global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(connectionError)

      const request = new Request('https://localhost:4321/api/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          name: 'Test User',
          password: 'password123',
        }),
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(503)
      expect(result).toEqual({
        success: false,
        error: 'Unable to connect to backend service. Please ensure the backend server is running.',
      })
    })

    it('should handle fetch failed error message', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('fetch failed'))

      const request = new Request('https://localhost:4321/api/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          name: 'Test User',
          password: 'password123',
        }),
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(503)
      expect(result).toEqual({
        success: false,
        error: 'Unable to connect to backend service. Please ensure the backend server is running.',
      })
    })

    it('should handle non-Error exceptions', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce('String error')

      const request = new Request('https://localhost:4321/api/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          name: 'Test User',
          password: 'password123',
        }),
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result).toEqual({
        success: false,
        error: 'An unexpected error occurred',
      })
    })

    it('should handle invalid JSON in request body', async () => {
      const request = new Request('https://localhost:4321/api/register', {
        method: 'POST',
        body: 'invalid json',
      })

      const response = await POST(request)
      const result = (await response.json()) as { success: boolean; error?: string }

      expect(response.status).toBe(500)
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('Data Validation and Security', () => {
    it('should send all required fields to backend', async () => {
      const mockBackendResponse = {
        success: true,
        data: {
          userId: '123',
          email: 'test@example.com',
          name: 'Test User',
        },
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockBackendResponse,
      })

      const requestBody = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      }

      const request = new Request('https://localhost:4321/api/register', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      await POST(request)

      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
      const sentBody = JSON.parse(fetchCall![1].body as string) as Record<string, unknown>

      expect(sentBody).toHaveProperty('email')
      expect(sentBody).toHaveProperty('name')
      expect(sentBody).toHaveProperty('password')
    })

    it('should handle special characters in user data', async () => {
      const mockBackendResponse = {
        success: true,
        data: {
          userId: '123',
          email: 'test+special@example.com',
          name: "O'Brien",
        },
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockBackendResponse,
      })

      const requestBody = {
        email: 'test+special@example.com',
        name: "O'Brien",
        password: 'p@ss!w0rd#123',
      }

      const request = new Request('https://localhost:4321/api/register', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result).toEqual(mockBackendResponse)
    })

    it('should preserve exact password value when forwarding to backend', async () => {
      const mockBackendResponse = {
        success: true,
        data: {
          userId: '123',
          email: 'test@example.com',
          name: 'Test User',
        },
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockBackendResponse,
      })

      const requestBody = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'complex!P@ssw0rd#with$symbols',
      }

      const request = new Request('https://localhost:4321/api/register', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      await POST(request)

      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
      const sentBody = JSON.parse(fetchCall![1].body as string) as {
        password: string
      }

      expect(sentBody.password).toBe('complex!P@ssw0rd#with$symbols')
    })
  })

  describe('HTTP Response Codes', () => {
    it('should return 200 for successful registration', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: {} }),
      })

      const request = new Request('https://localhost:4321/api/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          name: 'Test User',
          password: 'password123',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
    })

    it('should preserve backend status code on error', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ success: false, error: 'Conflict' }),
      })

      const request = new Request('https://localhost:4321/api/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          name: 'Test User',
          password: 'password123',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(409)
    })

    it('should return 500 for server errors', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Server error'))

      const request = new Request('https://localhost:4321/api/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          name: 'Test User',
          password: 'password123',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
    })
  })
})
