import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthController } from '../../../../src/adapters/primary/http/auth.controller.js'
import { LoginUserUseCase } from '../../../../src/application/use-cases/login-user.use-case.js'
import { UserId } from '../../../../src/domain/value-objects/userID.js'
import { UnauthorizedException } from '../../../../src/shared/exceptions/unauthorized.exception.js'
import { ValidationException } from '../../../../src/shared/exceptions/validation.exception.js'

// Helper function to create mock auth result with proper UserIdType
function createMockAuthResult(email: string, token: string, roles: string[], userId?: string) {
  return {
    userId: new UserId(userId || uuidv7()).getValue(),
    email,
    access_token: token,
    roles,
  }
}

describe('AuthController', () => {
  let controller: AuthController
  let mockLoginUserUseCase: LoginUserUseCase
  let mockRequest: FastifyRequest
  let mockReply: FastifyReply

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks()

    // Create mock use case
    mockLoginUserUseCase = {
      execute: vi.fn(),
    } as any

    // Create controller instance with mocked use case
    controller = new AuthController(mockLoginUserUseCase)

    // Create mock Fastify reply with chainable methods
    mockReply = {
      code: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    } as any

    // Create mock Fastify request
    mockRequest = {
      body: {},
      params: {},
      query: {},
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'test-user-agent',
      },
    } as any
  })

  describe('constructor', () => {
    it('should create instance with LoginUserUseCase dependency', () => {
      const instance = new AuthController(mockLoginUserUseCase)

      expect(instance).toBeInstanceOf(AuthController)
      expect(instance).toBeDefined()
    })

    it('should accept LoginUserUseCase as dependency', () => {
      const instance = new AuthController(mockLoginUserUseCase)

      expect(instance).toBeDefined()
      expect(instance).toBeInstanceOf(AuthController)
    })
  })

  describe('registerRoutes()', () => {
    it('should register POST /auth/login route', () => {
      const mockApp = {
        post: vi.fn(),
      } as unknown as FastifyInstance

      controller.registerRoutes(mockApp)

      expect(mockApp.post).toHaveBeenCalledTimes(2)
      expect(mockApp.post).toHaveBeenCalledWith('/auth/login', expect.any(Function))
      expect(mockApp.post).toHaveBeenCalledWith('/auth/oauth-sync', expect.any(Function))
    })

    it('should bind controller context to route handler', () => {
      const mockApp = {
        post: vi.fn(),
      } as unknown as FastifyInstance

      controller.registerRoutes(mockApp)

      // Verify handler is a bound function
      const loginHandler = vi.mocked(mockApp.post).mock.calls[0]?.[1]

      expect(loginHandler).toBeTypeOf('function')
    })

    it('should register route with correct HTTP method', () => {
      const mockApp = {
        post: vi.fn(),
        get: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
      } as unknown as FastifyInstance

      controller.registerRoutes(mockApp)

      expect(mockApp.post).toHaveBeenCalledTimes(2)
      expect(mockApp.get).not.toHaveBeenCalled()
      expect(mockApp.put).not.toHaveBeenCalled()
      expect(mockApp.delete).not.toHaveBeenCalled()
    })
  })

  describe('login()', () => {
    describe('successful login', () => {
      it('should authenticate user with valid credentials', async () => {
        mockRequest.body = {
          email: 'user@example.com',
          password: 'SecurePass123!',
        }

        const mockResult = createMockAuthResult('user@example.com', 'mock.jwt.token', ['user'])
        vi.mocked(mockLoginUserUseCase.execute).mockResolvedValue(mockResult)

        await controller.login(mockRequest, mockReply)

        expect(mockLoginUserUseCase.execute).toHaveBeenCalledTimes(1)
        expect(mockLoginUserUseCase.execute).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'user@example.com',
            password: 'SecurePass123!',
          }),
          expect.objectContaining({
            ipAddress: expect.any(String),
            userAgent: expect.any(String),
          })
        )
      })

      it('should return 200 status code for successful login', async () => {
        mockRequest.body = {
          email: 'user@example.com',
          password: 'SecurePass123!',
        }

        const mockResult = createMockAuthResult('user@example.com', 'mock.jwt.token', ['user'])
        vi.mocked(mockLoginUserUseCase.execute).mockResolvedValue(mockResult)

        await controller.login(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(200)
      })

      it('should return success response with user data and token', async () => {
        mockRequest.body = {
          email: 'user@example.com',
          password: 'SecurePass123!',
        }

        const mockResult = createMockAuthResult('user@example.com', 'mock.jwt.token', ['user'])
        vi.mocked(mockLoginUserUseCase.execute).mockResolvedValue(mockResult)

        await controller.login(mockRequest, mockReply)

        expect(mockReply.send).toHaveBeenCalledWith({
          success: true,
          data: mockResult,
        })
      })

      it('should handle admin user login', async () => {
        mockRequest.body = {
          email: 'admin@example.com',
          password: 'AdminPass123!',
        }

        const mockResult = createMockAuthResult('admin@example.com', 'admin.jwt.token', ['admin'])
        vi.mocked(mockLoginUserUseCase.execute).mockResolvedValue(mockResult)

        await controller.login(mockRequest, mockReply)

        expect(mockReply.send).toHaveBeenCalledWith({
          success: true,
          data: mockResult,
        })
      })

      it('should chain reply methods correctly', async () => {
        mockRequest.body = {
          email: 'user@example.com',
          password: 'SecurePass123!',
        }

        const mockResult = createMockAuthResult('user@example.com', 'mock.jwt.token', ['user'])
        vi.mocked(mockLoginUserUseCase.execute).mockResolvedValue(mockResult)

        await controller.login(mockRequest, mockReply)

        // Verify code() was called before send()
        const codeCall = vi.mocked(mockReply.code).mock.invocationCallOrder[0]
        const sendCall = vi.mocked(mockReply.send).mock.invocationCallOrder[0]
        expect(codeCall).toBeDefined()
        expect(sendCall).toBeDefined()
        expect(codeCall!).toBeLessThan(sendCall!)
      })

      it('should preserve exact response structure from use case', async () => {
        mockRequest.body = {
          email: 'test@example.com',
          password: 'TestPass123!',
        }

        const mockResult = createMockAuthResult(
          'test@example.com',
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature',
          ['user', 'moderator']
        )
        vi.mocked(mockLoginUserUseCase.execute).mockResolvedValue(mockResult)

        await controller.login(mockRequest, mockReply)

        const sentData = vi.mocked(mockReply.send).mock.calls[0]?.[0] as {
          success: boolean
          data: typeof mockResult
        }
        expect(sentData).toEqual({
          success: true,
          data: mockResult,
        })
        expect(sentData.data).toHaveProperty('userId')
        expect(sentData.data).toHaveProperty('email')
        expect(sentData.data).toHaveProperty('access_token')
        expect(sentData.data).toHaveProperty('roles')
      })

      it('should include success property set to true', async () => {
        mockRequest.body = {
          email: 'user@example.com',
          password: 'SecurePass123!',
        }

        const mockResult = createMockAuthResult('user@example.com', 'mock.jwt.token', ['user'])
        vi.mocked(mockLoginUserUseCase.execute).mockResolvedValue(mockResult)

        await controller.login(mockRequest, mockReply)

        const sentData = vi.mocked(mockReply.send).mock.calls[0]?.[0] as {
          success: boolean
          data?: typeof mockResult
          error?: string
        }
        expect(sentData).toHaveProperty('success')
        expect(sentData.success).toBe(true)
        expect(typeof sentData.success).toBe('boolean')
      })

      it('should include data property on success', async () => {
        mockRequest.body = {
          email: 'user@example.com',
          password: 'SecurePass123!',
        }

        const mockResult = createMockAuthResult('user@example.com', 'mock.jwt.token', ['user'])
        vi.mocked(mockLoginUserUseCase.execute).mockResolvedValue(mockResult)

        await controller.login(mockRequest, mockReply)

        const sentData = vi.mocked(mockReply.send).mock.calls[0]?.[0] as {
          success: boolean
          data?: typeof mockResult
          error?: string
        }
        expect(sentData).toHaveProperty('data')
        expect(sentData.data).toBeDefined()
        expect(sentData).not.toHaveProperty('error')
      })
    })

    describe('validation errors', () => {
      it('should handle missing email field', async () => {
        mockRequest.body = {
          password: 'SecurePass123!',
        }

        await controller.login(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Email is required and must be a string',
        })
      })

      it('should handle missing password field', async () => {
        mockRequest.body = {
          email: 'user@example.com',
        }

        await controller.login(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Password is required and must be a string',
        })
      })

      it('should handle empty request body', async () => {
        mockRequest.body = {}

        await controller.login(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: expect.any(String),
        })
      })

      it('should handle null request body', async () => {
        mockRequest.body = null as any

        await controller.login(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: expect.any(String),
        })
      })

      it('should handle non-string email', async () => {
        mockRequest.body = {
          email: 12345,
          password: 'SecurePass123!',
        }

        await controller.login(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Email is required and must be a string',
        })
      })

      it('should handle non-string password', async () => {
        mockRequest.body = {
          email: 'user@example.com',
          password: 12345,
        }

        await controller.login(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Password is required and must be a string',
        })
      })

      it('should return 400 status code for validation errors', async () => {
        mockRequest.body = {
          email: 'invalid-email',
          password: 'SecurePass123!',
        }

        vi.mocked(mockLoginUserUseCase.execute).mockRejectedValue(
          new ValidationException('Invalid email format')
        )

        await controller.login(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(400)
      })

      it('should return error response for validation failures', async () => {
        mockRequest.body = {
          email: 'invalid-email',
          password: 'SecurePass123!',
        }

        vi.mocked(mockLoginUserUseCase.execute).mockRejectedValue(
          new ValidationException('Invalid email format')
        )

        await controller.login(mockRequest, mockReply)

        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid email format',
        })
      })

      it('should include error property on validation failure', async () => {
        mockRequest.body = {
          email: 'user@example.com',
        }

        await controller.login(mockRequest, mockReply)

        const sentData = vi.mocked(mockReply.send).mock.calls[0]?.[0]
        expect(sentData).toHaveProperty('error')
        expect(sentData).not.toHaveProperty('data')
        expect(sentData).toHaveProperty('success', false)
      })
    })

    describe('authentication errors', () => {
      it('should handle invalid credentials with 401 status', async () => {
        mockRequest.body = {
          email: 'user@example.com',
          password: 'WrongPassword',
        }

        vi.mocked(mockLoginUserUseCase.execute).mockRejectedValue(
          new UnauthorizedException('Invalid email or password')
        )

        await controller.login(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(401)
      })

      it('should return generic error message for invalid credentials', async () => {
        mockRequest.body = {
          email: 'user@example.com',
          password: 'WrongPassword',
        }

        vi.mocked(mockLoginUserUseCase.execute).mockRejectedValue(
          new UnauthorizedException('Invalid email or password')
        )

        await controller.login(mockRequest, mockReply)

        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid email or password',
        })
      })

      it('should handle non-existent user', async () => {
        mockRequest.body = {
          email: 'nonexistent@example.com',
          password: 'SecurePass123!',
        }

        vi.mocked(mockLoginUserUseCase.execute).mockRejectedValue(
          new UnauthorizedException('Invalid email or password')
        )

        await controller.login(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(401)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid email or password',
        })
      })

      it('should handle wrong password', async () => {
        mockRequest.body = {
          email: 'user@example.com',
          password: 'WrongPassword123!',
        }

        vi.mocked(mockLoginUserUseCase.execute).mockRejectedValue(
          new UnauthorizedException('Invalid email or password')
        )

        await controller.login(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(401)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid email or password',
        })
      })

      it('should not reveal whether email exists (prevents user enumeration)', async () => {
        // Test with non-existent email
        mockRequest.body = {
          email: 'nonexistent@example.com',
          password: 'SecurePass123!',
        }

        vi.mocked(mockLoginUserUseCase.execute).mockRejectedValue(
          new UnauthorizedException('Invalid email or password')
        )

        await controller.login(mockRequest, mockReply)

        const firstError = vi.mocked(mockReply.send).mock.calls[0]?.[0] as {
          success: boolean
          error: string
        }

        // Reset mocks
        vi.clearAllMocks()
        mockReply = {
          code: vi.fn().mockReturnThis(),
          send: vi.fn().mockReturnThis(),
        } as any

        // Test with existing email but wrong password
        mockRequest.body = {
          email: 'user@example.com',
          password: 'WrongPassword123!',
        }

        vi.mocked(mockLoginUserUseCase.execute).mockRejectedValue(
          new UnauthorizedException('Invalid email or password')
        )

        await controller.login(mockRequest, mockReply)

        const secondError = vi.mocked(mockReply.send).mock.calls[0]?.[0] as {
          success: boolean
          error: string
        }

        // Both errors should be identical
        expect(firstError.error).toBe(secondError.error)
        expect(firstError.error).toBe('Invalid email or password')
      })
    })

    describe('error handling', () => {
      it('should handle unexpected errors with 500 status', async () => {
        mockRequest.body = {
          email: 'user@example.com',
          password: 'SecurePass123!',
        }

        vi.mocked(mockLoginUserUseCase.execute).mockRejectedValue(
          new Error('Database connection failed')
        )

        await controller.login(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
      })

      it('should return error message for unexpected errors', async () => {
        mockRequest.body = {
          email: 'user@example.com',
          password: 'SecurePass123!',
        }

        vi.mocked(mockLoginUserUseCase.execute).mockRejectedValue(
          new Error('Unexpected error occurred')
        )

        await controller.login(mockRequest, mockReply)

        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Unexpected error occurred',
        })
      })

      it('should use BaseException statusCode when available', async () => {
        mockRequest.body = {
          email: 'user@example.com',
          password: 'SecurePass123!',
        }

        const customError = new UnauthorizedException('Custom error')
        vi.mocked(mockLoginUserUseCase.execute).mockRejectedValue(customError)

        await controller.login(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(401)
      })

      it('should handle errors without message property', async () => {
        mockRequest.body = {
          email: 'user@example.com',
          password: 'SecurePass123!',
        }

        // Simulate error without message
        vi.mocked(mockLoginUserUseCase.execute).mockRejectedValue({})

        await controller.login(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'An unexpected error occurred',
        })
      })

      it('should include success property set to false on error', async () => {
        mockRequest.body = {
          email: 'user@example.com',
          password: 'SecurePass123!',
        }

        vi.mocked(mockLoginUserUseCase.execute).mockRejectedValue(new Error('Test error'))

        await controller.login(mockRequest, mockReply)

        const sentData = vi.mocked(mockReply.send).mock.calls[0]?.[0] as {
          success: boolean
          error?: string
          data?: any
        }
        expect(sentData.success).toBe(false)
        expect(sentData).toHaveProperty('error')
        expect(sentData).not.toHaveProperty('data')
      })
    })

    describe('integration with route registration', () => {
      it('should call login when POST /auth/login route is invoked', async () => {
        const mockApp = {
          post: vi.fn(),
        } as unknown as FastifyInstance

        controller.registerRoutes(mockApp)

        const loginHandler = vi.mocked(mockApp.post).mock.calls[0]?.[1] as unknown as (
          req: FastifyRequest,
          reply: FastifyReply
        ) => Promise<void>

        expect(loginHandler).toBeDefined()

        mockRequest.body = {
          email: 'user@example.com',
          password: 'SecurePass123!',
        }

        const mockResult = createMockAuthResult('user@example.com', 'mock.jwt.token', ['user'])

        vi.mocked(mockLoginUserUseCase.execute).mockResolvedValue(mockResult)

        await loginHandler(mockRequest, mockReply)

        expect(mockLoginUserUseCase.execute).toHaveBeenCalled()
        expect(mockReply.code).toHaveBeenCalledWith(200)
      })

      it('should maintain controller context when handler is invoked', async () => {
        const mockApp = {
          post: vi.fn(),
        } as unknown as FastifyInstance

        controller.registerRoutes(mockApp)

        const loginHandler = vi.mocked(mockApp.post).mock.calls[0]?.[1] as unknown as (
          req: FastifyRequest,
          reply: FastifyReply
        ) => Promise<void>

        mockRequest.body = {
          email: 'user@example.com',
          password: 'SecurePass123!',
        }

        const mockResult = createMockAuthResult('user@example.com', 'mock.jwt.token', ['user'])

        vi.mocked(mockLoginUserUseCase.execute).mockResolvedValue(mockResult)

        // Should not throw error about 'this' context
        await expect(loginHandler(mockRequest, mockReply)).resolves.toBeUndefined()
      })
    })

    describe('response structure validation', () => {
      it('should always return object with success property', async () => {
        mockRequest.body = {
          email: 'user@example.com',
          password: 'SecurePass123!',
        }

        const mockResult = createMockAuthResult('user@example.com', 'mock.jwt.token', ['user'])
        vi.mocked(mockLoginUserUseCase.execute).mockResolvedValue(mockResult)

        await controller.login(mockRequest, mockReply)

        const sentData = vi.mocked(mockReply.send).mock.calls[0]?.[0] as Record<string, any>

        expect(sentData).toHaveProperty('success')
      })

      it('should return either data or error property but not both', async () => {
        mockRequest.body = {
          email: 'user@example.com',
          password: 'SecurePass123!',
        }

        const mockResult = createMockAuthResult('user@example.com', 'mock.jwt.token', ['user'])

        vi.mocked(mockLoginUserUseCase.execute).mockResolvedValue(mockResult)

        await controller.login(mockRequest, mockReply)

        const successData = vi.mocked(mockReply.send).mock.calls[0]?.[0]
        expect(successData).toHaveProperty('data')
        expect(successData).not.toHaveProperty('error')

        // Reset and test error case
        vi.clearAllMocks()
        mockReply = {
          code: vi.fn().mockReturnThis(),
          send: vi.fn().mockReturnThis(),
        } as any

        vi.mocked(mockLoginUserUseCase.execute).mockRejectedValue(new Error('Test error'))

        await controller.login(mockRequest, mockReply)

        const errorData = vi.mocked(mockReply.send).mock.calls[0]?.[0]
        expect(errorData).toHaveProperty('error')
        expect(errorData).not.toHaveProperty('data')
      })
    })

    describe('edge cases', () => {
      it('should handle very long email addresses', async () => {
        const longEmail = 'a'.repeat(100) + '@example.com'
        mockRequest.body = {
          email: longEmail,
          password: 'SecurePass123!',
        }

        const mockResult = createMockAuthResult(longEmail, 'mock.jwt.token', ['user'])

        vi.mocked(mockLoginUserUseCase.execute).mockResolvedValue(mockResult)

        await controller.login(mockRequest, mockReply)

        expect(mockLoginUserUseCase.execute).toHaveBeenCalledWith(
          expect.objectContaining({ email: longEmail }),
          expect.objectContaining({
            ipAddress: expect.any(String),
            userAgent: expect.any(String),
          })
        )
      })

      it('should handle special characters in password', async () => {
        const specialPassword = '!@#$%^&*()_+-={}[]|:;<>?,./'
        mockRequest.body = {
          email: 'user@example.com',
          password: specialPassword,
        }

        const mockResult = createMockAuthResult('user@example.com', 'mock.jwt.token', ['user'])

        vi.mocked(mockLoginUserUseCase.execute).mockResolvedValue(mockResult)

        await controller.login(mockRequest, mockReply)

        expect(mockLoginUserUseCase.execute).toHaveBeenCalledWith(
          expect.objectContaining({ password: specialPassword }),
          expect.objectContaining({
            ipAddress: expect.any(String),
            userAgent: expect.any(String),
          })
        )
      })

      it('should handle unicode characters in credentials', async () => {
        mockRequest.body = {
          email: 'user@例え.com',
          password: 'パスワード123',
        }

        const mockResult = createMockAuthResult('user@例え.com', 'mock.jwt.token', ['user'])

        vi.mocked(mockLoginUserUseCase.execute).mockResolvedValue(mockResult)

        await controller.login(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(200)
      })
    })
  })
})
