import { POSTGRES_ERROR_CODE } from '../constants/error-codes.js'
import type { PostgresErrorCode } from '../constants/error-codes.js'
/**
 * Utility class for database error handling operations.
 * Provides methods to identify specific database errors, particularly PostgreSQL errors.
 * All methods are static and can be used without instantiation.
 *
 * @example
 * ```typescript
 * try {
 *   await userRepository.save(user)
 * } catch (error) {
 *   if (DatabaseUtil.isDuplicateKeyError(error)) {
 *     throw new ConflictException('User already exists')
 *   }
 *   throw error
 * }
 * ```
 */
export class DatabaseUtil {
  /**
   * PostgreSQL error code for unique constraint violations.
   * Code from POSTGRES_ERROR_CODE.UNIQUE_VIOLATION (currently '23505'): UNIQUE VIOLATION
   * @see https://www.postgresql.org/docs/current/errcodes-appendix.html
   */
  private static readonly PG_UNIQUE_VIOLATION: PostgresErrorCode =
    POSTGRES_ERROR_CODE.UNIQUE_VIOLATION

  /**
   * Checks if an error is a PostgreSQL duplicate key/unique constraint violation.
   *
   * This typically occurs when:
   * - Inserting a row with a value that violates a UNIQUE constraint
   * - Inserting a duplicate primary key
   * - Race condition where two operations try to insert the same unique value
   *
   * Works with errors from the `pg` (node-postgres) driver used by Drizzle ORM.
   *
   * @param error - The error to check (can be any type)
   * @returns True if the error is a PostgreSQL unique constraint violation, false otherwise
   *
   * @example
   * ```typescript
   * try {
   *   await db.insert(users).values({ email: 'existing@example.com' })
   * } catch (error) {
   *   if (DatabaseUtil.isDuplicateKeyError(error)) {
   *     console.log('Email already exists')
   *   }
   * }
   * ```
   */
  static isDuplicateKeyError(error: unknown): boolean {
    // Type guard: check if error is an object with a 'code' property
    if (!error || typeof error !== 'object') {
      return false
    }

    // PostgreSQL errors from node-postgres have a 'code' property
    // For unique constraint violations, code is '23505'
    // Drizzle ORM may wrap the error in a 'cause' property
    if ('code' in error && error.code === this.PG_UNIQUE_VIOLATION) {
      return true
    }

    // Check if the error is wrapped in a 'cause' property (Drizzle ORM pattern)
    if ('cause' in error && error.cause && typeof error.cause === 'object') {
      return 'code' in error.cause && error.cause.code === this.PG_UNIQUE_VIOLATION
    }

    return false
  }
}
