import { describe, expect, it } from 'vitest'

import {
  ConflictError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from './apiErrors.js'
import { mapBackendError } from './errorMapper.js'

describe('errorMapper', () => {
  describe('mapBackendError', () => {
    describe('status code 409 (Conflict)', () => {
      it('should return ConflictError for status 409', () => {
        const message = 'Resource already exists'
        const error = mapBackendError(409, message)

        expect(error).toBeInstanceOf(ConflictError)
        expect(error.message).toBe(message)
        expect(error.name).toBe('ConflictError')
      })

      it('should handle empty message', () => {
        const error = mapBackendError(409, '')

        expect(error).toBeInstanceOf(ConflictError)
        expect(error.message).toBe('')
      })
    })

    describe('status code 400 (Bad Request)', () => {
      it('should return ValidationError for status 400', () => {
        const message = 'Invalid input data'
        const error = mapBackendError(400, message)

        expect(error).toBeInstanceOf(ValidationError)
        expect(error.message).toBe(message)
        expect(error.name).toBe('ValidationError')
      })

      it('should handle detailed validation messages', () => {
        const message = 'Email is required. Password must be at least 8 characters.'
        const error = mapBackendError(400, message)

        expect(error).toBeInstanceOf(ValidationError)
        expect(error.message).toBe(message)
      })
    })

    describe('status code 404 (Not Found)', () => {
      it('should return NotFoundError for status 404', () => {
        const message = 'User not found'
        const error = mapBackendError(404, message)

        expect(error).toBeInstanceOf(NotFoundError)
        expect(error.message).toBe(message)
        expect(error.name).toBe('NotFoundError')
      })

      it('should handle resource-specific messages', () => {
        const message = 'The requested endpoint /api/users/999 does not exist'
        const error = mapBackendError(404, message)

        expect(error).toBeInstanceOf(NotFoundError)
        expect(error.message).toBe(message)
      })
    })

    describe('status code 401 (Unauthorized)', () => {
      it('should return UnauthorizedError for status 401', () => {
        const message = 'Authentication required'
        const error = mapBackendError(401, message)

        expect(error).toBeInstanceOf(UnauthorizedError)
        expect(error.message).toBe(message)
        expect(error.name).toBe('UnauthorizedError')
      })

      it('should handle token expiration messages', () => {
        const message = 'Token expired. Please login again.'
        const error = mapBackendError(401, message)

        expect(error).toBeInstanceOf(UnauthorizedError)
        expect(error.message).toBe(message)
      })
    })

    describe('status code 403 (Forbidden)', () => {
      it('should return ForbiddenError for status 403', () => {
        const message = 'Access denied'
        const error = mapBackendError(403, message)

        expect(error).toBeInstanceOf(ForbiddenError)
        expect(error.message).toBe(message)
        expect(error.name).toBe('ForbiddenError')
      })

      it('should handle permission-specific messages', () => {
        const message = 'You do not have permission to perform this action'
        const error = mapBackendError(403, message)

        expect(error).toBeInstanceOf(ForbiddenError)
        expect(error.message).toBe(message)
      })
    })

    describe('status code 500 (Internal Server Error)', () => {
      it('should return InternalServerError for status 500', () => {
        const message = 'An unexpected error occurred'
        const error = mapBackendError(500, message)

        expect(error).toBeInstanceOf(InternalServerError)
        expect(error.message).toBe(message)
        expect(error.name).toBe('InternalServerError')
      })

      it('should handle technical error messages', () => {
        const message = 'Database connection failed'
        const error = mapBackendError(500, message)

        expect(error).toBeInstanceOf(InternalServerError)
        expect(error.message).toBe(message)
      })
    })

    describe('default case (unhandled status codes)', () => {
      it('should return generic Error for status 502', () => {
        const message = 'Bad Gateway'
        const error = mapBackendError(502, message)

        expect(error).toBeInstanceOf(Error)
        expect(error).not.toBeInstanceOf(ConflictError)
        expect(error).not.toBeInstanceOf(ValidationError)
        expect(error.message).toBe(message)
        expect(error.name).toBe('Error')
      })

      it('should return generic Error for status 503', () => {
        const message = 'Service Unavailable'
        const error = mapBackendError(503, message)

        expect(error).toBeInstanceOf(Error)
        expect(error.message).toBe(message)
      })

      it('should return generic Error for status 200', () => {
        const message = 'Success treated as error'
        const error = mapBackendError(200, message)

        expect(error).toBeInstanceOf(Error)
        expect(error.message).toBe(message)
      })

      it('should return generic Error for status 0', () => {
        const message = 'Network error'
        const error = mapBackendError(0, message)

        expect(error).toBeInstanceOf(Error)
        expect(error.message).toBe(message)
      })

      it('should return generic Error for negative status codes', () => {
        const message = 'Invalid status code'
        const error = mapBackendError(-1, message)

        expect(error).toBeInstanceOf(Error)
        expect(error.message).toBe(message)
      })

      it('should return generic Error for very large status codes', () => {
        const message = 'Unknown error'
        const error = mapBackendError(999, message)

        expect(error).toBeInstanceOf(Error)
        expect(error.message).toBe(message)
      })
    })

    describe('edge cases', () => {
      it('should handle special characters in messages', () => {
        const message = 'Error: "Something" went <wrong> & failed!'
        const error = mapBackendError(400, message)

        expect(error).toBeInstanceOf(ValidationError)
        expect(error.message).toBe(message)
      })

      it('should handle unicode characters in messages', () => {
        const message = '错误：用户未找到 🚫'
        const error = mapBackendError(404, message)

        expect(error).toBeInstanceOf(NotFoundError)
        expect(error.message).toBe(message)
      })

      it('should handle very long messages', () => {
        const message = 'A'.repeat(1000)
        const error = mapBackendError(500, message)

        expect(error).toBeInstanceOf(InternalServerError)
        expect(error.message).toBe(message)
      })

      it('should handle newlines in messages', () => {
        const message = 'Error occurred:\nLine 1\nLine 2'
        const error = mapBackendError(400, message)

        expect(error).toBeInstanceOf(ValidationError)
        expect(error.message).toBe(message)
      })
    })

    describe('type consistency', () => {
      it('should always return an Error instance', () => {
        const statusCodes = [400, 401, 403, 404, 409, 500, 502, 999]
        const message = 'test'

        statusCodes.forEach((status) => {
          const error = mapBackendError(status, message)
          expect(error).toBeInstanceOf(Error)
        })
      })

      it('should return errors with correct inheritance chain', () => {
        const conflict = mapBackendError(409, 'test')
        const validation = mapBackendError(400, 'test')
        const notFound = mapBackendError(404, 'test')

        expect(conflict).toBeInstanceOf(Error)
        expect(conflict).toBeInstanceOf(ConflictError)

        expect(validation).toBeInstanceOf(Error)
        expect(validation).toBeInstanceOf(ValidationError)

        expect(notFound).toBeInstanceOf(Error)
        expect(notFound).toBeInstanceOf(NotFoundError)
      })
    })

    describe('message preservation', () => {
      it('should preserve exact message content for all status codes', () => {
        const testCases = [
          { status: 400, message: 'validation failed' },
          { status: 401, message: 'unauthorized access' },
          { status: 403, message: 'forbidden resource' },
          { status: 404, message: 'not found' },
          { status: 409, message: 'conflict detected' },
          { status: 500, message: 'server error' },
          { status: 999, message: 'unknown error' },
        ]

        testCases.forEach(({ message, status }) => {
          const error = mapBackendError(status, message)
          expect(error.message).toBe(message)
        })
      })
    })
  })
})
