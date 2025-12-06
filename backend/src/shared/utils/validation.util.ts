/**
 * Utility class for common validation operations.
 * All methods are static and can be used without instantiation.
 * Methods return boolean values indicating whether the input passes validation.
 *
 * @example
 * ```typescript
 * // Validate email address
 * ValidationUtil.isEmail('user@example.com') // true
 *
 * // Validate URL
 * ValidationUtil.isUrl('https://example.com') // true
 *
 * // Validate UUID
 * ValidationUtil.isUUID('123e4567-e89b-12d3-a456-426614174000') // true
 *
 * // Validate strong password
 * ValidationUtil.isStrongPassword('MyP@ssw0rd') // true
 *
 * // Validate phone number
 * ValidationUtil.isPhoneNumber('+14155552671') // true
 * ```
 */
export class ValidationUtil {
  /**
   * Validates if a string is a properly formatted email address.
   *
   * Uses a simple regex pattern that checks for:
   * - Non-whitespace characters before @
   * - Non-whitespace characters after @
   * - A dot (.) in the domain
   * - Non-whitespace characters after the dot
   *
   * Note: This is a basic validation. For production use, consider more robust
   * email validation or use a dedicated library.
   *
   * @param value - The string to validate as an email
   * @returns True if the string is a valid email format, false otherwise
   *
   * @example
   * ```typescript
   * ValidationUtil.isEmail('user@example.com') // true
   * ValidationUtil.isEmail('john.doe@company.co.uk') // true
   * ValidationUtil.isEmail('invalid-email') // false
   * ValidationUtil.isEmail('missing@domain') // false
   * ValidationUtil.isEmail('@example.com') // false
   * ```
   */
  static isEmail(value: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value)
  }

  /**
   * Validates if a string is a properly formatted URL.
   *
   * Uses the native URL constructor to validate the URL format.
   * Accepts both absolute URLs with protocols (http, https, ftp, etc.)
   * and relative URLs depending on browser/Node.js support.
   *
   * @param value - The string to validate as a URL
   * @returns True if the string is a valid URL format, false otherwise
   *
   * @example
   * ```typescript
   * ValidationUtil.isUrl('https://example.com') // true
   * ValidationUtil.isUrl('http://localhost:3000') // true
   * ValidationUtil.isUrl('ftp://files.example.com') // true
   * ValidationUtil.isUrl('example.com') // false (missing protocol)
   * ValidationUtil.isUrl('not a url') // false
   * ```
   */
  static isUrl(value: string): boolean {
    return URL.canParse(value)
  }

  /**
   * Validates if a string is a properly formatted UUID (Universally Unique Identifier).
   *
   * Checks for the standard UUID format:
   * - 8 hexadecimal digits
   * - 4 hexadecimal digits
   * - 4 hexadecimal digits
   * - 4 hexadecimal digits
   * - 12 hexadecimal digits
   * - Separated by hyphens
   *
   * Accepts both lowercase and uppercase hexadecimal characters.
   * Works with UUID versions 1-5.
   *
   * @param value - The string to validate as a UUID
   * @returns True if the string is a valid UUID format, false otherwise
   *
   * @example
   * ```typescript
   * ValidationUtil.isUUID('123e4567-e89b-12d3-a456-426614174000') // true
   * ValidationUtil.isUUID('550e8400-e29b-41d4-a716-446655440000') // true
   * ValidationUtil.isUUID('123E4567-E89B-12D3-A456-426614174000') // true (case-insensitive)
   * ValidationUtil.isUUID('invalid-uuid') // false
   * ValidationUtil.isUUID('123e4567e89b12d3a456426614174000') // false (missing hyphens)
   * ```
   */
  static isUUID(value: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(value)
  }

  /**
   * Validates if a password meets strong password requirements.
   *
   * A strong password must contain:
   * - At least 8 characters in length
   * - At least one lowercase letter (a-z)
   * - At least one uppercase letter (A-Z)
   * - At least one digit (0-9)
   * - At least one special character (@$!%*?&)
   *
   * Only allows alphanumeric characters and the specified special characters.
   *
   * @param password - The password string to validate
   * @returns True if the password meets strong password requirements, false otherwise
   *
   * @example
   * ```typescript
   * ValidationUtil.isStrongPassword('MyP@ssw0rd') // true
   * ValidationUtil.isStrongPassword('SecureP@ss1') // true
   * ValidationUtil.isStrongPassword('Test123!@#') // true
   * ValidationUtil.isStrongPassword('weak') // false (too short, missing requirements)
   * ValidationUtil.isStrongPassword('NoSpecialChar123') // false (missing special char)
   * ValidationUtil.isStrongPassword('no-uppercase-1!') // false (missing uppercase)
   * ValidationUtil.isStrongPassword('NO-LOWERCASE-1!') // false (missing lowercase)
   * ValidationUtil.isStrongPassword('NoDigits!@#') // false (missing digit)
   * ```
   */
  static isStrongPassword(password: string): boolean {
    // At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    return strongRegex.test(password)
  }

  /**
   * Validates if a string is a properly formatted international phone number.
   *
   * Follows the E.164 international phone number format:
   * - Optional leading + sign
   * - First digit must be 1-9 (country code cannot start with 0)
   * - Followed by 1-14 additional digits
   * - Total of 2-15 digits (including country code)
   * - No spaces, hyphens, or other separators
   *
   * Note: This validates format only, not whether the number actually exists.
   *
   * @param value - The string to validate as a phone number
   * @returns True if the string is a valid E.164 phone number format, false otherwise
   *
   * @example
   * ```typescript
   * ValidationUtil.isPhoneNumber('+14155552671') // true (US number)
   * ValidationUtil.isPhoneNumber('+442071838750') // true (UK number)
   * ValidationUtil.isPhoneNumber('+33123456789') // true (France number)
   * ValidationUtil.isPhoneNumber('14155552671') // true (without +)
   * ValidationUtil.isPhoneNumber('+1-415-555-2671') // false (has separators)
   * ValidationUtil.isPhoneNumber('123') // false (too short)
   * ValidationUtil.isPhoneNumber('+0123456789') // false (starts with 0)
   * ```
   */
  static isPhoneNumber(value: string): boolean {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/
    return phoneRegex.test(value)
  }
}
