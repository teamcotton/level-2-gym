import { TypeException } from '../../shared/exceptions/type.exception.js'
import { ValidationException } from '../../shared/exceptions/validation.exception.js'
import { ValidationUtil } from '../../shared/utils/validation.util.js'
import { isString } from '@norberts-spark/shared'

/**
 * Data Transfer Object for OAuth user synchronization requests
 *
 * Encapsulates OAuth user data required for creating or updating user records
 * from OAuth providers (Google, GitHub, etc.) and provides validation to ensure
 * data integrity before processing.
 *
 * @class
 * @property {string} provider - OAuth provider name (e.g., 'google', 'github')
 * @property {string} providerId - User ID from OAuth provider
 * @property {string} email - User's email address
 * @property {string} [name] - User's display name (optional)
 *
 * @example
 * ```typescript
 * // Validate and create OAuthSyncDto from request body
 * const oauthDto = OAuthSyncDto.validate(req.body)
 * console.log(oauthDto.provider) // 'google'
 * console.log(oauthDto.email) // 'user@example.com'
 * ```
 *
 * @example
 * ```typescript
 * // Direct instantiation (use validate() for safety)
 * const oauthDto = new OAuthSyncDto('google', '1234567890', 'user@example.com', 'John Doe')
 * ```
 */
export class OAuthSyncDto {
  constructor(
    public readonly provider: string,
    public readonly providerId: string,
    public readonly email: string,
    public readonly name?: string
  ) {}

  /**
   * Validates and creates an OAuthSyncDto instance from raw data
   *
   * Performs comprehensive validation on input data to ensure it contains
   * valid OAuth user fields before creating an OAuthSyncDto instance.
   *
   * @static
   * @param {any} data - Raw data object to validate (typically from request body)
   * @returns {OAuthSyncDto} Validated OAuthSyncDto instance
   *
   * @throws {TypeException} If data is not a valid object (null, undefined, or array)
   * @throws {ValidationException} If provider is missing or not a string
   * @throws {ValidationException} If providerId is missing or not a string
   * @throws {ValidationException} If email is missing, not a string, or invalid format
   * @throws {ValidationException} If name is provided but not a string
   *
   * @example
   * ```typescript
   * // Valid data with all fields
   * const dto = OAuthSyncDto.validate({
   *   provider: 'google',
   *   providerId: '1234567890',
   *   email: 'user@example.com',
   *   name: 'John Doe'
   * })
   * ```
   *
   * @example
   * ```typescript
   * // Valid data without optional name field
   * const dto = OAuthSyncDto.validate({
   *   provider: 'github',
   *   providerId: '9876543210',
   *   email: 'dev@example.com'
   * })
   * ```
   *
   * @example
   * ```typescript
   * // Invalid data - throws ValidationException
   * try {
   *   const dto = OAuthSyncDto.validate({ provider: 'google' })
   * } catch (error) {
   *   console.error(error.message) // 'ProviderId is required and must be a string'
   * }
   * ```
   */
  static validate(data: any): OAuthSyncDto {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new TypeException('Data must be a valid object')
    }

    if (!data.provider || !isString(data.provider) || !data.provider.trim()) {
      throw new ValidationException('Provider is required and must be a non-empty string')
    }

    if (!data.providerId || !isString(data.providerId) || !data.providerId.trim()) {
      throw new ValidationException('ProviderId is required and must be a non-empty string')
    }

    if (!data.email || !isString(data.email) || !data.email.trim()) {
      throw new ValidationException('Email is required and must be a non-empty string')
    }

    if (!ValidationUtil.isEmail(data.email)) {
      throw new ValidationException('Email must be a valid email address')
    }

    if (data.name !== undefined && !isString(data.name)) {
      throw new ValidationException('Name must be a string')
    }

    return new OAuthSyncDto(data.provider, data.providerId, data.email, data.name)
  }
}
