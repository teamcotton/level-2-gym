import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { LoginUserUseCase } from '../../../application/use-cases/login-user.use-case.js'
import { LoginUserDto } from '../../../application/dtos/login-user.dto.js'
import { OAuthSyncDto } from '../../../application/dtos/oauth-sync.dto.js'
import { BaseException } from '../../../shared/exceptions/base.exception.js'
import { oauthSyncAuthMiddleware } from '../../../infrastructure/http/middleware/auth-sync-auth.middleware.js'

/**
 * HTTP controller for authentication endpoints
 *
 * Handles authentication-related HTTP requests in the Fastify application.
 * Acts as a primary adapter in the Hexagonal Architecture, translating HTTP
 * requests into application use case calls and formatting responses.
 *
 * @class
 *
 * @remarks
 * This controller is part of the Ports & Adapters architecture, serving as
 * a primary (driving) adapter that receives external requests and delegates
 * business logic to application use cases. It handles:
 * - HTTP request validation and DTO conversion
 * - Use case orchestration
 * - HTTP response formatting (success and error cases)
 * - Exception translation to appropriate HTTP status codes
 *
 * Routes registered:
 * - `POST /auth/login` - User authentication endpoint
 *
 * Response format:
 * - Success: `{ success: true, data: {...} }`
 * - Error: `{ success: false, error: "message" }`
 *
 * @example
 * ```typescript
 * // Register controller in Fastify app
 * const authController = new AuthController(loginUserUseCase)
 * authController.registerRoutes(app)
 *
 * // Routes are now available at /auth/login
 * ```
 *
 * @see {@link LoginUserUseCase} for authentication business logic
 * @see {@link LoginUserDto} for request data structure
 */
export class AuthController {
  /**
   * Creates a new AuthController instance
   *
   * @param {LoginUserUseCase} loginUserUseCase - Use case for user authentication
   *
   * @example
   * ```typescript
   * const loginUseCase = new LoginUserUseCase(
   *   userRepository,
   *   logger,
   *   tokenGenerator
   * )
   * const authController = new AuthController(loginUseCase)
   * ```
   */
  constructor(private readonly loginUserUseCase: LoginUserUseCase) {}

  /**
   * Registers authentication routes with the Fastify application
   *
   * Binds HTTP endpoints to their respective handler methods. All routes
   * are prefixed with `/auth` and use proper HTTP method binding.
   *
   * @param {FastifyInstance} app - Fastify application instance
   * @returns {void}
   *
   * @example
   * ```typescript
   * import Fastify from 'fastify'
   * const app = Fastify()
   *
   * const authController = new AuthController(loginUserUseCase)
   * authController.registerRoutes(app)
   *
   * await app.listen({ port: 3000 })
   * // POST /auth/login is now available
   * ```
   */
  registerRoutes(app: FastifyInstance): void {
    app.post('/auth/login', this.login.bind(this))
    app.post('/auth/oauth-sync', { preHandler: oauthSyncAuthMiddleware }, this.oauthSync.bind(this))
  }

