import { describe, expect, it } from 'vitest'

import { ErrorCode } from '../../../src/shared/constants/error-codes.js'
import { HttpStatus } from '../../../src/shared/constants/http-status.js'
import { BaseException } from '../../../src/shared/exceptions/base.exception.js'

// Create a concrete implementation for testing
class TestException extends BaseException {
  constructor(message: string, details?: Record<string, any>) {
    super(message, ErrorCode.INTERNAL_ERROR, HttpStatus.INTERNAL_SERVER_ERROR, details)
  }
}

describe('BaseException', () => {
  describe('constructor', () => {
    it('should create an exception with all properties', () => {
      const message = 'Test error message'
      const code = ErrorCode.VALIDATION_ERROR
      const statusCode = HttpStatus.BAD_REQUEST
      const details = { field: 'email', reason: 'invalid format' }

      class CustomException extends BaseException {
        constructor() {
          super(message, code, statusCode, details)
        }
      }

      const exception = new CustomException()

      expect(exception.message).toBe(message)
      expect(exception.code).toBe(code)
      expect(exception.statusCode).toBe(statusCode)
      expect(exception.details).toEqual(details)
    })

    it('should set the correct name from constructor', () => {
      const exception = new TestException('Error')
      expect(exception.name).toBe('TestException')
    })

    it('should work without details', () => {
      const exception = new TestException('Error without details')
      expect(exception.message).toBe('Error without details')
      expect(exception.details).toBeUndefined()
    })

    it('should be an instance of Error', () => {
      const exception = new TestException('Error')
      expect(exception).toBeInstanceOf(Error)
      expect(exception).toBeInstanceOf(BaseException)
    })

    it('should capture stack trace', () => {
      const exception = new TestException('Error')
      expect(exception.stack).toBeDefined()
      expect(exception.stack).toContain('TestException')
    })
  })

  describe('toJSON', () => {
    it('should serialize to JSON with all properties', () => {
      const message = 'Test error'
      const details = { field: 'username', value: 'invalid' }
      const exception = new TestException(message, details)

      const json = exception.toJSON()

      expect(json).toEqual({
        name: 'TestException',
        message: message,
        code: ErrorCode.INTERNAL_ERROR,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        details: details,
      })
    })

    it('should serialize without details if not provided', () => {
      const exception = new TestException('Simple error')
      const json = exception.toJSON()

      expect(json).toEqual({
        name: 'TestException',
        message: 'Simple error',
        code: ErrorCode.INTERNAL_ERROR,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        details: undefined,
      })
    })

    it('should include nested objects in details', () => {
      const details = {
        errors: [
          { field: 'email', message: 'invalid' },
          { field: 'password', message: 'too short' },
        ],
        metadata: { timestamp: '2024-01-01' },
      }
      const exception = new TestException('Validation failed', details)
      const json = exception.toJSON()

      expect(json.details).toEqual(details)
    })
  })

  describe('inheritance', () => {
    it('should support multiple levels of inheritance', () => {
      class Level1Exception extends BaseException {
        constructor(message: string) {
          super(message, ErrorCode.VALIDATION_ERROR, HttpStatus.BAD_REQUEST)
        }
      }

      class Level2Exception extends Level1Exception {
        constructor() {
          super('Level 2 error')
        }
      }

      const exception = new Level2Exception()
      expect(exception).toBeInstanceOf(Level2Exception)
      expect(exception).toBeInstanceOf(Level1Exception)
      expect(exception).toBeInstanceOf(BaseException)
      expect(exception).toBeInstanceOf(Error)
    })
  })

  describe('error handling', () => {
    it('should be catchable as Error', () => {
      expect(() => {
        throw new TestException('Caught error')
      }).toThrow(Error)
    })

    it('should be catchable as BaseException', () => {
      const error = new TestException('Caught error')
      expect(error).toBeInstanceOf(BaseException)
    })

    it('should preserve error message when caught', () => {
      const error = new TestException('Specific error message')
      expect(error).toBeInstanceOf(TestException)
      expect(error.message).toBe('Specific error message')
    })
  })
})
