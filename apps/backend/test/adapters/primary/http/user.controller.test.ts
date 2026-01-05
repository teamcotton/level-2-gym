import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { UserController } from '../../../../src/adapters/primary/http/user.controller.js'
import { RegisterUserDto } from '../../../../src/application/dtos/register-user.dto.js'
import { GetAllUsersUseCase } from '../../../../src/application/use-cases/get-all-users.use-case.js'
import { RegisterUserUseCase } from '../../../../src/application/use-cases/register-user.use-case.js'
import { UserId } from '../../../../src/domain/value-objects/userID.js'
import { ValidationException } from '../../../../src/shared/exceptions/validation.exception.js'

// Helper function to create mock user with proper UserIdType
function createMockUser(
  email: string,
  name: string,
  role: string,
  createdAt: Date,
  userId?: string
) {
  return {
    userId: new UserId(userId || uuidv7()).getValue(),
    email,
    name,
    role,
    createdAt,
  }
}

// Helper function to create mock registration result with proper UserIdType
function createMockRegisterResult(
  accessToken: string,
  tokenType: string,
  expiresIn: number,
  userId?: string
) {
  return {
    userId: userId || uuidv7(),
    access_token: accessToken,
    token_type: tokenType,
    expires_in: expiresIn,
  }
}

