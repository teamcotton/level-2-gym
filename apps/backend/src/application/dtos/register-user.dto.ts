import { TypeException } from '../../shared/exceptions/type.exception.js'
import { ValidationException } from '../../shared/exceptions/validation.exception.js'
import { isString } from '../../shared/guards/type.guards.js'
import { USER_ROLES } from '../../domain/value-objects/role.js'

export class RegisterUserDto {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly name: string,
    public readonly role: string = 'user'
  ) {}

  static validate(data: any): RegisterUserDto {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new TypeException('Data must be a valid object')
    }
    if (!data.email || !isString(data.email)) {
      throw new ValidationException('Email is required and must be a string')
    }
    if (!data.password || !isString(data.password)) {
      throw new ValidationException('Password is required and must be a string')
    }
    if (!data.name || !isString(data.name)) {
      throw new ValidationException('Name is required and must be a string')
    }
    if (data.role && !isString(data.role)) {
      throw new ValidationException('Role must be a string')
    }
    if (data.role && !(USER_ROLES as readonly string[]).includes(data.role)) {
      throw new ValidationException(
        `Invalid role. Must be one of: ${USER_ROLES.join(', ')}`
      )
    }

    return new RegisterUserDto(data.email, data.password, data.name, data.role)
  }
}
