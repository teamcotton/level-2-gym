import { eq, count } from 'drizzle-orm'
import { db } from '../../../infrastructure/database/index.js'
import { user } from '../../../infrastructure/database/schema.js'
import type { DBUserSelect } from '../../../infrastructure/database/schema.js'
import { User } from '../../../domain/entities/user.js'
import { Email } from '../../../domain/value-objects/email.js'
import { Password } from '../../../domain/value-objects/password.js'
import { Role } from '../../../domain/value-objects/role.js'
import type {
  UserRepositoryPort,
  PaginationParams,
  PaginatedResult,
} from '../../../application/ports/user.repository.port.js'
import { DatabaseException } from '../../../shared/exceptions/database.exception.js'
import { ConflictException } from '../../../shared/exceptions/conflict.exception.js'
import { DatabaseUtil } from '../../../shared/utils/database.util.js'

/**
 * PostgreSQL implementation of the User Repository
 *
 * Provides concrete implementation of user data persistence operations using PostgreSQL
 * database via Drizzle ORM. Handles mapping between domain entities and database records,
 * and manages database-specific error handling and constraints.
 *
 * @class
 * @implements {UserRepositoryPort}
 *
 * @remarks
 * This repository is part of the Hexagonal Architecture pattern (Ports & Adapters),
 * serving as a secondary adapter that implements the UserRepositoryPort interface.
 * It translates domain operations into PostgreSQL queries using Drizzle ORM.
 *
 * Key responsibilities:
 * - Persist User domain entities to PostgreSQL
 * - Query user data with pagination support
 * - Transform database records to domain entities via toDomain()
 * - Handle database-specific errors (duplicate keys, connection issues)
 * - Enforce unique email constraint
 *
 * @example
 * ```typescript
 * // Instantiate and use repository
 * const userRepo = new PostgresUserRepository()
 *
 * // Save a new user
 * const user = new User(id, email, password, name, role, createdAt)
 * await userRepo.save(user)
 *
 * // Query users with pagination
 * const result = await userRepo.findAll({ limit: 20, offset: 0 })
 * console.log(`Found ${result.total} users`)
 * ```
 *
 * @see {@link UserRepositoryPort} for the port interface definition
 * @see {@link User} for the domain entity
 */
export class PostgresUserRepository implements UserRepositoryPort {
  /**
   * Persists a new user entity to the database
   *
   * Creates a new user record in PostgreSQL with all entity properties. The method
   * automatically handles email uniqueness validation and provides meaningful error
   * messages for constraint violations.
   *
   * @async
   * @param {User} userEntity - The user domain entity to persist
   * @returns {Promise<void>} Resolves when user is successfully saved
   *
   * @throws {ConflictException} If a user with the same email already exists
   * @throws {DatabaseException} If database operation fails for any other reason
   *
   * @example
   * ```typescript
   * const email = new Email('user@example.com')
   * const password = await Password.fromPlainText('password123')
   * const role = new Role('user')
   * const user = new User('uuid', email, password, 'John Doe', role, new Date())
   *
   * try {
   *   await userRepo.save(user)
   *   console.log('User saved successfully')
   * } catch (error) {
   *   if (error instanceof ConflictException) {
   *     console.error('Email already registered')
   *   }
   * }
   * ```
   */
  async save(userEntity: User): Promise<void> {
    try {
      await db.insert(user).values({
        userId: userEntity.id,
        email: userEntity.getEmail(),
        password: userEntity.getPasswordHash(),
        name: userEntity.getName(),
        role: userEntity.getRole(),
        createdAt: new Date(),
      })
    } catch (error) {
      if (DatabaseUtil.isDuplicateKeyError(error)) {
        throw new ConflictException('User with this email already exists', {
          email: userEntity.getEmail(),
        })
      }
      throw new DatabaseException('Failed to save user', { error })
    }
  }

