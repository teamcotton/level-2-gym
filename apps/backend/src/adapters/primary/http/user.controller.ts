import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { RegisterUserUseCase } from '../../../application/use-cases/register-user.use-case.js'
import { GetAllUsersUseCase } from '../../../application/use-cases/get-all-users.use-case.js'
import { RegisterUserDto } from '../../../application/dtos/register-user.dto.js'
import { BaseException } from '../../../shared/exceptions/base.exception.js'
import { authMiddleware } from '../../../infrastructure/http/middleware/auth.middleware.js'
import { requireRole } from '../../../infrastructure/http/middleware/role.middleware.js'

/**
 * HTTP controller for user-related endpoints
 *
 * Handles user registration, retrieval, and management through RESTful API endpoints.
 * Acts as the primary adapter in the hexagonal architecture, translating HTTP requests
 * into use case executions and formatting responses.
 *
 * @class UserController
 * @example
 * ```typescript
 * const controller = new UserController(registerUseCase, getAllUsersUseCase)
 * controller.registerRoutes(fastifyApp)
 * ```
 */
export class UserController {
  /**
   * Creates an instance of UserController
   * @param {RegisterUserUseCase} registerUserUseCase - Use case for registering new users
   * @param {GetAllUsersUseCase} getAllUsersUseCase - Use case for retrieving all users
   */
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly getAllUsersUseCase: GetAllUsersUseCase
  ) {}

  /**
   * Registers all user-related routes with the Fastify application
   *
   * Configures the following endpoints:
   * - POST /users/register - Register a new user
   * - GET /users - Retrieve all users with pagination
   * - GET /users/:id - Retrieve a specific user by ID (incomplete - returns stub response)
   *
   * @param {FastifyInstance} app - The Fastify application instance
   * @example
   * ```typescript
   * const app = fastify()
   * userController.registerRoutes(app)
   * ```
   */
  registerRoutes(app: FastifyInstance): void {
    app.post('/users/register', this.register.bind(this))
    app.get(
      '/users',
      {
        preHandler: [authMiddleware, requireRole(['admin', 'moderator'])],
      },
      this.getAllUsers.bind(this)
    )
    app.get('/users/:id', this.getUser.bind(this))
  }

  /**
   * Handles GET /users endpoint to retrieve all users with pagination
   *
   * Accepts optional query parameters for pagination:
   * - limit: Number of users per page (1-100, default varies by use case)
   * - offset: Number of users to skip (0 or greater)
   *
   * @param {FastifyRequest} request - Fastify request with query parameters
   * @param {FastifyReply} reply - Fastify reply object
   * @returns {Promise<void>}
   * @example
   * ```
   * GET /users?limit=20&offset=0
   * Response: {
   *   success: true,
   *   data: [...],
   *   pagination: { total: 150, limit: 20, offset: 0 }
   * }
   * ```
   */
  async getAllUsers(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      // Extract pagination parameters from query string
      const query = request.query as { limit?: string; offset?: string }
      const limit = query.limit ? Number.parseInt(query.limit, 10) : undefined
      const offset = query.offset ? Number.parseInt(query.offset, 10) : undefined

      // Validate pagination parameters
      if (limit !== undefined && (Number.isNaN(limit) || limit < 1 || limit > 100)) {
        reply.code(400).send({
          success: false,
          error: 'Invalid limit parameter. Must be between 1 and 100.',
        })
        return
      }

      if (offset !== undefined && (Number.isNaN(offset) || offset < 0)) {
        reply.code(400).send({
          success: false,
          error: 'Invalid offset parameter. Must be 0 or greater.',
        })
        return
      }

      const result = await this.getAllUsersUseCase.execute({ limit, offset })

      reply.code(200).send({
        success: true,
        data: result.data,
        pagination: {
          total: result.total,
          limit: result.limit,
          offset: result.offset,
        },
      })
    } catch (error) {
      const err = error as Error
      const statusCode = err instanceof BaseException ? err.statusCode : 500
      const errorMessage = err?.message || 'An unexpected error occurred'
      reply.code(statusCode).send({
        success: false,
        error: errorMessage,
      })
    }
  }

  /**
   * Handles POST /users/register endpoint to register a new user
   *
   * Validates the request body using RegisterUserDto, executes the registration
   * use case, and returns the created user with authentication token.
   *
   * @param {FastifyRequest} request - Fastify request with user registration data in body
   * @param {FastifyReply} reply - Fastify reply object
   * @returns {Promise<void>}
   * @example
   * ```
   * POST /users/register
   * Body: {
   *   email: 'user@example.com',
   *   password: 'SecurePass123',
   *   name: 'John Doe',
   *   role: 'member'
   * }
   * Response: {
   *   success: true,
   *   data: {
   *     userId: 'uuid',
   *     access_token: 'jwt.token.here',
   *     token_type: 'Bearer',
   *     expires_in: 3600
   *   }
   * }
   * ```
   */
  async register(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      // Convert HTTP request to DTO
      const dto = RegisterUserDto.validate(request.body)

      // Execute use case
      const result = await this.registerUserUseCase.execute(dto)

      // Convert result to HTTP response
      reply.code(201).send({
        success: true,
        data: result,
      })
    } catch (error) {
      const err = error as Error
      const statusCode = err instanceof BaseException ? err.statusCode : 500
      const errorMessage = err?.message || 'An unexpected error occurred'
      reply.code(statusCode).send({
        success: false,
        error: errorMessage,
      })
    }
  }

  /**
   * Handles GET /users/:id endpoint to retrieve a specific user by ID
   *
   * **Note:** This endpoint is currently incomplete and returns a minimal stub response.
   * Full implementation is pending.
   *
   * @param {FastifyRequest<{ Params: { id: string } }>} request - Fastify request with user ID in params
   * @param {FastifyReply} reply - Fastify reply object
   * @returns {Promise<void>} Currently returns only the user ID as a stub response
   * @todo Implement full user retrieval logic with complete user data
   * @example
   * ```
   * GET /users/abc123
   * Current Response: { id: 'abc123' }  // Stub response only
   * ```
   */
  async getUser(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    // Implementation here
    reply.send({ id: request.params.id })
  }
}
