import { describe, expect, it } from 'vitest'

import { ErrorCode } from '../../../src/shared/constants/error-codes.js'

describe('ErrorCode', () => {
  describe('enum values', () => {
    it('should have authentication error codes', () => {
      expect(ErrorCode.INVALID_CREDENTIALS).toBe('INVALID_CREDENTIALS')
      expect(ErrorCode.TOKEN_EXPIRED).toBe('TOKEN_EXPIRED')
      expect(ErrorCode.UNAUTHORIZED).toBe('UNAUTHORIZED')
    })

    it('should have validation error codes', () => {
      expect(ErrorCode.VALIDATION_ERROR).toBe('VALIDATION_ERROR')
      expect(ErrorCode.INVALID_EMAIL).toBe('INVALID_EMAIL')
      expect(ErrorCode.INVALID_PASSWORD).toBe('INVALID_PASSWORD')
    })

    it('should have resource error codes', () => {
      expect(ErrorCode.NOT_FOUND).toBe('NOT_FOUND')
      expect(ErrorCode.ALREADY_EXISTS).toBe('ALREADY_EXISTS')
      expect(ErrorCode.DUPLICATE_ENTRY).toBe('DUPLICATE_ENTRY')
    })

    it('should have business logic error codes', () => {
      expect(ErrorCode.INSUFFICIENT_PERMISSIONS).toBe('INSUFFICIENT_PERMISSIONS')
      expect(ErrorCode.OPERATION_NOT_ALLOWED).toBe('OPERATION_NOT_ALLOWED')
    })

    it('should have system error codes', () => {
      expect(ErrorCode.INTERNAL_ERROR).toBe('INTERNAL_ERROR')
      expect(ErrorCode.DATABASE_ERROR).toBe('DATABASE_ERROR')
      expect(ErrorCode.EXTERNAL_SERVICE_ERROR).toBe('EXTERNAL_SERVICE_ERROR')
    })
  })

  describe('enum completeness', () => {
    it('should have all expected error codes', () => {
      const expectedCodes = [
        'INVALID_CREDENTIALS',
        'TOKEN_EXPIRED',
        'UNAUTHORIZED',
        'VALIDATION_ERROR',
        'INVALID_EMAIL',
        'INVALID_PASSWORD',
        'NOT_FOUND',
        'ALREADY_EXISTS',
        'DUPLICATE_ENTRY',
        'INSUFFICIENT_PERMISSIONS',
        'OPERATION_NOT_ALLOWED',
        'INTERNAL_ERROR',
        'DATABASE_ERROR',
        'EXTERNAL_SERVICE_ERROR',
        'TYPE_ERROR',
      ]

      const actualCodes = Object.values(ErrorCode)
      expect(actualCodes).toHaveLength(expectedCodes.length)
      expectedCodes.forEach((code) => {
        expect(actualCodes).toContain(code)
      })
    })
  })

  describe('enum usage', () => {
    it('should be usable in switch statements', () => {
      const getErrorMessage = (code: ErrorCode): string => {
        switch (code) {
          case ErrorCode.NOT_FOUND:
            return 'Resource not found'
          case ErrorCode.VALIDATION_ERROR:
            return 'Validation failed'
          case ErrorCode.UNAUTHORIZED:
            return 'Unauthorized access'
          default:
            return 'Unknown error'
        }
      }

      expect(getErrorMessage(ErrorCode.NOT_FOUND)).toBe('Resource not found')
      expect(getErrorMessage(ErrorCode.VALIDATION_ERROR)).toBe('Validation failed')
      expect(getErrorMessage(ErrorCode.UNAUTHORIZED)).toBe('Unauthorized access')
    })

    it('should be comparable with strict equality', () => {
      const code: ErrorCode = ErrorCode.NOT_FOUND
      expect(code === ErrorCode.NOT_FOUND).toBe(true)
      // Use a function to allow comparing different enum values
      const isDifferent = (a: ErrorCode, b: ErrorCode) => a !== b
      expect(isDifferent(code, ErrorCode.VALIDATION_ERROR)).toBe(true)
    })

    it('should be usable as object keys', () => {
      const errorMessages = {
        [ErrorCode.NOT_FOUND]: 'Resource not found',
        [ErrorCode.VALIDATION_ERROR]: 'Invalid input',
        [ErrorCode.UNAUTHORIZED]: 'Access denied',
      }

      expect(errorMessages[ErrorCode.NOT_FOUND]).toBe('Resource not found')
      expect(errorMessages[ErrorCode.VALIDATION_ERROR]).toBe('Invalid input')
    })
  })

  describe('type safety', () => {
    it('should only accept valid ErrorCode values', () => {
      const validCode: ErrorCode = ErrorCode.NOT_FOUND
      expect(validCode).toBe('NOT_FOUND')

      // TypeScript would catch this at compile time
      // const invalidCode: ErrorCode = 'INVALID_CODE' // Type error
    })

    it('should work with type guards', () => {
      const isValidErrorCode = (code: string): code is ErrorCode => {
        return Object.values(ErrorCode).includes(code as ErrorCode)
      }

      expect(isValidErrorCode('NOT_FOUND')).toBe(true)
      expect(isValidErrorCode('VALIDATION_ERROR')).toBe(true)
      expect(isValidErrorCode('INVALID_CODE')).toBe(false)
    })
  })

  describe('categorization', () => {
    it('should distinguish authentication errors', () => {
      const authErrors = [
        ErrorCode.INVALID_CREDENTIALS,
        ErrorCode.TOKEN_EXPIRED,
        ErrorCode.UNAUTHORIZED,
      ]

      authErrors.forEach((code) => {
        expect(Object.values(ErrorCode)).toContain(code)
      })
    })

    it('should distinguish validation errors', () => {
      const validationErrors = [
        ErrorCode.VALIDATION_ERROR,
        ErrorCode.INVALID_EMAIL,
        ErrorCode.INVALID_PASSWORD,
      ]

      validationErrors.forEach((code) => {
        expect(Object.values(ErrorCode)).toContain(code)
      })
    })

    it('should distinguish resource errors', () => {
      const resourceErrors = [
        ErrorCode.NOT_FOUND,
        ErrorCode.ALREADY_EXISTS,
        ErrorCode.DUPLICATE_ENTRY,
      ]

      resourceErrors.forEach((code) => {
        expect(Object.values(ErrorCode)).toContain(code)
      })
    })
  })
})
