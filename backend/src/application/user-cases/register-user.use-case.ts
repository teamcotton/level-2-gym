import { User } from '../../domain/entities/user.js'
import { Email } from '../../domain/value-objects/email.js'
import { Password } from '../../domain/value-objects/password.js'
import type { UserRepositoryPort } from '../ports/user.repository.port.js'
import type { EmailServicePort } from '../ports/email.service.port.js'
import type { LoggerPort } from '../ports/logger.port.js'
import { RegisterUserDto } from '../dtos/register-user.dto.js'
import { ValidationException } from '../../shared/exceptions/validation.exception.js'

/**
 * Use case for registering a new user in the system.
 *
 * This use case handles the complete user registration workflow including:
 * - Validation that the user doesn't already exist
 * - Creation of domain objects (Email, Password)
 * - Creation and persistence of the User entity
 * - Sending a welcome email notification
 *
 * Business Rules:
 * - Users must have a unique email address
 * - Passwords are hashed before storage
 * - Registration succeeds even if welcome email fails (logged but not thrown)
 * - All operations are logged for audit purposes
 *
 * @example
 * ```typescript
 * const useCase = new RegisterUserUseCase(
 *   userRepository,
 *   emailService,
 *   logger
 * )
 *
 * const dto = RegisterUserDto.validate({
 *   email: 'user@example.com',
 *   password: 'securePassword123',
 *   name: 'John Doe'
 * })
 *
 * const result = await useCase.execute(dto)
 * console.log(result.userId) // 'user-1234567890-abc123'
 * ```
 */
export class RegisterUserUseCase {
  /**
   * Creates a new RegisterUserUseCase instance.
   *
   * @param userRepository - Repository for user persistence operations
   * @param emailService - Service for sending email notifications
   * @param logger - Logger for recording registration events and errors
   *
   * @example
   * ```typescript
   * const useCase = new RegisterUserUseCase(
   *   new UserRepository(),
   *   new EmailService(),
   *   new Logger()
   * )
   * ```
   */
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly emailService: EmailServicePort,
    private readonly logger: LoggerPort
  ) {}

  /**
   * Executes the user registration process.
   *
   * This method orchestrates the complete registration workflow:
   * 1. Validates that the email is not already registered
   * 2. Creates validated domain objects (Email and Password)
   * 3. Generates a unique user ID
   * 4. Creates and persists the User entity
   * 5. Sends a welcome email (non-blocking - failures are logged)
   *
   * @param dto - Data transfer object containing validated registration data
   * @returns A promise resolving to an object containing the new user's ID
   * @throws {Error} If a user with the same email already exists
   * @throws {Error} If password creation fails (password too short, etc.)
   * @throws {Error} If user persistence fails
   *
   * @example
   * ```typescript
   * const dto = RegisterUserDto.validate({
   *   email: 'john@example.com',
   *   password: 'MySecurePass123',
   *   name: 'John Smith'
   * })
   *
   * try {
   *   const { userId } = await useCase.execute(dto)
   *   console.log(`User registered with ID: ${userId}`)
   * } catch (error) {
   *   console.error('Registration failed:', error.message)
   * }
   * ```
   */
  async execute(dto: RegisterUserDto): Promise<{ userId: string }> {
    this.logger.info('Starting user registration', { email: dto.email })

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(dto.email)
    if (existingUser) {
      throw new ValidationException('User with this email already exists')
    }

    // Create domain objects
    const email = new Email(dto.email)
    const password = await Password.create(dto.password)
    const userId = this.generateId() // Simplified

    // Create user entity
    const user = new User(userId, email, password, dto.name)

    // Persist user
    await this.userRepository.save(user)

    // Send welcome email
    try {
      await this.emailService.sendWelcomeEmail(dto.email, dto.name)
    } catch (error) {
      this.logger.error('Failed to send welcome email', error as Error, {
        userId,
        email: dto.email,
      })
      // Don't fail registration if email fails
    }

    this.logger.info('User registered successfully', { userId })

    return { userId }
  }

  /**
   * Generates a unique user identifier.
   *
   * Creates a unique ID by combining a timestamp with a random string.
   * This is a simplified implementation - production systems should use
   * UUID v4, ULID, or database-generated IDs.
   *
   * @private
   * @returns A unique user identifier string
   *
   * @example
   * ```typescript
   * const id = this.generateId() // 'user-1701878400000-x3k2m9p1q'
   * ```
   */
  private generateId(): string {
    return `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}
