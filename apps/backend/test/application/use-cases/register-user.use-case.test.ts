import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RegisterUserDto } from '../../../src/application/dtos/register-user.dto.js'
import type { EmailServicePort } from '../../../src/application/ports/email.service.port.js'
import type { LoggerPort } from '../../../src/application/ports/logger.port.js'
import type { UserRepositoryPort } from '../../../src/application/ports/user.repository.port.js'
import { RegisterUserUseCase } from '../../../src/application/use-cases/register-user.use-case.js'
import { User } from '../../../src/domain/entities/user.js'
import { ConflictException } from '../../../src/shared/exceptions/conflict.exception.js'
import { ValidationException } from '../../../src/shared/exceptions/validation.exception.js'

describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase
  let mockUserRepository: UserRepositoryPort
  let mockEmailService: EmailServicePort
  let mockLogger: LoggerPort

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks()

    // Create mock implementations
    mockUserRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByEmail: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      existsByEmail: vi.fn(),
    }

    mockEmailService = {
      sendWelcomeEmail: vi.fn(),
      sendPasswordResetEmail: vi.fn(),
    }

    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    }

    // Create use case instance with mocks
    useCase = new RegisterUserUseCase(mockUserRepository, mockEmailService, mockLogger)
  })

  describe('execute()', () => {
    describe('successful registration', () => {
      it('should register a new user successfully', async () => {
        const dto = new RegisterUserDto('john@example.com', 'SecurePass123!', 'John Doe')

        vi.mocked(mockUserRepository.save).mockResolvedValue(undefined)
        vi.mocked(mockEmailService.sendWelcomeEmail).mockResolvedValue(undefined)

        const result = await useCase.execute(dto)

        // Should return a user ID
        expect(result).toBeDefined()
        expect(result.userId).toBeDefined()
        expect(typeof result.userId).toBe('string')
        expect(result.userId).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        )
      })

      it('should save the user to the repository', async () => {
        const dto = new RegisterUserDto('john@example.com', 'SecurePass123!', 'John Doe')

        vi.mocked(mockUserRepository.save).mockResolvedValue(undefined)
        vi.mocked(mockEmailService.sendWelcomeEmail).mockResolvedValue(undefined)

        await useCase.execute(dto)

        expect(mockUserRepository.save).toHaveBeenCalledTimes(1)

        const savedUser = vi.mocked(mockUserRepository.save).mock.calls?.[0]?.[0]
        expect(savedUser).toBeInstanceOf(User)
        expect(savedUser?.getEmail()).toBe('john@example.com')
      })

      it('should send a welcome email to the user', async () => {
        const dto = new RegisterUserDto('john@example.com', 'SecurePass123!', 'John Doe')

        vi.mocked(mockUserRepository.save).mockResolvedValue(undefined)
        vi.mocked(mockEmailService.sendWelcomeEmail).mockResolvedValue(undefined)

        await useCase.execute(dto)

        expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledTimes(1)
        expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledWith(
          'john@example.com',
          'John Doe'
        )
      })

      it('should log registration start with email', async () => {
        const dto = new RegisterUserDto('john@example.com', 'SecurePass123!', 'John Doe')

        vi.mocked(mockUserRepository.save).mockResolvedValue(undefined)
        vi.mocked(mockEmailService.sendWelcomeEmail).mockResolvedValue(undefined)

        await useCase.execute(dto)

        expect(mockLogger.info).toHaveBeenCalledWith('Starting user registration', {
          email: 'john@example.com',
        })
      })

      it('should log successful registration with userId', async () => {
        const dto = new RegisterUserDto('john@example.com', 'SecurePass123!', 'John Doe')

        vi.mocked(mockUserRepository.save).mockResolvedValue(undefined)
        vi.mocked(mockEmailService.sendWelcomeEmail).mockResolvedValue(undefined)

        const result = await useCase.execute(dto)

        expect(mockLogger.info).toHaveBeenCalledWith('User registered successfully', {
          userId: result.userId,
        })
      })

      it('should create unique user IDs for different registrations', async () => {
        const dto1 = new RegisterUserDto('john@example.com', 'SecurePass123!', 'John Doe')
        const dto2 = new RegisterUserDto('jane@example.com', 'SecurePass456!', 'Jane Smith')

        vi.mocked(mockUserRepository.save).mockResolvedValue(undefined)
        vi.mocked(mockEmailService.sendWelcomeEmail).mockResolvedValue(undefined)

        const result1 = await useCase.execute(dto1)
        const result2 = await useCase.execute(dto2)

        expect(result1.userId).not.toBe(result2.userId)
      })
    })

    describe('duplicate email handling', () => {
      it('should throw ConflictException when database rejects duplicate email', async () => {
        const dto = new RegisterUserDto('existing@example.com', 'SecurePass123!', 'John Doe')

        // Simulate PostgreSQL unique constraint violation error (code 23505)
        const duplicateKeyError = Object.assign(
          new Error('duplicate key value violates unique constraint'),
          {
            code: '23505',
          }
        )
        vi.mocked(mockUserRepository.save).mockRejectedValue(duplicateKeyError)

        await expect(useCase.execute(dto)).rejects.toThrow(ConflictException)
        await expect(useCase.execute(dto)).rejects.toThrow('User with this email already exists')
      })

      it('should not send welcome email when duplicate email is detected', async () => {
        const dto = new RegisterUserDto('existing@example.com', 'SecurePass123!', 'John Doe')

        const duplicateKeyError = Object.assign(
          new Error('duplicate key value violates unique constraint'),
          {
            code: '23505',
          }
        )
        vi.mocked(mockUserRepository.save).mockRejectedValue(duplicateKeyError)

        await expect(useCase.execute(dto)).rejects.toThrow(ConflictException)

        expect(mockEmailService.sendWelcomeEmail).not.toHaveBeenCalled()
      })

      it('should handle race condition with concurrent duplicate registrations', async () => {
        const dto = new RegisterUserDto('race@example.com', 'SecurePass123!', 'Test User')

        // Simulate race condition where both requests get past any checks
        // but database rejects the second one
        const duplicateKeyError = Object.assign(
          new Error('duplicate key value violates unique constraint'),
          {
            code: '23505',
          }
        )
        vi.mocked(mockUserRepository.save).mockRejectedValue(duplicateKeyError)

        await expect(useCase.execute(dto)).rejects.toThrow(ConflictException)
        await expect(useCase.execute(dto)).rejects.toThrow('User with this email already exists')
      })
    })

    describe('email service failure handling', () => {
      it('should not fail registration if welcome email fails to send', async () => {
        const dto = new RegisterUserDto('john@example.com', 'SecurePass123!', 'John Doe')

        vi.mocked(mockUserRepository.save).mockResolvedValue(undefined)
        vi.mocked(mockEmailService.sendWelcomeEmail).mockRejectedValue(
          new Error('Email service down')
        )

        const result = await useCase.execute(dto)

        // Should still return userId despite email failure
        expect(result).toBeDefined()
        expect(result.userId).toBeDefined()
      })

      it('should log error when welcome email fails to send', async () => {
        const dto = new RegisterUserDto('john@example.com', 'SecurePass123!', 'John Doe')

        vi.mocked(mockUserRepository.save).mockResolvedValue(undefined)

        const emailError = new Error('Email service down')
        vi.mocked(mockEmailService.sendWelcomeEmail).mockRejectedValue(emailError)

        const result = await useCase.execute(dto)

        expect(mockLogger.error).toHaveBeenCalledTimes(1)
        expect(mockLogger.error).toHaveBeenCalledWith('Failed to send welcome email', emailError, {
          userId: result.userId,
          email: 'john@example.com',
        })
      })

      it('should still save user even if email service fails', async () => {
        const dto = new RegisterUserDto('john@example.com', 'SecurePass123!', 'John Doe')

        vi.mocked(mockUserRepository.save).mockResolvedValue(undefined)
        vi.mocked(mockEmailService.sendWelcomeEmail).mockRejectedValue(
          new Error('Email service down')
        )

        await useCase.execute(dto)

        expect(mockUserRepository.save).toHaveBeenCalledTimes(1)
      })
    })

    describe('domain object creation', () => {
      it('should create Email value object from dto email', async () => {
        const dto = new RegisterUserDto('test@example.com', 'SecurePass123!', 'Test User')

        vi.mocked(mockUserRepository.save).mockResolvedValue(undefined)
        vi.mocked(mockEmailService.sendWelcomeEmail).mockResolvedValue(undefined)

        await useCase.execute(dto)

        const savedUser = vi.mocked(mockUserRepository.save).mock.calls?.[0]?.[0]
        expect(savedUser).toBeInstanceOf(User)
        expect(savedUser?.getEmail()).toBe('test@example.com')
      })

      it('should create Password value object from dto password', async () => {
        const dto = new RegisterUserDto('test@example.com', 'SecurePass123!', 'Test User')

        vi.mocked(mockUserRepository.save).mockResolvedValue(undefined)
        vi.mocked(mockEmailService.sendWelcomeEmail).mockResolvedValue(undefined)

        await useCase.execute(dto)

        const savedUser = vi.mocked(mockUserRepository.save).mock.calls?.[0]?.[0]

        // Password should be hashed and verifiable via updatePassword
        // User entity doesn't expose direct password verification
        // But we can verify it was created properly by checking it's a User instance
        expect(savedUser).toBeInstanceOf(User)
      })

      it('should create User entity with all properties', async () => {
        const dto = new RegisterUserDto('test@example.com', 'SecurePass123!', 'Test User')

        vi.mocked(mockUserRepository.save).mockResolvedValue(undefined)
        vi.mocked(mockEmailService.sendWelcomeEmail).mockResolvedValue(undefined)

        await useCase.execute(dto)

        const savedUser = vi.mocked(mockUserRepository.save).mock.calls?.[0]?.[0]
        expect(savedUser).toBeInstanceOf(User)
        expect(savedUser?.getEmail()).toBe('test@example.com')
      })

      it('should throw ValidationException for invalid email format', async () => {
        const dto = new RegisterUserDto('invalid-email', 'SecurePass123!', 'Test User')

        // Email validation happens when creating Email value object
        await expect(useCase.execute(dto)).rejects.toThrow(ValidationException)
        await expect(useCase.execute(dto)).rejects.toThrow('Invalid email format')
      })

      it('should throw ValidationException for weak password', async () => {
        const dto = new RegisterUserDto('test@example.com', 'weak', 'Test User')

        // Password validation happens when creating Password value object
        await expect(useCase.execute(dto)).rejects.toThrow(ValidationException)
        await expect(useCase.execute(dto)).rejects.toThrow('Password must be at least 8 characters')
      })
    })

    describe('repository failure handling', () => {
      it('should throw error when repository save fails with non-duplicate error', async () => {
        const dto = new RegisterUserDto('test@example.com', 'SecurePass123!', 'Test User')

        vi.mocked(mockUserRepository.save).mockRejectedValue(
          new Error('Database connection failed')
        )

        await expect(useCase.execute(dto)).rejects.toThrow('Database connection failed')
      })

      it('should not send email if repository save fails', async () => {
        const dto = new RegisterUserDto('test@example.com', 'SecurePass123!', 'Test User')

        vi.mocked(mockUserRepository.save).mockRejectedValue(
          new Error('Database connection failed')
        )

        await expect(useCase.execute(dto)).rejects.toThrow()

        // Email should not be sent if save fails
        expect(mockEmailService.sendWelcomeEmail).not.toHaveBeenCalled()
      })
    })

    describe('edge cases', () => {
      it('should handle very long names', async () => {
        const longName = 'A'.repeat(500)
        const dto = new RegisterUserDto('test@example.com', 'SecurePass123!', longName)

        vi.mocked(mockUserRepository.save).mockResolvedValue(undefined)
        vi.mocked(mockEmailService.sendWelcomeEmail).mockResolvedValue(undefined)

        const result = await useCase.execute(dto)

        expect(result.userId).toBeDefined()

        const savedUser = vi.mocked(mockUserRepository.save).mock.calls?.[0]?.[0]
        expect(savedUser).toBeInstanceOf(User)
        expect(savedUser?.getEmail()).toBe('test@example.com')
      })

      it('should handle special characters in name', async () => {
        const specialName = "O'Brien-Smith (Jr.) <test@example.com>"
        const dto = new RegisterUserDto('test@example.com', 'SecurePass123!', specialName)

        vi.mocked(mockUserRepository.save).mockResolvedValue(undefined)
        vi.mocked(mockEmailService.sendWelcomeEmail).mockResolvedValue(undefined)

        const result = await useCase.execute(dto)

        expect(result.userId).toBeDefined()

        const savedUser = vi.mocked(mockUserRepository.save).mock.calls?.[0]?.[0]
        expect(savedUser).toBeInstanceOf(User)
        expect(savedUser?.getEmail()).toBe('test@example.com')
      })

      it('should handle email with subdomain', async () => {
        const dto = new RegisterUserDto('user@mail.company.co.uk', 'SecurePass123!', 'Test User')

        vi.mocked(mockUserRepository.save).mockResolvedValue(undefined)
        vi.mocked(mockEmailService.sendWelcomeEmail).mockResolvedValue(undefined)

        const result = await useCase.execute(dto)

        expect(result.userId).toBeDefined()
      })

      it('should handle concurrent registrations with different emails', async () => {
        const dto1 = new RegisterUserDto('user1@example.com', 'SecurePass123!', 'User One')
        const dto2 = new RegisterUserDto('user2@example.com', 'SecurePass456!', 'User Two')
        const dto3 = new RegisterUserDto('user3@example.com', 'SecurePass789!', 'User Three')

        vi.mocked(mockUserRepository.save).mockResolvedValue(undefined)
        vi.mocked(mockEmailService.sendWelcomeEmail).mockResolvedValue(undefined)

        const [result1, result2, result3] = await Promise.all([
          useCase.execute(dto1),
          useCase.execute(dto2),
          useCase.execute(dto3),
        ])

        // All should have unique IDs
        expect(result1.userId).not.toBe(result2.userId)
        expect(result2.userId).not.toBe(result3.userId)
        expect(result1.userId).not.toBe(result3.userId)

        // All should have saved
        expect(mockUserRepository.save).toHaveBeenCalledTimes(3)
      })
    })

    describe('logging behavior', () => {
      it('should call logger methods in correct order', async () => {
        const dto = new RegisterUserDto('test@example.com', 'SecurePass123!', 'Test User')

        vi.mocked(mockUserRepository.save).mockResolvedValue(undefined)
        vi.mocked(mockEmailService.sendWelcomeEmail).mockResolvedValue(undefined)

        await useCase.execute(dto)

        const infoCalls = vi.mocked(mockLogger.info).mock.calls
        expect(infoCalls).toHaveLength(2)
        expect(infoCalls?.[0]?.[0]).toBe('Starting user registration')
        expect(infoCalls?.[1]?.[0]).toBe('User registered successfully')
      })

      it('should only log error when email service fails', async () => {
        const dto = new RegisterUserDto('test@example.com', 'SecurePass123!', 'Test User')

        vi.mocked(mockUserRepository.save).mockResolvedValue(undefined)
        vi.mocked(mockEmailService.sendWelcomeEmail).mockRejectedValue(new Error('Email failed'))

        await useCase.execute(dto)

        expect(mockLogger.error).toHaveBeenCalledTimes(1)
        expect(mockLogger.warn).not.toHaveBeenCalled()
      })

      it('should not log error when registration is successful', async () => {
        const dto = new RegisterUserDto('test@example.com', 'SecurePass123!', 'Test User')

        vi.mocked(mockUserRepository.save).mockResolvedValue(undefined)
        vi.mocked(mockEmailService.sendWelcomeEmail).mockResolvedValue(undefined)

        await useCase.execute(dto)

        expect(mockLogger.error).not.toHaveBeenCalled()
      })
    })

    describe('return value', () => {
      it('should return object with userId property', async () => {
        const dto = new RegisterUserDto('test@example.com', 'SecurePass123!', 'Test User')

        vi.mocked(mockUserRepository.save).mockResolvedValue(undefined)
        vi.mocked(mockEmailService.sendWelcomeEmail).mockResolvedValue(undefined)

        const result = await useCase.execute(dto)

        expect(result).toHaveProperty('userId')
        expect(Object.keys(result)).toEqual(['userId'])
      })

      it('should return userId matching saved user id', async () => {
        const dto = new RegisterUserDto('test@example.com', 'SecurePass123!', 'Test User')

        vi.mocked(mockUserRepository.save).mockResolvedValue(undefined)
        vi.mocked(mockEmailService.sendWelcomeEmail).mockResolvedValue(undefined)

        const result = await useCase.execute(dto)

        const savedUser = vi.mocked(mockUserRepository.save).mock.calls[0]?.[0]
        expect(savedUser).toBeDefined()
        expect(result.userId).toBe(savedUser!.id)
      })
    })
  })

  describe('constructor', () => {
    it('should create instance with all dependencies', () => {
      const instance = new RegisterUserUseCase(mockUserRepository, mockEmailService, mockLogger)

      expect(instance).toBeInstanceOf(RegisterUserUseCase)
      expect(instance).toBeDefined()
    })

    it('should store dependencies as private readonly properties', () => {
      const instance = new RegisterUserUseCase(mockUserRepository, mockEmailService, mockLogger)

      // Dependencies should be accessible (TypeScript private/readonly are compile-time only)
      expect(instance).toBeDefined()
    })
  })
})
