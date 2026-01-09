import type { FastifyInstance, FastifyServerOptions } from 'fastify'
import { createFastifyApp } from '../http/fastify.config.js'

// Application
import { RegisterUserUseCase } from '../../application/use-cases/register-user.use-case.js'
import { GetAllUsersUseCase } from '../../application/use-cases/get-all-users.use-case.js'
import { LoginUserUseCase } from '../../application/use-cases/login-user.use-case.js'
import { GetChatUseCase } from '../../application/use-cases/get-chat.use-case.js'
import { AppendedChatUseCase } from '../../application/use-cases/append-chat.use-case.js'
import { SaveChatUseCase } from '../../application/use-cases/save-chat.use-case.js'
import { GetChatsByUserIdUseCase } from '../../application/use-cases/get-chats-by-userid.use-case.js'
import { GetChatContentByChatIdUseCase } from '../../application/use-cases/get-chat-content-by-chat-id.use-case.js'
import { RegisterUserWithProviderUseCase } from '../../application/use-cases/register-user-with-provider.use-case.js'

// Adapters
import { PostgresUserRepository } from '../../adapters/secondary/repositories/user.repository.js'
import { AIRepository } from '../../adapters/secondary/repositories/ai.repository.js'
import { ResendService } from '../../adapters/secondary/services/email.service.js'
import { PinoLoggerService } from '../../adapters/secondary/services/logger.service.js'
import { JwtTokenGeneratorService } from '../../adapters/secondary/services/jwt-token-generator.service.js'
import { UserController } from '../../adapters/primary/http/user.controller.js'
import { AuthController } from '../../adapters/primary/http/auth.controller.js'
import { AIController } from '../../adapters/primary/http/ai.controller.js'

import type { AuditLogPort } from '../../application/ports/audit-log.port.js'
import { AuditLogRepository } from '../../adapters/secondary/repositories/audit-log.repository.js'
import { EnvConfig } from '../config/env.config.js'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { readFileSync } from 'node:fs'

/**
 * Dependency Injection Container implementing the Singleton pattern
 *
 * Manages the application's dependency graph and lifecycle. Initializes all components
 * in the correct order:
 * 1. Infrastructure (logger, Fastify app with optional HTTPS)
 * 2. Services (email, token generation)
 * 3. Repositories (user data access, AI data access)
 * 4. Use cases (application logic)
 * 5. Controllers (HTTP adapters)
 * 6. Route registration
 *
 * The container follows hexagonal architecture with clear separation between
 * primary adapters (controllers), application core (use cases), and secondary
 * adapters (repositories, services).
 *
 * @class Container
 * @example
 * ```typescript
 * const container = Container.getInstance()
 * await container.start()
 * // Application is now running
 * await container.stop()
 * ```
 */
export class Container {
  private static instance: Container

  // Infrastructure
  public readonly app: FastifyInstance

  // Services
  public readonly logger: PinoLoggerService
  public readonly emailService: ResendService
  public readonly tokenGenerator: JwtTokenGeneratorService

  // Repositories
  public readonly userRepository: PostgresUserRepository
  public readonly aiRepository: AIRepository

  // Domain Services
  // public readonly workoutCalculator: WorkoutCalculator

  // Use Cases
  public readonly registerUserUseCase: RegisterUserUseCase
  public readonly getAllUsersUseCase: GetAllUsersUseCase
  public readonly loginUserUseCase: LoginUserUseCase
  public readonly getChatUseCase: GetChatUseCase
  //  private readonly createChatUseCase: CreateChatUseCase
  private readonly appendChatUseCase: AppendedChatUseCase
  private readonly saveChatUseCase: SaveChatUseCase
  private readonly getChatsByUserIdUseCase: GetChatsByUserIdUseCase
  private readonly getChatContentByChatIdUseCase: GetChatContentByChatIdUseCase
  private readonly registerUserWithProviderUseCase: RegisterUserWithProviderUseCase

  // Controllers
  public readonly userController: UserController
  public readonly authController: AuthController
  public readonly aiController: AIController

  // Audit log
  public readonly auditLog: AuditLogPort

