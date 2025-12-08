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
   * Code 23505: UNIQUE VIOLATION
   * @see https://www.postgresql.org/docs/current/errcodes-appendix.html
   */
  private static readonly PG_UNIQUE_VIOLATION = '23505'

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
    return 'code' in error && error.code === this.PG_UNIQUE_VIOLATION
  }
}