  /**
   * Retrieves all users with optional pagination
   *
   * Queries the database for user records and returns them as domain entities
   * with pagination metadata. Supports customizable page size and offset for
   * efficient data retrieval.
   *
   * @async
   * @param {PaginationParams} [params] - Optional pagination parameters
   * @param {number} [params.limit=50] - Maximum number of records to return (default: 50)
   * @param {number} [params.offset=0] - Number of records to skip (default: 0)
   * @returns {Promise<PaginatedResult<User>>} Paginated result with user entities and metadata
   *
   * @throws {DatabaseException} If database query fails
   *
   * @example
   * ```typescript
   * // Get first page with default limit (50)
   * const page1 = await userRepo.findAll()
   * console.log(`Total users: ${page1.total}`)
   *
   * // Get second page with custom limit
   * const page2 = await userRepo.findAll({ limit: 20, offset: 20 })
   * page2.data.forEach(user => console.log(user.getEmail()))
   * ```
   */
  async findAll(params?: PaginationParams): Promise<PaginatedResult<User>> {
    try {
      const limit = params?.limit ?? 50
      const offset = params?.offset ?? 0

      // Get total count
      const totalResult = await db.select({ count: count() }).from(user)
      const total = totalResult[0]?.count ?? 0

      // Get paginated results
      const result = await db.select().from(user).limit(limit).offset(offset)

      return {
        data: result.map((record) => this.toDomain(record)),
        total: Number(total),
        limit,
        offset,
      }
    } catch (error) {
      throw new DatabaseException('Failed to find all users', { error })
    }
  }

  /**
   * Finds a user by their unique identifier
   *
   * Queries the database for a user with the specified ID and returns the
   * corresponding domain entity if found.
   *
   * @async
   * @param {string} id - The unique user identifier (UUID)
   * @returns {Promise<User | null>} User entity if found, null otherwise
   *
   * @throws {DatabaseException} If database query fails
   *
   * @example
   * ```typescript
   * const user = await userRepo.findById('550e8400-e29b-41d4-a716-446655440000')
   *
   * if (user) {
   *   console.log(`Found user: ${user.getName()}`)
   * } else {
   *   console.log('User not found')
   * }
   * ```
   */
  async findById(id: string): Promise<User | null> {
    try {
      const result = await db.select().from(user).where(eq(user.userId, id))

      if (result.length === 0) {
        return null
      }

      const dbRecord = result[0]
      if (dbRecord) {
        return this.toDomain(dbRecord)
      } else {
        return null
      }
    } catch (error) {
      throw new DatabaseException('Failed to find user by ID', { id, error })
    }
  }

  /**
   * Finds a user by their email address
   *
   * Queries the database for a user with the specified email address and returns
   * the corresponding domain entity if found. Email lookup is case-sensitive.
   *
   * @async
   * @param {string} email - The user's email address
   * @returns {Promise<User | null>} User entity if found, null otherwise
   *
   * @throws {DatabaseException} If database query fails
   *
   * @example
   * ```typescript
   * const user = await userRepo.findByEmail('user@example.com')
   *
   * if (user) {
   *   console.log(`User ID: ${user.id}`)
   * } else {
   *   console.log('No user with this email')
   * }
   * ```
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const result = await db.select().from(user).where(eq(user.email, email))

      if (result.length === 0) {
        return null
      }

      const dbRecord = result[0]
      if (dbRecord) {
        return this.toDomain(dbRecord)
      } else {
        return null
      }
    } catch (error) {
      throw new DatabaseException('Failed to find user by email', { email, error })
    }
  }

  /**
   * Updates an existing user's information
   *
   * Updates the user record in the database with new values from the provided
   * entity. Only updates email, name, and role fields. The user ID and password
   * hash are immutable via this method.
   *
   * @async
   * @param {User} userEntity - The user entity with updated information
   * @returns {Promise<void>} Resolves when user is successfully updated
   *
   * @throws {ConflictException} If updating email to one that already exists
   * @throws {DatabaseException} If database operation fails for any other reason
   *
   * @example
   * ```typescript
   * const user = await userRepo.findById('uuid')
   *
   * if (user) {
   *   // Update user properties
   *   const updatedEmail = new Email('newemail@example.com')
   *   const updatedUser = new User(
   *     user.id,
   *     updatedEmail,
   *     user.getPassword(),
   *     'New Name',
   *     user.getRoleObject(),
   *     user.createdAt
   *   )
   *
   *   await userRepo.update(updatedUser)
   *   console.log('User updated successfully')
   * }
   * ```
   */
  async update(userEntity: User): Promise<void> {
    try {
      await db
        .update(user)
        .set({
          email: userEntity.getEmail(),
          name: userEntity.getName(),
          role: userEntity.getRole(),
        })
        .where(eq(user.userId, userEntity.id))
    } catch (error) {
      if (DatabaseUtil.isDuplicateKeyError(error)) {
        throw new ConflictException('User with this email already exists', {
          email: userEntity.getEmail(),
        })
      }
      throw new DatabaseException('Failed to update user', { error })
    }
  }