  /**
   * Handles user login requests
   *
   * Authenticates users by validating credentials and generating JWT access tokens.
   * Validates request body, executes login use case, and formats the response
   * with appropriate HTTP status codes.
   *
   * @async
   * @param {FastifyRequest} request - Fastify request object with login credentials in body
   * @param {FastifyReply} reply - Fastify reply object for sending HTTP response
   * @returns {Promise<void>} Resolves when response is sent
   *
   * @remarks
   * Request body should contain:
   * - `email` (string): User's email address
   * - `password` (string): User's password
   *
   * Success response (200):
   * ```json
   * {
   *   "success": true,
   *   "data": {
   *     "userId": "uuid",
   *     "email": "user@example.com",
   *     "access_token": "jwt_token",
   *     "roles": ["user"]
   *   }
   * }
   * ```
   *
   * Error responses:
   * - 400: Validation error (invalid request body)
   * - 401: Unauthorized (invalid credentials)
   * - 500: Internal server error
   *
   * Error response format:
   * ```json
   * {
   *   "success": false,
   *   "error": "Error message"
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Successful login request
   * // POST /auth/login
   * // Body: { "email": "user@example.com", "password": "password123" }
   *
   * // Response:
   * // Status: 200
   * // {
   * //   "success": true,
   * //   "data": {
   * //     "userId": "550e8400-e29b-41d4-a716-446655440000",
   * //     "email": "user@example.com",
   * //     "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
   * //     "roles": ["user"]
   * //   }
   * // }
   * ```
   *
   * @example
   * ```typescript
   * // Failed login request - invalid credentials
   * // POST /auth/login
   * // Body: { "email": "user@example.com", "password": "wrongPassword" }
   *
   * // Response:
   * // Status: 401
   * // {
   * //   "success": false,
   * //   "error": "Invalid email or password"
   * // }
   * ```
   *
   * @see {@link LoginUserDto.validate} for request body validation
   * @see {@link LoginUserUseCase.execute} for authentication logic
   */
  async login(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      // Convert HTTP request to DTO
      const dto = LoginUserDto.validate(request.body)

      // Extract audit context from request
      const auditContext = {
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'] ?? null,
      }

      // Execute use case
      const result = await this.loginUserUseCase.execute(dto, auditContext)

      // Convert result to HTTP response
      reply.code(200).send({
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
   * Handles OAuth user synchronization
   *
   * Creates or updates user records for OAuth-authenticated users (Google, GitHub, etc.)
   * This endpoint is called by the frontend NextAuth callback to ensure OAuth users
   * are stored in the backend database for consistency with credentials users.
   * **Security:** This endpoint is protected by the oauthSyncAuthMiddleware, which requires
   * a valid shared secret in the X-OAuth-Sync-Secret header to prevent unauthorized access.
   *
   * @async
   * @param {FastifyRequest} request - Fastify request with OAuth user data in body
   * @param {FastifyReply} reply - Fastify reply object for sending HTTP response
   * @returns {Promise<void>} Resolves when response is sent
   *
   * @remarks
   * Request headers must include:
   * - `X-OAuth-Sync-Secret`: Shared secret matching OAUTH_SYNC_SECRET environment variable
   *
   * Request body should contain:
   * - `provider` (string): OAuth provider name (e.g., 'google', 'github')
   * - `providerId` (string): User ID from OAuth provider
   * - `email` (string): User's email address (must be valid email format)
   * - `name` (string, optional): User's display name
   *
   * Success response (200):
   * ```json
   * {
   *   "success": true,
   *   "message": "OAuth user sync completed"
   * }
   * ```
   *
   * Error responses:
   * - 401: Unauthorized (invalid or missing shared secret)
   * - 400: Validation error (invalid request body)
   * - 500: Internal server error
   *
   * This is a simple implementation that logs the sync request.
   * TODO: Implement actual user creation/update in database
   *
   * @see {@link OAuthSyncDto.validate} for request body validation
   * @see {@link oauthSyncAuthMiddleware} for authentication implementation
   */
  async oauthSync(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      // Validate request body using DTO
      const dto = OAuthSyncDto.validate(request.body)

      // TODO: Implement user repository method to create/update OAuth user
      // For now, just log the sync request
      request.log.info({
        msg: 'OAuth user sync requested',
        provider: dto.provider,
        providerId: dto.providerId,
        email: dto.email,
        name: dto.name,
      })

      reply.code(200).send({
        success: true,
        message: 'OAuth user sync completed',
      })
    } catch (error) {
      const err = error as Error
      const statusCode = err instanceof BaseException ? err.statusCode : 500
      const errorMessage = err?.message || 'OAuth sync failed'
      reply.code(statusCode).send({
        success: false,
        error: errorMessage,
      })
    }
  }
}
