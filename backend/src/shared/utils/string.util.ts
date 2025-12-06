import crypto from 'crypto'
import { ValidationException } from '../exceptions/validation.exception.js'

/**
 * Utility class for common string manipulation operations.
 * All methods are static and can be used without instantiation.
 *
 * @example
 * ```typescript
 * // Capitalize a string
 * StringUtil.capitalize('hello world') // 'Hello world'
 *
 * // Create a URL-friendly slug
 * StringUtil.slugify('Hello World!') // 'hello-world'
 *
 * // Truncate long text
 * StringUtil.truncate('Long text here', 10) // 'Long te...'
 *
 * // Generate secure random string
 * StringUtil.randomString(16) // 'aB3dE9fG2hI5jK8l'
 *
 * // Mask email for privacy
 * StringUtil.maskEmail('user@example.com') // 'use***@example.com'
 * ```
 */
export class StringUtil {
  /**
   * Capitalizes the first letter of a string and converts the rest to lowercase.
   *
   * @param str - The string to capitalize
   * @returns The capitalized string
   *
   * @example
   * ```typescript
   * StringUtil.capitalize('hello') // 'Hello'
   * StringUtil.capitalize('HELLO') // 'Hello'
   * StringUtil.capitalize('hELLO wORLD') // 'Hello world'
   * ```
   */
  static capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  }

  /**
   * Converts a string to a URL-friendly slug.
   *
   * This method:
   * - Converts to lowercase
   * - Removes leading/trailing whitespace
   * - Removes special characters (keeps only alphanumeric, spaces, and hyphens)
   * - Replaces spaces and underscores with hyphens
   * - Removes leading/trailing hyphens
   *
   * @param str - The string to convert to a slug
   * @returns A URL-friendly slug
   *
   * @example
   * ```typescript
   * StringUtil.slugify('Hello World') // 'hello-world'
   * StringUtil.slugify('Hello World!') // 'hello-world'
   * StringUtil.slugify('  Multiple   Spaces  ') // 'multiple-spaces'
   * StringUtil.slugify('special@#$chars') // 'specialchars'
   * StringUtil.slugify('underscores_and-dashes') // 'underscores-and-dashes'
   * ```
   */
  static slugify(str: string): string {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  /**
   * Truncates a string to a maximum length and appends a suffix.
   *
   * If the string is shorter than or equal to maxLength, it is returned unchanged.
   * The suffix length is accounted for in the truncation.
   *
   * @param str - The string to truncate
   * @param maxLength - The maximum length of the resulting string (including suffix)
   * @param suffix - The suffix to append to truncated strings (defaults to '...')
   * @returns The truncated string with suffix, or the original string if no truncation needed
   *
   * @example
   * ```typescript
   * StringUtil.truncate('Hello World', 20) // 'Hello World'
   * StringUtil.truncate('Hello World', 8) // 'Hello...'
   * StringUtil.truncate('Hello World', 8, '…') // 'Hello W…'
   * StringUtil.truncate('Long text here', 10, ' [more]') // 'Lon [more]'
   * ```
   */
  static truncate(str: string, maxLength: number, suffix: string = '...'): string {
    if (str.length <= maxLength) return str
    return str.substring(0, maxLength - suffix.length) + suffix
  }

  /**
   * Generates a cryptographically secure random string.
   *
   * Uses Node.js crypto.randomBytes for security. This method is suitable for
   * generating tokens, passwords, or other security-sensitive random strings.
   *
   * **Security Note:** Do NOT use Math.random() for security-sensitive values.
   * This method uses cryptographically secure random number generation.
   *
   * @param length - The desired length of the random string (must be >= 0)
   * @returns A random string containing uppercase, lowercase letters, and digits
   * @throws {ValidationException} If length is negative
   *
   * @example
   * ```typescript
   * StringUtil.randomString(16) // 'aB3dE9fG2hI5jK8l'
   * StringUtil.randomString(32) // 'X9mK2pQr4sT6vW8yA0cE1gI3jL5nP7'
   * StringUtil.randomString(8)  // 'Xy7Mn2Kp'
   * StringUtil.randomString(0)  // ''
   * ```
   */
  static randomString(length: number): string {
    if (length < 0) {
      throw new ValidationException('Length must be a non-negative number')
    }
    if (length === 0) {
      return ''
    }
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const bytes = crypto.randomBytes(length)
    let result = ''
    for (let i = 0; i < length; i++) {
      // Map each byte to a character in the allowed set
      result += chars.charAt(bytes[i]! % chars.length)
    }
    return result
  }

  /**
   * Masks an email address for privacy by hiding part of the local part.
   *
   * Shows the first 3 characters (or fewer if the local part is shorter) of the
   * local part and replaces the rest with '***'. The domain remains unchanged.
   *
   * @param email - The email address to mask
   * @returns The masked email address
   * @throws {ValidationException} If the email format is invalid (missing @ or domain)
   *
   * @example
   * ```typescript
   * StringUtil.maskEmail('user@example.com') // 'use***@example.com'
   * StringUtil.maskEmail('john.doe@example.com') // 'joh***@example.com'
   * StringUtil.maskEmail('ab@test.com') // 'ab***@test.com'
   * StringUtil.maskEmail('a@test.com') // 'a***@test.com'
   * StringUtil.maskEmail('invalid-email') // throws Error: 'Invalid email format'
   * ```
   */
  static maskEmail(email: string): string {
    if (email.split('@').length !== 2) {
      throw new ValidationException('Invalid email format')
    }
    const [localPart, domain] = email.split('@')
    if (!localPart || !domain) {
      throw new ValidationException('Invalid email format')
    }
    const visibleChars = Math.min(3, localPart.length)
    const masked = localPart.substring(0, visibleChars) + '***'
    return `${masked}@${domain}`
  }
}