  /**
   * Deletes a user from the database
   *
   * Permanently removes the user record with the specified ID from the database.
   * This operation cannot be undone. No error is thrown if the user doesn't exist.
   *
   * @async
   * @param {string} id - The unique user identifier (UUID)
   * @returns {Promise<void>} Resolves when user is successfully deleted
   *
   * @throws {DatabaseException} If database operation fails
   *
   * @example
   * ```typescript
   * // Delete user by ID
   * await userRepo.delete('550e8400-e29b-41d4-a716-446655440000')
   * console.log('User deleted')
   *
   * // Verify deletion
   * const deletedUser = await userRepo.findById('550e8400-e29b-41d4-a716-446655440000')
   * console.log(deletedUser) // null
   * ```
   */
  async delete(id: string): Promise<void> {
    try {
      await db.delete(user).where(eq(user.userId, id))
    } catch (error) {
      throw new DatabaseException('Failed to delete user', { id, error })
    }
  }

  /**
   * Checks if a user with the given email exists
   *
   * Efficiently checks for email existence without loading the full user entity.
   * Useful for validation during user registration or email update operations.
   *
   * @async
   * @param {string} email - The email address to check
   * @returns {Promise<boolean>} True if user exists, false otherwise
   *
   * @throws {DatabaseException} If database query fails
   *
   * @example
   * ```typescript
   * // Check email availability before registration
   * const emailTaken = await userRepo.existsByEmail('user@example.com')
   *
   * if (emailTaken) {
   *   throw new ConflictException('Email already registered')
   * }
   *
   * // Proceed with registration
   * await userRepo.save(newUser)
   * ```
   */
  async existsByEmail(email: string): Promise<boolean> {
    try {
      const result = await db.select({ id: user.userId }).from(user).where(eq(user.email, email))

      return result.length > 0
    } catch (error) {
      throw new DatabaseException('Failed to check if user exists by email', { email, error })
    }
  }

  /**
   * Transforms a database record into a User domain entity
   *
   * Internal mapper method that converts PostgreSQL query results into rich
   * domain entities with value objects and business logic. Reconstructs
   * Email, Password, and Role value objects from primitive database values.
   *
   * @private
   * @param {DBUserSelect} record - Raw database record from Drizzle ORM query
   * @returns {User} Fully hydrated User domain entity
   *
   * @example
   * ```typescript
   * // Internal usage within repository methods
   * const dbRecord = await db.select().from(user).where(eq(user.userId, id))
   * const userEntity = this.toDomain(dbRecord[0])
   *
   * // userEntity now has all domain methods available
   * console.log(userEntity.getEmail()) // Email value object
   * console.log(userEntity.getRole()) // 'user' or 'admin'
   * ```
   */
  private toDomain(record: DBUserSelect): User {
    const email = new Email(record.email)
    const password = Password.fromHash(record.password)
    const role = new Role(record.role)
    return new User(record.userId, email, password, record.name, role, record.createdAt)
  }
}
