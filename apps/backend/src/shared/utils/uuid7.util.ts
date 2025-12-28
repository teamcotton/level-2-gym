import { uuidv7 } from 'uuidv7'
import { isValidUUID, uuidVersionValidation } from 'uuidv7-utilities'

/**
 * Utility class for generating and validating UUIDv7.
 *
 * UUIDv7 is a time-ordered UUID that combines timestamp-based ordering with
 * random data, making it ideal for database primary keys and distributed systems.
 *
 * @example
 * ```typescript
 * const util = new Uuid7Util()
 * const uuid = util.createUuidv7()
 * // '018d3f78-1234-7abc-def0-123456789abc'
 *
 * Uuid7Util.isValidUUID(uuid) // true
 * Uuid7Util.uuidVersionValidation(uuid) // 'v7'
 * ```
 */
export class Uuid7Util {
  /**
   * Validates a UUID string and returns its version if valid.
   *
   * @param uuid - The UUID string to validate
   * @returns The UUID version (e.g., 'v7', 'v4') if the UUID is valid and matches
   *          the expected version 7, otherwise an error message string or undefined
   *          for invalid/malformed UUIDs
   *
   * @example
   * ```typescript
   * Uuid7Util.uuidVersionValidation('018d3f78-1234-7abc-def0-123456789abc') // 'v7'
   * Uuid7Util.uuidVersionValidation('550e8400-e29b-41d4-a716-446655440000') // 'Expected v7, but got v4'
   * Uuid7Util.uuidVersionValidation('not-a-uuid') // undefined
   * Uuid7Util.uuidVersionValidation('') // undefined
   * ```
   */
  static uuidVersionValidation(uuid: string): string | undefined {
    return uuidVersionValidation(uuid)
  }

  /**
   * Checks if a string is a valid UUID of any version.
   *
   * @param uuid - The string to validate
   * @returns `true` if the string is a valid UUID format (any version), `false` otherwise
   *
   * @example
   * ```typescript
   * Uuid7Util.isValidUUID('018d3f78-1234-7abc-def0-123456789abc') // true (v7)
   * Uuid7Util.isValidUUID('550e8400-e29b-41d4-a716-446655440000') // true (v4)
   * Uuid7Util.isValidUUID('not-a-uuid') // false
   * Uuid7Util.isValidUUID('') // false
   * ```
   */
  static isValidUUID(uuid: string): boolean {
    return isValidUUID(uuid)
  }

  /**
   * Generates a new UUIDv7.
   *
   * UUIDv7 values are time-ordered and can be safely compared lexicographically,
   * making them suitable for use as database primary keys, distributed IDs,
   * and chronologically sortable identifiers.
   *
   * @returns A newly generated UUIDv7 string in the format:
   *          `xxxxxxxx-xxxx-7xxx-xxxx-xxxxxxxxxxxx`
   *
   * @example
   * ```typescript
   * const util = new Uuid7Util()
   * const id1 = util.createUuidv7()
   * const id2 = util.createUuidv7()
   *
   * // UUIDs are chronologically ordered
   * console.log(id1 < id2) // true
   * ```
   */
  static createUuidv7(): string {
    return uuidv7()
  }
}
