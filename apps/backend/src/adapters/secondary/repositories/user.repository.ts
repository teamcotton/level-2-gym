import { eq } from 'drizzle-orm'
import { db } from '../../../infrastructure/database/index.js'
import { user } from '../../../infrastructure/database/schema.js'
import type { DBUserSelect } from '../../../infrastructure/database/schema.js'
import { User } from '../../../domain/entities/user.js'
import { Email } from '../../../domain/value-objects/email.js'
import { Password } from '../../../domain/value-objects/password.js'
import { Role } from '../../../domain/value-objects/role.js'
import type { UserRepositoryPort } from '../../../application/ports/user.repository.port.js'
import { DatabaseException } from '../../../shared/exceptions/database.exception.js'
import { ConflictException } from '../../../shared/exceptions/conflict.exception.js'
import { DatabaseUtil } from '../../../shared/utils/database.util.js'

export class PostgresUserRepository implements UserRepositoryPort {
  async save(userEntity: User): Promise<void> {
    try {
      await db.insert(user).values({
        email: userEntity.getEmail(),
        password: userEntity['password'].getHash(), // Access private via bracket notation
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

  async findById(id: string): Promise<User | null> {
    try {
      const result = await db.select().from(user).where(eq(user.userId, id))

      if (result.length === 0) {
        return null
      }

      return this.toDomain(result[0]!)
    } catch (error) {
      throw new DatabaseException('Failed to find user by ID', { id, error })
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const result = await db.select().from(user).where(eq(user.email, email))

      if (result.length === 0) {
        return null
      }

      return this.toDomain(result[0]!)
    } catch (error) {
      throw new DatabaseException('Failed to find user by email', { email, error })
    }
  }

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

  async delete(id: string): Promise<void> {
    try {
      await db.delete(user).where(eq(user.userId, id))
    } catch (error) {
      throw new DatabaseException('Failed to delete user', { id, error })
    }
  }

  async existsByEmail(email: string): Promise<boolean> {
    try {
      const result = await db.select({ id: user.userId }).from(user).where(eq(user.email, email))

      return result.length > 0
    } catch (error) {
      throw new DatabaseException('Failed to check if user exists by email', { email, error })
    }
  }

  private toDomain(record: DBUserSelect): User {
    const email = new Email(record.email)
    const password = Password.fromHash(record.password)
    const role = new Role(record.role)
    return new User(record.userId, email, password, record.name, role, record.createdAt)
  }
}
