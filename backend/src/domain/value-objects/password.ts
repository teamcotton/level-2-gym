import * as bcrypt from 'bcrypt'
import { ValidationException } from '../../shared/exceptions/validation.exception.js'
/**
 * Unique symbol for password branding to ensure type safety.
 * This prevents regular strings from being used where Password types are expected.
 */
declare const PasswordBrand: unique symbol

/**
 * Branded password type that wraps the Password class with compile-time type safety.
 * The brand ensures that only validated Password instances can be used where this type is expected.
 *
 * @template T - The string literal type of the password (defaults to string)
 */
export type PasswordType<T extends string = string> = Password<T> & { readonly [PasswordBrand]: T }

/**
 * Password value object that handles password hashing and validation.
 *
 * This class implements secure password management using bcrypt for hashing.
 * Passwords are never stored in plain text - they are immediately hashed upon creation.
 *
 * Business Rules:
 * - Passwords must be at least 8 characters long
 * - Passwords are hashed using bcrypt with salt rounds of 10
 * - The constructor is private to enforce creation through factory methods
 *
 * @template T - The string literal type of the hashed password (defaults to string)
 *
 * @example
 * ```typescript
 * // Create a new password from plain text
 * const password = await Password.create('mySecureP@ssw0rd')
 *
 * // Verify a password
 * const isValid = await password.matches('mySecureP@ssw0rd') // true
 *
 * // Get the hash for storage
 * const hash = password.getHash()
 *
 * // Reconstruct from stored hash
 * const savedPassword = Password.fromHash(hash)
 * ```
 */
export class Password<T extends string = string> {
  private readonly hashedValue: string
  declare readonly [PasswordBrand]: T

  /**
   * Private constructor to enforce creation through factory methods.
   *
   * @param hashedValue - The bcrypt hashed password value
   * @private
   */
  private constructor(hashedValue: T) {
    this.hashedValue = hashedValue
  }

  /**
   * Factory method to create a new Password instance from plain text.
   *
   * This method validates the password meets minimum requirements,
   * then hashes it using bcrypt with 10 salt rounds.
   *
   * @param plainPassword - The plain text password to hash
   * @returns A Promise resolving to a new Password instance with the hashed value
   * @throws {ValidationException} If password is less than 8 characters
   *
   * @example
   * ```typescript
   * const password = await Password.create('mySecurePassword123')
   * ```
   */
  static async create(plainPassword: string): Promise<Password> {
    // Business rule: Password must be at least 8 characters
    if (plainPassword.length < 8) {
      throw new ValidationException('Password must be at least 8 characters')
    }

    const hashedValue = await bcrypt.hash(plainPassword, 10)
    return new Password(hashedValue)
  }

  /**
   * Factory method to reconstruct a Password instance from a stored hash.
   *
   * Use this method when loading passwords from the database or other storage.
   * No validation or hashing is performed - the hash is used as-is.
   *
   * @param hashedValue - The bcrypt hashed password string from storage
   * @returns A new Password instance with the provided hash
   *
   * @example
   * ```typescript
   * // Reconstruct password from database
   * const storedHash = '$2b$10$...' // from database
   * const password = Password.fromHash(storedHash)
   * ```
   */
  static fromHash(hashedValue: string): Password {
    // Basic validation: non-empty and matches bcrypt hash format
    // Bcrypt hashes typically start with $2a$, $2b$, or $2y$ and are 60 chars long
    const bcryptRegex = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/
    if (!hashedValue || !bcryptRegex.test(hashedValue)) {
      throw new ValidationException('Invalid bcrypt hash provided to Password.fromHash')
    }
    return new Password(hashedValue)
  }

  /**
   * Verify if a plain text password matches this hashed password.
   *
   * Uses bcrypt's constant-time comparison to prevent timing attacks.
   *
   * @param plainPassword - The plain text password to verify
   * @returns A Promise resolving to true if the password matches, false otherwise
   *
   * @example
   * ```typescript
   * const password = await Password.create('myPassword')
   * await password.matches('myPassword') // true
   * await password.matches('wrongPassword') // false
   * ```
   */
  async matches(plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, this.hashedValue)
  }

  /**
   * Get the bcrypt hashed password value for storage.
   *
   * Use this method when persisting the password to a database or other storage.
   *
   * @returns The bcrypt hashed password string
   *
   * @example
   * ```typescript
   * const password = await Password.create('myPassword')
   * const hash = password.getHash()
   * // Store hash in database: '$2b$10$...'
   * ```
   */
  getHash(): string {
    return this.hashedValue
  }
}
