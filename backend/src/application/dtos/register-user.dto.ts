import { isString } from '../../shared/guards/type.guards.js'
import { ValidationException } from '../../shared/exceptions/validation.exception.js'

export class RegisterUserDto {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly name: string
  ) {}

  static validate(data: any): RegisterUserDto {
    if (!isString(data.email || typeof data.email)) {
      throw new ValidationException('Email is required and must be a string')
    }
    if (!isString(data.password || typeof data.password)) {
      throw new ValidationException('Password is required and must be a string')
    }
    if (!isString(data.name || typeof data.name)) {
      throw new ValidationException('Name is required and must be a string')
    }

    return new RegisterUserDto(data.email, data.password, data.name)
  }
}
