import { describe, expect, it } from 'vitest'

import { LoginUserDto } from '../../../src/application/dtos/login-user.dto.js'
import { TypeException } from '../../../src/shared/exceptions/type.exception.js'
import { ValidationException } from '../../../src/shared/exceptions/validation.exception.js'

describe('LoginUserDto', () => {
  describe('constructor', () => {
    it('should create a LoginUserDto with valid data', () => {
      const email = 'test@example.com'
      const password = 'password123'

      const dto = new LoginUserDto(email, password)

      expect(dto.email).toBe(email)
      expect(dto.password).toBe(password)
    })

    it('should have readonly properties at compile time', () => {
      const dto = new LoginUserDto('test@example.com', 'password123')

      // TypeScript readonly is compile-time only, but properties should exist
      expect(dto.email).toBeDefined()
      expect(dto.password).toBeDefined()

      // Properties are public and enumerable
      const emailDescriptor = Object.getOwnPropertyDescriptor(dto, 'email')
      const passwordDescriptor = Object.getOwnPropertyDescriptor(dto, 'password')

      expect(emailDescriptor?.enumerable).toBe(true)
      expect(passwordDescriptor?.enumerable).toBe(true)
    })

    it('should be instance of LoginUserDto', () => {
      const dto = new LoginUserDto('test@example.com', 'password123')

      expect(dto).toBeInstanceOf(LoginUserDto)
    })

    it('should accept any string value for email', () => {
      const dto = new LoginUserDto('any-string', 'password123')

      expect(dto.email).toBe('any-string')
    })

    it('should accept any string value for password', () => {
      const dto = new LoginUserDto('test@example.com', 'any-password')

      expect(dto.password).toBe('any-password')
    })

    it('should preserve email case sensitivity', () => {
      const email = 'Test@Example.COM'
      const dto = new LoginUserDto(email, 'password123')

      expect(dto.email).toBe(email)
    })

    it('should preserve password exactly as provided', () => {
      const password = 'P@ssW0rd!123'
      const dto = new LoginUserDto('test@example.com', password)

      expect(dto.password).toBe(password)
    })

    it('should handle empty strings without validation', () => {
      const dto = new LoginUserDto('', '')

      expect(dto.email).toBe('')
      expect(dto.password).toBe('')
    })
  })

  describe('validate()', () => {
    describe('successful validation', () => {
      it('should validate and create LoginUserDto with valid data', () => {
        const data = {
          email: 'test@example.com',
          password: 'password123',
        }

        const dto = LoginUserDto.validate(data)

        expect(dto).toBeInstanceOf(LoginUserDto)
        expect(dto.email).toBe(data.email)
        expect(dto.password).toBe(data.password)
      })

      it('should validate with email containing special characters', () => {
        const data = {
          email: 'user+tag@example.co.uk',
          password: 'password123',
        }

        const dto = LoginUserDto.validate(data)

        expect(dto.email).toBe(data.email)
        expect(dto.password).toBe(data.password)
      })

      it('should validate with password containing special characters', () => {
        const data = {
          email: 'test@example.com',
          password: 'P@ssw0rd!#$%',
        }

        const dto = LoginUserDto.validate(data)

        expect(dto.email).toBe(data.email)
        expect(dto.password).toBe(data.password)
      })

      it('should validate with long email', () => {
        const longEmail = 'a'.repeat(50) + '@example.com'
        const data = {
          email: longEmail,
          password: 'password123',
        }

        const dto = LoginUserDto.validate(data)

        expect(dto.email).toBe(longEmail)
      })

      it('should validate with long password', () => {
        const longPassword = 'a'.repeat(100)
        const data = {
          email: 'test@example.com',
          password: longPassword,
        }

        const dto = LoginUserDto.validate(data)

        expect(dto.password).toBe(longPassword)
      })

      it('should validate with password containing spaces', () => {
        const data = {
          email: 'test@example.com',
          password: 'pass word 123',
        }

        const dto = LoginUserDto.validate(data)

        expect(dto.password).toBe(data.password)
      })

      it('should validate with unicode characters in email', () => {
        const data = {
          email: 'test汉字@example.com',
          password: 'password123',
        }

        const dto = LoginUserDto.validate(data)

        expect(dto.email).toBe(data.email)
      })

      it('should validate with unicode characters in password', () => {
        const data = {
          email: 'test@example.com',
          password: 'pässwørd汉字',
        }

        const dto = LoginUserDto.validate(data)

        expect(dto.password).toBe(data.password)
      })

      it('should ignore extra properties in data object', () => {
        const data = {
          email: 'test@example.com',
          password: 'password123',
          extraField: 'should be ignored',
          anotherField: 123,
        }

        const dto = LoginUserDto.validate(data)

        expect(dto.email).toBe(data.email)
        expect(dto.password).toBe(data.password)
        expect(dto).not.toHaveProperty('extraField')
        expect(dto).not.toHaveProperty('anotherField')
      })

      it('should validate with whitespace-only email (truthy string)', () => {
        const data = {
          email: '   ',
          password: 'password123',
        }

        const dto = LoginUserDto.validate(data)

        expect(dto.email).toBe('   ')
      })

      it('should validate with whitespace-only password (truthy string)', () => {
        const data = {
          email: 'test@example.com',
          password: '   ',
        }

        const dto = LoginUserDto.validate(data)

        expect(dto.password).toBe('   ')
      })
    })

    describe('TypeException - invalid data type', () => {
      it('should throw TypeException when data is null', () => {
        expect(() => LoginUserDto.validate(null)).toThrow(TypeException)
        expect(() => LoginUserDto.validate(null)).toThrow('Data must be a valid object')
      })

      it('should throw TypeException when data is undefined', () => {
        expect(() => LoginUserDto.validate(undefined)).toThrow(TypeException)
        expect(() => LoginUserDto.validate(undefined)).toThrow('Data must be a valid object')
      })

      it('should throw TypeException when data is an array', () => {
        expect(() => LoginUserDto.validate([])).toThrow(TypeException)
        expect(() => LoginUserDto.validate([])).toThrow('Data must be a valid object')
      })

      it('should throw TypeException when data is an array with values', () => {
        expect(() => LoginUserDto.validate(['email@example.com', 'password123'])).toThrow(
          TypeException
        )
        expect(() => LoginUserDto.validate(['email@example.com', 'password123'])).toThrow(
          'Data must be a valid object'
        )
      })

      it('should throw TypeException when data is a string', () => {
        expect(() => LoginUserDto.validate('string')).toThrow(TypeException)
        expect(() => LoginUserDto.validate('string')).toThrow('Data must be a valid object')
      })

      it('should throw TypeException when data is a number', () => {
        expect(() => LoginUserDto.validate(123)).toThrow(TypeException)
        expect(() => LoginUserDto.validate(123)).toThrow('Data must be a valid object')
      })

      it('should throw TypeException when data is a boolean', () => {
        expect(() => LoginUserDto.validate(true)).toThrow(TypeException)
        expect(() => LoginUserDto.validate(true)).toThrow('Data must be a valid object')
      })

      it('should throw TypeException when data is a function', () => {
        expect(() => LoginUserDto.validate(() => {})).toThrow(TypeException)
        expect(() => LoginUserDto.validate(() => {})).toThrow('Data must be a valid object')
      })
    })

    describe('ValidationException - missing email', () => {
      it('should throw ValidationException when email is missing', () => {
        const data = {
          password: 'password123',
        }

        expect(() => LoginUserDto.validate(data)).toThrow(ValidationException)
        expect(() => LoginUserDto.validate(data)).toThrow('Email is required and must be a string')
      })

      it('should throw ValidationException when email is null', () => {
        const data = {
          email: null,
          password: 'password123',
        }

        expect(() => LoginUserDto.validate(data)).toThrow(ValidationException)
        expect(() => LoginUserDto.validate(data)).toThrow('Email is required and must be a string')
      })

      it('should throw ValidationException when email is undefined', () => {
        const data = {
          email: undefined,
          password: 'password123',
        }

        expect(() => LoginUserDto.validate(data)).toThrow(ValidationException)
        expect(() => LoginUserDto.validate(data)).toThrow('Email is required and must be a string')
      })

      it('should throw ValidationException when email is empty string', () => {
        const data = {
          email: '',
          password: 'password123',
        }

        expect(() => LoginUserDto.validate(data)).toThrow(ValidationException)
        expect(() => LoginUserDto.validate(data)).toThrow('Email is required and must be a string')
      })

      it('should throw ValidationException when email is a number', () => {
        const data = {
          email: 123,
          password: 'password123',
        }

        expect(() => LoginUserDto.validate(data)).toThrow(ValidationException)
        expect(() => LoginUserDto.validate(data)).toThrow('Email is required and must be a string')
      })

      it('should throw ValidationException when email is a boolean', () => {
        const data = {
          email: true,
          password: 'password123',
        }

        expect(() => LoginUserDto.validate(data)).toThrow(ValidationException)
        expect(() => LoginUserDto.validate(data)).toThrow('Email is required and must be a string')
      })

      it('should throw ValidationException when email is an object', () => {
        const data = {
          email: { value: 'test@example.com' },
          password: 'password123',
        }

        expect(() => LoginUserDto.validate(data)).toThrow(ValidationException)
        expect(() => LoginUserDto.validate(data)).toThrow('Email is required and must be a string')
      })

      it('should throw ValidationException when email is an array', () => {
        const data = {
          email: ['test@example.com'],
          password: 'password123',
        }

        expect(() => LoginUserDto.validate(data)).toThrow(ValidationException)
        expect(() => LoginUserDto.validate(data)).toThrow('Email is required and must be a string')
      })
    })

    describe('ValidationException - missing password', () => {
      it('should throw ValidationException when password is missing', () => {
        const data = {
          email: 'test@example.com',
        }

        expect(() => LoginUserDto.validate(data)).toThrow(ValidationException)
        expect(() => LoginUserDto.validate(data)).toThrow(
          'Password is required and must be a string'
        )
      })

      it('should throw ValidationException when password is null', () => {
        const data = {
          email: 'test@example.com',
          password: null,
        }

        expect(() => LoginUserDto.validate(data)).toThrow(ValidationException)
        expect(() => LoginUserDto.validate(data)).toThrow(
          'Password is required and must be a string'
        )
      })

      it('should throw ValidationException when password is undefined', () => {
        const data = {
          email: 'test@example.com',
          password: undefined,
        }

        expect(() => LoginUserDto.validate(data)).toThrow(ValidationException)
        expect(() => LoginUserDto.validate(data)).toThrow(
          'Password is required and must be a string'
        )
      })

      it('should throw ValidationException when password is empty string', () => {
        const data = {
          email: 'test@example.com',
          password: '',
        }

        expect(() => LoginUserDto.validate(data)).toThrow(ValidationException)
        expect(() => LoginUserDto.validate(data)).toThrow(
          'Password is required and must be a string'
        )
      })

      it('should throw ValidationException when password is a number', () => {
        const data = {
          email: 'test@example.com',
          password: 123456,
        }

        expect(() => LoginUserDto.validate(data)).toThrow(ValidationException)
        expect(() => LoginUserDto.validate(data)).toThrow(
          'Password is required and must be a string'
        )
      })

      it('should throw ValidationException when password is a boolean', () => {
        const data = {
          email: 'test@example.com',
          password: false,
        }

        expect(() => LoginUserDto.validate(data)).toThrow(ValidationException)
        expect(() => LoginUserDto.validate(data)).toThrow(
          'Password is required and must be a string'
        )
      })

      it('should throw ValidationException when password is an object', () => {
        const data = {
          email: 'test@example.com',
          password: { value: 'password123' },
        }

        expect(() => LoginUserDto.validate(data)).toThrow(ValidationException)
        expect(() => LoginUserDto.validate(data)).toThrow(
          'Password is required and must be a string'
        )
      })

      it('should throw ValidationException when password is an array', () => {
        const data = {
          email: 'test@example.com',
          password: ['password123'],
        }

        expect(() => LoginUserDto.validate(data)).toThrow(ValidationException)
        expect(() => LoginUserDto.validate(data)).toThrow(
          'Password is required and must be a string'
        )
      })
    })

    describe('ValidationException - both email and password invalid', () => {
      it('should throw ValidationException for email when both are missing', () => {
        const data = {}

        expect(() => LoginUserDto.validate(data)).toThrow(ValidationException)
        expect(() => LoginUserDto.validate(data)).toThrow('Email is required and must be a string')
      })

      it('should throw ValidationException for email when both are null', () => {
        const data = {
          email: null,
          password: null,
        }

        expect(() => LoginUserDto.validate(data)).toThrow(ValidationException)
        expect(() => LoginUserDto.validate(data)).toThrow('Email is required and must be a string')
      })

      it('should throw ValidationException for email when both are empty strings', () => {
        const data = {
          email: '',
          password: '',
        }

        expect(() => LoginUserDto.validate(data)).toThrow(ValidationException)
        expect(() => LoginUserDto.validate(data)).toThrow('Email is required and must be a string')
      })

      it('should throw ValidationException for email when both are wrong types', () => {
        const data = {
          email: 123,
          password: true,
        }

        expect(() => LoginUserDto.validate(data)).toThrow(ValidationException)
        expect(() => LoginUserDto.validate(data)).toThrow('Email is required and must be a string')
      })
    })

    describe('Edge cases', () => {
      it('should validate with single character email', () => {
        const data = {
          email: 'a',
          password: 'password123',
        }

        const dto = LoginUserDto.validate(data)

        expect(dto.email).toBe('a')
      })

      it('should validate with single character password', () => {
        const data = {
          email: 'test@example.com',
          password: 'p',
        }

        const dto = LoginUserDto.validate(data)

        expect(dto.password).toBe('p')
      })

      it('should validate with email containing newlines', () => {
        const data = {
          email: 'test\n@example.com',
          password: 'password123',
        }

        const dto = LoginUserDto.validate(data)

        expect(dto.email).toBe('test\n@example.com')
      })

      it('should validate with password containing newlines', () => {
        const data = {
          email: 'test@example.com',
          password: 'pass\nword',
        }

        const dto = LoginUserDto.validate(data)

        expect(dto.password).toBe('pass\nword')
      })

      it('should validate with numeric string email', () => {
        const data = {
          email: '12345',
          password: 'password123',
        }

        const dto = LoginUserDto.validate(data)

        expect(dto.email).toBe('12345')
      })

      it('should validate with numeric string password', () => {
        const data = {
          email: 'test@example.com',
          password: '12345',
        }

        const dto = LoginUserDto.validate(data)

        expect(dto.password).toBe('12345')
      })
    })

    describe('Return value', () => {
      it('should return an instance of LoginUserDto', () => {
        const data = {
          email: 'test@example.com',
          password: 'password123',
        }

        const dto = LoginUserDto.validate(data)

        expect(dto).toBeInstanceOf(LoginUserDto)
      })

      it('should return a new instance each time', () => {
        const data = {
          email: 'test@example.com',
          password: 'password123',
        }

        const dto1 = LoginUserDto.validate(data)
        const dto2 = LoginUserDto.validate(data)

        expect(dto1).not.toBe(dto2)
        expect(dto1.email).toBe(dto2.email)
        expect(dto1.password).toBe(dto2.password)
      })

      it('should have only email and password properties', () => {
        const data = {
          email: 'test@example.com',
          password: 'password123',
          extraField: 'ignored',
        }

        const dto = LoginUserDto.validate(data)
        const keys = Object.keys(dto)

        expect(keys).toHaveLength(2)
        expect(keys).toContain('email')
        expect(keys).toContain('password')
      })
    })
  })
})
