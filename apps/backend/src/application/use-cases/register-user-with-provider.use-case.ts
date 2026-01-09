import { User } from '../../domain/entities/user.js'
import { Email } from '../../domain/value-objects/email.js'
import { Role } from '../../domain/value-objects/role.js'
import type { UserRepositoryPort } from '../ports/user.repository.port.js'
import type { EmailServicePort } from '../ports/email.service.port.js'
import type { LoggerPort } from '../ports/logger.port.js'
import type { TokenGeneratorPort } from '../ports/token-generator.port.js'
import { RegisterUserDto } from '../dtos/register-user.dto.js'
import { ConflictException } from '../../shared/exceptions/conflict.exception.js'
import { DatabaseUtil } from '../../shared/utils/database.util.js'
import { EnvConfig } from '../../infrastructure/config/env.config.js'
import type { UserIdType } from '../../domain/value-objects/userID.js'

/**
 * Use case for registering a new user in the system
 *
 * This use case handles the complete user registration process including:
 * - Creating domain entities from DTO
 * - Validating and hashing passwords
 * - Persisting user to repository with duplicate email detection
 * - Sending welcome email (non-blocking)
 * - Generating JWT access token
 *
 * @class RegisterUserUseCase
 * @example
 * ```typescript
 * const useCase = new RegisterUserUseCase(
 *   userRepository,
 *   emailService,
 *   logger,
 *   tokenGenerator
 * )
 * const result = await useCase.execute({
 *   email: 'user@example.com',
 *   password: 'SecurePass123',
 *   name: 'John Doe',
 *   role: 'member'
 * })
 * ```
 */
export class RegisterUserWithProviderUseCase {
  /**
   * Creates an instance of RegisterUserUseCase
   * @param {UserRepositoryPort} userRepository - Repository for persisting user data
   * @param {EmailServicePort} emailService - Service for sending welcome emails
   * @param {LoggerPort} logger - Logger for tracking operations
   * @param {TokenGeneratorPort} tokenGenerator - Service for generating JWT tokens
   */
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly emailService: EmailServicePort,
    private readonly logger: LoggerPort,
    private readonly tokenGenerator: TokenGeneratorPort
  ) {}

  /**
   * Executes the user registration use case
   *
   * Creates a new user account with the provided information. The process includes:
   * 1. Validating email format and password strength through value objects
   * 2. Hashing the password securely
   * 3. Saving the user to the database (with duplicate email detection)
   * 4. Sending a welcome email (failure doesn't block registration)
   * 5. Generating a JWT access token for immediate login
   *
   * @param {RegisterUserDto} dto - User registration data (email, password, name, role)
   * @returns {Promise<{ userId: string, access_token: string, token_type: string, expires_in: number }>}   *          Registration result with user ID and authentication token
   * @throws {ConflictException} If a user with the same email already exists
   * @throws {Error} If password validation, database operation, or token generation fails.
   *                 Note: Email service failures are logged but do not throw errors or prevent registration.
   * @example
   * ```typescript
   * try {
   *   const result = await useCase.execute({
   *     email: 'newuser@example.com',
   *     password: 'StrongPass123!',
   *     name: 'Jane Smith',
   *     role: 'member'
   *   })
   *   console.log(`User ${result.userId} registered successfully`)
   * } catch (error) {
   *   if (error instanceof ConflictException) {
   *     console.error('Email already in use')
   *   }
   * }
   * ```
   */
  async execute(
    dto: RegisterUserDto
  ): Promise<{ userId: string; access_token: string; token_type: string; expires_in: number }> {
    this.logger.info('Starting user registration', { email: dto.email })

    // Create domain objects
    const email = new Email(dto.email)
    const role = new Role(dto.role)

    // Create user entity without ID - PostgreSQL will generate UUIDv7 via uuidv7() function
    const user = new User(undefined, email, dto.name, role, undefined, new Date(), dto.provider)

    // Persist user with race condition handling
    // The database has a unique constraint on email, so if two concurrent requests
    // try to register the same email, one will succeed and the other will fail
    // with a duplicate key error. We catch that error and convert it to a
    // user-friendly ConflictException.
    let userId: UserIdType
    try {
      userId = await this.userRepository.save(user)
    } catch (error) {
      this.logger.error('Failed to save user', error as Error, { email: dto.email })
      if (DatabaseUtil.isDuplicateKeyError(error)) {
        throw new ConflictException('User with this email already exists', { email: dto.email })
      }
      throw error
    }

    // Send welcome email. This will differ to a user registered with password.
    // Failure to send email should not block registration.
    try {
      await this.emailService.sendWelcomeEmail(dto.email, dto.name)
    } catch (error) {
      this.logger.error('Failed to send welcome email', error as Error, {
        userId: userId,
        email: dto.email,
      })
      // Don't fail registration if email fails
    }

    this.logger.info('User registered successfully', { userId: userId })

    // Generate JWT access token
    const accessToken = this.tokenGenerator.generateToken({
      sub: userId,
      email: dto.email,
      roles: [dto.role],
    })

    const expiresIn = Number.parseInt(EnvConfig.JWT_EXPIRATION, 10)
    const safeExpiresIn = Number.isNaN(expiresIn) ? 3600 : expiresIn

    return {
      userId: userId,
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: safeExpiresIn,
    }
  }
}
