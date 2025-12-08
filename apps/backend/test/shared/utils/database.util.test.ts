import { describe, expect, it } from 'vitest'

import { DatabaseUtil } from '../../../src/shared/utils/database.util.js'

describe('DatabaseUtil', () => {
  describe('isDuplicateKeyError', () => {
    it('should return true for PostgreSQL unique constraint violation (code 23505)', () => {
      const error = {
        code: '23505',
        message: 'duplicate key value violates unique constraint "users_email_key"',
      }

      expect(DatabaseUtil.isDuplicateKeyError(error)).toBe(true)
    })

    it('should return false for non-duplicate errors', () => {
      const error = {
        code: '23503',
        message: 'foreign key constraint violation',
      }

      expect(DatabaseUtil.isDuplicateKeyError(error)).toBe(false)
    })

    it('should return false for errors without code property', () => {
      const error = new Error('Some other error')

      expect(DatabaseUtil.isDuplicateKeyError(error)).toBe(false)
    })

    it('should return false for null', () => {
      expect(DatabaseUtil.isDuplicateKeyError(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(DatabaseUtil.isDuplicateKeyError(undefined)).toBe(false)
    })

    it('should return false for non-object values', () => {
      expect(
        DatabaseUtil.isDuplicateKeyError('duplicate key value violates unique constraint')
      ).toBe(false)
      expect(DatabaseUtil.isDuplicateKeyError(123)).toBe(false)
      expect(DatabaseUtil.isDuplicateKeyError(true)).toBe(false)
    })

    it('should return true for Error objects with code 23505', () => {
      const error = Object.assign(
        new Error('duplicate key value violates unique constraint "users_email_key"'),
        {
          code: '23505',
        }
      )

      expect(DatabaseUtil.isDuplicateKeyError(error)).toBe(true)
    })

    it('should return false for Error objects with different codes', () => {
      const error = Object.assign(new Error('some error'), {
        code: '42P01',
      })

      expect(DatabaseUtil.isDuplicateKeyError(error)).toBe(false)
    })
  })
})
