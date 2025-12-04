APPLICATION LAYER (Use Cases/Application Services)

Purpose:
Orchestrates the flow of data to and from the domain, and directs the domain
objects to perform their business logic. This layer defines the application's
use cases and coordinates domain objects.

Contains:
- Use Cases: Specific application operations (e.g., RegisterUser, CreateWorkout)
- Application Services: Orchestrate domain objects and coordinate transactions
- DTOs (Data Transfer Objects): Data structures for transferring data between layers
- Command/Query objects: Represent requests to the application
- Port Interfaces: Definitions of what the application needs from the outside world

Rules:
- Depends on domain layer only
- Defines port interfaces (contracts) for infrastructure to implement
- No knowledge of HTTP, databases, or external services (only interfaces)
- Orchestrates domain logic but contains no business rules itself
- Transaction boundaries are typically defined here

Example Structure:
application/
  ├── use-cases/
  │   ├── register-user.use-case.ts
  │   └── create-workout.use-case.ts
  ├── ports/
  │   ├── user.repository.port.ts      # Interface only
  │   ├── email.service.port.ts        # Interface only
  │   └── logger.port.ts               # Interface only
  └── dtos/
      ├── register-user.dto.ts
      └── create-workout.dto.ts

========================================
CODE EXAMPLES
========================================

1. PORT INTERFACE EXAMPLE (application/ports/user.repository.port.ts):

import { User } from '../../domain/entities/user'

export interface UserRepositoryPort {
  save(user: User): Promise<void>
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  update(user: User): Promise<void>
  delete(id: string): Promise<void>
  existsByEmail(email: string): Promise<boolean>
}

2. PORT INTERFACE EXAMPLE (application/ports/email.service.port.ts):

export interface EmailServicePort {
  sendWelcomeEmail(to: string, name: string): Promise<void>
  sendPasswordResetEmail(to: string, resetToken: string): Promise<void>
  sendWorkoutReminder(to: string, workoutDetails: any): Promise<void>
}

3. PORT INTERFACE EXAMPLE (application/ports/logger.port.ts):

export interface LoggerPort {
  info(message: string, context?: Record<string, any>): void
  error(message: string, error?: Error, context?: Record<string, any>): void
  warn(message: string, context?: Record<string, any>): void
  debug(message: string, context?: Record<string, any>): void
}

4. DTO EXAMPLE (application/dtos/register-user.dto.ts):

export class RegisterUserDto {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly name: string
  ) {}

  static validate(data: any): RegisterUserDto {
    if (!data.email || typeof data.email !== 'string') {
      throw new Error('Email is required and must be a string')
    }
    if (!data.password || typeof data.password !== 'string') {
      throw new Error('Password is required and must be a string')
    }
    if (!data.name || typeof data.name !== 'string') {
      throw new Error('Name is required and must be a string')
    }
    
    return new RegisterUserDto(data.email, data.password, data.name)
  }
}

5. DTO EXAMPLE (application/dtos/create-workout.dto.ts):

export class CreateWorkoutDto {
  constructor(
    public readonly userId: string,
    public readonly duration: number,
    public readonly intensity: 'low' | 'medium' | 'high',
    public readonly exercises: string[]
  ) {}
}

6. USE CASE EXAMPLE (application/use-cases/register-user.use-case.ts):

import { randomUUID } from 'node:crypto'
import { User } from '../../domain/entities/user'
import { Email } from '../../domain/value-objects/email'
import { Password } from '../../domain/value-objects/password'
import { UserCreatedEvent } from '../../domain/events/user-created.event'
import { UserRepositoryPort } from '../ports/user.repository.port'
import { EmailServicePort } from '../ports/email.service.port'
import { LoggerPort } from '../ports/logger.port'
import { RegisterUserDto } from '../dtos/register-user.dto'

export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly emailService: EmailServicePort,
    private readonly logger: LoggerPort
  ) {}

  async execute(dto: RegisterUserDto): Promise<{ userId: string }> {
    this.logger.info('Starting user registration', { email: dto.email })

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(dto.email)
    if (existingUser) {
      throw new Error('User with this email already exists')
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
        email: dto.email
      })
      // Don't fail registration if email fails
    }

    this.logger.info('User registered successfully', { userId })

    return { userId }
  }

  private generateId(): string {
    // Use Node.js built-in randomUUID() for production-ready unique IDs
    return randomUUID()
  }
}

7. USE CASE EXAMPLE (application/use-cases/create-workout.use-case.ts):

import { randomUUID } from 'node:crypto'
import { UserRepositoryPort } from '../ports/user.repository.port'
import { WorkoutCalculator } from '../../domain/services/workout-calculator'
import { CreateWorkoutDto } from '../dtos/create-workout.dto'

export class CreateWorkoutUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly workoutCalculator: WorkoutCalculator
  ) {}

  async execute(dto: CreateWorkoutDto): Promise<{ workoutId: string; caloriesBurned: number }> {
    // Verify user exists
    const user = await this.userRepository.findById(dto.userId)
    if (!user) {
      throw new Error('User not found')
    }

    // Calculate calories using domain service
    const caloriesBurned = this.workoutCalculator.calculateCaloriesBurned(
      dto.duration,
      dto.intensity,
      75 // User weight - would come from user profile
    )

    const workoutId = this.generateId()

    // Here you would save the workout to a workout repository
    // await this.workoutRepository.save(workout)

    return { workoutId, caloriesBurned }
  }

  private generateId(): string {
    // Use Node.js built-in randomUUID() for production-ready unique IDs
    return randomUUID()
  }
}
