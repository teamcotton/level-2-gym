import type { FastifyInstance, FastifyServerOptions } from 'fastify'
import { createFastifyApp } from '../http/fastify.config.js'

// Application
import { RegisterUserUseCase } from '../../application/use-cases/register-user.use-case.js'
import { GetAllUsersUseCase } from '../../application/use-cases/get-all-users.use-case.js'

// Adapters
import { PostgresUserRepository } from '../../adapters/secondary/repositories/user.repository.js'
import { ResendService } from '../../adapters/secondary/services/email.service.js'
import { PinoLoggerService } from '../../adapters/secondary/services/logger.service.js'
import { JwtTokenGeneratorService } from '../../adapters/secondary/services/jwt-token-generator.service.js'
import { UserController } from '../../adapters/primary/http/user.controller.js'

import { EnvConfig } from '../config/env.config.js'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { readFileSync } from 'node:fs'

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

  // Domain Services
  // public readonly workoutCalculator: WorkoutCalculator

  // Use Cases
  public readonly registerUserUseCase: RegisterUserUseCase
  public readonly getAllUsersUseCase: GetAllUsersUseCase

  // Controllers
  public readonly userController: UserController

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

    // Initialize domain services
    // this.workoutCalculator = new WorkoutCalculator()

    // Initialize use cases
    this.registerUserUseCase = new RegisterUserUseCase(
      this.userRepository,
      this.emailService,
      this.logger,
      this.tokenGenerator
    )
    this.getAllUsersUseCase = new GetAllUsersUseCase(this.userRepository, this.logger)

    // Initialize controllers (primary adapters)
    this.userController = new UserController(this.registerUserUseCase, this.getAllUsersUseCase)

    // Register routes
    this.registerRoutes()
  }

  private registerRoutes(): void {
    this.userController.registerRoutes(this.app)
  }

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container()
    }
    return Container.instance
  }

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

  async stop(): Promise<void> {
    await this.app.close()
    this.logger.info('Server stopped')
  }
}
