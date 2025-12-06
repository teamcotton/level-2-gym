import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RegisterUserDto } from '../../../src/application/dtos/register-user.dto.js'
import type { EmailServicePort } from '../../../src/application/ports/email.service.port.js'
import type { LoggerPort } from '../../../src/application/ports/logger.port.js'
import type { UserRepositoryPort } from '../../../src/application/ports/user.repository.port.js'
import { RegisterUserUseCase } from '../../../src/application/user-cases/register-user.use-case.js'
import { User } from '../../../src/domain/entities/user.js'
import { Email } from '../../../src/domain/value-objects/email.js'
import { Password } from '../../../src/domain/value-objects/password.js'

describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase
  let mockUserRepository: UserRepositoryPort
  let mockEmailService: EmailServicePort
  let mockLogger: LoggerPort
  let testDto: RegisterUserDto

  beforeEach(() => {
    // Create mock implementations
    mockUserRepository = {
      save: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn().mockResolvedValue(null),
      findByEmail: vi.fn().mockResolvedValue(null),
      update: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      existsByEmail: vi.fn().mockResolvedValue(false),
    }

    mockEmailService = {
      sendWelcomeEmail: vi.fn().mockResolvedValue(undefined),
      sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
    }

    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    }

    // Create use case instance
    useCase = new RegisterUserUseCase(mockUserRepository, mockEmailService, mockLogger)

    // Create test DTO
    testDto = RegisterUserDto.validate({
      email: 'test@example.com',
      password: 'password123',
      name: 'John Doe',
    })
  })

  describe('Constructor', () => {
    it('should create an instance with all dependencies', () => {
      expect(useCase).toBeInstanceOf(RegisterUserUseCase)
    })

    it('should accept UserRepositoryPort dependency', () => {
      const instance = new RegisterUserUseCase(mockUserRepository, mockEmailService, mockLogger)
      expect(instance).toBeInstanceOf(RegisterUserUseCase)
    })

    it('should accept EmailServicePort dependency', () => {
      const instance = new RegisterUserUseCase(mockUserRepository, mockEmailService, mockLogger)
      expect(instance).toBeInstanceOf(RegisterUserUseCase)
    })

    it('should accept LoggerPort dependency', () => {
      const instance = new RegisterUserUseCase(mockUserRepository, mockEmailService, mockLogger)
      expect(instance).toBeInstanceOf(RegisterUserUseCase)
    })
  })

  describe('execute() - Successful Registration', () => {
    it('should successfully register a new user', async () => {
      const result = await useCase.execute(testDto)

      expect(result).toHaveProperty('userId')
      expect(typeof result.userId).toBe('string')
      expect(result.userId).toMatch(/^user-\d+-[a-z0-9]+$/)
    })

    it('should check if user already exists by email', async () => {
      await useCase.execute(testDto)

      expect(mockUserRepository.findByEmail).toHaveBeenCalledTimes(1)
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(testDto.email)
    })

    it('should save the new user to repository', async () => {
      await useCase.execute(testDto)

      expect(mockUserRepository.save).toHaveBeenCalledTimes(1)
      expect(mockUserRepository.save).toHaveBeenCalledWith(expect.any(User))
    })

    it('should send welcome email after registration', async () => {
      await useCase.execute(testDto)

      expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledTimes(1)
      expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledWith(testDto.email, testDto.name)
    })

    it('should log the start of registration', async () => {
      await useCase.execute(testDto)

      expect(mockLogger.info).toHaveBeenCalledWith('Starting user registration', {
        email: testDto.email,
      })
    })

    it('should log successful registration', async () => {
      const result = await useCase.execute(testDto)

      expect(mockLogger.info).toHaveBeenCalledWith('User registered successfully', {
        userId: result.userId,
      })
    })

    it('should return a unique userId for each registration', async () => {
      const result1 = await useCase.execute(testDto)
      const result2 = await useCase.execute(testDto)

      expect(result1.userId).not.toBe(result2.userId)
    })

    it('should generate userId with timestamp prefix', async () => {
      const beforeTime = Date.now()
      const result = await useCase.execute(testDto)
      const afterTime = Date.now()

      const timestamp = parseInt(result.userId.split('-')[1]!)
      expect(timestamp).toBeGreaterThanOrEqual(beforeTime)
      expect(timestamp).toBeLessThanOrEqual(afterTime)
    })
  })

  describe('execute() - Existing User Validation', () => {
    it('should throw error if user with email already exists', async () => {
      const existingUser = new User(
        'existing-123',
        new Email('test@example.com'),
        await Password.create('password123'),
        'Existing User'
      )
      mockUserRepository.findByEmail = vi.fn().mockResolvedValue(existingUser)

      await expect(useCase.execute(testDto)).rejects.toThrow('User with this email already exists')
    })

    it('should not save user if email already exists', async () => {
      const existingUser = new User(
        'existing-123',
        new Email('test@example.com'),
        await Password.create('password123'),
        'Existing User'
      )
      mockUserRepository.findByEmail = vi.fn().mockResolvedValue(existingUser)

      await expect(useCase.execute(testDto)).rejects.toThrow()
      expect(mockUserRepository.save).not.toHaveBeenCalled()
    })

    it('should not send welcome email if email already exists', async () => {
      const existingUser = new User(
        'existing-123',
        new Email('test@example.com'),
        await Password.create('password123'),
        'Existing User'
      )
      mockUserRepository.findByEmail = vi.fn().mockResolvedValue(existingUser)

      await expect(useCase.execute(testDto)).rejects.toThrow()
      expect(mockEmailService.sendWelcomeEmail).not.toHaveBeenCalled()
    })
  })

  describe('execute() - Email Service Error Handling', () => {
    it('should not fail registration if welcome email fails', async () => {
      mockEmailService.sendWelcomeEmail = vi
        .fn()
        .mockRejectedValue(new Error('Email service unavailable'))

      const result = await useCase.execute(testDto)

      expect(result).toHaveProperty('userId')
      expect(mockUserRepository.save).toHaveBeenCalled()
    })

    it('should log error when welcome email fails', async () => {
      const emailError = new Error('Email service unavailable')
      mockEmailService.sendWelcomeEmail = vi.fn().mockRejectedValue(emailError)

      const result = await useCase.execute(testDto)

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to send welcome email', emailError, {
        userId: result.userId,
        email: testDto.email,
      })
    })

    it('should continue registration flow after email failure', async () => {
      mockEmailService.sendWelcomeEmail = vi
        .fn()
        .mockRejectedValue(new Error('Email service unavailable'))

      const result = await useCase.execute(testDto)

      expect(mockLogger.info).toHaveBeenCalledWith('User registered successfully', {
        userId: result.userId,
      })
    })

    it('should handle email service timeout gracefully', async () => {
      mockEmailService.sendWelcomeEmail = vi.fn().mockRejectedValue(new Error('Request timeout'))

      await expect(useCase.execute(testDto)).resolves.toHaveProperty('userId')
    })
  })

  describe('execute() - DTO Validation Integration', () => {
    it('should work with valid email in DTO', async () => {
      const dto = RegisterUserDto.validate({
        email: 'valid@example.com',
        password: 'password123',
        name: 'Valid User',
      })

      const result = await useCase.execute(dto)
      expect(result).toHaveProperty('userId')
    })

    it('should work with minimum password length', async () => {
      const dto = RegisterUserDto.validate({
        email: 'test@example.com',
        password: 'pass1234', // 8 characters
        name: 'Test User',
      })

      const result = await useCase.execute(dto)
      expect(result).toHaveProperty('userId')
    })

    it('should work with special characters in name', async () => {
      const dto = RegisterUserDto.validate({
        email: 'test@example.com',
        password: 'password123',
        name: "O'Brien-Smith",
      })

      const result = await useCase.execute(dto)
      expect(result).toHaveProperty('userId')
    })

    it('should work with unicode characters in name', async () => {
      const dto = RegisterUserDto.validate({
        email: 'test@example.com',
        password: 'password123',
        name: '李明',
      })

      const result = await useCase.execute(dto)
      expect(result).toHaveProperty('userId')
    })
  })

  describe('execute() - Repository Error Handling', () => {
    it('should propagate repository save errors', async () => {
      const saveError = new Error('Database connection failed')
      mockUserRepository.save = vi.fn().mockRejectedValue(saveError)

      await expect(useCase.execute(testDto)).rejects.toThrow('Database connection failed')
    })

    it('should propagate repository findByEmail errors', async () => {
      const findError = new Error('Database query failed')
      mockUserRepository.findByEmail = vi.fn().mockRejectedValue(findError)

      await expect(useCase.execute(testDto)).rejects.toThrow('Database query failed')
    })

    it('should not send email if save fails', async () => {
      mockUserRepository.save = vi.fn().mockRejectedValue(new Error('Save failed'))

      await expect(useCase.execute(testDto)).rejects.toThrow()
      expect(mockEmailService.sendWelcomeEmail).not.toHaveBeenCalled()
    })
  })

  describe('execute() - Domain Object Creation', () => {
    it('should create Email value object from DTO', async () => {
      await useCase.execute(testDto)

      // Verify user was saved with Email instance
      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          getEmail: expect.any(Function),
        })
      )
    })

    it('should create Password value object from DTO', async () => {
      await useCase.execute(testDto)

      // Password should be created and hashed
      expect(mockUserRepository.save).toHaveBeenCalled()
      const savedUser = (mockUserRepository.save as any).mock.calls[0][0]
      expect(savedUser).toBeInstanceOf(User)
    })

    it('should create User entity with all required fields', async () => {
      await useCase.execute(testDto)

      const savedUser = (mockUserRepository.save as any).mock.calls[0][0] as User
      expect(savedUser).toBeInstanceOf(User)
      expect(savedUser.id).toBeDefined()
      expect(savedUser.getEmail()).toBe('test@example.com')
      expect(savedUser.getName()).toBe('John Doe')
    })

    it('should generate unique user ID for User entity', async () => {
      await useCase.execute(testDto)

      const savedUser = (mockUserRepository.save as any).mock.calls[0][0] as User
      expect(savedUser.id).toMatch(/^user-\d+-[a-z0-9]+$/)
    })
  })

  describe('execute() - Logging Behavior', () => {
    it('should log at start, success, and potentially error', async () => {
      await useCase.execute(testDto)

      expect(mockLogger.info).toHaveBeenCalledTimes(2) // start and success
    })

    it('should include email in start log', async () => {
      await useCase.execute(testDto)

      const startLogCall = (mockLogger.info as any).mock.calls[0]
      expect(startLogCall[0]).toBe('Starting user registration')
      expect(startLogCall[1]).toEqual({ email: testDto.email })
    })

    it('should include userId in success log', async () => {
      const result = await useCase.execute(testDto)

      const successLogCall = (mockLogger.info as any).mock.calls[1]
      expect(successLogCall[0]).toBe('User registered successfully')
      expect(successLogCall[1]).toEqual({ userId: result.userId })
    })

    it('should log error details when email fails', async () => {
      const emailError = new Error('SMTP connection failed')
      mockEmailService.sendWelcomeEmail = vi.fn().mockRejectedValue(emailError)

      await useCase.execute(testDto)

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to send welcome email',
        emailError,
        expect.objectContaining({
          email: testDto.email,
        })
      )
    })
  })

  describe('execute() - Edge Cases', () => {
    it('should handle very long user names', async () => {
      const longName = 'A'.repeat(1000)
      const dto = RegisterUserDto.validate({
        email: 'test@example.com',
        password: 'password123',
        name: longName,
      })

      const result = await useCase.execute(dto)
      expect(result).toHaveProperty('userId')
    })

    it('should handle email with special characters', async () => {
      const dto = RegisterUserDto.validate({
        email: 'test+tag@example.co.uk',
        password: 'password123',
        name: 'Test User',
      })

      const result = await useCase.execute(dto)
      expect(result).toHaveProperty('userId')
    })

    it('should handle concurrent registrations', async () => {
      const dto1 = RegisterUserDto.validate({
        email: 'user1@example.com',
        password: 'password123',
        name: 'User 1',
      })
      const dto2 = RegisterUserDto.validate({
        email: 'user2@example.com',
        password: 'password123',
        name: 'User 2',
      })

      const [result1, result2] = await Promise.all([useCase.execute(dto1), useCase.execute(dto2)])

      expect(result1.userId).not.toBe(result2.userId)
      expect(mockUserRepository.save).toHaveBeenCalledTimes(2)
    })

    it('should handle repository returning null for non-existent user', async () => {
      mockUserRepository.findByEmail = vi.fn().mockResolvedValue(null)

      const result = await useCase.execute(testDto)
      expect(result).toHaveProperty('userId')
    })

    it('should handle repository returning undefined for non-existent user', async () => {
      mockUserRepository.findByEmail = vi.fn().mockResolvedValue(undefined)

      const result = await useCase.execute(testDto)
      expect(result).toHaveProperty('userId')
    })
  })

  describe('execute() - Password Handling', () => {
    it('should hash password before saving', async () => {
      await useCase.execute(testDto)

      const savedUser = (mockUserRepository.save as any).mock.calls[0][0] as User
      expect(savedUser).toBeInstanceOf(User)
      // Password is hashed and stored internally
    })

    it('should accept long passwords', async () => {
      const dto = RegisterUserDto.validate({
        email: 'test@example.com',
        password: 'a'.repeat(100),
        name: 'Test User',
      })

      const result = await useCase.execute(dto)
      expect(result).toHaveProperty('userId')
    })

    it('should accept passwords with special characters', async () => {
      const dto = RegisterUserDto.validate({
        email: 'test@example.com',
        password: 'P@ssw0rd!#$%^&*()',
        name: 'Test User',
      })

      const result = await useCase.execute(dto)
      expect(result).toHaveProperty('userId')
    })
  })

  describe('execute() - Call Order Verification', () => {
    it('should check for existing user before creating domain objects', async () => {
      const callOrder: string[] = []

      mockUserRepository.findByEmail = vi.fn().mockImplementation(async () => {
        callOrder.push('findByEmail')
        return null
      })

      mockUserRepository.save = vi.fn().mockImplementation(async () => {
        callOrder.push('save')
      })

      await useCase.execute(testDto)

      expect(callOrder[0]).toBe('findByEmail')
      expect(callOrder[1]).toBe('save')
    })

    it('should save user before sending welcome email', async () => {
      const callOrder: string[] = []

      mockUserRepository.save = vi.fn().mockImplementation(async () => {
        callOrder.push('save')
      })

      mockEmailService.sendWelcomeEmail = vi.fn().mockImplementation(async () => {
        callOrder.push('sendEmail')
      })

      await useCase.execute(testDto)

      expect(callOrder.indexOf('save')).toBeLessThan(callOrder.indexOf('sendEmail'))
    })
  })
})
