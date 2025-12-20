import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { UserController } from '../../../src/adapters/primary/http/user.controller.js'
import { PostgresUserRepository } from '../../../src/adapters/secondary/repositories/user.repository.js'
import { ResendService } from '../../../src/adapters/secondary/services/email.service.js'
import { PinoLoggerService } from '../../../src/adapters/secondary/services/logger.service.js'
import { RegisterUserUseCase } from '../../../src/application/use-cases/register-user.use-case.js'
import { EnvConfig } from '../../../src/infrastructure/config/env.config.js'
import { Container } from '../../../src/infrastructure/di/container.js'
import { createFastifyApp } from '../../../src/infrastructure/http/fastify.config.js'

// Mock all dependencies
vi.mock('../../../src/infrastructure/http/fastify.config.js', () => ({
  createFastifyApp: vi.fn(() => ({
    listen: vi.fn(),
    close: vi.fn(),
    register: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
  })),
}))

vi.mock('../../../src/infrastructure/config/env.config.js', () => ({
  EnvConfig: {
    validate: vi.fn(),
    NODE_ENV: 'test',
    PORT: '3000',
    HOST: '127.0.0.1',
    USE_HTTPS: 'true',
    RESEND_API_KEY: 'test-api-key',
    LOG_LEVEL: 'silent',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
  },
}))

vi.mock('../../../src/adapters/secondary/services/logger.service.js', () => ({
  PinoLoggerService: vi.fn(function (this: any) {
    this.info = vi.fn()
    this.error = vi.fn()
    this.warn = vi.fn()
    this.debug = vi.fn()
  }),
}))

vi.mock('../../../src/adapters/secondary/services/email.service.js', () => ({
  ResendService: vi.fn(function (this: any) {
    this.sendWelcomeEmail = vi.fn()
    this.sendPasswordResetEmail = vi.fn()
  }),
}))

vi.mock('../../../src/adapters/secondary/repositories/user.repository.js', () => ({
  PostgresUserRepository: vi.fn(function (this: any) {
    this.save = vi.fn()
    this.findById = vi.fn()
    this.findByEmail = vi.fn()
    this.update = vi.fn()
    this.delete = vi.fn()
    this.existsByEmail = vi.fn()
  }),
}))

vi.mock('../../../src/application/use-cases/register-user.use-case.js', () => ({
  RegisterUserUseCase: vi.fn(function (this: any) {
    this.execute = vi.fn()
  }),
}))

vi.mock('../../../src/adapters/primary/http/user.controller.js', () => ({
  UserController: vi.fn(function (this: any) {
    this.registerRoutes = vi.fn()
  }),
}))

