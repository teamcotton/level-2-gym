import { TypeException } from '../../shared/exceptions/type.exception.js'
import { ValidationException } from '../../shared/exceptions/validation.exception.js'
import { isString } from '../../shared/guards/type.guards.js'

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
    if (data.role !== undefined && !isString(data.role)) {
      throw new ValidationException('Role must be a string')
    }
    // Security: Only allow 'user' role during registration to prevent privilege escalation
    if (data.role !== undefined && data.role !== 'user') {
      throw new ValidationException('Only "user" role is allowed during registration')
    }

    return new RegisterUserDto(data.email, data.password, data.name, data.role)
  }
}
