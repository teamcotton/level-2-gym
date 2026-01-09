import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RegisterUserDto } from '../../../src/application/dtos/register-user.dto.js'
import type { AuditLogPort } from '../../../src/application/ports/audit-log.port.js'
import type { EmailServicePort } from '../../../src/application/ports/email.service.port.js'
import type { LoggerPort } from '../../../src/application/ports/logger.port.js'
import type { TokenGeneratorPort } from '../../../src/application/ports/token-generator.port.js'
import type { UserRepositoryPort } from '../../../src/application/ports/user.repository.port.js'
import { RegisterUserWithProviderUseCase } from '../../../src/application/use-cases/register-user-with-provider.use-case.js'
import { AuditAction, EntityType } from '../../../src/domain/audit/entity-type.enum.js'
import { User } from '../../../src/domain/entities/user.js'
import { UserId, type UserIdType } from '../../../src/domain/value-objects/userID.js'
import { ConflictException } from '../../../src/shared/exceptions/conflict.exception.js'
import { ValidationException } from '../../../src/shared/exceptions/validation.exception.js'

// Helper function to create mock UserIdType from UUID string
function createMockUserId(uuid?: string): UserIdType {
  return new UserId(uuid || uuidv7()).getValue()
}

describe('RegisterUserWithProviderUseCase', () => {
  let useCase: RegisterUserWithProviderUseCase
  let mockUserRepository: UserRepositoryPort
  let mockEmailService: EmailServicePort
  let mockLogger: LoggerPort
  let mockTokenGenerator: TokenGeneratorPort
  let mockAuditLog: AuditLogPort
  const auditContext = { ipAddress: '127.0.0.1', userAgent: 'test-agent' }

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks()

    // Create mock implementations
    mockUserRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByEmail: vi.fn(),
      findAll: vi.fn(),
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

    mockTokenGenerator = {
      generateToken: vi.fn().mockReturnValue('mock-jwt-token'),
    }

    mockAuditLog = {
      log: vi.fn().mockResolvedValue(undefined),
      getByEntity: vi.fn(),
      getByUser: vi.fn(),
      getByAction: vi.fn(),
    }

    // Create use case instance with mocks
    useCase = new RegisterUserWithProviderUseCase(
      mockUserRepository,
      mockEmailService,
      mockLogger,
      mockTokenGenerator,
      mockAuditLog
    )
  })

  describe('execute()', () => {
    describe('successful registration with OAuth provider', () => {
      it('should register a new user with provider successfully', async () => {
        const dto = new RegisterUserDto('john@example.com', 'John Doe', 'user', undefined, 'google')

        vi.mocked(mockUserRepository.save).mockResolvedValue(createMockUserId())
        vi.mocked(mockEmailService.sendWelcomeEmail).mockResolvedValue(undefined)

        const result = await useCase.execute(dto, auditContext)

        // Should return a user ID
        expect(result).toBeDefined()
        expect(result.userId).toBeDefined()
        expect(typeof result.userId).toBe('string')
        expect(result.userId).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        )
      })

      it('should log successful registration to audit log', async () => {
        const dto = new RegisterUserDto('john@example.com', 'John Doe', 'user', undefined, 'google')
        const mockUserId = createMockUserId()

        vi.mocked(mockUserRepository.save).mockResolvedValue(mockUserId)
        vi.mocked(mockEmailService.sendWelcomeEmail).mockResolvedValue(undefined)

        await useCase.execute(dto, auditContext)

        expect(mockAuditLog.log).toHaveBeenCalledTimes(1)
        expect(mockAuditLog.log).toHaveBeenCalledWith({
          userId: mockUserId,
          entityType: EntityType.USER,
          entityId: mockUserId,
          action: AuditAction.CREATE,
          changes: { reason: 'new_user' },
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
        })
      })

      it('should return an access token', async () => {
        const dto = new RegisterUserDto('john@example.com', 'John Doe', 'user', undefined, 'google')

        vi.mocked(mockUserRepository.save).mockResolvedValue(createMockUserId())
        vi.mocked(mockEmailService.sendWelcomeEmail).mockResolvedValue(undefined)

        const result = await useCase.execute(dto, auditContext)

        expect(result.access_token).toBe('mock-jwt-token')
        expect(result.token_type).toBe('Bearer')
        expect(result.expires_in).toBe(3600)
      })

      it('should save the user to the repository without password', async () => {
        const dto = new RegisterUserDto('john@example.com', 'John Doe', 'user', undefined, 'google')

        vi.mocked(mockUserRepository.save).mockResolvedValue(createMockUserId())
        vi.mocked(mockEmailService.sendWelcomeEmail).mockResolvedValue(undefined)

        await useCase.execute(dto, auditContext)

        expect(mockUserRepository.save).toHaveBeenCalledTimes(1)

        const savedUser = vi.mocked(mockUserRepository.save).mock.calls?.[0]?.[0]
        expect(savedUser).toBeInstanceOf(User)
        expect(savedUser?.getEmail()).toBe('john@example.com')
        expect(savedUser?.getName()).toBe('John Doe')
        expect(savedUser?.getRole()).toBe('user')
        expect(savedUser?.getProvider()).toBe('google')
        expect(savedUser?.getPassword()).toBeUndefined()
      })

      it('should send a welcome email to the user', async () => {
        const dto = new RegisterUserDto('john@example.com', 'John Doe', 'user', undefined, 'google')

        vi.mocked(mockUserRepository.save).mockResolvedValue(createMockUserId())
        vi.mocked(mockEmailService.sendWelcomeEmail).mockResolvedValue(undefined)

        await useCase.execute(dto, auditContext)

        expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledTimes(1)
        expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledWith(
          'john@example.com',
          'John Doe'
        )
      })

      it('should log registration start with email', async () => {
        const dto = new RegisterUserDto('john@example.com', 'John Doe', 'user', undefined, 'google')

        vi.mocked(mockUserRepository.save).mockResolvedValue(createMockUserId())
        vi.mocked(mockEmailService.sendWelcomeEmail).mockResolvedValue(undefined)

        await useCase.execute(dto, auditContext)

        expect(mockLogger.info).toHaveBeenCalledWith('Starting user registration', {
          email: 'john@example.com',
        })
      })

      it('should log successful registration with userId', async () => {
        const dto = new RegisterUserDto('john@example.com', 'John Doe', 'user', undefined, 'google')

        vi.mocked(mockUserRepository.save).mockResolvedValue(createMockUserId())
        vi.mocked(mockEmailService.sendWelcomeEmail).mockResolvedValue(undefined)

        const result = await useCase.execute(dto, auditContext)

        expect(mockLogger.info).toHaveBeenCalledWith('User registered successfully', {
          userId: result.userId,
        })
      })

      it('should generate JWT token with correct payload', async () => {
        const dto = new RegisterUserDto('john@example.com', 'John Doe', 'user', undefined, 'google')

        const mockUserId = createMockUserId()
        vi.mocked(mockUserRepository.save).mockResolvedValue(mockUserId)
        vi.mocked(mockEmailService.sendWelcomeEmail).mockResolvedValue(undefined)

        await useCase.execute(dto, auditContext)

        expect(mockTokenGenerator.generateToken).toHaveBeenCalledTimes(1)
        expect(mockTokenGenerator.generateToken).toHaveBeenCalledWith({
          sub: mockUserId,
          email: 'john@example.com',
          roles: ['user'],
        })
      })

      it('should create unique user IDs for different registrations', async () => {
        const dto1 = new RegisterUserDto(
          'john@example.com',
          'John Doe',
          'user',
          undefined,
          'google'
        )
        const dto2 = new RegisterUserDto(
          'jane@example.com',
          'Jane Smith',
          'user',
          undefined,
          'github'
        )

        vi.mocked(mockUserRepository.save).mockImplementation(() =>
          Promise.resolve(createMockUserId())
        )
        vi.mocked(mockEmailService.sendWelcomeEmail).mockResolvedValue(undefined)

        const result1 = await useCase.execute(dto1, auditContext)
        const result2 = await useCase.execute(dto2, auditContext)

        expect(result1.userId).not.toBe(result2.userId)
      })

      it('should handle different OAuth providers', async () => {
        const providers = ['google', 'github', 'facebook']

        for (const provider of providers) {
          const dto = new RegisterUserDto(
            'user@example.com',
            'User Name',
            'user',
            undefined,
            provider
          )

          vi.mocked(mockUserRepository.save).mockResolvedValue(createMockUserId())
          vi.mocked(mockEmailService.sendWelcomeEmail).mockResolvedValue(undefined)

          await useCase.execute(dto, auditContext)

          const savedUser = vi.mocked(mockUserRepository.save).mock.calls?.[
            vi.mocked(mockUserRepository.save).mock.calls.length - 1
          ]?.[0]
          expect(savedUser?.getProvider()).toBe(provider)
        }
      })
    })

    describe('duplicate email handling', () => {
      it('should throw ConflictException when database rejects duplicate email', async () => {
        const dto = new RegisterUserDto(
          'existing@example.com',
          'John Doe',
          'user',
          undefined,
          'google'
        )

        // Simulate PostgreSQL unique constraint violation error (code 23505)
        const duplicateKeyError = Object.assign(
          new Error('duplicate key value violates unique constraint'),
          {
            code: '23505',
          }
        )
        vi.mocked(mockUserRepository.save).mockRejectedValue(duplicateKeyError)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(ConflictException)
        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(
          'User with this email already exists'
        )
      })

      it('should not send welcome email when duplicate email is detected', async () => {
        const dto = new RegisterUserDto(
          'existing@example.com',
          'John Doe',
          'user',
          undefined,
          'google'
        )

        const duplicateKeyError = Object.assign(
          new Error('duplicate key value violates unique constraint'),
          {
            code: '23505',
          }
        )
        vi.mocked(mockUserRepository.save).mockRejectedValue(duplicateKeyError)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(ConflictException)

        expect(mockEmailService.sendWelcomeEmail).not.toHaveBeenCalled()
      })

      it('should log duplicate email failure to audit log', async () => {
        const dto = new RegisterUserDto(
          'duplicate@example.com',
          'Test User',
          'user',
          undefined,
          'google'
        )

        const duplicateKeyError = Object.assign(
          new Error('duplicate key value violates unique constraint'),
          {
            code: '23505',
          }
        )
        vi.mocked(mockUserRepository.save).mockRejectedValue(duplicateKeyError)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(ConflictException)

        expect(mockAuditLog.log).toHaveBeenCalledTimes(1)
        expect(mockAuditLog.log).toHaveBeenCalledWith({
          userId: null,
          entityType: EntityType.USER,
          entityId: expect.any(String),
          action: AuditAction.REGISTRATION_FAILED,
          changes: { reason: 'duplicate_email' },
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
        })
      })

      it('should log error when duplicate email is detected', async () => {
        const dto = new RegisterUserDto(
          'existing@example.com',
          'John Doe',
          'user',
          undefined,
          'google'
        )

        const duplicateKeyError = Object.assign(
          new Error('duplicate key value violates unique constraint'),
          {
            code: '23505',
          }
        )
        vi.mocked(mockUserRepository.save).mockRejectedValue(duplicateKeyError)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(ConflictException)

        expect(mockLogger.error).toHaveBeenCalledWith('Failed to save user', duplicateKeyError, {
          email: 'existing@example.com',
        })
      })
    })

    describe('email service failure handling', () => {
      it('should complete registration even if welcome email fails', async () => {
        const dto = new RegisterUserDto('john@example.com', 'John Doe', 'user', undefined, 'google')

        vi.mocked(mockUserRepository.save).mockResolvedValue(createMockUserId())
        vi.mocked(mockEmailService.sendWelcomeEmail).mockRejectedValue(new Error('SMTP error'))

        const result = await useCase.execute(dto, auditContext)

        expect(result).toBeDefined()
        expect(result.userId).toBeDefined()
        expect(result.access_token).toBe('mock-jwt-token')
      })

      it('should log error when email fails but not throw', async () => {
        const dto = new RegisterUserDto('john@example.com', 'John Doe', 'user', undefined, 'google')

        const mockUserId = createMockUserId()
        vi.mocked(mockUserRepository.save).mockResolvedValue(mockUserId)

        const emailError = new Error('SMTP connection failed')
        vi.mocked(mockEmailService.sendWelcomeEmail).mockRejectedValue(emailError)

        await useCase.execute(dto, auditContext)

        expect(mockLogger.error).toHaveBeenCalledWith('Failed to send welcome email', emailError, {
          userId: mockUserId,
          email: 'john@example.com',
        })
      })
    })

    describe('database error handling', () => {
      it('should throw original error when save fails with non-duplicate error', async () => {
        const dto = new RegisterUserDto('john@example.com', 'John Doe', 'user', undefined, 'google')

        const dbError = new Error('Connection timeout')
        vi.mocked(mockUserRepository.save).mockRejectedValue(dbError)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow('Connection timeout')
        expect(mockLogger.error).toHaveBeenCalledWith('Failed to save user', dbError, {
          email: 'john@example.com',
        })
      })

      it('should not send email when repository save fails', async () => {
        const dto = new RegisterUserDto('john@example.com', 'John Doe', 'user', undefined, 'google')

        vi.mocked(mockUserRepository.save).mockRejectedValue(new Error('Database error'))

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow()
        expect(mockEmailService.sendWelcomeEmail).not.toHaveBeenCalled()
      })

      it('should not log to audit log when repository save fails with non-duplicate error', async () => {
        const dto = new RegisterUserDto(
          'test@example.com',
          'Test User',
          'user',
          undefined,
          'google'
        )

        vi.mocked(mockUserRepository.save).mockRejectedValue(
          new Error('Database connection failed')
        )

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow()

        // Audit log should not be called for general database errors
        expect(mockAuditLog.log).not.toHaveBeenCalled()
      })
    })

    describe('role handling', () => {
      it('should register user with default user role', async () => {
        const dto = new RegisterUserDto('john@example.com', 'John Doe', 'user', undefined, 'google')

        vi.mocked(mockUserRepository.save).mockResolvedValue(createMockUserId())
        vi.mocked(mockEmailService.sendWelcomeEmail).mockResolvedValue(undefined)

        await useCase.execute(dto, auditContext)

        const savedUser = vi.mocked(mockUserRepository.save).mock.calls?.[0]?.[0]
        expect(savedUser?.getRole()).toBe('user')
      })

      it('should register user with admin role', async () => {
        const dto = new RegisterUserDto(
          'admin@example.com',
          'Admin User',
          'admin',
          undefined,
          'google'
        )

        vi.mocked(mockUserRepository.save).mockResolvedValue(createMockUserId())
        vi.mocked(mockEmailService.sendWelcomeEmail).mockResolvedValue(undefined)

        await useCase.execute(dto, auditContext)

        const savedUser = vi.mocked(mockUserRepository.save).mock.calls?.[0]?.[0]
        expect(savedUser?.getRole()).toBe('admin')
      })
    })

    describe('email validation', () => {
      it('should throw ValidationException for invalid email format', async () => {
        const dto = new RegisterUserDto('invalid-email', 'John Doe', 'user', undefined, 'google')

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(ValidationException)
      })

      it('should accept valid email formats', async () => {
        const validEmails = [
          'user@example.com',
          'user.name@example.com',
          'user+tag@example.co.uk',
          'user_name@subdomain.example.com',
        ]

        vi.mocked(mockUserRepository.save).mockResolvedValue(createMockUserId())
        vi.mocked(mockEmailService.sendWelcomeEmail).mockResolvedValue(undefined)

        for (const email of validEmails) {
          const dto = new RegisterUserDto(email, 'Test User', 'user', undefined, 'google')
          await expect(useCase.execute(dto, auditContext)).resolves.toBeDefined()
        }
      })
    })

    describe('provider validation', () => {
      it('should require provider when no password is provided', () => {
        expect(() => {
          RegisterUserDto.validate({
            email: 'john@example.com',
            name: 'John Doe',
            role: 'user',
          })
        }).toThrow(ValidationException)
      })

      it('should accept various provider names', async () => {
        const providers = ['google', 'github', 'facebook', 'microsoft', 'apple']

        vi.mocked(mockUserRepository.save).mockResolvedValue(createMockUserId())
        vi.mocked(mockEmailService.sendWelcomeEmail).mockResolvedValue(undefined)

        for (const provider of providers) {
          const dto = new RegisterUserDto('user@example.com', 'User', 'user', undefined, provider)
          await expect(useCase.execute(dto, auditContext)).resolves.toBeDefined()
        }
      })
    })
  })
})
