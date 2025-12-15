import { User } from '../../domain/entities/user.js'
import { Email } from '../../domain/value-objects/email.js'
import { Password } from '../../domain/value-objects/password.js'
import { Role } from '../../domain/value-objects/role.js'
import type { UserRepositoryPort } from '../ports/user.repository.port.js'
import type { EmailServicePort } from '../ports/email.service.port.js'
import type { LoggerPort } from '../ports/logger.port.js'
import { RegisterUserDto } from '../dtos/register-user.dto.js'
import { ConflictException } from '../../shared/exceptions/conflict.exception.js'
import { DatabaseUtil } from '../../shared/utils/database.util.js'
import { uuidv7 } from 'uuidv7'

export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly emailService: EmailServicePort,
    private readonly logger: LoggerPort
  ) {}

  async execute(dto: RegisterUserDto): Promise<{ userId: string }> {
    this.logger.info('Starting user registration', { email: dto.email })

    // Create domain objects
    const email = new Email(dto.email)
    const password = await Password.create(dto.password)
    const role = new Role(dto.role)
    const userId = this.generateId() // Simplified

    // Create user entity
    const user = new User(userId, email, password, dto.name, role)

    // Persist user with race condition handling
    // The database has a unique constraint on email, so if two concurrent requests
    // try to register the same email, one will succeed and the other will fail
    // with a duplicate key error. We catch that error and convert it to a
    // user-friendly ConflictException.
    try {
      await this.userRepository.save(user)
    } catch (error) {
      this.logger.error('Failed to save user', error as Error, { userId })
      if (DatabaseUtil.isDuplicateKeyError(error)) {
        throw new ConflictException('User with this email already exists', { email: dto.email })
      }
      throw error
    }

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

  private generateId(): string {
    return uuidv7()
  }
}
