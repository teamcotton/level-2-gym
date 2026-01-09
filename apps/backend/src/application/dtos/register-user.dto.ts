import { TypeException } from '../../shared/exceptions/type.exception.js'
import { ValidationException } from '../../shared/exceptions/validation.exception.js'
import { isString } from '@norberts-spark/shared'

/**
 * Helper function to check if a providerId value is valid (non-empty string)
 * @param value - The value to check
 * @returns true if value is a valid non-empty string, false otherwise
 */
function isValidProviderId(value: any): boolean {
  return isString(value) && value.trim() !== ''
}

export class RegisterUserDto {
  constructor(
    public readonly email: string,
    public readonly name: string,
    public readonly role: string = 'user',
    public readonly password?: string,
    public readonly provider?: string,
    public readonly providerId?: string
  ) {}

  static validate(data: any): RegisterUserDto {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new TypeException('Data must be a valid object')
    }
    if (!data.email || !isString(data.email)) {
      throw new ValidationException('Email is required and must be a string')
    }
    // Password validation: required if no provider is present
    if (!data.provider && (!data.password || !isString(data.password))) {
      throw new ValidationException('Password must be a string when provider is not provided')
    }
    // Password type validation: when a provider is present and a password is supplied, it must be a string
    if (
      data.provider &&
      data.password !== undefined &&
      data.password !== null &&
      !isString(data.password)
    ) {
      throw new ValidationException('Password must be a string when provided')
    }
    if (!data.name || !isString(data.name)) {
      throw new ValidationException('Name is required and must be a string')
    }
    if (data.role !== undefined && !isString(data.role)) {
      throw new ValidationException('Role must be a string')
    }
    // Security: Only allow 'user' role during registration to prevent privilege escalation
    if (data.role !== undefined && data.role !== 'user') {
      throw new ValidationException('Only "user" role is allowed during registration')
    }
    // Provider validation: if provided without password, must be a string
    if (data.provider !== undefined && !data.password && !isString(data.provider)) {
      throw new ValidationException('Provider must be a string when password is not provided')
    }

    // ProviderId validation: if provided, must be a non-empty string
    if (data.providerId !== undefined && data.providerId !== null) {
      if (!isString(data.providerId)) {
        throw new ValidationException('ProviderId must be a string when provided')
      }
      if (!isValidProviderId(data.providerId)) {
        throw new ValidationException('ProviderId must be a non-empty string when provided')
      }
    }

    // If provider is set and no password, providerId should also be set and valid
    if (data.provider && !data.password && !isValidProviderId(data.providerId)) {
      throw new ValidationException(
        'ProviderId is required when using OAuth provider without password'
      )
    }

    return new RegisterUserDto(
      data.email,
      data.name,
      data.role,
      data.password,
      data.provider,
      data.providerId
    )
  }
}
