INFRASTRUCTURE LAYER (External Concerns)

Purpose:
Contains all the technical implementation details that support the application
but are not part of the core business logic. This includes database configuration,
external service setup, and framework initialization.

Contains:
- Database Configuration: Drizzle ORM setup, connection pooling, migrations
- Framework Setup: Fastify server configuration, middleware, plugins
- External Service Configuration: API clients, third-party SDK initialization
- Security: Authentication, authorization, encryption utilities
- Logging: Logger configuration and setup
- Environment Configuration: dotenv setup, config validation
- Dependency Injection: IoC container setup

Rules:
- Provides concrete implementations for technical concerns
- Contains framework and library-specific configuration
- Should not contain business logic
- Wires together all layers through dependency injection
- Handles cross-cutting concerns (logging, monitoring, security)

Example Structure:
infrastructure/
  ├── database/
  │   ├── drizzle.config.ts
  │   ├── schema.ts
  │   └── migrations/
  ├── http/
  │   ├── fastify.config.ts
  │   ├── middleware/
  │   │   ├── auth.middleware.ts
  │   │   └── error.middleware.ts
  │   └── plugins/
  ├── config/
  │   ├── env.config.ts
  │   └── app.config.ts
  ├── security/
  │   ├── jwt.util.ts
  │   └── crypto.util.ts
  └── di/
      └── container.ts                  # Dependency injection setup

========================================
CODE EXAMPLES
========================================

1. DATABASE CONFIGURATION (infrastructure/database/drizzle.config.ts):

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { EnvConfig } from '../config/env.config'

const queryClient = postgres(EnvConfig.DATABASE_URL)
export const db = drizzle(queryClient)

2. DATABASE SCHEMA (infrastructure/database/schema.ts):

import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const usersTable = pgTable('users', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})

export const workoutsTable = pgTable('workouts', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => usersTable.id),
  duration: text('duration').notNull(),
  intensity: text('intensity').notNull(),
  caloriesBurned: text('calories_burned').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow()
})

3. ENVIRONMENT CONFIG (infrastructure/config/env.config.ts):

import dotenv from 'dotenv'

dotenv.config()

export class EnvConfig {
  static readonly NODE_ENV = process.env.NODE_ENV || 'development'
  static readonly PORT = parseInt(process.env.PORT || '3000', 10)
  static readonly HOST = process.env.HOST || 'localhost'
  
  static readonly DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/level2gym'
  
  static readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
  static readonly JWT_EXPIRATION = process.env.JWT_EXPIRATION || '7d'
  
  static readonly SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || ''
  
  static readonly USE_HTTPS = process.env.USE_HTTPS === 'true'
  
  static readonly LOG_LEVEL = process.env.LOG_LEVEL || 'info'

  static validate(): void {
    const required = ['DATABASE_URL', 'JWT_SECRET']
    const missing = required.filter(key => !process.env[key])
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
    }
  }
}

4. FASTIFY CONFIGURATION (infrastructure/http/fastify.config.ts):

import Fastify, { FastifyInstance, FastifyServerOptions } from 'fastify'
import fastifyCors from '@fastify/cors'
import { readFileSync } from 'fs'
import { join } from 'path'
import { EnvConfig } from '../config/env.config'

export function createFastifyApp(): FastifyInstance {
  const options: FastifyServerOptions = {
    logger: {
      level: EnvConfig.LOG_LEVEL
    }
  }

  // Add HTTPS support in development
  if (EnvConfig.USE_HTTPS && EnvConfig.NODE_ENV === 'development') {
    options.https = {
      key: readFileSync(join(__dirname, '../../certs/key.pem')),
      cert: readFileSync(join(__dirname, '../../certs/cert.pem'))
    }
  }

  const app = Fastify(options)

  // Register CORS
  app.register(fastifyCors, {
    origin: true
  })

  // Register error handler
  app.setErrorHandler((error, request, reply) => {
    request.log.error(error)
    reply.status(500).send({ error: 'Internal Server Error' })
  })

  return app
}

5. AUTH MIDDLEWARE (infrastructure/http/middleware/auth.middleware.ts):

