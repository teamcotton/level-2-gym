import { describe, expect, it } from 'vitest'

import {
  ConflictError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from './apiErrors.js'

describe('apiErrors', () => {
  describe('ConflictError', () => {
    it('should create an instance with the correct message', () => {
      const message = 'Resource already exists'
      const error = new ConflictError(message)

      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(ConflictError)
      expect(error.message).toBe(message)
    })

    it('should have the correct name property', () => {
      const error = new ConflictError('test')

      expect(error.name).toBe('ConflictError')
    })

    it('should be throwable', () => {
      expect(() => {
        throw new ConflictError('test error')
      }).toThrow(ConflictError)
    })

    it('should be catchable as Error', () => {
      expect(() => {
        throw new ConflictError('test')
      }).toThrow(Error)
    })
  })

  describe('ValidationError', () => {
    it('should create an instance with the correct message', () => {
      const message = 'Invalid input data'
      const error = new ValidationError(message)

      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.message).toBe(message)
    })

    it('should have the correct name property', () => {
      const error = new ValidationError('test')

      expect(error.name).toBe('ValidationError')
    })

    it('should be throwable', () => {
      expect(() => {
        throw new ValidationError('test error')
      }).toThrow(ValidationError)
    })

    it('should handle empty string message', () => {
      const error = new ValidationError('')

      expect(error.message).toBe('')
      expect(error.name).toBe('ValidationError')
    })
  })

  describe('NotFoundError', () => {
    it('should create an instance with the correct message', () => {
      const message = 'Resource not found'
      const error = new NotFoundError(message)

      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(NotFoundError)
      expect(error.message).toBe(message)
    })

    it('should have the correct name property', () => {
      const error = new NotFoundError('test')

      expect(error.name).toBe('NotFoundError')
    })

    it('should be throwable', () => {
      expect(() => {
        throw new NotFoundError('test error')
      }).toThrow(NotFoundError)
    })
  })

  describe('UnauthorizedError', () => {
    it('should create an instance with the correct message', () => {
      const message = 'Authentication required'
      const error = new UnauthorizedError(message)

      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(UnauthorizedError)
      expect(error.message).toBe(message)
    })

    it('should have the correct name property', () => {
      const error = new UnauthorizedError('test')

      expect(error.name).toBe('UnauthorizedError')
    })

    it('should be throwable', () => {
      expect(() => {
        throw new UnauthorizedError('test error')
      }).toThrow(UnauthorizedError)
    })

    it('should preserve stack trace', () => {
      const error = new UnauthorizedError('test')

      expect(error.stack).toBeDefined()
      expect(error.stack).toContain('UnauthorizedError')
    })
  })

  describe('ForbiddenError', () => {
    it('should create an instance with the correct message', () => {
      const message = 'Access denied'
      const error = new ForbiddenError(message)

      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(ForbiddenError)
      expect(error.message).toBe(message)
    })

    it('should have the correct name property', () => {
      const error = new ForbiddenError('test')

      expect(error.name).toBe('ForbiddenError')
    })

    it('should be throwable', () => {
      expect(() => {
        throw new ForbiddenError('test error')
      }).toThrow(ForbiddenError)
    })
  })

  describe('InternalServerError', () => {
    it('should create an instance with the correct message', () => {
      const message = 'Internal server error occurred'
      const error = new InternalServerError(message)

      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(InternalServerError)
      expect(error.message).toBe(message)
    })

    it('should have the correct name property', () => {
      const error = new InternalServerError('test')

      expect(error.name).toBe('InternalServerError')
    })

    it('should be throwable', () => {
      expect(() => {
        throw new InternalServerError('test error')
      }).toThrow(InternalServerError)
    })

    it('should handle special characters in message', () => {
      const message = 'Error: "Something" went <wrong> & failed!'
      const error = new InternalServerError(message)

      expect(error.message).toBe(message)
    })
  })

  describe('Error inheritance', () => {
    it('all custom errors should extend Error', () => {
      const errors = [
        new ConflictError('test'),
        new ValidationError('test'),
        new NotFoundError('test'),
        new UnauthorizedError('test'),
        new ForbiddenError('test'),
        new InternalServerError('test'),
      ]

      errors.forEach((error) => {
        expect(error).toBeInstanceOf(Error)
      })
    })

    it('custom errors should have distinct names', () => {
      const errorNames = [
        new ConflictError('test').name,
        new ValidationError('test').name,
        new NotFoundError('test').name,
        new UnauthorizedError('test').name,
        new ForbiddenError('test').name,
        new InternalServerError('test').name,
      ]

      const uniqueNames = new Set(errorNames)
      expect(uniqueNames.size).toBe(errorNames.length)
    })

    it('should be distinguishable by instanceof', () => {
      const conflict = new ConflictError('test')
      const validation = new ValidationError('test')

      expect(conflict).toBeInstanceOf(ConflictError)
      expect(conflict).not.toBeInstanceOf(ValidationError)
      expect(validation).toBeInstanceOf(ValidationError)
      expect(validation).not.toBeInstanceOf(ConflictError)
    })
  })
})
