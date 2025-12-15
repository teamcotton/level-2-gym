import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { UserController } from '../../../../src/adapters/primary/http/user.controller.js'
import { RegisterUserDto } from '../../../../src/application/dtos/register-user.dto.js'
import { GetAllUsersUseCase } from '../../../../src/application/use-cases/get-all-users.use-case.js'
import { RegisterUserUseCase } from '../../../../src/application/use-cases/register-user.use-case.js'
import { ValidationException } from '../../../../src/shared/exceptions/validation.exception.js'

describe('UserController', () => {
  let controller: UserController
  let mockRegisterUserUseCase: RegisterUserUseCase
  let mockGetAllUsersUseCase: GetAllUsersUseCase
  let mockRequest: any
  let mockReply: FastifyReply

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks()

    // Create mock use case
    mockRegisterUserUseCase = {
      execute: vi.fn(),
    } as any

    // Create mock get all users use case
    mockGetAllUsersUseCase = {
      execute: vi.fn(),
    } as any

    // Create controller instance with mocked use case
    controller = new UserController(mockRegisterUserUseCase, mockGetAllUsersUseCase)

    // Create mock Fastify reply with chainable methods
    mockReply = {
      code: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    } as any

    // Create mock Fastify request
    mockRequest = {
      body: {},
      params: {},
    } as any
  })

  describe('constructor', () => {
    it('should create instance with RegisterUserUseCase dependency', () => {
      const instance = new UserController(mockRegisterUserUseCase, mockGetAllUsersUseCase)

      expect(instance).toBeInstanceOf(UserController)
      expect(instance).toBeDefined()
    })
  })

  describe('registerRoutes()', () => {
    it('should register POST /users/register route', () => {
      const mockApp = {
        post: vi.fn(),
        get: vi.fn(),
      } as unknown as FastifyInstance

      controller.registerRoutes(mockApp)

      expect(mockApp.post).toHaveBeenCalledTimes(1)
      expect(mockApp.post).toHaveBeenCalledWith('/users/register', expect.any(Function))
    })

    it('should register GET /users/:id route', () => {
      const mockApp = {
        post: vi.fn(),
        get: vi.fn(),
      } as unknown as FastifyInstance

      controller.registerRoutes(mockApp)

      expect(mockApp.get).toHaveBeenCalledTimes(2)
      expect(mockApp.get).toHaveBeenCalledWith('/users/:id', expect.any(Function))
      expect(mockApp.get).toHaveBeenCalledWith('/users', expect.any(Function))
    })

    it('should bind controller context to route handlers', () => {
      const mockApp = {
        post: vi.fn(),
        get: vi.fn(),
      } as unknown as FastifyInstance

      controller.registerRoutes(mockApp)

      // Verify handlers are bound functions
      const registerHandler = vi.mocked(mockApp.post).mock.calls[0]?.[1]
      const getUserHandler = vi.mocked(mockApp.get).mock.calls[0]?.[1]

      expect(registerHandler).toBeTypeOf('function')
      expect(getUserHandler).toBeTypeOf('function')
    })

    it('should register routes in correct order', () => {
      const mockApp = {
        post: vi.fn(),
        get: vi.fn(),
      } as unknown as FastifyInstance

      controller.registerRoutes(mockApp)

      const callOrder = vi.mocked(mockApp.post).mock.invocationCallOrder[0]
      const getCallOrder = vi.mocked(mockApp.get).mock.invocationCallOrder[0]

      expect(callOrder).toBeDefined()
      expect(getCallOrder).toBeDefined()
      expect(callOrder!).toBeLessThan(getCallOrder!)
    })
  })

  describe('register()', () => {
    describe('successful registration', () => {
      it('should register a new user successfully', async () => {
        const requestBody = {
          email: 'test@example.com',
          password: 'SecurePass123!',
          name: 'Test User',
        }

        mockRequest.body = requestBody

        const mockResult = { userId: 'user-123-abc' }
        vi.mocked(mockRegisterUserUseCase.execute).mockResolvedValue(mockResult)

        await controller.register(mockRequest, mockReply)

        expect(mockRegisterUserUseCase.execute).toHaveBeenCalledTimes(1)
        expect(mockRegisterUserUseCase.execute).toHaveBeenCalledWith(expect.any(RegisterUserDto))
      })

      it('should validate request body with RegisterUserDto', async () => {
        const requestBody = {
          email: 'test@example.com',
          password: 'SecurePass123!',
          name: 'Test User',
        }

        mockRequest.body = requestBody

        const mockResult = { userId: 'user-123-abc' }
        vi.mocked(mockRegisterUserUseCase.execute).mockResolvedValue(mockResult)

        await controller.register(mockRequest, mockReply)

        const executedDto = vi.mocked(mockRegisterUserUseCase.execute).mock.calls[0]?.[0]
        expect(executedDto).toBeInstanceOf(RegisterUserDto)
        expect(executedDto?.email).toBe('test@example.com')
        expect(executedDto?.password).toBe('SecurePass123!')
        expect(executedDto?.name).toBe('Test User')
      })

      it('should return 201 status code for successful registration', async () => {
        mockRequest.body = {
          email: 'test@example.com',
          password: 'SecurePass123!',
          name: 'Test User',
        }

        const mockResult = { userId: 'user-123-abc' }
        vi.mocked(mockRegisterUserUseCase.execute).mockResolvedValue(mockResult)

        await controller.register(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(201)
      })

      it('should return success response with user data', async () => {
        mockRequest.body = {
          email: 'test@example.com',
          password: 'SecurePass123!',
          name: 'Test User',
        }

        const mockResult = { userId: 'user-123-abc' }
        vi.mocked(mockRegisterUserUseCase.execute).mockResolvedValue(mockResult)

        await controller.register(mockRequest, mockReply)

        expect(mockReply.send).toHaveBeenCalledWith({
          success: true,
          data: mockResult,
        })
      })

      it('should handle different valid user data', async () => {
        mockRequest.body = {
          email: 'another@example.com',
          password: 'DifferentPass456!',
          name: 'Another User',
        }

        const mockResult = { userId: 'user-456-xyz' }
        vi.mocked(mockRegisterUserUseCase.execute).mockResolvedValue(mockResult)

        await controller.register(mockRequest, mockReply)

        expect(mockReply.send).toHaveBeenCalledWith({
          success: true,
          data: { userId: 'user-456-xyz' },
        })
      })

      it('should chain reply methods correctly', async () => {
        mockRequest.body = {
          email: 'test@example.com',
          password: 'SecurePass123!',
          name: 'Test User',
        }

        const mockResult = { userId: 'user-123-abc' }
        vi.mocked(mockRegisterUserUseCase.execute).mockResolvedValue(mockResult)

        await controller.register(mockRequest, mockReply)

        // Verify code() was called before send()
        const codeCall = vi.mocked(mockReply.code).mock.invocationCallOrder[0]
        const sendCall = vi.mocked(mockReply.send).mock.invocationCallOrder[0]
        expect(codeCall).toBeDefined()
        expect(sendCall).toBeDefined()
        expect(codeCall!).toBeLessThan(sendCall!)
      })
    })

    describe('validation errors', () => {
      it('should handle invalid email format from use case', async () => {
        mockRequest.body = {
          email: 'invalid-email',
          password: 'SecurePass123!',
          name: 'Test User',
        }

        // DTO validation passes (it's a string), but Email value object validation fails
        vi.mocked(mockRegisterUserUseCase.execute).mockRejectedValue(
          new ValidationException('Invalid email format')
        )

        await controller.register(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid email format',
        })
      })

      it('should handle missing email field', async () => {
        mockRequest.body = {
          password: 'SecurePass123!',
          name: 'Test User',
        }

        await controller.register(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Email is required and must be a string',
        })
      })

      it('should handle missing password field', async () => {
        mockRequest.body = {
          email: 'test@example.com',
          name: 'Test User',
        }

        await controller.register(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Password is required and must be a string',
        })
      })

      it('should handle missing name field', async () => {
        mockRequest.body = {
          email: 'test@example.com',
          password: 'SecurePass123!',
        }

        await controller.register(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Name is required and must be a string',
        })
      })

      it('should handle TypeErrorException for invalid request body type', async () => {
        mockRequest.body = null

        await controller.register(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Data must be a valid object',
        })
      })

      it('should handle array as request body', async () => {
        mockRequest.body = []

        await controller.register(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Data must be a valid object',
        })
      })

      it('should not call use case when DTO validation fails', async () => {
        mockRequest.body = {
          email: '', // Empty string fails DTO validation
          password: 'SecurePass123!',
          name: 'Test User',
        }

        await controller.register(mockRequest, mockReply)

        expect(mockRegisterUserUseCase.execute).not.toHaveBeenCalled()
      })
    })

    describe('use case errors', () => {
      it('should handle duplicate email error from use case', async () => {
        mockRequest.body = {
          email: 'existing@example.com',
          password: 'SecurePass123!',
          name: 'Test User',
        }

        vi.mocked(mockRegisterUserUseCase.execute).mockRejectedValue(
          new Error('User with this email already exists')
        )

        await controller.register(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'User with this email already exists',
        })
      })

      it('should handle password validation error from use case', async () => {
        mockRequest.body = {
          email: 'test@example.com',
          password: 'weak',
          name: 'Test User',
        }

        vi.mocked(mockRegisterUserUseCase.execute).mockRejectedValue(
          new ValidationException('Password must be at least 8 characters')
        )

        await controller.register(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Password must be at least 8 characters',
        })
      })

      it('should handle repository errors from use case', async () => {
        mockRequest.body = {
          email: 'test@example.com',
          password: 'SecurePass123!',
          name: 'Test User',
        }

        vi.mocked(mockRegisterUserUseCase.execute).mockRejectedValue(
          new Error('Database connection failed')
        )

        await controller.register(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Database connection failed',
        })
      })

      it('should handle generic errors from use case', async () => {
        mockRequest.body = {
          email: 'test@example.com',
          password: 'SecurePass123!',
          name: 'Test User',
        }

        vi.mocked(mockRegisterUserUseCase.execute).mockRejectedValue(new Error('Unexpected error'))

        await controller.register(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Unexpected error',
        })
      })
    })

    describe('edge cases', () => {
      it('should handle extra fields in request body', async () => {
        mockRequest.body = {
          email: 'test@example.com',
          password: 'SecurePass123!',
          name: 'Test User',
          extraField: 'should be ignored',
          anotherField: 123,
        }

        const mockResult = { userId: 'user-123-abc' }
        vi.mocked(mockRegisterUserUseCase.execute).mockResolvedValue(mockResult)

        await controller.register(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(201)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: true,
          data: mockResult,
        })
      })

      it('should handle whitespace in fields', async () => {
        mockRequest.body = {
          email: '  test@example.com  ',
          password: '  SecurePass123!  ',
          name: '  Test User  ',
        }

        const mockResult = { userId: 'user-123-abc' }
        vi.mocked(mockRegisterUserUseCase.execute).mockResolvedValue(mockResult)

        await controller.register(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(201)
      })

      it('should handle empty object as request body', async () => {
        mockRequest.body = {}

        await controller.register(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: expect.stringContaining('required'),
        })
      })

      it('should handle string instead of object', async () => {
        mockRequest.body = 'invalid'

        await controller.register(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
      })

      it('should handle number instead of object', async () => {
        mockRequest.body = 123

        await controller.register(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
      })
    })

    describe('response structure', () => {
      it('should return consistent success response structure', async () => {
        mockRequest.body = {
          email: 'test@example.com',
          password: 'SecurePass123!',
          name: 'Test User',
        }

        const mockResult = { userId: 'user-123-abc' }
        vi.mocked(mockRegisterUserUseCase.execute).mockResolvedValue(mockResult)

        await controller.register(mockRequest, mockReply)

        const sentResponse = vi.mocked(mockReply.send).mock.calls[0]?.[0] as Record<string, any>
        expect(sentResponse).toHaveProperty('success', true)
        expect(sentResponse).toHaveProperty('data')
        expect(Object.keys(sentResponse)).toEqual(['success', 'data'])
      })

      it('should return consistent error response structure', async () => {
        mockRequest.body = {
          email: '', // Empty string fails DTO validation
          password: 'SecurePass123!',
          name: 'Test User',
        }

        await controller.register(mockRequest, mockReply)

        const sentResponse = vi.mocked(mockReply.send).mock.calls[0]?.[0] as Record<string, any>
        expect(sentResponse).toHaveProperty('success', false)
        expect(sentResponse).toHaveProperty('error')
        expect(Object.keys(sentResponse)).toEqual(['success', 'error'])
      })

      it('should include userId in success response data', async () => {
        mockRequest.body = {
          email: 'test@example.com',
          password: 'SecurePass123!',
          name: 'Test User',
        }

        const mockResult = { userId: 'user-123-abc' }
        vi.mocked(mockRegisterUserUseCase.execute).mockResolvedValue(mockResult)

        await controller.register(mockRequest, mockReply)

        const sentResponse = vi.mocked(mockReply.send).mock.calls[0]?.[0] as {
          data?: { userId: string }
        }
        expect(sentResponse.data).toEqual({ userId: 'user-123-abc' })
      })

      it('should include error message in error response', async () => {
        mockRequest.body = null

        await controller.register(mockRequest, mockReply)

        const sentResponse = vi.mocked(mockReply.send).mock.calls[0]?.[0] as { error?: string }
        expect(sentResponse.error).toBe('Data must be a valid object')
      })
    })
  })

  describe('getUser()', () => {
    it('should return user by id from params', async () => {
      const mockRequestWithParams = {
        params: { id: 'user-123' },
      } as FastifyRequest<{ Params: { id: string } }>

      await controller.getUser(mockRequestWithParams, mockReply)

      expect(mockReply.send).toHaveBeenCalledWith({ id: 'user-123' })
    })

    it('should handle different user ids', async () => {
      const mockRequestWithParams = {
        params: { id: 'user-456-xyz' },
      } as FastifyRequest<{ Params: { id: string } }>

      await controller.getUser(mockRequestWithParams, mockReply)

      expect(mockReply.send).toHaveBeenCalledWith({ id: 'user-456-xyz' })
    })

    it('should extract id from request params', async () => {
      const mockRequestWithParams = {
        params: { id: 'test-id-789' },
      } as FastifyRequest<{ Params: { id: string } }>

      await controller.getUser(mockRequestWithParams, mockReply)

      const sentResponse = vi.mocked(mockReply.send).mock.calls?.[0]?.[0]
      expect(sentResponse).toEqual({ id: 'test-id-789' })
    })

    it('should call reply.send once', async () => {
      const mockRequestWithParams = {
        params: { id: 'user-123' },
      } as FastifyRequest<{ Params: { id: string } }>

      await controller.getUser(mockRequestWithParams, mockReply)

      expect(mockReply.send).toHaveBeenCalledTimes(1)
    })
  })

  describe('getAllUsers()', () => {
    beforeEach(() => {
      mockRequest = {
        query: {},
      } as FastifyRequest<{ Querystring: { page?: string; pageSize?: string } }>
    })

    describe('successful retrieval', () => {
      it('should get all users without pagination parameters', async () => {
        const mockResult = {
          data: [
            {
              userId: 'user-1',
              email: 'user1@example.com',
              name: 'User One',
              role: 'user',
              createdAt: new Date(),
            },
          ],
          total: 1,
          page: 1,
          pageSize: 10,
          totalPages: 1,
        }

        vi.mocked(mockGetAllUsersUseCase.execute).mockResolvedValue(mockResult)

        await controller.getAllUsers(
          mockRequest as FastifyRequest<{ Querystring: { page?: string; pageSize?: string } }>,
          mockReply
        )

        expect(mockGetAllUsersUseCase.execute).toHaveBeenCalledWith(undefined)
        expect(mockReply.code).toHaveBeenCalledWith(200)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: true,
          data: mockResult.data,
          pagination: {
            page: 1,
            pageSize: 10,
            total: 1,
            totalPages: 1,
          },
        })
      })

      it('should get all users with pagination parameters', async () => {
        mockRequest.query = { page: '2', pageSize: '20' }

        const mockResult = {
          data: [
            {
              userId: 'user-1',
              email: 'user1@example.com',
              name: 'User One',
              role: 'user',
              createdAt: new Date(),
            },
          ],
          total: 50,
          page: 2,
          pageSize: 20,
          totalPages: 3,
        }

        vi.mocked(mockGetAllUsersUseCase.execute).mockResolvedValue(mockResult)

        await controller.getAllUsers(
          mockRequest as FastifyRequest<{ Querystring: { page?: string; pageSize?: string } }>,
          mockReply
        )

        expect(mockGetAllUsersUseCase.execute).toHaveBeenCalledWith({ page: 2, pageSize: 20 })
        expect(mockReply.code).toHaveBeenCalledWith(200)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: true,
          data: mockResult.data,
          pagination: {
            page: 2,
            pageSize: 20,
            total: 50,
            totalPages: 3,
          },
        })
      })

      it('should handle only page parameter', async () => {
        mockRequest.query = { page: '3' }

        const mockResult = {
          data: [],
          total: 25,
          page: 3,
          pageSize: 10,
          totalPages: 3,
        }

        vi.mocked(mockGetAllUsersUseCase.execute).mockResolvedValue(mockResult)

        await controller.getAllUsers(
          mockRequest as FastifyRequest<{ Querystring: { page?: string; pageSize?: string } }>,
          mockReply
        )

        expect(mockGetAllUsersUseCase.execute).toHaveBeenCalledWith({ page: 3, pageSize: 10 })
      })

      it('should handle only pageSize parameter', async () => {
        mockRequest.query = { pageSize: '50' }

        const mockResult = {
          data: [],
          total: 100,
          page: 1,
          pageSize: 50,
          totalPages: 2,
        }

        vi.mocked(mockGetAllUsersUseCase.execute).mockResolvedValue(mockResult)

        await controller.getAllUsers(
          mockRequest as FastifyRequest<{ Querystring: { page?: string; pageSize?: string } }>,
          mockReply
        )

        expect(mockGetAllUsersUseCase.execute).toHaveBeenCalledWith({ page: 1, pageSize: 50 })
      })
    })

    describe('validation errors', () => {
      it('should return 400 for invalid page parameter (not a number)', async () => {
        mockRequest.query = { page: 'invalid' }

        await controller.getAllUsers(
          mockRequest as FastifyRequest<{ Querystring: { page?: string; pageSize?: string } }>,
          mockReply
        )

        expect(mockGetAllUsersUseCase.execute).not.toHaveBeenCalled()
        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid page parameter. Must be a positive integer.',
        })
      })

      it('should return 400 for page less than 1', async () => {
        mockRequest.query = { page: '0' }

        await controller.getAllUsers(
          mockRequest as FastifyRequest<{ Querystring: { page?: string; pageSize?: string } }>,
          mockReply
        )

        expect(mockGetAllUsersUseCase.execute).not.toHaveBeenCalled()
        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid page parameter. Must be a positive integer.',
        })
      })

      it('should return 400 for negative page', async () => {
        mockRequest.query = { page: '-1' }

        await controller.getAllUsers(
          mockRequest as FastifyRequest<{ Querystring: { page?: string; pageSize?: string } }>,
          mockReply
        )

        expect(mockGetAllUsersUseCase.execute).not.toHaveBeenCalled()
        expect(mockReply.code).toHaveBeenCalledWith(400)
      })

      it('should return 400 for invalid pageSize parameter (not a number)', async () => {
        mockRequest.query = { pageSize: 'xyz' }

        await controller.getAllUsers(
          mockRequest as FastifyRequest<{ Querystring: { page?: string; pageSize?: string } }>,
          mockReply
        )

        expect(mockGetAllUsersUseCase.execute).not.toHaveBeenCalled()
        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid pageSize parameter. Must be between 1 and 100.',
        })
      })

      it('should return 400 for pageSize less than 1', async () => {
        mockRequest.query = { pageSize: '0' }

        await controller.getAllUsers(
          mockRequest as FastifyRequest<{ Querystring: { page?: string; pageSize?: string } }>,
          mockReply
        )

        expect(mockGetAllUsersUseCase.execute).not.toHaveBeenCalled()
        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid pageSize parameter. Must be between 1 and 100.',
        })
      })

      it('should return 400 for pageSize greater than 100', async () => {
        mockRequest.query = { pageSize: '101' }

        await controller.getAllUsers(
          mockRequest as FastifyRequest<{ Querystring: { page?: string; pageSize?: string } }>,
          mockReply
        )

        expect(mockGetAllUsersUseCase.execute).not.toHaveBeenCalled()
        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid pageSize parameter. Must be between 1 and 100.',
        })
      })
    })

    describe('error handling', () => {
      it('should handle database errors', async () => {
        mockRequest.query = {}

        vi.mocked(mockGetAllUsersUseCase.execute).mockRejectedValue(
          new Error('Database connection failed')
        )

        await controller.getAllUsers(
          mockRequest as FastifyRequest<{ Querystring: { page?: string; pageSize?: string } }>,
          mockReply
        )

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Database connection failed',
        })
      })
    })
  })

  describe('integration', () => {
    it('should handle complete registration flow', async () => {
      const mockApp = {
        post: vi.fn(),
        get: vi.fn(),
      } as unknown as FastifyInstance

      // Register routes
      controller.registerRoutes(mockApp)

      // Get the registered handler
      const registerHandler = vi.mocked(mockApp.post).mock.calls[0]?.[1] as unknown as (
        req: FastifyRequest,
        reply: FastifyReply
      ) => Promise<void>

      // Prepare request
      mockRequest.body = {
        email: 'integration@example.com',
        password: 'IntegrationPass123!',
        name: 'Integration Test',
      }

      const mockResult = { userId: 'user-integration-123' }
      vi.mocked(mockRegisterUserUseCase.execute).mockResolvedValue(mockResult)

      // Execute handler
      await registerHandler(mockRequest, mockReply)

      // Verify complete flow
      expect(mockRegisterUserUseCase.execute).toHaveBeenCalled()
      expect(mockReply.code).toHaveBeenCalledWith(201)
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
      })
    })

    it('should maintain context when routes are called', async () => {
      const mockApp = {
        post: vi.fn(),
        get: vi.fn(),
      } as unknown as FastifyInstance

      controller.registerRoutes(mockApp)

      const registerHandler = vi.mocked(mockApp.post).mock.calls[0]?.[1] as unknown as (
        req: FastifyRequest,
        reply: FastifyReply
      ) => Promise<void>

      mockRequest.body = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
      }

      const mockResult = { userId: 'user-123' }
      vi.mocked(mockRegisterUserUseCase.execute).mockResolvedValue(mockResult)

      await registerHandler(mockRequest, mockReply)

      // Should successfully execute without context errors
      expect(mockRegisterUserUseCase.execute).toHaveBeenCalled()
    })
  })
})