import { FastifyRequest, FastifyReply } from 'fastify'
import jwt from 'jsonwebtoken'
import { EnvConfig } from '../../config/env.config'

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const token = request.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      return reply.code(401).send({ error: 'No token provided' })
    }

    const decoded = jwt.verify(token, EnvConfig.JWT_SECRET)
    request.user = decoded
  } catch (error) {
    return reply.code(401).send({ error: 'Invalid token' })
  }
}

6. JWT UTILITY (infrastructure/security/jwt.util.ts):

import jwt from 'jsonwebtoken'
import { EnvConfig } from '../config/env.config'

export class JwtUtil {
  static generateToken(payload: { userId: string; email: string }): string {
    return jwt.sign(payload, EnvConfig.JWT_SECRET, {
      expiresIn: EnvConfig.JWT_EXPIRATION
    })
  }

  static verifyToken(token: string): { userId: string; email: string } {
    return jwt.verify(token, EnvConfig.JWT_SECRET) as { userId: string; email: string }
  }

  static decodeToken(token: string): any {
    return jwt.decode(token)
  }
}

7. DEPENDENCY INJECTION CONTAINER (infrastructure/di/container.ts):

import { FastifyInstance } from 'fastify'
import { createFastifyApp } from '../http/fastify.config'

// Domain
import { WorkoutCalculator } from '../../domain/services/workout-calculator'

// Application
import { RegisterUserUseCase } from '../../application/use-cases/register-user.use-case'
import { CreateWorkoutUseCase } from '../../application/use-cases/create-workout.use-case'

// Adapters
import { PostgresUserRepository } from '../../adapters/secondary/repositories/user.repository'
import { SendGridEmailService } from '../../adapters/secondary/services/email.service'
import { PinoLoggerService } from '../../adapters/secondary/services/logger.service'
import { UserController } from '../../adapters/primary/http/user.controller'

import { EnvConfig } from '../config/env.config'

export class Container {
  private static instance: Container
  
  // Infrastructure
  public readonly app: FastifyInstance
  
  // Services
  public readonly logger: PinoLoggerService
  public readonly emailService: SendGridEmailService
  
  // Repositories
  public readonly userRepository: PostgresUserRepository
  
  // Domain Services
  public readonly workoutCalculator: WorkoutCalculator
  
  // Use Cases
  public readonly registerUserUseCase: RegisterUserUseCase
  public readonly createWorkoutUseCase: CreateWorkoutUseCase
  
  // Controllers
  public readonly userController: UserController

  private constructor() {
    // Validate environment
    EnvConfig.validate()
    
    // Initialize infrastructure
    this.app = createFastifyApp()
    
    // Initialize services (secondary adapters)
    this.logger = new PinoLoggerService()
    this.emailService = new SendGridEmailService(EnvConfig.SENDGRID_API_KEY, this.logger)
    
    // Initialize repositories (secondary adapters)
    this.userRepository = new PostgresUserRepository()
    
    // Initialize domain services
    this.workoutCalculator = new WorkoutCalculator()
    
    // Initialize use cases
    this.registerUserUseCase = new RegisterUserUseCase(
      this.userRepository,
      this.emailService,
      this.logger
    )
    
    this.createWorkoutUseCase = new CreateWorkoutUseCase(
      this.userRepository,
      this.workoutCalculator
    )
    
    // Initialize controllers (primary adapters)
    this.userController = new UserController(this.registerUserUseCase)
    
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
      await this.app.listen({
        port: EnvConfig.PORT,
        host: EnvConfig.HOST
      })
      this.logger.info(`Server started on ${EnvConfig.USE_HTTPS ? 'https' : 'http'}://${EnvConfig.HOST}:${EnvConfig.PORT}`)
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

8. APPLICATION ENTRY POINT (Example usage in index.ts):

import { Container } from './infrastructure/di/container'

async function main() {
  const container = Container.getInstance()
  await container.start()
  
  // Graceful shutdown
  process.on('SIGINT', async () => {
    await container.stop()
    process.exit(0)
  })
}

main()