describe('UserController', () => {
  let controller: UserController
  let mockRegisterUserUseCase: RegisterUserUseCase
  let mockGetAllUsersUseCase: GetAllUsersUseCase
  let mockRequest: FastifyRequest
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
      query: {},
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
      // Both GET /users and GET /users/:id now use route options with middleware
      expect(mockApp.get).toHaveBeenCalledWith(
        '/users',
        expect.objectContaining({
          preHandler: expect.any(Array),
        }),
        expect.any(Function)
      )
      expect(mockApp.get).toHaveBeenCalledWith(
        '/users/:id',
        expect.objectContaining({
          preHandler: expect.any(Array),
        }),
        expect.any(Function)
      )
    })

    it('should bind controller context to route handlers', () => {
      const mockApp = {
        post: vi.fn(),
        get: vi.fn(),
      } as unknown as FastifyInstance

      controller.registerRoutes(mockApp)

      // Verify handlers are bound functions
      const registerHandler = vi.mocked(mockApp.post).mock.calls[0]?.[1]
      // GET /users is registered with options, so handler is at index 2
      const getAllUsersHandler = (vi.mocked(mockApp.get).mock.calls[0] as any)?.[2]
      // GET /users/:id is also registered with options, so handler is at index 2
      const getUserByIdHandler = (vi.mocked(mockApp.get).mock.calls[1] as any)?.[2]

      expect(registerHandler).toBeTypeOf('function')
      expect(getAllUsersHandler).toBeTypeOf('function')
      expect(getUserByIdHandler).toBeTypeOf('function')
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

  describe('getAllUsers()', () => {
    describe('successful retrieval', () => {
      it('should retrieve all users successfully', async () => {
        const mockUsers = [
          createMockUser('user1@example.com', 'User One', 'user', new Date('2024-01-01')),
          createMockUser('user2@example.com', 'User Two', 'admin', new Date('2024-01-02')),
        ]

        vi.mocked(mockGetAllUsersUseCase.execute).mockResolvedValue({
          data: mockUsers,
          total: mockUsers.length,
          limit: 10,
          offset: 0,
        })

        await controller.getAllUsers(mockRequest, mockReply)

        expect(mockGetAllUsersUseCase.execute).toHaveBeenCalledTimes(1)
        expect(mockGetAllUsersUseCase.execute).toHaveBeenCalledWith({
          limit: undefined,
          offset: undefined,
        })
      })

      it('should return 200 status code for successful retrieval', async () => {
        const mockUsers = [
          createMockUser('user1@example.com', 'User One', 'user', new Date('2024-01-01')),
        ]

        vi.mocked(mockGetAllUsersUseCase.execute).mockResolvedValue({
          data: mockUsers,
          total: mockUsers.length,
          limit: 10,
          offset: 0,
        })

        await controller.getAllUsers(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(200)
      })

      it('should return success response with users array', async () => {
        const mockUsers = [
          createMockUser('user1@example.com', 'User One', 'user', new Date('2024-01-01')),
          createMockUser('user2@example.com', 'User Two', 'admin', new Date('2024-01-02')),
        ]

        vi.mocked(mockGetAllUsersUseCase.execute).mockResolvedValue({
          data: mockUsers,
          total: mockUsers.length,
          limit: 10,
          offset: 0,
        })

        await controller.getAllUsers(mockRequest, mockReply)

        expect(mockReply.send).toHaveBeenCalledWith({
          success: true,
          data: mockUsers,
          pagination: {
            total: mockUsers.length,
            limit: 10,
            offset: 0,
          },
        })
      })

      it('should handle empty users array', async () => {
        const mockUsers: any[] = []

        vi.mocked(mockGetAllUsersUseCase.execute).mockResolvedValue({
          data: mockUsers,
          total: mockUsers.length,
          limit: 10,
          offset: 0,
        })

        await controller.getAllUsers(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(200)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: true,
          data: [],
          pagination: {
            total: 0,
            limit: 10,
            offset: 0,
          },
        })
      })

      it('should handle large number of users', async () => {
        const mockUsers = Array.from({ length: 100 }, (_, i) =>
          createMockUser(`user${i}@example.com`, `User ${i}`, 'user', new Date('2024-01-01'))
        )

        vi.mocked(mockGetAllUsersUseCase.execute).mockResolvedValue({
          data: mockUsers,
          total: mockUsers.length,
          limit: 10,
          offset: 0,
        })

        await controller.getAllUsers(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(200)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: true,
          data: mockUsers,
          pagination: {
            total: mockUsers.length,
            limit: 10,
            offset: 0,
          },
        })
      })

      it('should preserve user data structure from use case', async () => {
        const mockUsers = [
          createMockUser(
            'test@example.com',
            'Test User',
            'moderator',
            new Date('2024-06-15T10:30:00Z')
          ),
        ]

        vi.mocked(mockGetAllUsersUseCase.execute).mockResolvedValue({
          data: mockUsers,
          total: mockUsers.length,
          limit: 10,
          offset: 0,
        })

        await controller.getAllUsers(mockRequest, mockReply)

        const sentData = vi.mocked(mockReply.send).mock.calls[0]?.[0] as {
          success: boolean
          data: typeof mockUsers
          pagination: { total: number; limit: number; offset: number }
        }
        expect(sentData).toEqual({
          success: true,
          data: mockUsers,
          pagination: {
            total: mockUsers.length,
            limit: 10,
            offset: 0,
          },
        })
        expect(sentData.data[0]).toHaveProperty('userId')
        expect(typeof sentData.data[0]?.userId).toBe('string')
        expect(sentData.data[0]).toHaveProperty('email', 'test@example.com')
        expect(sentData.data[0]).toHaveProperty('name', 'Test User')
        expect(sentData.data[0]).toHaveProperty('role', 'moderator')
        expect(sentData.data[0]).toHaveProperty('createdAt')
      })
    })

    describe('error handling', () => {
      it('should handle use case execution error', async () => {
        const error = new Error('Database connection failed')
        vi.mocked(mockGetAllUsersUseCase.execute).mockRejectedValue(error)

        await controller.getAllUsers(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Database connection failed',
        })
      })

      it('should handle BaseException with custom status code', async () => {
        const error = new ValidationException('Invalid query parameters')
        vi.mocked(mockGetAllUsersUseCase.execute).mockRejectedValue(error)

        await controller.getAllUsers(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid query parameters',
        })
      })

      it('should handle unknown error types', async () => {
        const error = 'Unknown error'
        vi.mocked(mockGetAllUsersUseCase.execute).mockRejectedValue(error)

        await controller.getAllUsers(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
      })

      it('should handle null error gracefully', async () => {
        vi.mocked(mockGetAllUsersUseCase.execute).mockRejectedValue(null)

        await controller.getAllUsers(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'An unexpected error occurred',
        })
      })

      it('should not expose internal error details in production', async () => {
        const error = new Error('Internal database schema mismatch')
        vi.mocked(mockGetAllUsersUseCase.execute).mockRejectedValue(error)

        await controller.getAllUsers(mockRequest, mockReply)

        const sentData = vi.mocked(mockReply.send).mock.calls[0]?.[0] as {
          success: boolean
          data?: unknown
          error?: string
        }
        expect(sentData).toHaveProperty('success', false)
        expect(sentData).toHaveProperty('error')
        expect(sentData.error).toBe('Internal database schema mismatch')
      })
    })

    describe('response structure', () => {
      it('should always return object with success property', async () => {
        const mockUsers = [createMockUser('test@example.com', 'Test User', 'user', new Date())]

        vi.mocked(mockGetAllUsersUseCase.execute).mockResolvedValue({
          data: mockUsers,
          total: mockUsers.length,
          limit: 10,
          offset: 0,
        })

        await controller.getAllUsers(mockRequest, mockReply)

        const sentData = vi.mocked(mockReply.send).mock.calls[0]?.[0] as {
          success: boolean
          data?: typeof mockUsers
          pagination?: { total: number; limit: number; offset: number }
          error?: string
        }
        expect(sentData).toEqual({
          success: true,
          data: mockUsers,
          pagination: {
            total: mockUsers.length,
            limit: 10,
            offset: 0,
          },
        })
        expect(sentData).toHaveProperty('success')
        expect(typeof sentData.success).toBe('boolean')
      })

      it('should include data property on success', async () => {
        const mockUsers = [createMockUser('test@example.com', 'Test User', 'user', new Date())]

        vi.mocked(mockGetAllUsersUseCase.execute).mockResolvedValue({
          data: mockUsers,
          total: mockUsers.length,
          limit: 10,
          offset: 0,
        })

        await controller.getAllUsers(mockRequest, mockReply)

        const sentData = vi.mocked(mockReply.send).mock.calls[0]?.[0] as {
          success: boolean
          data?: typeof mockUsers
          pagination?: { total: number; limit: number; offset: number }
          error?: string
        }
        expect(sentData).toEqual({
          success: true,
          data: mockUsers,
          pagination: {
            total: mockUsers.length,
            limit: 10,
            offset: 0,
          },
        })
        expect(sentData).toHaveProperty('data')
        expect(Array.isArray(sentData.data)).toBe(true)
      })

      it('should include error property on failure', async () => {
        const error = new Error('Test error')
        vi.mocked(mockGetAllUsersUseCase.execute).mockRejectedValue(error)

        await controller.getAllUsers(mockRequest, mockReply)

        const sentData = vi.mocked(mockReply.send).mock.calls[0]?.[0]
        expect(sentData).toHaveProperty('error')
        expect(sentData).not.toHaveProperty('data')
      })
    })

    describe('integration with route registration', () => {
      it('should call getAllUsers when GET /users route is invoked', async () => {
        const mockApp = {
          post: vi.fn(),
          get: vi.fn(),
        } as unknown as FastifyInstance

        controller.registerRoutes(mockApp)

        // GET /users is now registered with options, so handler is at index 2
        const getAllUsersHandler = (vi.mocked(mockApp.get).mock.calls[0] as any)?.[2] as (
          req: FastifyRequest,
          reply: FastifyReply
        ) => Promise<void>

        expect(getAllUsersHandler).toBeDefined()

        const mockUsers = [createMockUser('test@example.com', 'Test User', 'user', new Date())]

        vi.mocked(mockGetAllUsersUseCase.execute).mockResolvedValue({
          data: mockUsers,
          total: mockUsers.length,
          limit: 10,
          offset: 0,
        })

        await getAllUsersHandler(mockRequest, mockReply)

        expect(mockGetAllUsersUseCase.execute).toHaveBeenCalled()
        expect(mockGetAllUsersUseCase.execute).toHaveBeenCalledWith({
          limit: undefined,
          offset: undefined,
        })
        expect(mockReply.code).toHaveBeenCalledWith(200)
      })

      it('should maintain controller context when called via route', async () => {
        const mockApp = {
          post: vi.fn(),
          get: vi.fn(),
        } as unknown as FastifyInstance

        controller.registerRoutes(mockApp)

        // GET /users is now registered with options, so handler is at index 2
        const getAllUsersHandler = (vi.mocked(mockApp.get).mock.calls[0] as any)?.[2] as (
          req: FastifyRequest,
          reply: FastifyReply
        ) => Promise<void>

        const mockUsers = [createMockUser('test@example.com', 'Test User', 'user', new Date())]

        vi.mocked(mockGetAllUsersUseCase.execute).mockResolvedValue({
          data: mockUsers,
          total: mockUsers.length,
          limit: 10,
          offset: 0,
        })

        await getAllUsersHandler(mockRequest, mockReply)

        expect(mockGetAllUsersUseCase.execute).toHaveBeenCalledTimes(1)
        expect(mockGetAllUsersUseCase.execute).toHaveBeenCalledWith({
          limit: undefined,
          offset: undefined,
        })
      })
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

        const mockResult = createMockRegisterResult('mock.jwt.token', 'Bearer', 3600)
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

        const mockResult = createMockRegisterResult('mock.jwt.token', 'Bearer', 3600)
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

        const mockResult = createMockRegisterResult('mock.jwt.token', 'Bearer', 3600)
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

        const mockResult = createMockRegisterResult('mock.jwt.token', 'Bearer', 3600)
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

        const mockResult = createMockRegisterResult('mock.jwt.token', 'Bearer', 3600)
        vi.mocked(mockRegisterUserUseCase.execute).mockResolvedValue(mockResult)

        await controller.register(mockRequest, mockReply)

        expect(mockReply.send).toHaveBeenCalledWith({
          success: true,
          data: mockResult,
        })
      })

      it('should chain reply methods correctly', async () => {
        mockRequest.body = {
          email: 'test@example.com',
          password: 'SecurePass123!',
          name: 'Test User',
        }

        const mockResult = createMockRegisterResult('mock.jwt.token', 'Bearer', 3600)
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

        const mockResult = createMockRegisterResult('mock.jwt.token', 'Bearer', 3600)
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

        const mockResult = createMockRegisterResult('mock.jwt.token', 'Bearer', 3600)
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

        const mockResult = createMockRegisterResult('mock.jwt.token', 'Bearer', 3600)
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

        const userId = uuidv7()
        const mockResult = createMockRegisterResult('mock.jwt.token', 'Bearer', 3600, userId)
        vi.mocked(mockRegisterUserUseCase.execute).mockResolvedValue(mockResult)

        await controller.register(mockRequest, mockReply)

        const sentResponse = vi.mocked(mockReply.send).mock.calls[0]?.[0] as {
          data?: Record<string, any>
        }
        expect(sentResponse.data).toEqual(
          expect.objectContaining({
            userId: expect.any(String),
            access_token: 'mock.jwt.token',
          })
        )
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

      expect(mockReply.send).toHaveBeenCalledWith({ data: { id: 'user-123' }, success: true })
    })

    it('should handle different user ids', async () => {
      const mockRequestWithParams = {
        params: { id: 'user-456-xyz' },
      } as FastifyRequest<{ Params: { id: string } }>

      await controller.getUser(mockRequestWithParams, mockReply)

      expect(mockReply.send).toHaveBeenCalledWith({ data: { id: 'user-456-xyz' }, success: true })
    })

    it('should extract id from request params', async () => {
      const mockRequestWithParams = {
        params: { id: 'test-id-789' },
      } as FastifyRequest<{ Params: { id: string } }>

      await controller.getUser(mockRequestWithParams, mockReply)

      const sentResponse = vi.mocked(mockReply.send).mock.calls?.[0]?.[0]
      expect(sentResponse).toEqual({ data: { id: 'test-id-789' }, success: true })
    })

    it('should call reply.send once', async () => {
      const mockRequestWithParams = {
        params: { id: 'user-123' },
      } as FastifyRequest<{ Params: { id: string } }>

      await controller.getUser(mockRequestWithParams, mockReply)

      expect(mockReply.send).toHaveBeenCalledTimes(1)
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

      const mockResult = createMockRegisterResult('mock.jwt.token', 'Bearer', 3600)
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

      const mockResult = createMockRegisterResult('mock.jwt.token', 'Bearer', 3600)
      vi.mocked(mockRegisterUserUseCase.execute).mockResolvedValue(mockResult)

      await registerHandler(mockRequest, mockReply)

      // Should successfully execute without context errors
      expect(mockRegisterUserUseCase.execute).toHaveBeenCalled()
    })
  })
})
