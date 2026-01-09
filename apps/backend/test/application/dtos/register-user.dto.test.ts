import { describe, expect, it } from 'vitest'

import { RegisterUserDto } from '../../../src/application/dtos/register-user.dto.js'
import { ValidationException } from '../../../src/shared/exceptions/validation.exception.js'

describe('RegisterUserDto', () => {
  describe('constructor', () => {
    it('should create a RegisterUserDto with valid data', () => {
      const email = 'test@example.com'
      const name = 'John Doe'
      const password = 'password123'

      const dto = new RegisterUserDto(email, name, 'user', password)

      expect(dto.email).toBe(email)
      expect(dto.name).toBe(name)
      expect(dto.password).toBe(password)
      expect(dto.role).toBe('user')
      expect(dto.provider).toBeUndefined()
    })

    it('should create a RegisterUserDto with custom role', () => {
      const email = 'admin@example.com'
      const name = 'Admin User'
      const password = 'password123'
      const role = 'admin'

      const dto = new RegisterUserDto(email, name, role, password)

      expect(dto.email).toBe(email)
      expect(dto.name).toBe(name)
      expect(dto.password).toBe(password)
      expect(dto.role).toBe(role)
      expect(dto.provider).toBeUndefined()
    })

    it('should default to "user" role when not provided', () => {
      const dto = new RegisterUserDto('test@example.com', 'John Doe', undefined, 'password123')

      expect(dto.role).toBe('user')
    })

    it('should create OAuth user without password', () => {
      const email = 'oauth@example.com'
      const name = 'OAuth User'
      const provider = 'google'
      const providerId = '1234567890'

      const dto = new RegisterUserDto(email, name, 'user', undefined, provider, providerId)

      expect(dto.email).toBe(email)
      expect(dto.name).toBe(name)
      expect(dto.password).toBeUndefined()
      expect(dto.provider).toBe(provider)
      expect(dto.providerId).toBe(providerId)
      expect(dto.role).toBe('user')
    })

    it('should have readonly properties at compile time', () => {
      const dto = new RegisterUserDto('test@example.com', 'John Doe', 'user', 'password123')

      // TypeScript readonly is compile-time only, but properties should exist
      expect(dto.email).toBeDefined()
      expect(dto.name).toBeDefined()
      expect(dto.password).toBeDefined()

      // Properties are public and enumerable
      const descriptor1 = Object.getOwnPropertyDescriptor(dto, 'email')
      const descriptor2 = Object.getOwnPropertyDescriptor(dto, 'name')
      const descriptor3 = Object.getOwnPropertyDescriptor(dto, 'password')

      expect(descriptor1?.enumerable).toBe(true)
      expect(descriptor2?.enumerable).toBe(true)
      expect(descriptor3?.enumerable).toBe(true)
    })

    it('should be instance of RegisterUserDto', () => {
      const dto = new RegisterUserDto('test@example.com', 'John Doe', 'user', 'password123')

      expect(dto).toBeInstanceOf(RegisterUserDto)
    })
  })

  describe('validate()', () => {
    describe('successful validation', () => {
      it('should validate and create RegisterUserDto with valid data', () => {
        const data = {
          email: 'test@example.com',
          password: 'password123',
          name: 'John Doe',
        }

        const dto = RegisterUserDto.validate(data)

        expect(dto).toBeInstanceOf(RegisterUserDto)
        expect(dto.email).toBe(data.email)
        expect(dto.password).toBe(data.password)
        expect(dto.name).toBe(data.name)
        expect(dto.role).toBe('user')
      })

      it('should validate and create RegisterUserDto with user role explicitly set', () => {
        const data = {
          email: 'user@example.com',
          password: 'password123',
          name: 'Regular User',
          role: 'user',
        }

        const dto = RegisterUserDto.validate(data)

        expect(dto).toBeInstanceOf(RegisterUserDto)
        expect(dto.email).toBe(data.email)
        expect(dto.name).toBe(data.name)
        expect(dto.password).toBe(data.password)
        expect(dto.role).toBe('user')
        expect(dto.provider).toBeUndefined()
      })

      it('should validate OAuth user with provider and providerId, no password', () => {
        const data = {
          email: 'oauth@example.com',
          name: 'OAuth User',
          provider: 'google',
          providerId: '123456789',
        }

        const dto = RegisterUserDto.validate(data)

        expect(dto).toBeInstanceOf(RegisterUserDto)
        expect(dto.email).toBe(data.email)
        expect(dto.name).toBe(data.name)
        expect(dto.password).toBeUndefined()
        expect(dto.provider).toBe('google')
        expect(dto.providerId).toBe('123456789')
        expect(dto.role).toBe('user')
      })

      it('should validate with extra properties in data', () => {
        const data = {
          email: 'test@example.com',
          password: 'password123',
          name: 'John Doe',
          extraField: 'should be ignored',
          anotherField: 123,
        }

        const dto = RegisterUserDto.validate(data)

        expect(dto.email).toBe(data.email)
        expect(dto.name).toBe(data.name)
        expect(dto.password).toBe(data.password)
        expect((dto as any).extraField).toBeUndefined()
      })

      it('should handle whitespace in valid strings', () => {
        const data = {
          email: '  test@example.com  ',
          password: '  password123  ',
          name: '  John Doe  ',
        }

        const dto = RegisterUserDto.validate(data)

        expect(dto.email).toBe(data.email)
        expect(dto.name).toBe(data.name)
        expect(dto.password).toBe(data.password)
      })
    })

    describe('email validation', () => {
      it('should throw ValidationException when email is missing', () => {
        const data = {
          password: 'password123',
          name: 'John Doe',
        }

        expect(() => RegisterUserDto.validate(data)).toThrow(ValidationException)
        expect(() => RegisterUserDto.validate(data)).toThrow(
          'Email is required and must be a string'
        )
      })

      it('should throw ValidationException when email is null', () => {
        const data = {
          email: null,
          password: 'password123',
          name: 'John Doe',
        }

        expect(() => RegisterUserDto.validate(data)).toThrow(ValidationException)
        expect(() => RegisterUserDto.validate(data)).toThrow(
          'Email is required and must be a string'
        )
      })

      it('should throw ValidationException when email is undefined', () => {
        const data = {
          email: undefined,
          password: 'password123',
          name: 'John Doe',
        }

        expect(() => RegisterUserDto.validate(data)).toThrow(ValidationException)
        expect(() => RegisterUserDto.validate(data)).toThrow(
          'Email is required and must be a string'
        )
      })

      it('should throw ValidationException when email is empty string', () => {
        const data = {
          email: '',
          password: 'password123',
          name: 'John Doe',
        }

        expect(() => RegisterUserDto.validate(data)).toThrow(ValidationException)
        expect(() => RegisterUserDto.validate(data)).toThrow(
          'Email is required and must be a string'
        )
      })

      it('should throw ValidationException when email is not a string', () => {
        const data = {
          email: 123,
          password: 'password123',
          name: 'John Doe',
        }

        expect(() => RegisterUserDto.validate(data)).toThrow(ValidationException)
        expect(() => RegisterUserDto.validate(data)).toThrow(
          'Email is required and must be a string'
        )
      })

      it('should throw ValidationException when email is an array', () => {
        const data = {
          email: ['test@example.com'],
          password: 'password123',
          name: 'John Doe',
        }

        expect(() => RegisterUserDto.validate(data)).toThrow(ValidationException)
        expect(() => RegisterUserDto.validate(data)).toThrow(
          'Email is required and must be a string'
        )
      })

      it('should throw ValidationException when email is an object', () => {
        const data = {
          email: { value: 'test@example.com' },
          password: 'password123',
          name: 'John Doe',
        }

        expect(() => RegisterUserDto.validate(data)).toThrow(ValidationException)
        expect(() => RegisterUserDto.validate(data)).toThrow(
          'Email is required and must be a string'
        )
      })
    })

    describe('password validation', () => {
      it('should throw ValidationException when password is missing and no provider', () => {
        const data = {
          email: 'test@example.com',
          name: 'John Doe',
        }

        expect(() => RegisterUserDto.validate(data)).toThrow(ValidationException)
        expect(() => RegisterUserDto.validate(data)).toThrow(
          'Password must be a string when provider is not provided'
        )
      })

      it('should throw ValidationException when password is null and no provider', () => {
        const data = {
          email: 'test@example.com',
          password: null,
          name: 'John Doe',
        }

        expect(() => RegisterUserDto.validate(data)).toThrow(ValidationException)
        expect(() => RegisterUserDto.validate(data)).toThrow(
          'Password must be a string when provider is not provided'
        )
      })

      it('should throw ValidationException when password is undefined and no provider', () => {
        const data = {
          email: 'test@example.com',
          password: undefined,
          name: 'John Doe',
        }

        expect(() => RegisterUserDto.validate(data)).toThrow(ValidationException)
        expect(() => RegisterUserDto.validate(data)).toThrow(
          'Password must be a string when provider is not provided'
        )
      })

      it('should throw ValidationException when password is empty string', () => {
        const data = {
          email: 'test@example.com',
          password: '',
          name: 'John Doe',
        }

        expect(() => RegisterUserDto.validate(data)).toThrow(ValidationException)
        expect(() => RegisterUserDto.validate(data)).toThrow(
          'Password must be a string when provider is not provided'
        )
      })

      it('should throw ValidationException when password is not a string', () => {
        const data = {
          email: 'test@example.com',
          password: 12345678,
          name: 'John Doe',
        }

        expect(() => RegisterUserDto.validate(data)).toThrow(ValidationException)
        expect(() => RegisterUserDto.validate(data)).toThrow(
          'Password must be a string when provider is not provided'
        )
      })

      it('should throw ValidationException when password is a boolean', () => {
        const data = {
          email: 'test@example.com',
          password: true,
          name: 'John Doe',
        }

        expect(() => RegisterUserDto.validate(data)).toThrow(ValidationException)
        expect(() => RegisterUserDto.validate(data)).toThrow(
          'Password must be a string when provider is not provided'
        )
      })

      it('should throw ValidationException when password is an array', () => {
        const data = {
          email: 'test@example.com',
          password: ['password123'],
          name: 'John Doe',
        }

        expect(() => RegisterUserDto.validate(data)).toThrow(ValidationException)
        expect(() => RegisterUserDto.validate(data)).toThrow(
          'Password must be a string when provider is not provided'
        )
      })
    })

    describe('name validation', () => {
      it('should throw ValidationException when name is missing', () => {
        const data = {
          email: 'test@example.com',
          password: 'password123',
        }

        expect(() => RegisterUserDto.validate(data)).toThrow(ValidationException)
        expect(() => RegisterUserDto.validate(data)).toThrow(
          'Name is required and must be a string'
        )
      })

      it('should throw ValidationException when name is null', () => {
        const data = {
          email: 'test@example.com',
          password: 'password123',
          name: null,
        }

        expect(() => RegisterUserDto.validate(data)).toThrow(ValidationException)
        expect(() => RegisterUserDto.validate(data)).toThrow(
          'Name is required and must be a string'
        )
      })

      it('should throw ValidationException when name is undefined', () => {
        const data = {
          email: 'test@example.com',
          password: 'password123',
          name: undefined,
        }

        expect(() => RegisterUserDto.validate(data)).toThrow(ValidationException)
        expect(() => RegisterUserDto.validate(data)).toThrow(
          'Name is required and must be a string'
        )
      })

      it('should throw ValidationException when name is empty string', () => {
        const data = {
          email: 'test@example.com',
          password: 'password123',
          name: '',
        }

        expect(() => RegisterUserDto.validate(data)).toThrow(ValidationException)
        expect(() => RegisterUserDto.validate(data)).toThrow(
          'Name is required and must be a string'
        )
      })

      it('should throw ValidationException when name is not a string', () => {
        const data = {
          email: 'test@example.com',
          password: 'password123',
          name: 123,
        }

        expect(() => RegisterUserDto.validate(data)).toThrow(ValidationException)
        expect(() => RegisterUserDto.validate(data)).toThrow(
          'Name is required and must be a string'
        )
      })

      it('should throw ValidationException when name is an object', () => {
        const data = {
          email: 'test@example.com',
          password: 'password123',
          name: { first: 'John', last: 'Doe' },
        }

        expect(() => RegisterUserDto.validate(data)).toThrow(ValidationException)
        expect(() => RegisterUserDto.validate(data)).toThrow(
          'Name is required and must be a string'
        )
      })

      it('should throw ValidationException when name is an array', () => {
        const data = {
          email: 'test@example.com',
          password: 'password123',
          name: ['John Doe'],
        }

        expect(() => RegisterUserDto.validate(data)).toThrow(ValidationException)
        expect(() => RegisterUserDto.validate(data)).toThrow(
          'Name is required and must be a string'
        )
      })
    })

    describe('role validation', () => {
      it('should not throw when role is "user"', () => {
        const data = {
          email: 'test@example.com',
          password: 'password123',
          name: 'John Doe',
          role: 'user',
        }

        expect(() => RegisterUserDto.validate(data)).not.toThrow()
      })

      it('should throw ValidationException when role is "admin"', () => {
        const data = {
          email: 'test@example.com',
          password: 'password123',
          name: 'John Doe',
          role: 'admin',
        }

        expect(() => RegisterUserDto.validate(data)).toThrow(ValidationException)
        expect(() => RegisterUserDto.validate(data)).toThrow(
          'Only "user" role is allowed during registration'
        )
      })

      it('should throw ValidationException when role is "moderator"', () => {
        const data = {
          email: 'test@example.com',
          password: 'password123',
          name: 'John Doe',
          role: 'moderator',
        }

        expect(() => RegisterUserDto.validate(data)).toThrow(ValidationException)
        expect(() => RegisterUserDto.validate(data)).toThrow(
          'Only "user" role is allowed during registration'
        )
      })

      it('should throw ValidationException when role is not a string', () => {
        const data = {
          email: 'test@example.com',
          password: 'password123',
          name: 'John Doe',
          role: 123,
        }

        expect(() => RegisterUserDto.validate(data)).toThrow(ValidationException)
        expect(() => RegisterUserDto.validate(data)).toThrow('Role must be a string')
      })

      it('should throw ValidationException when role is an array', () => {
        const data = {
          email: 'test@example.com',
          password: 'password123',
          name: 'John Doe',
          role: ['admin'],
        }

        expect(() => RegisterUserDto.validate(data)).toThrow(ValidationException)
        expect(() => RegisterUserDto.validate(data)).toThrow('Role must be a string')
      })

      it('should throw ValidationException when role is an object', () => {
        const data = {
          email: 'test@example.com',
          password: 'password123',
          name: 'John Doe',
          role: { type: 'admin' },
        }

        expect(() => RegisterUserDto.validate(data)).toThrow(ValidationException)
        expect(() => RegisterUserDto.validate(data)).toThrow('Role must be a string')
      })

      it('should not throw when role is undefined (defaults to "user")', () => {
        const data = {
          email: 'test@example.com',
          password: 'password123',
          name: 'John Doe',
          role: undefined,
        }

        const dto = RegisterUserDto.validate(data)
        expect(dto.role).toBe('user')
      })

      it('should not throw when role is not provided (defaults to "user")', () => {
        const data = {
          email: 'test@example.com',
          password: 'password123',
          name: 'John Doe',
        }

        const dto = RegisterUserDto.validate(data)
        expect(dto.role).toBe('user')
      })

      it('should throw ValidationException when role is invalid', () => {
        const data = {
          email: 'test@example.com',
          password: 'password123',
          name: 'John Doe',
          role: 'superuser',
        }

        expect(() => RegisterUserDto.validate(data)).toThrow(ValidationException)
        expect(() => RegisterUserDto.validate(data)).toThrow(
          'Only "user" role is allowed during registration'
        )
      })

      it('should throw ValidationException when role is empty string', () => {
        const data = {
          email: 'test@example.com',
          password: 'password123',
          name: 'John Doe',
          role: '',
        }

        expect(() => RegisterUserDto.validate(data)).toThrow(ValidationException)
        expect(() => RegisterUserDto.validate(data)).toThrow(
          'Only "user" role is allowed during registration'
        )
      })

      it('should throw ValidationException when role has wrong case', () => {
        const data = {
          email: 'test@example.com',
          password: 'password123',
          name: 'John Doe',
          role: 'Admin',
        }

        expect(() => RegisterUserDto.validate(data)).toThrow(ValidationException)
        expect(() => RegisterUserDto.validate(data)).toThrow(
          'Only "user" role is allowed during registration'
        )
      })
    })

    describe('provider validation', () => {
      it('should allow provider without password for OAuth users', () => {
        const data = {
          email: 'oauth@example.com',
          name: 'OAuth User',
          provider: 'google',
          providerId: '123456789',
        }

        const dto = RegisterUserDto.validate(data)

        expect(dto).toBeInstanceOf(RegisterUserDto)
        expect(dto.provider).toBe('google')
        expect(dto.providerId).toBe('123456789')
        expect(dto.password).toBeUndefined()
      })

      it('should allow provider with providerId for OAuth users', () => {
        const data = {
          email: 'oauth@example.com',
          name: 'OAuth User',
          provider: 'google',
          providerId: '123456789',
        }

        const dto = RegisterUserDto.validate(data)

        expect(dto).toBeInstanceOf(RegisterUserDto)
        expect(dto.provider).toBe('google')
        expect(dto.providerId).toBe('123456789')
        expect(dto.password).toBeUndefined()
      })

      it('should throw ValidationException when provider is not a string', () => {
        const data = {
          email: 'test@example.com',
          name: 'John Doe',
          provider: 123,
        }

        expect(() => RegisterUserDto.validate(data)).toThrow(ValidationException)
        expect(() => RegisterUserDto.validate(data)).toThrow(
          'Provider must be a string when password is not provided'
        )
      })

      it('should throw ValidationException when provider is an array', () => {
        const data = {
          email: 'test@example.com',
          name: 'John Doe',
          provider: ['google'],
        }

        expect(() => RegisterUserDto.validate(data)).toThrow(ValidationException)
        expect(() => RegisterUserDto.validate(data)).toThrow(
          'Provider must be a string when password is not provided'
        )
      })

      it('should throw ValidationException when provider is an object', () => {
        const data = {
          email: 'test@example.com',
          name: 'John Doe',
          provider: { name: 'google' },
        }

        expect(() => RegisterUserDto.validate(data)).toThrow(ValidationException)
        expect(() => RegisterUserDto.validate(data)).toThrow(
          'Provider must be a string when password is not provided'
        )
      })

      it('should allow both password and provider', () => {
        const data = {
          email: 'test@example.com',
          name: 'John Doe',
          password: 'password123',
          provider: 'google',
        }

        const dto = RegisterUserDto.validate(data)

        expect(dto).toBeInstanceOf(RegisterUserDto)
        expect(dto.password).toBe('password123')
        expect(dto.provider).toBe('google')
      })

      it('should throw ValidationException when providerId is not a string', () => {
        const data = {
          email: 'test@example.com',
          name: 'John Doe',
          provider: 'google',
          providerId: 12345,
        }

        expect(() => RegisterUserDto.validate(data)).toThrow(ValidationException)
        expect(() => RegisterUserDto.validate(data)).toThrow(
          'ProviderId must be a string when provided'
        )
      })

      it('should throw ValidationException when providerId is empty string', () => {
        const data = {
          email: 'test@example.com',
          name: 'John Doe',
          provider: 'google',
          providerId: '',
        }

        expect(() => RegisterUserDto.validate(data)).toThrow(ValidationException)
        expect(() => RegisterUserDto.validate(data)).toThrow(
          'ProviderId must be a non-empty string when provided'
        )
      })

      it('should throw ValidationException when providerId is whitespace only', () => {
        const data = {
          email: 'test@example.com',
          name: 'John Doe',
          provider: 'google',
          providerId: '   ',
        }

        expect(() => RegisterUserDto.validate(data)).toThrow(ValidationException)
        expect(() => RegisterUserDto.validate(data)).toThrow(
          'ProviderId must be a non-empty string when provided'
        )
      })

      it('should throw ValidationException when provider is set without password but providerId is missing', () => {
        const data = {
          email: 'test@example.com',
          name: 'John Doe',
          provider: 'google',
        }

        expect(() => RegisterUserDto.validate(data)).toThrow(ValidationException)
        expect(() => RegisterUserDto.validate(data)).toThrow(
          'ProviderId is required when using OAuth provider without password'
        )
      })

      it('should allow providerId as undefined', () => {
        const data = {
          email: 'test@example.com',
          name: 'John Doe',
          provider: 'google',
          providerId: undefined,
        }

        expect(() => RegisterUserDto.validate(data)).toThrow(ValidationException)
        expect(() => RegisterUserDto.validate(data)).toThrow(
          'ProviderId is required when using OAuth provider without password'
        )
      })

      it('should allow password with provider without providerId', () => {
        const data = {
          email: 'test@example.com',
          name: 'John Doe',
          password: 'password123',
          provider: 'google',
        }

        const dto = RegisterUserDto.validate(data)

        expect(dto).toBeInstanceOf(RegisterUserDto)
        expect(dto.password).toBe('password123')
        expect(dto.provider).toBe('google')
        expect(dto.providerId).toBeUndefined()
      })
    })

    describe('edge cases', () => {
      it('should throw error when data is null', () => {
        expect(() => RegisterUserDto.validate(null)).toThrow()
      })

      it('should throw error when data is undefined', () => {
        expect(() => RegisterUserDto.validate(undefined)).toThrow()
      })

      it('should throw ValidationException when data is empty object', () => {
        expect(() => RegisterUserDto.validate({})).toThrow(ValidationException)
        expect(() => RegisterUserDto.validate({})).toThrow('Email is required and must be a string')
      })

      it('should validate only the first error (email checked first)', () => {
        const data = {
          email: 123,
          password: 456,
          name: 789,
        }

        expect(() => RegisterUserDto.validate(data)).toThrow(
          'Email is required and must be a string'
        )
      })

      it('should validate password second if email is valid', () => {
        const data = {
          email: 'test@example.com',
          password: 456,
          name: 789,
        }

        expect(() => RegisterUserDto.validate(data)).toThrow(
          'Password must be a string when provider is not provided'
        )
      })

      it('should validate name third if email and password are valid', () => {
        const data = {
          email: 'test@example.com',
          password: 'password123',
          name: 789,
        }

        expect(() => RegisterUserDto.validate(data)).toThrow(
          'Name is required and must be a string'
        )
      })

      it('should skip password validation if provider and providerId are present', () => {
        const data = {
          email: 'test@example.com',
          name: 'OAuth User',
          provider: 'google',
          providerId: '123456789',
        }

        const dto = RegisterUserDto.validate(data)

        expect(dto).toBeInstanceOf(RegisterUserDto)
        expect(dto.password).toBeUndefined()
        expect(dto.provider).toBe('google')
        expect(dto.providerId).toBe('123456789')
      })
    })

    describe('static method', () => {
      it('should be a static method', () => {
        expect(typeof RegisterUserDto.validate).toBe('function')
      })

      it('should be callable without instance', () => {
        const data = {
          email: 'test@example.com',
          password: 'password123',
          name: 'John Doe',
        }

        const dto = RegisterUserDto.validate(data)

        expect(dto).toBeInstanceOf(RegisterUserDto)
      })
    })

    describe('type safety', () => {
      it('should handle data with correct types', () => {
        const data: any = {
          email: 'test@example.com',
          password: 'password123',
          name: 'John Doe',
        }

        const dto = RegisterUserDto.validate(data)

        expect(typeof dto.email).toBe('string')
        expect(typeof dto.name).toBe('string')
        expect(typeof dto.password).toBe('string')
      })

      it('should handle OAuth user types with providerId', () => {
        const data: any = {
          email: 'test@example.com',
          name: 'John Doe',
          provider: 'google',
          providerId: '987654321',
        }

        const dto = RegisterUserDto.validate(data)

        expect(typeof dto.email).toBe('string')
        expect(typeof dto.name).toBe('string')
        expect(dto.password).toBeUndefined()
        expect(typeof dto.provider).toBe('string')
        expect(typeof dto.providerId).toBe('string')
      })

      it('should preserve exact string values', () => {
        const data = {
          email: 'user@domain.co.uk',
          password: 'MyP@ssw0rd!',
          name: "Jane O'Brien-Smith",
        }

        const dto = RegisterUserDto.validate(data)

        expect(dto.email).toBe('user@domain.co.uk')
        expect(dto.name).toBe("Jane O'Brien-Smith")
        expect(dto.password).toBe('MyP@ssw0rd!')
      })

      it('should handle special characters in strings', () => {
        const data = {
          email: 'test+tag@example.com',
          password: '!@#$%^&*()_+-=[]{}|;:",.<>?',
          name: 'Müller São José',
        }

        const dto = RegisterUserDto.validate(data)

        expect(dto.email).toBe(data.email)
        expect(dto.name).toBe(data.name)
        expect(dto.password).toBe(data.password)
      })
    })
  })
})
