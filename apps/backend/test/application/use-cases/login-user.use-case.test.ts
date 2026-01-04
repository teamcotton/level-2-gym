import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LoginUserDto } from '../../../src/application/dtos/login-user.dto.js'
import type { AuditLogPort } from '../../../src/application/ports/audit-log.port.js'
import type { LoggerPort } from '../../../src/application/ports/logger.port.js'
import type { TokenGeneratorPort } from '../../../src/application/ports/token-generator.port.js'
import type { UserRepositoryPort } from '../../../src/application/ports/user.repository.port.js'
import { LoginUserUseCase } from '../../../src/application/use-cases/login-user.use-case.js'
import { User } from '../../../src/domain/entities/user.js'
import { Email } from '../../../src/domain/value-objects/email.js'
import { Password } from '../../../src/domain/value-objects/password.js'
import { Role } from '../../../src/domain/value-objects/role.js'
import { UserId } from '../../../src/domain/value-objects/userID.js'
import { UnauthorizedException } from '../../../src/shared/exceptions/unauthorized.exception.js'

describe('LoginUserUseCase', () => {
  let useCase: LoginUserUseCase
  let mockUserRepository: UserRepositoryPort
  let mockLogger: LoggerPort
  let mockTokenGenerator: TokenGeneratorPort
  let mockAuditLog: AuditLogPort

  // Standard audit context for tests
  const auditContext = {
    ipAddress: '127.0.0.1',
    userAgent: 'test-user-agent',
  }

  // Helper function to create a mock user
  const createMockUser = async (
    email: string,
    password: string,
    role: string = 'user',
    name: string = 'Test User'
  ): Promise<User> => {
    const userId = new UserId(uuidv7()).getValue()
    return new User(userId, new Email(email), await Password.create(password), name, new Role(role))
  }

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
    useCase = new LoginUserUseCase(mockUserRepository, mockLogger, mockTokenGenerator, mockAuditLog)
  })

  describe('execute()', () => {
    describe('successful login', () => {
      it('should login user successfully with valid credentials', async () => {
        const dto = new LoginUserDto('john@example.com', 'SecurePass123!')
        const mockUser = await createMockUser('john@example.com', 'SecurePass123!')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)

        const result = await useCase.execute(dto, auditContext)

        expect(result).toBeDefined()
        expect(result.userId).toBe(mockUser.id)
        expect(result.email).toBe('john@example.com')
        expect(result.access_token).toBe('mock-jwt-token')
        expect(result.roles).toEqual(['user'])
      })

      it('should find user by email', async () => {
        const dto = new LoginUserDto('john@example.com', 'SecurePass123!')
        const mockUser = await createMockUser('john@example.com', 'SecurePass123!')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)

        await useCase.execute(dto, auditContext)

        expect(mockUserRepository.findByEmail).toHaveBeenCalledTimes(1)
        expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('john@example.com')
      })

      it('should verify password correctly', async () => {
        const dto = new LoginUserDto('john@example.com', 'SecurePass123!')
        const mockUser = await createMockUser('john@example.com', 'SecurePass123!')

        // Spy on verifyPassword method
        const verifyPasswordSpy = vi.spyOn(mockUser, 'verifyPassword')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)

        await useCase.execute(dto, auditContext)

        expect(verifyPasswordSpy).toHaveBeenCalledTimes(1)
        expect(verifyPasswordSpy).toHaveBeenCalledWith('SecurePass123!')
      })

      it('should generate JWT token with correct payload', async () => {
        const dto = new LoginUserDto('john@example.com', 'SecurePass123!')
        const mockUser = await createMockUser('john@example.com', 'SecurePass123!', 'admin')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)

        await useCase.execute(dto, auditContext)

        expect(mockTokenGenerator.generateToken).toHaveBeenCalledTimes(1)
        expect(mockTokenGenerator.generateToken).toHaveBeenCalledWith({
          sub: mockUser.id,
          email: 'john@example.com',
          roles: ['admin'],
        })
      })

      it('should log login attempt with email', async () => {
        const dto = new LoginUserDto('john@example.com', 'SecurePass123!')
        const mockUser = await createMockUser('john@example.com', 'SecurePass123!')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)

        await useCase.execute(dto, auditContext)

        expect(mockLogger.info).toHaveBeenCalledWith('User login attempt', {
          email: 'john@example.com',
        })
      })

      it('should log successful login with userId and email', async () => {
        const dto = new LoginUserDto('john@example.com', 'SecurePass123!')
        const mockUser = await createMockUser('john@example.com', 'SecurePass123!')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)

        await useCase.execute(dto, auditContext)

        expect(mockLogger.info).toHaveBeenCalledWith('User logged in successfully', {
          userId: mockUser.id,
          email: 'john@example.com',
        })
      })

      it('should handle admin role correctly', async () => {
        const dto = new LoginUserDto('admin@example.com', 'AdminPass123!')
        const mockUser = await createMockUser('admin@example.com', 'AdminPass123!', 'admin')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)

        const result = await useCase.execute(dto, auditContext)

        expect(result.roles).toEqual(['admin'])
        expect(mockTokenGenerator.generateToken).toHaveBeenCalledWith(
          expect.objectContaining({
            roles: ['admin'],
          })
        )
      })

      it('should return access token in response', async () => {
        const dto = new LoginUserDto('john@example.com', 'SecurePass123!')
        const mockUser = await createMockUser('john@example.com', 'SecurePass123!')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)
        vi.mocked(mockTokenGenerator.generateToken).mockReturnValue('custom-jwt-token-12345')

        const result = await useCase.execute(dto, auditContext)

        expect(result.access_token).toBe('custom-jwt-token-12345')
      })
    })

    describe('user not found', () => {
      it('should throw UnauthorizedException when user does not exist', async () => {
        const dto = new LoginUserDto('nonexistent@example.com', 'Password123!')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(UnauthorizedException)
        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(
          'Invalid email or password'
        )
      })

      it('should log warning when user is not found', async () => {
        const dto = new LoginUserDto('nonexistent@example.com', 'Password123!')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(UnauthorizedException)

        expect(mockLogger.warn).toHaveBeenCalledWith('Login failed: User not found', {
          email: 'nonexistent@example.com',
        })
      })

      it('should not call token generator when user is not found', async () => {
        const dto = new LoginUserDto('nonexistent@example.com', 'Password123!')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(UnauthorizedException)

        expect(mockTokenGenerator.generateToken).not.toHaveBeenCalled()
      })

      it('should not log successful login when user is not found', async () => {
        const dto = new LoginUserDto('nonexistent@example.com', 'Password123!')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(UnauthorizedException)

        expect(mockLogger.info).toHaveBeenCalledTimes(1) // Only login attempt
        expect(mockLogger.info).not.toHaveBeenCalledWith(
          'User logged in successfully',
          expect.any(Object)
        )
      })

      it('should use generic error message to prevent user enumeration', async () => {
        const dto = new LoginUserDto('nonexistent@example.com', 'Password123!')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(
          'Invalid email or password'
        )
      })
    })

    describe('invalid password', () => {
      it('should throw UnauthorizedException when password is incorrect', async () => {
        const dto = new LoginUserDto('john@example.com', 'WrongPassword123!')
        const mockUser = await createMockUser('john@example.com', 'CorrectPassword123!')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(UnauthorizedException)
        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(
          'Invalid email or password'
        )
      })

      it('should log warning when password is invalid', async () => {
        const dto = new LoginUserDto('john@example.com', 'WrongPassword123!')
        const mockUser = await createMockUser('john@example.com', 'CorrectPassword123!')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(UnauthorizedException)

        expect(mockLogger.warn).toHaveBeenCalledWith('Login failed: Invalid password', {
          email: 'john@example.com',
          userId: mockUser.id,
        })
      })

      it('should not call token generator when password is invalid', async () => {
        const dto = new LoginUserDto('john@example.com', 'WrongPassword123!')
        const mockUser = await createMockUser('john@example.com', 'CorrectPassword123!')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(UnauthorizedException)

        expect(mockTokenGenerator.generateToken).not.toHaveBeenCalled()
      })

      it('should not log successful login when password is invalid', async () => {
        const dto = new LoginUserDto('john@example.com', 'WrongPassword123!')
        const mockUser = await createMockUser('john@example.com', 'CorrectPassword123!')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(UnauthorizedException)

        expect(mockLogger.info).toHaveBeenCalledTimes(1) // Only login attempt
        expect(mockLogger.info).not.toHaveBeenCalledWith(
          'User logged in successfully',
          expect.any(Object)
        )
      })

      it('should use generic error message to prevent password guessing', async () => {
        const dto = new LoginUserDto('john@example.com', 'WrongPassword123!')
        const mockUser = await createMockUser('john@example.com', 'CorrectPassword123!')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(
          'Invalid email or password'
        )
      })
    })

    describe('edge cases', () => {
      it('should handle repository errors gracefully', async () => {
        const dto = new LoginUserDto('john@example.com', 'SecurePass123!')

        const dbError = new Error('Database connection failed')
        vi.mocked(mockUserRepository.findByEmail).mockRejectedValue(dbError)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(
          'Database connection failed'
        )
      })

      it('should handle email with different casing', async () => {
        const dto = new LoginUserDto('JOHN@EXAMPLE.COM', 'SecurePass123!')
        const mockUser = await createMockUser('john@example.com', 'SecurePass123!')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)

        const result = await useCase.execute(dto, auditContext)

        expect(result).toBeDefined()
        expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('JOHN@EXAMPLE.COM')
      })

      it('should handle password verification failure', async () => {
        const dto = new LoginUserDto('john@example.com', 'SecurePass123!')
        const mockUser = await createMockUser('john@example.com', 'DifferentPass456!')

        // Mock verifyPassword to return false
        vi.spyOn(mockUser, 'verifyPassword').mockResolvedValue(false)

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(UnauthorizedException)
      })

      it('should generate unique tokens for different users', async () => {
        const dto1 = new LoginUserDto('user1@example.com', 'Pass123!')
        const dto2 = new LoginUserDto('user2@example.com', 'Pass456!')

        const mockUser1 = await createMockUser('user1@example.com', 'Pass123!')
        const mockUser2 = await createMockUser('user2@example.com', 'Pass456!')

        vi.mocked(mockUserRepository.findByEmail)
          .mockResolvedValueOnce(mockUser1)
          .mockResolvedValueOnce(mockUser2)

        vi.mocked(mockTokenGenerator.generateToken)
          .mockReturnValueOnce('token-for-user1')
          .mockReturnValueOnce('token-for-user2')

        const result1 = await useCase.execute(dto1, auditContext)
        const result2 = await useCase.execute(dto2, auditContext)

        expect(result1.access_token).toBe('token-for-user1')
        expect(result2.access_token).toBe('token-for-user2')
        expect(result1.userId).not.toBe(result2.userId)
      })
    })

    describe('security considerations', () => {
      it('should not expose user existence through different error messages', async () => {
        const dtoNonExistent = new LoginUserDto('nonexistent@example.com', 'Password123!')
        const dtoWrongPassword = new LoginUserDto('john@example.com', 'WrongPassword!')

        const mockUser = await createMockUser('john@example.com', 'CorrectPassword123!')

        vi.mocked(mockUserRepository.findByEmail)
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(mockUser)

        let errorMessage1: string = ''
        let errorMessage2: string = ''

        try {
          await useCase.execute(dtoNonExistent, auditContext)
        } catch (error: any) {
          errorMessage1 = error.message
        }

        try {
          await useCase.execute(dtoWrongPassword, auditContext)
        } catch (error: any) {
          errorMessage2 = error.message
        }

        // Both errors should have the same generic message
        expect(errorMessage1).toBe('Invalid email or password')
        expect(errorMessage2).toBe('Invalid email or password')
      })

      it('should not leak user information in successful login response', async () => {
        const dto = new LoginUserDto('john@example.com', 'SecurePass123!')
        const mockUser = await createMockUser('john@example.com', 'SecurePass123!')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)

        const result = await useCase.execute(dto, auditContext)

        // Should not expose sensitive data like password hash
        expect(result).not.toHaveProperty('password')
        expect(result).not.toHaveProperty('passwordHash')

        // Should only expose necessary fields
        expect(Object.keys(result).sort()).toEqual(['access_token', 'email', 'roles', 'userId'])
      })

      it('should log sensitive operations for security audit', async () => {
        const dto = new LoginUserDto('john@example.com', 'SecurePass123!')
        const mockUser = await createMockUser('john@example.com', 'SecurePass123!')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)

        await useCase.execute(dto, auditContext)

        // Verify security audit logs are created
        expect(mockLogger.info).toHaveBeenCalledWith(
          'User login attempt',
          expect.objectContaining({ email: 'john@example.com' })
        )
        expect(mockLogger.info).toHaveBeenCalledWith(
          'User logged in successfully',
          expect.objectContaining({ userId: mockUser.id })
        )
      })

      it('should log failed login attempts for security monitoring', async () => {
        const dto = new LoginUserDto('attacker@example.com', 'GuessedPassword!')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(UnauthorizedException)

        expect(mockLogger.warn).toHaveBeenCalledWith('Login failed: User not found', {
          email: 'attacker@example.com',
        })
      })
    })

    describe('token generation', () => {
      it('should include user ID in token payload', async () => {
        const dto = new LoginUserDto('john@example.com', 'SecurePass123!')
        const mockUser = await createMockUser('john@example.com', 'SecurePass123!')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)

        await useCase.execute(dto, auditContext)

        expect(mockTokenGenerator.generateToken).toHaveBeenCalledWith(
          expect.objectContaining({
            sub: mockUser.id,
          })
        )
      })

      it('should include email in token payload', async () => {
        const dto = new LoginUserDto('john@example.com', 'SecurePass123!')
        const mockUser = await createMockUser('john@example.com', 'SecurePass123!')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)

        await useCase.execute(dto, auditContext)

        expect(mockTokenGenerator.generateToken).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'john@example.com',
          })
        )
      })

      it('should include roles in token payload', async () => {
        const dto = new LoginUserDto('admin@example.com', 'AdminPass123!')
        const mockUser = await createMockUser('admin@example.com', 'AdminPass123!', 'admin')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)

        await useCase.execute(dto, auditContext)

        expect(mockTokenGenerator.generateToken).toHaveBeenCalledWith(
          expect.objectContaining({
            roles: ['admin'],
          })
        )
      })

      it('should handle token generation failure', async () => {
        const dto = new LoginUserDto('john@example.com', 'SecurePass123!')
        const mockUser = await createMockUser('john@example.com', 'SecurePass123!')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)
        vi.mocked(mockTokenGenerator.generateToken).mockImplementation(() => {
          throw new Error('Token generation failed')
        })

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow('Token generation failed')
      })
    })
  })
})
