import { describe, expect, it } from 'vitest'

import { ErrorCode } from '../../../src/shared/constants/error-codes.js'
import { HttpStatus } from '../../../src/shared/constants/http-status.js'
import { BaseException } from '../../../src/shared/exceptions/base.exception.js'
import { ValidationException } from '../../../src/shared/exceptions/validation.exception.js'

describe('ValidationException', () => {
  describe('constructor', () => {
    it('should create a validation exception with message', () => {
      const message = 'Validation failed'
      const exception = new ValidationException(message)

      expect(exception.message).toBe(message)
      expect(exception.code).toBe(ErrorCode.VALIDATION_ERROR)
      expect(exception.statusCode).toBe(HttpStatus.BAD_REQUEST)
    })

    it('should create a validation exception with details', () => {
      const message = 'Invalid input'
      const details = { field: 'email', reason: 'invalid format' }
      const exception = new ValidationException(message, details)

      expect(exception.message).toBe(message)
      expect(exception.details).toEqual(details)
    })

    it('should work without details', () => {
      const exception = new ValidationException('Error without details')
      expect(exception.details).toBeUndefined()
    })

    it('should set the correct name', () => {
      const exception = new ValidationException('Error')
      expect(exception.name).toBe('ValidationException')
    })

    it('should be instance of BaseException and Error', () => {
      const exception = new ValidationException('Error')
      expect(exception).toBeInstanceOf(ValidationException)
      expect(exception).toBeInstanceOf(BaseException)
      expect(exception).toBeInstanceOf(Error)
    })
  })

  describe('properties', () => {
    it('should always have BAD_REQUEST status code', () => {
      const exception1 = new ValidationException('Error 1')
      const exception2 = new ValidationException('Error 2', { field: 'name' })

      expect(exception1.statusCode).toBe(HttpStatus.BAD_REQUEST)
      expect(exception2.statusCode).toBe(HttpStatus.BAD_REQUEST)
      expect(exception1.statusCode).toBe(400)
    })

    it('should always have VALIDATION_ERROR code', () => {
      const exception1 = new ValidationException('Error 1')
      const exception2 = new ValidationException('Error 2', { field: 'name' })

      expect(exception1.code).toBe(ErrorCode.VALIDATION_ERROR)
      expect(exception2.code).toBe(ErrorCode.VALIDATION_ERROR)
    })
  })

  describe('toJSON', () => {
    it('should serialize with all properties', () => {
      const message = 'Validation error'
      const details = { fields: ['email', 'password'] }
      const exception = new ValidationException(message, details)

      const json = exception.toJSON()

      expect(json).toEqual({
        name: 'ValidationException',
        message: message,
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: HttpStatus.BAD_REQUEST,
        details: details,
      })
    })
  })

  describe('common validation scenarios', () => {
    it('should handle single field validation error', () => {
      const exception = new ValidationException('Email is invalid', {
        field: 'email',
        value: 'not-an-email',
        constraint: 'must be valid email format',
      })

      expect(exception.message).toBe('Email is invalid')
      expect(exception.details).toHaveProperty('field', 'email')
    })

    it('should handle multiple field validation errors', () => {
      const exception = new ValidationException('Multiple validation errors', {
        errors: [
          { field: 'email', message: 'invalid format' },
          { field: 'password', message: 'too short' },
          { field: 'age', message: 'must be positive' },
        ],
      })

      expect(exception.message).toBe('Multiple validation errors')
      expect(exception.details?.errors).toHaveLength(3)
    })

    it('should handle validation with custom constraints', () => {
      const exception = new ValidationException('Username validation failed', {
        field: 'username',
        value: 'a',
        constraints: {
          minLength: 3,
          maxLength: 20,
          pattern: '^[a-zA-Z0-9_]+$',
        },
      })

      expect(exception.details).toHaveProperty('constraints')
    })
  })

  describe('error throwing', () => {
    it('should be throwable and catchable', () => {
      expect(() => {
        throw new ValidationException('Validation failed')
      }).toThrow(ValidationException)
    })

    it('should preserve details when caught', () => {
      const details = { field: 'email', reason: 'invalid' }
      const error = new ValidationException('Invalid email', details)
      expect(error).toBeInstanceOf(ValidationException)
      expect(error.details).toEqual(details)
    })
  })
})
