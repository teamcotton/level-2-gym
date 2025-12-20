import { TypeException } from '../../shared/exceptions/type.exception.js'
import { ValidationException } from '../../shared/exceptions/validation.exception.js'
import { isString } from '../../shared/guards/type.guards.js'

/**
 * Data Transfer Object for user login requests
 *
 * Encapsulates user credentials required for authentication and provides validation
 * to ensure data integrity before processing login attempts.
 *
 * @class
 * @property {string} email - User's email address (readonly)
 * @property {string} password - User's password (readonly)
 *
 * @example
 * ```typescript
 * // Validate and create LoginUserDto from request body
 * const loginDto = LoginUserDto.validate(req.body)
 * console.log(loginDto.email) // 'user@example.com'
 * ```
 *
 * @example
 * ```typescript
 * // Direct instantiation (use validate() for safety)
 * const loginDto = new LoginUserDto('user@example.com', 'password123')
 * ```
 */
export class LoginUserDto {
  constructor(
    public readonly email: string,
    public readonly password: string
  ) {}

  /**
   * Validates and creates a LoginUserDto instance from raw data
   *
   * Performs comprehensive validation on input data to ensure it contains
   * valid email and password fields before creating a LoginUserDto instance.
   *
   * @static
   * @param {any} data - Raw data object to validate (typically from request body)
   * @returns {LoginUserDto} Validated LoginUserDto instance
   *
   * @throws {TypeException} If data is not a valid object (null, undefined, or array)
   * @throws {ValidationException} If email is missing or not a string
   * @throws {ValidationException} If password is missing or not a string
   *
   * @example
   * ```typescript
   * // Valid data
   * const dto = LoginUserDto.validate({
   *   email: 'user@example.com',
   *   password: 'securePassword123'
   * })
   * ```
   *
   * @example
   * ```typescript
   * // Invalid data - throws ValidationException
   * try {
   *   const dto = LoginUserDto.validate({ email: 'user@example.com' })
   * } catch (error) {
   *   console.error(error.message) // 'Password is required and must be a string'
   * }
   * ```
   */
  static validate(data: any): LoginUserDto {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new TypeException('Data must be a valid object')
    }
    if (!data.email || !isString(data.email)) {
      throw new ValidationException('Email is required and must be a string')
    }
    if (!data.password || !isString(data.password)) {
      throw new ValidationException('Password is required and must be a string')
    }

    return new LoginUserDto(data.email, data.password)
  }
}