  /**
   * Private constructor to enforce Singleton pattern
   *
   * Initializes all application components in dependency order:
   * - Validates environment variables
   * - Configures HTTPS for development (optional, falls back to HTTP)
   * - Instantiates logger, services, repositories, use cases, and controllers
   * - Registers all HTTP routes
   *
   * @private
   * @throws {Error} If environment validation fails or Fastify initialization fails
   */
  private constructor() {
    // Validate environment
    EnvConfig.validate()

    // Initialize logger first for structured logging throughout initialization
    this.logger = new PinoLoggerService()

    try {
      const __filename = fileURLToPath(import.meta.url)
      const __dirname = dirname(__filename)

      const isDevelopment = EnvConfig.NODE_ENV !== 'production'
      const useHttps = isDevelopment && EnvConfig.USE_HTTPS === 'true'

      let httpsOptions: FastifyServerOptions | undefined
      if (useHttps) {
        // __dirname points to src/infrastructure/di/ directory
        // Go up to backend root, then into certs/
        const certsPath = join(__dirname, '../../..', 'certs')

        try {
          httpsOptions = {
            https: {
              key: readFileSync(join(certsPath, 'key.pem')),
              cert: readFileSync(join(certsPath, 'cert.pem')),
            },
          } as FastifyServerOptions
          this.logger.info('🔒 HTTPS enabled for development')
        } catch (error) {
          const instructions = `To generate certificates with proper Subject Alternative Names:
cd apps/backend/certs && mkcert -key-file key.pem -cert-file cert.pem \\
  localhost \\
  127.0.0.1 \\
  ::1 \\
  *.localhost \\
  local.dev \\
  0.0.0.0`

          this.logger.warn('⚠️  HTTPS certificates not found, falling back to HTTP', {
            certsPath,
            instructions,
          })
        }
      }

      // Initialize infrastructure
      this.app = createFastifyApp(httpsOptions)
    } catch (error) {
      throw new Error(
        `Failed to initialize Fastify app: ${error instanceof Error ? error.message : error}`
      )
    }

    // Initialize services (secondary adapters)
    this.emailService = new ResendService(EnvConfig.RESEND_API_KEY, this.logger)
    this.tokenGenerator = new JwtTokenGeneratorService()

    // Initialize repositories (secondary adapters)
    this.userRepository = new PostgresUserRepository()
    this.aiRepository = new AIRepository(this.logger)
    this.auditLog = new AuditLogRepository(this.logger)

    // Initialize domain services
    // this.workoutCalculator = new WorkoutCalculator()

    // Initialize use cases
    this.registerUserUseCase = new RegisterUserUseCase(
      this.userRepository,
      this.emailService,
      this.logger,
      this.tokenGenerator,
      this.auditLog
    )
    this.getAllUsersUseCase = new GetAllUsersUseCase(this.userRepository, this.logger)
    this.loginUserUseCase = new LoginUserUseCase(
      this.userRepository,
      this.logger,
      this.tokenGenerator,
      this.auditLog
    )
    this.getChatUseCase = new GetChatUseCase(this.aiRepository, this.logger)
    this.appendChatUseCase = new AppendedChatUseCase(this.aiRepository, this.logger)
    this.saveChatUseCase = new SaveChatUseCase(this.logger, this.aiRepository)
    this.getChatsByUserIdUseCase = new GetChatsByUserIdUseCase(this.aiRepository, this.logger)
    this.getChatContentByChatIdUseCase = new GetChatContentByChatIdUseCase(
      this.aiRepository,
      this.logger
    )
    this.registerUserWithProviderUseCase = new RegisterUserWithProviderUseCase(
      this.userRepository,
      this.emailService,
      this.logger,
      this.tokenGenerator,
      this.auditLog
    )

    // Initialize controllers (primary adapters)
    this.userController = new UserController(this.registerUserUseCase, this.getAllUsersUseCase)
    this.authController = new AuthController(
      this.loginUserUseCase,
      this.registerUserWithProviderUseCase
    )
    this.aiController = new AIController(
      this.getChatUseCase,
      this.logger,
      this.appendChatUseCase,
      this.saveChatUseCase,
      this.getChatsByUserIdUseCase,
      this.getChatContentByChatIdUseCase
    )

    // Register routes
    this.registerRoutes()
  }

  /**
   * Registers all HTTP routes from controllers with the Fastify app
   *
   * Called automatically during container initialization. Controllers register
   * their respective endpoints with the Fastify instance under the /api/v1 prefix.
   *
   * @private
   */
  private registerRoutes(): void {
    // Register all API routes under /api/v1 prefix
    this.app.register(
      (instance, _opts, done) => {
        this.userController.registerRoutes(instance)
        this.authController.registerRoutes(instance)
        this.aiController.registerRoutes(instance)
        done()
      },
      { prefix: `/api/${EnvConfig.API_VERSION}` }
    )
  }

  /**
   * Gets the singleton instance of the Container
   *
   * Creates the container on first call and returns the same instance on subsequent calls.
   * This ensures all dependencies are initialized only once.
   *
   * @static
   * @returns {Container} The singleton Container instance
   * @example
   * ```typescript
   * const container = Container.getInstance()
   * const logger = container.logger
   * ```
   */
  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container()
    }
    return Container.instance
  }

  /**
   * Starts the HTTP server
   *
   * Binds the Fastify server to the configured host and port. Uses HTTPS in
   * development if certificates are available, otherwise falls back to HTTP.
   * Logs the server URL and API documentation link.
   *
   * @returns {Promise<void>}
   * @throws {Error} If the server fails to start (exits process with code 1)
   * @example
   * ```typescript
   * const container = Container.getInstance()
   * await container.start()
   * * // Server is now listening on the configured host and port (HTTP or HTTPS)
   * ```
   */
  async start(): Promise<void> {
    try {
      const port = Number.parseInt(EnvConfig.PORT)
      const host = EnvConfig.HOST
      const isDevelopment = EnvConfig.NODE_ENV !== 'production'
      const useHttps = isDevelopment && EnvConfig.USE_HTTPS === 'true'

      await this.app.listen({ port, host })
      const protocol = useHttps ? 'https' : 'http'
      this.logger.info(`Server listening on ${protocol}://${host}:${port}`)
      this.logger.info(`📚 API Documentation: ${protocol}://${host}:${port}/docs`)
    } catch (error) {
      this.logger.error('Failed to start server', error as Error)
      process.exit(1)
    }
  }

  /**
   * Gracefully stops the HTTP server
   *
   * Closes the Fastify server and all active connections. Should be called
   * during application shutdown to ensure clean termination.
   *
   * @returns {Promise<void>}
   * @example
   * ```typescript
   * process.on('SIGTERM', async () => {
   *   const container = Container.getInstance()
   *   await container.stop()
   *   process.exit(0)
   * })
   * ```
   */
  async stop(): Promise<void> {
    await this.app.close()
    this.logger.info('Server stopped')
  }
}
