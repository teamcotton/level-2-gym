DOMAIN LAYER (Core/Hexagon Center)

Purpose:
This is the heart of the hexagonal architecture containing pure business logic,
entities, and domain services. It has NO dependencies on external frameworks,
databases, or infrastructure concerns.

Contains:
- Entities: Core business objects with identity (e.g., User, Workout, Exercise)
- Value Objects: Immutable objects defined by their attributes (e.g., Email, WorkoutDuration)
- Domain Services: Business logic that doesn't naturally fit in a single entity
- Domain Events: Events that represent something significant that happened in the domain
- Business Rules: Pure functions and validation logic

Rules:
- Must be framework-agnostic (no Fastify, Express, database libraries)
- No external dependencies except language primitives and utility libraries
- Contains only pure business logic
- Defines interfaces (ports) that the application needs but doesn't implement them
- Should be testable without any infrastructure

Example Structure:
domain/
  ├── entities/
  │   ├── user.ts
  │   └── workout.ts
  ├── value-objects/
  │   ├── email.ts
  │   └── password.ts
  ├── services/
  │   └── workout-calculator.ts
  └── events/
      └── user-created.event.ts

========================================
CODE EXAMPLES
========================================

1. ENTITY EXAMPLE (domain/entities/user.ts):

export class User {
  constructor(
    public readonly id: string,
    private email: Email,
    private password: Password,
    private name: string,
    private createdAt: Date = new Date()
  ) {}

  updateEmail(newEmail: Email): void {
    // Business rule: Email can only be updated if verified
    if (!this.isEmailVerified()) {
      throw new Error('Cannot update unverified email')
    }
    this.email = newEmail
  }

  async updatePassword(oldPassword: string, newPassword: Password): Promise<void> {
    // Business rule: Must verify old password before updating
    if (!(await this.password.matches(oldPassword))) {
      throw new Error('Old password is incorrect')
    }
    this.password = newPassword
  }

  private isEmailVerified(): boolean {
    // Business logic for email verification
    return true // Simplified
  }

  getEmail(): string {
    return this.email.getValue()
  }

  getName(): string {
    return this.name
  }
}

2. VALUE OBJECT EXAMPLE (domain/value-objects/email.ts):

export class Email {
  private readonly value: string

  constructor(email: string) {
    this.validate(email)
    this.value = email.toLowerCase().trim()
  }

  private validate(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format')
    }
  }

  getValue(): string {
    return this.value
  }

  equals(other: Email): boolean {
    return this.value === other.value
  }
}

3. VALUE OBJECT EXAMPLE (domain/value-objects/password.ts):

import * as bcrypt from 'bcrypt'

export class Password {
  private readonly hashedValue: string

  private constructor(hashedValue: string) {
    this.hashedValue = hashedValue
  }

  static async create(plainPassword: string): Promise<Password> {
    // Business rule: Password must be at least 8 characters
    if (plainPassword.length < 8) {
      throw new Error('Password must be at least 8 characters')
    }
    
    const hashedValue = await bcrypt.hash(plainPassword, 10)
    return new Password(hashedValue)
  }

  static fromHash(hashedValue: string): Password {
    return new Password(hashedValue)
  }

  async matches(plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, this.hashedValue)
  }

  getHash(): string {
    return this.hashedValue
  }
}

4. DOMAIN SERVICE EXAMPLE (domain/services/workout-calculator.ts):

export class WorkoutCalculator {
  calculateCaloriesBurned(
    duration: number,
    intensity: 'low' | 'medium' | 'high',
    userWeight: number
  ): number {
    // Business logic for calorie calculation
    const baseRate = userWeight * 0.05
    const intensityMultiplier = {
      low: 1.0,
      medium: 1.5,
      high: 2.0
    }
    
    return Math.round(baseRate * duration * intensityMultiplier[intensity])
  }

  calculateRestPeriod(workoutDuration: number, intensity: 'low' | 'medium' | 'high'): number {
    // Business rule: Rest period based on workout intensity
    const intensityFactor = {
      low: 0.5,
      medium: 1.0,
      high: 1.5
    }
    
    return Math.round(workoutDuration * intensityFactor[intensity])
  }
}

5. DOMAIN EVENT EXAMPLE (domain/events/user-created.event.ts):

export class UserCreatedEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly createdAt: Date = new Date()
  ) {}

  toJSON() {
    return {
      eventType: 'UserCreated',
      userId: this.userId,
      email: this.email,
      createdAt: this.createdAt.toISOString()
    }
  }
}
