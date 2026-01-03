import { Uuid7Util } from '../../shared/utils/uuid7.util.js'

/**
 * Unique symbol for UUID branding to ensure type safety.
 * This prevents regular strings from being used where UUID types are expected.
 */
declare const UserIdBrand: unique symbol

/**
 * Branded type for User IDs that ensures type safety at compile time.
 * The brand prevents regular strings from being used where UserIdType is expected,
 * enforcing proper validation through the UserId class.
 *
 * @template T - The string literal type of the UUID (defaults to string)
 * @example
 * ```typescript
 * // This will not compile - direct string assignment blocked by brand
 * const id: UserIdType = 'some-uuid'; // Error!
 *
 * // Correct usage - create through UserId class
 * const userId = new UserId(uuidv7());
 * const id: UserIdType = userId.getValue(); // OK!
 * ```
 */
export type UserIdType<T extends string = string> = string & { readonly [UserIdBrand]: T }

/**
 * Helper function to brand a validated UUID string as a UserIdType.
 * This is an internal utility used after UUID validation to apply the type brand.
 *
 * @template T - The string literal type of the UUID
 * @param value - The validated UUID string to brand
 * @returns The same string value but typed as UserIdType<T>
 * @internal
 */
function brandUserId<T extends string>(value: string): UserIdType<T> {
  return value as UserIdType<T>
}

/**
 * Value object representing a User identifier with strict UUID v7 validation.
 *
 * This class encapsulates user identification logic and ensures that only valid
 * UUID v7 strings can be used as user identifiers. It provides compile-time type
 * safety through branded types and runtime validation.
 *
 * @template T - The string literal type of the UUID (defaults to string)
 *
 * @example
 * ```typescript
 * import { uuidv7 } from 'uuidv7';
 * import { UserId, UserIdType } from './userID';
 *
 * // Create a new user ID with a valid UUID v7
 * const userId = new UserId(uuidv7());
 * const id: UserIdType = userId.getValue();
 *
 * // Get the underlying UUID string value
 * const uuidString = userId.getValue();
 * console.log(uuidString); // "019b8589-7670-725e-b51b-2fcb23f9c593"
 *
 * // Invalid UUID will throw an error
 * try {
 *   const invalid = new UserId('not-a-uuid'); // Throws: Invalid userID UUID format provided
 * } catch (error) {
 *   console.error(error.message);
 * }
 *
 * // Wrong UUID version will throw an error
 * try {
 *   const uuidv4 = '550e8400-e29b-41d4-a716-446655440000';
 *   const invalid = new UserId(uuidv4); // Throws: Invalid userID UUID version: v4
 * } catch (error) {
 *   console.error(error.message);
 * }
 * ```
 *
 * @see {@link UserIdType} for the branded type definition
 * @see {@link Uuid7Util} for UUID validation utilities
 */
export class UserId<T extends string = string> {
  /**
   * The validated and branded UUID v7 string representing the user ID.
   * @private
   * @readonly
   */
  private readonly value: UserIdType<T>

  /**
   * Type brand property for compile-time type safety.
   * This property only exists at compile time and is used by TypeScript
   * to distinguish UserId instances from regular objects.
   * @readonly
   */
  declare readonly [UserIdBrand]: T

  /**
   * Creates a new UserId instance from a UUID v7 string.
   *
   * The constructor validates that the provided value is:
   * 1. A valid UUID format (8-4-4-4-12 hexadecimal pattern)
   * 2. Specifically a UUID version 7 (time-ordered UUID)
   *
   * @param value - The UUID v7 string to use as the user identifier
   * @throws {Error} Throws "Invalid userID UUID format provided" if the UUID format is invalid
   * @throws {Error} Throws "Invalid userID UUID version: {version}" if the UUID is not version 7
   *
   * @example
   * ```typescript
   * import { uuidv7 } from 'uuidv7';
   *
   * // Valid usage
   * const userId = new UserId(uuidv7());
   *
   * // Invalid - not a UUID
   * const invalid1 = new UserId('abc123'); // Throws error
   *
   * // Invalid - wrong UUID version
   * const uuidv4 = '550e8400-e29b-41d4-a716-446655440000';
   * const invalid2 = new UserId(uuidv4); // Throws error
   * ```
   */
  constructor(value: string) {
    this.value = this.processUserIdUUID(value)
  }

  /**
   * Validates and processes a UUID string to ensure it meets user ID requirements.
   *
   * This method performs two validation steps:
   * 1. Checks if the string matches the UUID format using {@link Uuid7Util.isValidUUID}
   * 2. Verifies the UUID is version 7 using {@link Uuid7Util.uuidVersionValidation}
   *
   * If validation passes, the UUID string is branded as a UserIdType to provide
   * compile-time type safety.
   *
   * @template T - The string literal type of the UUID
   * @param userUUID - The UUID string to validate and process
   * @returns The validated UUID string branded as UserIdType<T>
   * @throws {Error} If the UUID format is invalid
   * @throws {Error} If the UUID version is not v7
   * @private
   *
   * @example
   * ```typescript
   * // Internal usage within constructor
   * const processed = this.processUserIdUUID('019b8589-7670-725e-b51b-2fcb23f9c593');
   * // Returns the same string but typed as UserIdType
   * ```
   */
  private processUserIdUUID<T extends string = string>(userUUID: string): UserIdType<T> {
    if (!Uuid7Util.isValidUUID(userUUID)) {
      throw new Error('Invalid userID UUID format provided')
    }
    // Validate the UUID version but return the UUID itself, not the version string
    const version = Uuid7Util.uuidVersionValidation(userUUID)
    if (version !== 'v7') {
      throw new Error(`Invalid userID UUID version: ${version}`)
    }
    return brandUserId<T>(userUUID)
  }

  /**
   * Returns the underlying UUID v7 string value as a branded UserIdType.
   *
   * This getter provides access to the validated UUID string while maintaining
   * type safety through the UserIdType brand. The returned value is a string
   * at runtime but typed as UserIdType at compile time.
   *
   * @returns The branded UUID v7 string representing this user ID
   *
   * @example
   * ```typescript
   * const userId = new UserId(uuidv7());
   * const value: UserIdType = userId.getValue();
   *
   * console.log(typeof value); // "string"
   * console.log(value); // "019b8589-7670-725e-b51b-2fcb23f9c593"
   *
   * // The value maintains its branded type for type safety
   * function requiresUserId(id: UserIdType) {
   *   // ...
   * }
   * requiresUserId(value); // OK - correct type
   * requiresUserId('some-string'); // Error - type mismatch
   * ```
   */
  getValue(): UserIdType {
    return this.value
  }
}
