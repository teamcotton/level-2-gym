import { LoginUserDto } from '../dtos/login-user.dto.js'
import type { UserRepositoryPort } from '../ports/user.repository.port.js'
import type { LoggerPort } from '../ports/logger.port.js'
import type { TokenGeneratorPort } from '../ports/token-generator.port.js'
import { UnauthorizedException } from '../../shared/exceptions/unauthorized.exception.js'
import { InternalErrorException } from '../../shared/exceptions/internal-error.exception.js'

/**
 * Use case for authenticating users and generating access tokens
 *
 * Orchestrates the user login flow by validating credentials, verifying passwords,
 * and generating JWT access tokens for authenticated users. Implements secure
 * authentication practices with comprehensive logging for security monitoring.
 *
 * @class
 *
 * @remarks
 * This use case follows the Clean Architecture pattern, encapsulating business
 * logic for user authentication. It coordinates between multiple ports (repository,
 * logger, token generator) without depending on specific implementations.
 *
 * Security features:
 * - Password verification using domain entity methods
 * - Generic error messages to prevent user enumeration attacks
 * - Comprehensive audit logging for login attempts and failures
 * - JWT token generation with user claims (sub, email, roles)
 *
 * @example
 * ```typescript
 * // Instantiate use case with dependencies
 * const loginUseCase = new LoginUserUseCase(
 *   userRepository,
 *   logger,
 *   tokenGenerator
 * )
 *
 * // Execute login
 * const dto = new LoginUserDto('user@example.com', 'password123')
 * const result = await loginUseCase.execute(dto)
 * console.log(`Access token: ${result.access_token}`)
 * ```
 *
 * @see {@link LoginUserDto} for the input data structure
 * @see {@link UserRepositoryPort} for user data access
 * @see {@link TokenGeneratorPort} for JWT generation
 */
export class LoginUserUseCase {
  /**
   * Creates a new LoginUserUseCase instance
   *
   * @param {UserRepositoryPort} userRepository - Repository for user data access
   * @param {LoggerPort} logger - Logger for audit trail and monitoring
   * @param {TokenGeneratorPort} tokenGenerator - Service for generating JWT tokens
   *
   * @example
   * ```typescript
   * const loginUseCase = new LoginUserUseCase(
   *   new PostgresUserRepository(),
   *   new WinstonLogger(),
   *   new JwtTokenGenerator()
   * )
   * ```
   */
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly logger: LoggerPort,
    private readonly tokenGenerator: TokenGeneratorPort
  ) {}

  /**
   * Authenticates a user and generates an access token
   *
   * Validates user credentials by checking if the user exists and verifying
   * their password. On successful authentication, generates a JWT access token
   * containing user identity and roles. All login attempts are logged for
   * security monitoring.
   *
   * @async
   * @param {LoginUserDto} dto - Login credentials (email and password)
   * @returns {Promise<{userId: string, email: string, access_token: string, roles: string[]}>}
   *          Object containing user information and JWT access token
   *
   * @throws {UnauthorizedException} If user doesn't exist or password is invalid.
   *         Uses generic error message "Invalid email or password" to prevent
   *         user enumeration attacks.
   *
   * @example
   * ```typescript
   * // Successful login
   * const dto = LoginUserDto.validate({
   *   email: 'user@example.com',
   *   password: 'correctPassword'
   * })
   *
   * const result = await loginUseCase.execute(dto)
   * // Returns:
   * // {
   * //   userId: '550e8400-e29b-41d4-a716-446655440000',
   * //   email: 'user@example.com',
   * //   access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
   * //   roles: ['user']
   * // }
   * ```
   *
   * @example
   * ```typescript
   * // Failed login - invalid credentials
   * try {
   *   const dto = new LoginUserDto('user@example.com', 'wrongPassword')
   *   await loginUseCase.execute(dto)
   * } catch (error) {
   *   if (error instanceof UnauthorizedException) {
   *     console.error(error.message) // 'Invalid email or password'
   *   }
   * }
   * ```
   */
  async execute(dto: LoginUserDto): Promise<{
    userId: string
    email: string
    access_token: string
    roles: string[]
  }> {
    this.logger.info('User login attempt', { email: dto.email })

    const user = await this.userRepository.findByEmail(dto.email)

    if (!user) {
      this.logger.warn('Login failed: User not found', { email: dto.email })
      throw new UnauthorizedException('Invalid email or password')
    }

    if (!user.id) {
      this.logger.error('User found but has no ID', new InternalErrorException('Missing user ID'), {
        email: dto.email,
      })
      throw new InternalErrorException('User found but has no ID', {
        email: dto.email,
      })
    }

    const isPasswordValid = await user.verifyPassword(dto.password)

    if (!isPasswordValid) {
      this.logger.warn('Login failed: Invalid password', { email: dto.email, userId: user.id })
      throw new UnauthorizedException('Invalid email or password')
    }

    this.logger.info('User logged in successfully', { userId: user.id, email: dto.email })

    // Generate JWT access token
    const accessToken = this.tokenGenerator.generateToken({
      sub: user.id,
      email: user.getEmail(),
      roles: [user.getRole()],
    })

    return {
      userId: user.id,
      email: user.getEmail(),
      access_token: accessToken,
      roles: [user.getRole()],
    }
  }
}
