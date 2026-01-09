import { describe, expect, it } from 'vitest'

import { OAuthSyncDto } from '../../../src/application/dtos/oauth-sync.dto.js'
import { TypeException } from '../../../src/shared/exceptions/type.exception.js'
import { ValidationException } from '../../../src/shared/exceptions/validation.exception.js'

describe('OAuthSyncDto', () => {
  describe('constructor', () => {
    it('should create an OAuthSyncDto with all required fields', () => {
      const provider = 'google'
      const providerId = '1234567890'
      const email = 'test@example.com'

      const dto = new OAuthSyncDto(provider, providerId, email)

      expect(dto.provider).toBe(provider)
      expect(dto.providerId).toBe(providerId)
      expect(dto.email).toBe(email)
      expect(dto.name).toBeUndefined()
    })

    it('should create an OAuthSyncDto with optional name field', () => {
      const provider = 'github'
      const providerId = '9876543210'
      const email = 'dev@example.com'
      const name = 'John Doe'

      const dto = new OAuthSyncDto(provider, providerId, email, name)

      expect(dto.provider).toBe(provider)
      expect(dto.providerId).toBe(providerId)
      expect(dto.email).toBe(email)
      expect(dto.name).toBe(name)
    })

    it('should have readonly properties at compile time', () => {
      const dto = new OAuthSyncDto('google', '12345', 'test@example.com', 'Test User')

      expect(dto.provider).toBeDefined()
      expect(dto.providerId).toBeDefined()
      expect(dto.email).toBeDefined()
      expect(dto.name).toBeDefined()

      const providerDescriptor = Object.getOwnPropertyDescriptor(dto, 'provider')
      const providerIdDescriptor = Object.getOwnPropertyDescriptor(dto, 'providerId')
      const emailDescriptor = Object.getOwnPropertyDescriptor(dto, 'email')
      const nameDescriptor = Object.getOwnPropertyDescriptor(dto, 'name')

      expect(providerDescriptor?.enumerable).toBe(true)
      expect(providerIdDescriptor?.enumerable).toBe(true)
      expect(emailDescriptor?.enumerable).toBe(true)
      expect(nameDescriptor?.enumerable).toBe(true)
    })

    it('should be instance of OAuthSyncDto', () => {
      const dto = new OAuthSyncDto('google', '12345', 'test@example.com')

      expect(dto).toBeInstanceOf(OAuthSyncDto)
    })
  })

  describe('validate()', () => {
    describe('successful validation', () => {
      it('should validate and create OAuthSyncDto with all required fields', () => {
        const data = {
          provider: 'google',
          providerId: '1234567890',
          email: 'test@example.com',
        }

        const dto = OAuthSyncDto.validate(data)

        expect(dto).toBeInstanceOf(OAuthSyncDto)
        expect(dto.provider).toBe(data.provider)
        expect(dto.providerId).toBe(data.providerId)
        expect(dto.email).toBe(data.email)
        expect(dto.name).toBeUndefined()
      })

      it('should validate and create OAuthSyncDto with optional name field', () => {
        const data = {
          provider: 'github',
          providerId: '9876543210',
          email: 'dev@example.com',
          name: 'John Doe',
        }

        const dto = OAuthSyncDto.validate(data)

        expect(dto).toBeInstanceOf(OAuthSyncDto)
        expect(dto.provider).toBe(data.provider)
        expect(dto.providerId).toBe(data.providerId)
        expect(dto.email).toBe(data.email)
        expect(dto.name).toBe(data.name)
      })

      it('should validate with email containing special characters', () => {
        const data = {
          provider: 'google',
          providerId: '12345',
          email: 'user+tag@example.co.uk',
        }

        const dto = OAuthSyncDto.validate(data)

        expect(dto.email).toBe(data.email)
      })

      it('should validate with different OAuth providers', () => {
        const providers = ['google', 'github', 'facebook', 'twitter', 'linkedin']

        providers.forEach((provider) => {
          const data = {
            provider,
            providerId: '12345',
            email: 'user@example.com',
          }

          const dto = OAuthSyncDto.validate(data)

          expect(dto.provider).toBe(provider)
        })
      })

      it('should validate with long providerId', () => {
        const longProviderId = 'a'.repeat(100)
        const data = {
          provider: 'google',
          providerId: longProviderId,
          email: 'user@example.com',
        }

        const dto = OAuthSyncDto.validate(data)

        expect(dto.providerId).toBe(longProviderId)
      })

      it('should validate with long name', () => {
        const longName = 'John ' + 'Doe '.repeat(50)
        const data = {
          provider: 'google',
          providerId: '12345',
          email: 'user@example.com',
          name: longName,
        }

        const dto = OAuthSyncDto.validate(data)

        expect(dto.name).toBe(longName)
      })

      it('should validate with unicode characters in name', () => {
        const data = {
          provider: 'google',
          providerId: '12345',
          email: 'user@example.com',
          name: 'José García 汉字',
        }

        const dto = OAuthSyncDto.validate(data)

        expect(dto.name).toBe(data.name)
      })

      it('should ignore extra properties in data object', () => {
        const data = {
          provider: 'google',
          providerId: '12345',
          email: 'user@example.com',
          name: 'John Doe',
          extraField: 'should be ignored',
          anotherField: 123,
        }

        const dto = OAuthSyncDto.validate(data)

        expect(dto.provider).toBe(data.provider)
        expect(dto.providerId).toBe(data.providerId)
        expect(dto.email).toBe(data.email)
        expect(dto.name).toBe(data.name)
        expect(dto).not.toHaveProperty('extraField')
        expect(dto).not.toHaveProperty('anotherField')
      })

      it('should validate with whitespace-only provider (truthy string)', () => {
        const data = {
          provider: '   ',
          providerId: '12345',
          email: 'test@example.com',
        }

        // Whitespace-only strings should now be rejected
        expect(() => OAuthSyncDto.validate(data)).toThrow(ValidationException)
        expect(() => OAuthSyncDto.validate(data)).toThrow(
          'Provider is required and must be a non-empty string'
        )
      })

      it('should validate with whitespace-only providerId (truthy string)', () => {
        const data = {
          provider: 'google',
          providerId: '   ',
          email: 'test@example.com',
        }

        // Whitespace-only strings should now be rejected
        expect(() => OAuthSyncDto.validate(data)).toThrow(ValidationException)
        expect(() => OAuthSyncDto.validate(data)).toThrow(
          'ProviderId is required and must be a non-empty string'
        )
      })

      it('should validate with whitespace-only name (truthy string)', () => {
        const data = {
          provider: 'google',
          providerId: '12345',
          email: 'test@example.com',
          name: '   ',
        }

        const dto = OAuthSyncDto.validate(data)

        expect(dto.name).toBe('   ')
      })
    })

    describe('TypeException - invalid data type', () => {
      it('should throw TypeException when data is null', () => {
        expect(() => OAuthSyncDto.validate(null)).toThrow(TypeException)
        expect(() => OAuthSyncDto.validate(null)).toThrow('Data must be a valid object')
      })

      it('should throw TypeException when data is undefined', () => {
        expect(() => OAuthSyncDto.validate(undefined)).toThrow(TypeException)
        expect(() => OAuthSyncDto.validate(undefined)).toThrow('Data must be a valid object')
      })

      it('should throw TypeException when data is an array', () => {
        expect(() => OAuthSyncDto.validate([])).toThrow(TypeException)
        expect(() => OAuthSyncDto.validate([])).toThrow('Data must be a valid object')
      })

      it('should throw TypeException when data is a string', () => {
        expect(() => OAuthSyncDto.validate('string')).toThrow(TypeException)
        expect(() => OAuthSyncDto.validate('string')).toThrow('Data must be a valid object')
      })

      it('should throw TypeException when data is a number', () => {
        expect(() => OAuthSyncDto.validate(123)).toThrow(TypeException)
        expect(() => OAuthSyncDto.validate(123)).toThrow('Data must be a valid object')
      })
    })

    describe('ValidationException - missing provider', () => {
      it('should throw ValidationException when provider is missing', () => {
        const data = {
          providerId: '12345',
          email: 'test@example.com',
        }

        expect(() => OAuthSyncDto.validate(data)).toThrow(ValidationException)
        expect(() => OAuthSyncDto.validate(data)).toThrow(
          'Provider is required and must be a non-empty string'
        )
      })

      it('should throw ValidationException when provider is null', () => {
        const data = {
          provider: null,
          providerId: '12345',
          email: 'test@example.com',
        }

        expect(() => OAuthSyncDto.validate(data)).toThrow(ValidationException)
        expect(() => OAuthSyncDto.validate(data)).toThrow(
          'Provider is required and must be a non-empty string'
        )
      })

      it('should throw ValidationException when provider is empty string', () => {
        const data = {
          provider: '',
          providerId: '12345',
          email: 'test@example.com',
        }

        expect(() => OAuthSyncDto.validate(data)).toThrow(ValidationException)
        expect(() => OAuthSyncDto.validate(data)).toThrow(
          'Provider is required and must be a non-empty string'
        )
      })

      it('should throw ValidationException when provider is a number', () => {
        const data = {
          provider: 123,
          providerId: '12345',
          email: 'test@example.com',
        }

        expect(() => OAuthSyncDto.validate(data)).toThrow(ValidationException)
        expect(() => OAuthSyncDto.validate(data)).toThrow(
          'Provider is required and must be a non-empty string'
        )
      })
    })

    describe('ValidationException - missing providerId', () => {
      it('should throw ValidationException when providerId is missing', () => {
        const data = {
          provider: 'google',
          email: 'test@example.com',
        }

        expect(() => OAuthSyncDto.validate(data)).toThrow(ValidationException)
        expect(() => OAuthSyncDto.validate(data)).toThrow(
          'ProviderId is required and must be a non-empty string'
        )
      })

      it('should throw ValidationException when providerId is null', () => {
        const data = {
          provider: 'google',
          providerId: null,
          email: 'test@example.com',
        }

        expect(() => OAuthSyncDto.validate(data)).toThrow(ValidationException)
        expect(() => OAuthSyncDto.validate(data)).toThrow(
          'ProviderId is required and must be a non-empty string'
        )
      })

      it('should throw ValidationException when providerId is empty string', () => {
        const data = {
          provider: 'google',
          providerId: '',
          email: 'test@example.com',
        }

        expect(() => OAuthSyncDto.validate(data)).toThrow(ValidationException)
        expect(() => OAuthSyncDto.validate(data)).toThrow(
          'ProviderId is required and must be a non-empty string'
        )
      })

      it('should throw ValidationException when providerId is a number', () => {
        const data = {
          provider: 'google',
          providerId: 12345,
          email: 'test@example.com',
        }

        expect(() => OAuthSyncDto.validate(data)).toThrow(ValidationException)
        expect(() => OAuthSyncDto.validate(data)).toThrow(
          'ProviderId is required and must be a non-empty string'
        )
      })
    })

    describe('ValidationException - missing email', () => {
      it('should throw ValidationException when email is missing', () => {
        const data = {
          provider: 'google',
          providerId: '12345',
        }

        expect(() => OAuthSyncDto.validate(data)).toThrow(ValidationException)
        expect(() => OAuthSyncDto.validate(data)).toThrow(
          'Email is required and must be a non-empty string'
        )
      })

      it('should throw ValidationException when email is null', () => {
        const data = {
          provider: 'google',
          providerId: '12345',
          email: null,
        }

        expect(() => OAuthSyncDto.validate(data)).toThrow(ValidationException)
        expect(() => OAuthSyncDto.validate(data)).toThrow(
          'Email is required and must be a non-empty string'
        )
      })

      it('should throw ValidationException when email is empty string', () => {
        const data = {
          provider: 'google',
          providerId: '12345',
          email: '',
        }

        expect(() => OAuthSyncDto.validate(data)).toThrow(ValidationException)
        expect(() => OAuthSyncDto.validate(data)).toThrow(
          'Email is required and must be a non-empty string'
        )
      })

      it('should throw ValidationException when email is a number', () => {
        const data = {
          provider: 'google',
          providerId: '12345',
          email: 123,
        }

        expect(() => OAuthSyncDto.validate(data)).toThrow(ValidationException)
        expect(() => OAuthSyncDto.validate(data)).toThrow(
          'Email is required and must be a non-empty string'
        )
      })
    })

    describe('ValidationException - invalid email format', () => {
      it('should throw ValidationException when email is not a valid format', () => {
        const data = {
          provider: 'google',
          providerId: '12345',
          email: 'not-an-email',
        }

        expect(() => OAuthSyncDto.validate(data)).toThrow(ValidationException)
        expect(() => OAuthSyncDto.validate(data)).toThrow('Email must be a valid email address')
      })

      it('should throw ValidationException when email is missing @ symbol', () => {
        const data = {
          provider: 'google',
          providerId: '12345',
          email: 'testexample.com',
        }

        expect(() => OAuthSyncDto.validate(data)).toThrow(ValidationException)
        expect(() => OAuthSyncDto.validate(data)).toThrow('Email must be a valid email address')
      })

      it('should throw ValidationException when email is missing domain', () => {
        const data = {
          provider: 'google',
          providerId: '12345',
          email: 'test@',
        }

        expect(() => OAuthSyncDto.validate(data)).toThrow(ValidationException)
        expect(() => OAuthSyncDto.validate(data)).toThrow('Email must be a valid email address')
      })

      it('should throw ValidationException when email has no local part', () => {
        const data = {
          provider: 'google',
          providerId: '12345',
          email: '@example.com',
        }

        expect(() => OAuthSyncDto.validate(data)).toThrow(ValidationException)
        expect(() => OAuthSyncDto.validate(data)).toThrow('Email must be a valid email address')
      })
    })

    describe('ValidationException - invalid name', () => {
      it('should throw ValidationException when name is a number', () => {
        const data = {
          provider: 'google',
          providerId: '12345',
          email: 'test@example.com',
          name: 123,
        }

        expect(() => OAuthSyncDto.validate(data)).toThrow(ValidationException)
        expect(() => OAuthSyncDto.validate(data)).toThrow('Name must be a string')
      })

      it('should throw ValidationException when name is a boolean', () => {
        const data = {
          provider: 'google',
          providerId: '12345',
          email: 'test@example.com',
          name: true,
        }

        expect(() => OAuthSyncDto.validate(data)).toThrow(ValidationException)
        expect(() => OAuthSyncDto.validate(data)).toThrow('Name must be a string')
      })

      it('should throw ValidationException when name is an object', () => {
        const data = {
          provider: 'google',
          providerId: '12345',
          email: 'test@example.com',
          name: { first: 'John', last: 'Doe' },
        }

        expect(() => OAuthSyncDto.validate(data)).toThrow(ValidationException)
        expect(() => OAuthSyncDto.validate(data)).toThrow('Name must be a string')
      })

      it('should throw ValidationException when name is an array', () => {
        const data = {
          provider: 'google',
          providerId: '12345',
          email: 'test@example.com',
          name: ['John', 'Doe'],
        }

        expect(() => OAuthSyncDto.validate(data)).toThrow(ValidationException)
        expect(() => OAuthSyncDto.validate(data)).toThrow('Name must be a string')
      })

      it('should NOT throw ValidationException when name is empty string', () => {
        const data = {
          provider: 'google',
          providerId: '12345',
          email: 'test@example.com',
          name: '',
        }

        // Empty string is a valid string, so it should pass
        const dto = OAuthSyncDto.validate(data)
        expect(dto.name).toBe('')
      })
    })

    describe('Return value', () => {
      it('should return an instance of OAuthSyncDto', () => {
        const data = {
          provider: 'google',
          providerId: '12345',
          email: 'test@example.com',
        }

        const dto = OAuthSyncDto.validate(data)

        expect(dto).toBeInstanceOf(OAuthSyncDto)
      })

      it('should return a new instance each time', () => {
        const data = {
          provider: 'google',
          providerId: '12345',
          email: 'test@example.com',
        }

        const dto1 = OAuthSyncDto.validate(data)
        const dto2 = OAuthSyncDto.validate(data)

        expect(dto1).not.toBe(dto2)
        expect(dto1.provider).toBe(dto2.provider)
        expect(dto1.providerId).toBe(dto2.providerId)
        expect(dto1.email).toBe(dto2.email)
      })

      it('should have only expected properties without name', () => {
        const data = {
          provider: 'google',
          providerId: '12345',
          email: 'test@example.com',
        }

        const dto = OAuthSyncDto.validate(data)
        const keys = Object.keys(dto)

        // Constructor creates all 4 properties, with name being undefined when not provided
        expect(keys).toHaveLength(4)
        expect(keys).toContain('provider')
        expect(keys).toContain('providerId')
        expect(keys).toContain('email')
        expect(keys).toContain('name')
        expect(dto.name).toBeUndefined()
      })

      it('should have only expected properties with name', () => {
        const data = {
          provider: 'google',
          providerId: '12345',
          email: 'test@example.com',
          name: 'John Doe',
        }

        const dto = OAuthSyncDto.validate(data)
        const keys = Object.keys(dto)

        expect(keys).toHaveLength(4)
        expect(keys).toContain('provider')
        expect(keys).toContain('providerId')
        expect(keys).toContain('email')
        expect(keys).toContain('name')
      })
    })
  })
})
