import { describe, expect, it } from 'vitest'

import { ErrorCode } from '../../../src/shared/constants/error-codes.js'
import { HttpStatus } from '../../../src/shared/constants/http-status.js'
import { BaseException } from '../../../src/shared/exceptions/base.exception.js'
import { NotFoundException } from '../../../src/shared/exceptions/not-found.exception.js'

describe('NotFoundException', () => {
  describe('constructor', () => {
    it('should create exception with resource name only', () => {
      const exception = new NotFoundException('User')

      expect(exception.message).toBe('User not found')
      expect(exception.code).toBe(ErrorCode.NOT_FOUND)
      expect(exception.statusCode).toBe(HttpStatus.NOT_FOUND)
      expect(exception.details).toEqual({
        resource: 'User',
        identifier: undefined,
      })
    })

    it('should create exception with resource and identifier', () => {
      const exception = new NotFoundException('User', '123')

      expect(exception.message).toBe("User with identifier '123' not found")
      expect(exception.details).toEqual({
        resource: 'User',
        identifier: '123',
      })
    })

    it('should set the correct name', () => {
      const exception = new NotFoundException('Product')
      expect(exception.name).toBe('NotFoundException')
    })

    it('should be instance of BaseException and Error', () => {
      const exception = new NotFoundException('Order')
      expect(exception).toBeInstanceOf(NotFoundException)
      expect(exception).toBeInstanceOf(BaseException)
      expect(exception).toBeInstanceOf(Error)
    })
  })

  describe('properties', () => {
    it('should always have NOT_FOUND status code', () => {
      const exception1 = new NotFoundException('User')
      const exception2 = new NotFoundException('Product', '456')

      expect(exception1.statusCode).toBe(HttpStatus.NOT_FOUND)
      expect(exception2.statusCode).toBe(HttpStatus.NOT_FOUND)
      expect(exception1.statusCode).toBe(404)
    })

    it('should always have NOT_FOUND error code', () => {
      const exception1 = new NotFoundException('User')
      const exception2 = new NotFoundException('Product', '456')

      expect(exception1.code).toBe(ErrorCode.NOT_FOUND)
      expect(exception2.code).toBe(ErrorCode.NOT_FOUND)
    })

    it('should include resource in details', () => {
      const exception = new NotFoundException('Customer', 'abc-123')
      expect(exception.details).toHaveProperty('resource', 'Customer')
      expect(exception.details).toHaveProperty('identifier', 'abc-123')
    })
  })

  describe('message formatting', () => {
    it('should format message without identifier', () => {
      const exception = new NotFoundException('Book')
      expect(exception.message).toBe('Book not found')
    })

    it('should format message with identifier', () => {
      const exception = new NotFoundException('Book', 'isbn-123')
      expect(exception.message).toBe("Book with identifier 'isbn-123' not found")
    })

    it('should handle numeric identifiers', () => {
      const exception = new NotFoundException('Post', '42')
      expect(exception.message).toBe("Post with identifier '42' not found")
    })

    it('should handle UUID identifiers', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000'
      const exception = new NotFoundException('User', uuid)
      expect(exception.message).toBe(`User with identifier '${uuid}' not found`)
    })
  })

  describe('toJSON', () => {
    it('should serialize without identifier', () => {
      const exception = new NotFoundException('Category')
      const json = exception.toJSON()

      expect(json).toEqual({
        name: 'NotFoundException',
        message: 'Category not found',
        code: ErrorCode.NOT_FOUND,
        statusCode: HttpStatus.NOT_FOUND,
        details: {
          resource: 'Category',
          identifier: undefined,
        },
      })
    })

    it('should serialize with identifier', () => {
      const exception = new NotFoundException('Category', 'electronics')
      const json = exception.toJSON()

      expect(json).toEqual({
        name: 'NotFoundException',
        message: "Category with identifier 'electronics' not found",
        code: ErrorCode.NOT_FOUND,
        statusCode: HttpStatus.NOT_FOUND,
        details: {
          resource: 'Category',
          identifier: 'electronics',
        },
      })
    })
  })

  describe('common use cases', () => {
    it('should handle user not found by ID', () => {
      const exception = new NotFoundException('User', '12345')
      expect(exception.message).toContain('User')
      expect(exception.message).toContain('12345')
      expect(exception.details?.resource).toBe('User')
      expect(exception.details?.identifier).toBe('12345')
    })

    it('should handle resource not found by slug', () => {
      const exception = new NotFoundException('Article', 'my-article-slug')
      expect(exception.message).toBe("Article with identifier 'my-article-slug' not found")
    })

    it('should handle resource type not found', () => {
      const exception = new NotFoundException('Configuration')
      expect(exception.message).toBe('Configuration not found')
    })

    it('should handle nested resource names', () => {
      const exception = new NotFoundException('UserProfile', 'user-123')
      expect(exception.message).toBe("UserProfile with identifier 'user-123' not found")
    })
  })

  describe('error throwing', () => {
    it('should be throwable and catchable', () => {
      expect(() => {
        throw new NotFoundException('User', '999')
      }).toThrow(NotFoundException)
    })

    it('should preserve details when caught', () => {
      const error = new NotFoundException('Product', 'prod-456')
      expect(error).toBeInstanceOf(NotFoundException)
      expect(error.details?.resource).toBe('Product')
      expect(error.details?.identifier).toBe('prod-456')
    })

    it('should be catchable as BaseException', () => {
      const error = new NotFoundException('Order')
      expect(error).toBeInstanceOf(BaseException)
      expect(error.code).toBe(ErrorCode.NOT_FOUND)
      expect(error.statusCode).toBe(HttpStatus.NOT_FOUND)
    })
  })
})