describe('Container', () => {
  // Reset the singleton instance before each test
  beforeEach(() => {
    // @ts-expect-error - accessing private static property for testing
    Container.instance = undefined
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance on multiple calls to getInstance', () => {
      const instance1 = Container.getInstance()
      const instance2 = Container.getInstance()

      expect(instance1).toBe(instance2)
    })

    it('should create only one instance', () => {
      Container.getInstance()
      Container.getInstance()
      Container.getInstance()

      // validate should only be called once during construction
      expect(EnvConfig.validate).toHaveBeenCalledTimes(1)
    })
  })

  describe('Initialization', () => {
    it('should validate environment configuration on instantiation', () => {
      Container.getInstance()

      expect(EnvConfig.validate).toHaveBeenCalledTimes(1)
    })

    it('should initialize logger service first', () => {
      const container = Container.getInstance()

      expect(container.logger).toBeDefined()
      expect(typeof container.logger.info).toBe('function')
      expect(typeof container.logger.error).toBe('function')
      expect(typeof container.logger.warn).toBe('function')
      expect(typeof container.logger.debug).toBe('function')
    })

    it('should initialize Fastify app', () => {
      const container = Container.getInstance()

      expect(container.app).toBeDefined()
      expect(typeof container.app.listen).toBe('function')
      expect(typeof container.app.close).toBe('function')
    })

    it('should initialize all services', () => {
      const container = Container.getInstance()

      expect(container.emailService).toBeDefined()
      expect(typeof container.emailService.sendWelcomeEmail).toBe('function')
      expect(typeof container.emailService.sendPasswordResetEmail).toBe('function')
    })

    it('should initialize all repositories', () => {
      const container = Container.getInstance()

      expect(container.userRepository).toBeDefined()
      expect(typeof container.userRepository.save).toBe('function')
      expect(typeof container.userRepository.findById).toBe('function')
      expect(typeof container.userRepository.findByEmail).toBe('function')
    })

    it('should initialize all use cases', () => {
      const container = Container.getInstance()

      expect(container.registerUserUseCase).toBeDefined()
      expect(typeof container.registerUserUseCase.execute).toBe('function')
    })

    it('should initialize all controllers', () => {
      const container = Container.getInstance()

      expect(container.userController).toBeDefined()
      expect(typeof container.userController.registerRoutes).toBe('function')
    })

    it('should register routes during initialization', () => {
      Container.getInstance()

      // The mock should have been called during construction
      const mockInstance = vi.mocked(UserController).mock.results[0]?.value
      expect(mockInstance.registerRoutes).toHaveBeenCalledTimes(1)
    })
  })

  describe('Dependency Injection', () => {
    it('should inject logger into ResendService', () => {
      const container = Container.getInstance()

      expect(ResendService).toHaveBeenCalledWith(expect.anything(), container.logger)
    })

    it('should inject dependencies into RegisterUserUseCase', () => {
      const container = Container.getInstance()

      expect(RegisterUserUseCase).toHaveBeenCalledWith(
        container.userRepository,
        container.emailService,
        container.logger,
        container.tokenGenerator
      )
    })

    it('should inject use case into UserController', () => {
      const container = Container.getInstance()

      expect(UserController).toHaveBeenCalledWith(
        container.registerUserUseCase,
        container.getAllUsersUseCase
      )
    })

    it('should inject Fastify app into controller for route registration', () => {
      const container = Container.getInstance()

      const mockInstance = vi.mocked(UserController).mock.results[0]?.value
      expect(mockInstance.registerRoutes).toHaveBeenCalledWith(container.app)
    })
  })

  describe('start', () => {
    it('should start the Fastify server on specified port', async () => {
      const container = Container.getInstance()
      const mockListen = vi.fn().mockResolvedValue(undefined)
      container.app.listen = mockListen

      await container.start()

      expect(mockListen).toHaveBeenCalledWith({
        port: 3000,
        host: '127.0.0.1',
      })
    })

    it('should log server startup information', async () => {
      const container = Container.getInstance()
      vi.mocked(container.app.listen).mockResolvedValue(undefined as any)

      await container.start()

      expect(container.logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Server listening on')
      )
      expect(container.logger.info).toHaveBeenCalledWith(
        expect.stringContaining('API Documentation')
      )
    })

    it('should use HTTP protocol in test environment', async () => {
      // Temporarily set USE_HTTPS to 'false' to test HTTP protocol
      const originalUseHttps = EnvConfig.USE_HTTPS
      Object.defineProperty(EnvConfig, 'USE_HTTPS', {
        value: 'false',
        writable: true,
        configurable: true,
      })

      const container = Container.getInstance()
      vi.mocked(container.app.listen).mockResolvedValue(undefined as any)

      await container.start()

      expect(container.logger.info).toHaveBeenCalledWith(
        expect.stringContaining('http://127.0.0.1:3000')
      )

      // Restore original value
      Object.defineProperty(EnvConfig, 'USE_HTTPS', {
        value: originalUseHttps,
        writable: true,
        configurable: true,
      })
    })

    it('should log error and exit on startup failure', async () => {
      const container = Container.getInstance()
      const mockError = new Error('Port already in use')
      vi.mocked(container.app.listen).mockRejectedValue(mockError)

      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called')
      })

      await expect(container.start()).rejects.toThrow('process.exit called')

      expect(container.logger.error).toHaveBeenCalledWith('Failed to start server', mockError)
      expect(mockExit).toHaveBeenCalledWith(1)

      mockExit.mockRestore()
    })

    it('should use custom host from environment', async () => {
      // Update the mocked EnvConfig HOST value
      const originalHost = EnvConfig.HOST
      Object.defineProperty(EnvConfig, 'HOST', {
        value: '0.0.0.0',
        writable: true,
        configurable: true,
      })

      const container = Container.getInstance()
      const mockListen = vi.fn().mockResolvedValue(undefined)
      container.app.listen = mockListen

      await container.start()

      expect(mockListen).toHaveBeenCalledWith({
        port: 3000,
        host: '0.0.0.0',
      })

      // Restore original value
      Object.defineProperty(EnvConfig, 'HOST', {
        value: originalHost,
        writable: true,
        configurable: true,
      })
    })
  })

  describe('stop', () => {
    it('should close the Fastify server', async () => {
      const container = Container.getInstance()
      const mockClose = vi.fn().mockResolvedValue(undefined)
      container.app.close = mockClose

      await container.stop()

      expect(mockClose).toHaveBeenCalledTimes(1)
    })

    it('should log server shutdown', async () => {
      const container = Container.getInstance()
      vi.mocked(container.app.close).mockResolvedValue(undefined as any)

      await container.stop()

      expect(container.logger.info).toHaveBeenCalledWith('Server stopped')
    })

    it('should handle close errors gracefully', async () => {
      const container = Container.getInstance()
      const mockError = new Error('Failed to close server')
      vi.mocked(container.app.close).mockRejectedValue(mockError)

      await expect(container.stop()).rejects.toThrow('Failed to close server')
    })
  })

  describe('Error Handling', () => {
    it('should throw error when environment validation fails', () => {
      vi.mocked(EnvConfig.validate).mockImplementationOnce(() => {
        throw new Error('Missing required environment variables: DATABASE_URL')
      })

      // Reset singleton
      // @ts-expect-error - accessing private static property for testing
      Container.instance = undefined

      expect(() => Container.getInstance()).toThrow(
        'Missing required environment variables: DATABASE_URL'
      )
    })

    it('should throw error when Fastify app initialization fails', () => {
      vi.mocked(createFastifyApp).mockImplementationOnce(() => {
        throw new Error('Failed to read openapi.json')
      })

      // Reset singleton
      // @ts-expect-error - accessing private static property for testing
      Container.instance = undefined

      expect(() => Container.getInstance()).toThrow('Failed to initialize Fastify app')
    })
  })

  describe('Public API', () => {
    it('should expose all required services through public properties', () => {
      const container = Container.getInstance()

      expect(container).toHaveProperty('app')
      expect(container).toHaveProperty('logger')
      expect(container).toHaveProperty('emailService')
      expect(container).toHaveProperty('tokenGenerator')
      expect(container).toHaveProperty('userRepository')
      expect(container).toHaveProperty('registerUserUseCase')
      expect(container).toHaveProperty('userController')
    })

    it('should have start method that returns Promise', () => {
      const container = Container.getInstance()

      expect(container.start).toBeDefined()
      expect(typeof container.start).toBe('function')
      expect(container.start()).toBeInstanceOf(Promise)
    })

    it('should have stop method that returns Promise', () => {
      const container = Container.getInstance()

      expect(container.stop).toBeDefined()
      expect(typeof container.stop).toBe('function')
      expect(container.stop()).toBeInstanceOf(Promise)
    })

    it('should have static getInstance method', () => {
      expect(Container.getInstance).toBeDefined()
      expect(typeof Container.getInstance).toBe('function')
    })
  })

  describe('Integration', () => {
    it('should wire up complete user registration flow', () => {
      const container = Container.getInstance()

      // Verify the dependency chain
      expect(container.userController).toBeDefined()
      expect(container.registerUserUseCase).toBeDefined()
      expect(container.userRepository).toBeDefined()
      expect(container.emailService).toBeDefined()
      expect(container.logger).toBeDefined()

      // Verify routes are registered
      const mockInstance = vi.mocked(UserController).mock.results[0]?.value
      expect(mockInstance.registerRoutes).toHaveBeenCalledWith(container.app)
    })

    it('should initialize all components in correct order', () => {
      Container.getInstance()

      // Verify initialization order by checking call order
      const validateOrder = vi.mocked(EnvConfig.validate).mock.invocationCallOrder[0]
      const loggerOrder = vi.mocked(PinoLoggerService).mock.invocationCallOrder[0]
      const appOrder = vi.mocked(createFastifyApp).mock.invocationCallOrder[0]
      const emailOrder = vi.mocked(ResendService).mock.invocationCallOrder[0]
      const repoOrder = vi.mocked(PostgresUserRepository).mock.invocationCallOrder[0]

      expect(validateOrder).toBeLessThan(loggerOrder!)
      expect(loggerOrder).toBeLessThan(appOrder!)
      expect(appOrder).toBeLessThan(emailOrder!)
      expect(emailOrder).toBeLessThan(repoOrder!)
    })
  })
})
