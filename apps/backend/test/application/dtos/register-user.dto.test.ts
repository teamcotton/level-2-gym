import { describe, expect, it } from 'vitest'

import { RegisterUserDto } from '../../../src/application/dtos/register-user.dto.js'
import { ValidationException } from '../../../src/shared/exceptions/validation.exception.js'

describe('RegisterUserDto', () => {
  describe('constructor', () => {
    it('should create a RegisterUserDto with valid data', () => {
      const email = 'test@example.com'
      const password = 'password123'
      const name = 'John Doe'

      const dto = new RegisterUserDto(email, password, name)

      expect(dto.email).toBe(email)
      expect(dto.password).toBe(password)
      expect(dto.name).toBe(name)
      expect(dto.role).toBe('user')
    })

    it('should create a RegisterUserDto with custom role', () => {
      const email = 'admin@example.com'
      const password = 'password123'
      const name = 'Admin User'
      const role = 'admin'

      const dto = new RegisterUserDto(email, password, name, role)

      expect(dto.email).toBe(email)
      expect(dto.password).toBe(password)
      expect(dto.name).toBe(name)
      expect(dto.role).toBe(role)
    })

    it('should default to "user" role when not provided', () => {
      const dto = new RegisterUserDto('test@example.com', 'password123', 'John Doe')

      expect(dto.role).toBe('user')
    })

    it('should have readonly properties at compile time', () => {
      const dto = new RegisterUserDto('test@example.com', 'password123', 'John Doe')

      // TypeScript readonly is compile-time only, but properties should exist
      expect(dto.email).toBeDefined()
      expect(dto.password).toBeDefined()
      expect(dto.name).toBeDefined()

      // Properties are public and enumerable
      const descriptor1 = Object.getOwnPropertyDescriptor(dto, 'email')
      const descriptor2 = Object.getOwnPropertyDescriptor(dto, 'password')
      const descriptor3 = Object.getOwnPropertyDescriptor(dto, 'name')

      expect(descriptor1?.enumerable).toBe(true)
      expect(descriptor2?.enumerable).toBe(true)
      expect(descriptor3?.enumerable).toBe(true)
    })

    it('should be instance of RegisterUserDto', () => {
      const dto = new RegisterUserDto('test@example.com', 'password123', 'John Doe')

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

      it('should validate and create RegisterUserDto with custom role', () => {
        const data = {
          email: 'admin@example.com',
          password: 'password123',
          name: 'Admin User',
          role: 'admin',
        }

        const dto = RegisterUserDto.validate(data)

        expect(dto).toBeInstanceOf(RegisterUserDto)
        expect(dto.email).toBe(data.email)
        expect(dto.password).toBe(data.password)
        expect(dto.name).toBe(data.name)
        expect(dto.role).toBe(data.role)
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
        expect(dto.password).toBe(data.password)
        expect(dto.name).toBe(data.name)
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
        expect(dto.password).toBe(data.password)
        expect(dto.name).toBe(data.name)
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
      it('should throw ValidationException when password is missing', () => {
        const data = {
          email: 'test@example.com',
          name: 'John Doe',
        }

        expect(() => RegisterUserDto.validate(data)).toThrow(ValidationException)
        expect(() => RegisterUserDto.validate(data)).toThrow(
          'Password is required and must be a string'
        )
      })

      it('should throw ValidationException when password is null', () => {
        const data = {
          email: 'test@example.com',
          password: null,
          name: 'John Doe',
        }

        expect(() => RegisterUserDto.validate(data)).toThrow(ValidationException)
        expect(() => RegisterUserDto.validate(data)).toThrow(
          'Password is required and must be a string'
        )
      })

      it('should throw ValidationException when password is undefined', () => {
        const data = {
          email: 'test@example.com',
          password: undefined,
          name: 'John Doe',
        }

        expect(() => RegisterUserDto.validate(data)).toThrow(ValidationException)
        expect(() => RegisterUserDto.validate(data)).toThrow(
          'Password is required and must be a string'
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
          'Password is required and must be a string'
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
          'Password is required and must be a string'
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
          'Password is required and must be a string'
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
          'Password is required and must be a string'
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
      it('should not throw when role is valid', () => {
        const data = {
          email: 'test@example.com',
          password: 'password123',
          name: 'John Doe',
          role: 'moderator',
        }

        expect(() => RegisterUserDto.validate(data)).not.toThrow()
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
          'Invalid role. Must be one of: user, admin, moderator'
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
          'Invalid role. Must be one of: user, admin, moderator'
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
          'Invalid role. Must be one of: user, admin, moderator'
        )
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
          'Password is required and must be a string'
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
        expect(typeof dto.password).toBe('string')
        expect(typeof dto.name).toBe('string')
      })

      it('should preserve exact string values', () => {
        const data = {
          email: 'user@domain.co.uk',
          password: 'MyP@ssw0rd!',
          name: "Jane O'Brien-Smith",
        }

        const dto = RegisterUserDto.validate(data)

        expect(dto.email).toBe('user@domain.co.uk')
        expect(dto.password).toBe('MyP@ssw0rd!')
        expect(dto.name).toBe("Jane O'Brien-Smith")
      })

      it('should handle special characters in strings', () => {
        const data = {
          email: 'test+tag@example.com',
          password: '!@#$%^&*()_+-=[]{}|;:",.<>?',
          name: 'Müller São José',
        }

        const dto = RegisterUserDto.validate(data)

        expect(dto.email).toBe(data.email)
        expect(dto.password).toBe(data.password)
        expect(dto.name).toBe(data.name)
      })
    })
  })
})
