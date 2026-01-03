import { Uuid7Util } from '../../shared/utils/uuid7.util.js'

/**
 * Unique symbol for UUID branding to ensure type safety.
 * This prevents regular strings from being used where UUID types are expected.
 */
declare const ChatIdBrand: unique symbol

/**
 * Branded type for Chat IDs that ensures type safety at compile time.
 * The brand prevents regular strings from being used where ChatIdType is expected,
 * enforcing proper validation through the ChatId class.
 *
 * @template T - The string literal type of the UUID (defaults to string)
 * @example
 * ```typescript
 * // This will not compile - direct string assignment blocked by brand
 * const id: ChatIdType = 'some-uuid'; // Error!
 *
 * // Correct usage - create through ChatId class
 * const chatId = new ChatId(uuidv7());
 * const id: ChatIdType = chatId.getValue(); // OK!
 * ```
 */
export type ChatIdType<T extends string = string> = string & { readonly [ChatIdBrand]: T }

/**
 * Helper function to brand a validated UUID string as a ChatIdType.
 * This is an internal utility used after UUID validation to apply the type brand.
 *
 * @template T - The string literal type of the UUID
 * @param value - The validated UUID string to brand
 * @returns The same string value but typed as ChatIdType<T>
 * @internal
 */
function brandChatId<T extends string>(value: string): ChatIdType<T> {
  return value as ChatIdType<T>
}

/**
 * Value object representing a Chat identifier with strict UUID v7 validation.
 *
 * This class encapsulates chat identification logic and ensures that only valid
 * UUID v7 strings can be used as chat identifiers. It provides compile-time type
 * safety through branded types and runtime validation.
 *
 * @template T - The string literal type of the UUID (defaults to string)
 *
 * @example
 * ```typescript
 * import { uuidv7 } from 'uuidv7';
 * import { ChatId, ChatIdType } from './chatID';
 *
 * // Create a new chat ID with a valid UUID v7
 * const chatId = new ChatId(uuidv7());
 * const chatIdValue: ChatIdType = chatId.getValue();
 *
 * // Get the underlying UUID string value
 * const uuidString = chatIdValue;
 * console.log(uuidString); // "019b8589-7670-725e-b51b-2fcb23f9c593"
 *
 * // Invalid UUID will throw an error
 * try {
 *   const invalid = new ChatId('not-a-uuid'); // Throws: Invalid UUID format provided
 * } catch (error) {
 *   console.error(error.message);
 * }
 *
 * // Wrong UUID version will throw an error
 * try {
 *   const uuidv4 = '550e8400-e29b-41d4-a716-446655440000';
 *   const invalid = new ChatId(uuidv4); // Throws: Invalid UUID version: v4
 * } catch (error) {
 *   console.error(error.message);
 * }
 * ```
 *
 * @see {@link ChatIdType} for the branded type definition
 * @see {@link Uuid7Util} for UUID validation utilities
 */
export class ChatId<T extends string = string> {
  /**
   * The validated and branded UUID v7 string representing the chat ID.
   * @private
   * @readonly
   */
  private readonly value: ChatIdType<T>

  /**
   * Type brand property for compile-time type safety.
   * This property only exists at compile time and is used by TypeScript
   * to distinguish ChatId instances from regular objects.
   * @readonly
   */
  declare readonly [ChatIdBrand]: T

  /**
   * Creates a new ChatId instance from a UUID v7 string.
   *
   * The constructor validates that the provided value is:
   * 1. A valid UUID format (8-4-4-4-12 hexadecimal pattern)
   * 2. Specifically a UUID version 7 (time-ordered UUID)
   *
   * @param value - The UUID v7 string to use as the chat identifier
   * @throws {Error} Throws "Invalid UUID format provided" if the string is not a valid UUID
   * @throws {Error} Throws "Invalid UUID version: {version}" if the UUID is not version 7
   *
   * @example
   * ```typescript
   * import { uuidv7 } from 'uuidv7';
   *
   * // Valid usage
   * const chatId = new ChatId(uuidv7());
   *
   * // Invalid - not a UUID
   * const invalid1 = new ChatId('abc123'); // Throws error
   *
   * // Invalid - wrong UUID version
   * const uuidv4 = '550e8400-e29b-41d4-a716-446655440000';
   * const invalid2 = new ChatId(uuidv4); // Throws error
   * ```
   */
  constructor(value: string) {
    this.value = this.processChatUUID(value)
  }

  /**
   * Validates and processes a UUID string to ensure it meets chat ID requirements.
   *
   * This method performs two validation steps:
   * 1. Checks if the string matches the UUID format using {@link Uuid7Util.isValidUUID}
   * 2. Verifies the UUID is version 7 using {@link Uuid7Util.uuidVersionValidation}
   *
   * If validation passes, the UUID string is branded as a ChatIdType to provide
   * compile-time type safety.
   *
   * @template T - The string literal type of the UUID
   * @param userUUID - The UUID string to validate and process
   * @returns The validated UUID string branded as ChatIdType<T>
   * @throws {Error} If the UUID format is invalid
   * @throws {Error} If the UUID version is not v7
   * @private
   *
   * @example
   * ```typescript
   * // Internal usage within constructor
   * const processed = this.processChatUUID('019b8589-7670-725e-b51b-2fcb23f9c593');
   * // Returns the same string but typed as ChatIdType
   * ```
   */
  private processChatUUID<T extends string = string>(userUUID: string): ChatIdType<T> {
    if (!Uuid7Util.isValidUUID(userUUID)) {
      throw new Error('Invalid UUID format provided')
    }
    // Validate the UUID version but return the UUID itself, not the version string
    const version = Uuid7Util.uuidVersionValidation(userUUID)
    if (version !== 'v7') {
      throw new Error(`Invalid UUID version: ${version}`)
    }
    return brandChatId<T>(userUUID)
  }

  /**
   * Returns the underlying UUID v7 string value as a branded ChatIdType.
   *
   * This getter provides access to the validated UUID string while maintaining
   * type safety through the ChatIdType brand. The returned value is a string
   * at runtime but typed as ChatIdType at compile time.
   *
   * @returns The branded UUID v7 string representing this chat ID
   *
   * @example
   * ```typescript
   * const chatId = new ChatId(uuidv7());
   * const value: ChatIdType = chatId.getValue();
   *
   * console.log(typeof value); // "string"
   * console.log(value); // "019b8589-7670-725e-b51b-2fcb23f9c593"
   *
   * // The value maintains its branded type for type safety
   * function requiresChatId(id: ChatIdType) {
   *   // ...
   * }
   * requiresChatId(value); // OK - correct type
   * requiresChatId('some-string'); // Error - type mismatch
   * ```
   */
  getValue(): ChatIdType {
    return this.value
  }
}
