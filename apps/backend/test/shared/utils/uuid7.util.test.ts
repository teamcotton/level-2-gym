import { describe, expect, it } from 'vitest'

import { Uuid7Util } from '../../../src/shared/utils/uuid7.util.js'

describe('Uuid7Util', () => {
  describe('uuidVersionValidation', () => {
    it('should return v7 for a valid UUIDv7', () => {
      const testUuid = Uuid7Util.createUuidv7()

      const result = Uuid7Util.uuidVersionValidation(testUuid)

      expect(result).toBe('v7')
    })

    it('should return error message for invalid UUID version', () => {
      // UUID v4 example
      const uuidv4 = '550e8400-e29b-41d4-a716-446655440000'

      const result = Uuid7Util.uuidVersionValidation(uuidv4)

      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
      expect(result).toContain('4')
    })

    it('should return undefined for empty string', () => {
      const result = Uuid7Util.uuidVersionValidation('')

      expect(result).toBeUndefined()
    })

    it('should return undefined for malformed UUID string', () => {
      const result = Uuid7Util.uuidVersionValidation('not-a-uuid')

      expect(result).toBeUndefined()
    })
  })

  describe('isValidUUID', () => {
    it('should return true for valid UUIDv7', () => {
      const testUuid = Uuid7Util.createUuidv7()

      const result = Uuid7Util.isValidUUID(testUuid)

      expect(result).toBe(true)
    })

    it('should return false for invalid UUID', () => {
      const result = Uuid7Util.isValidUUID('not-a-uuid')

      expect(result).toBe(false)
    })

    it('should return false for empty string', () => {
      const result = Uuid7Util.isValidUUID('')

      expect(result).toBe(false)
    })

    it('should return false for UUID with wrong format', () => {
      const result = Uuid7Util.isValidUUID('550e8400-e29b-41d4-a716')

      expect(result).toBe(false)
    })

    it('should return true for valid UUID v4', () => {
      const uuidv4 = '550e8400-e29b-41d4-a716-446655440000'

      const result = Uuid7Util.isValidUUID(uuidv4)

      expect(result).toBe(true)
    })
  })

  describe('createUuidv7', () => {
    it('should generate a valid UUIDv7', () => {
      const result = Uuid7Util.createUuidv7()

      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
      expect(result).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      )
    })

    it('should generate unique UUIDs on multiple calls', () => {
      const uuid1 = Uuid7Util.createUuidv7()
      const uuid2 = Uuid7Util.createUuidv7()
      const uuid3 = Uuid7Util.createUuidv7()

      expect(uuid1).not.toBe(uuid2)
      expect(uuid2).not.toBe(uuid3)
      expect(uuid1).not.toBe(uuid3)
    })

    it('should return string type', () => {
      const result = Uuid7Util.createUuidv7()

      expect(typeof result).toBe('string')
    })
  })

  describe('integration scenarios', () => {
    it('should validate generated UUID from createUuidv7', () => {
      const generatedUuid = Uuid7Util.createUuidv7()

      const isValid = Uuid7Util.isValidUUID(generatedUuid)

      expect(isValid).toBe(true)
    })

    it('should validate version of generated UUID', () => {
      const generatedUuid = Uuid7Util.createUuidv7()

      const validation = Uuid7Util.uuidVersionValidation(generatedUuid)

      expect(validation).toBe('v7')
    })

    it('should generate chronologically ordered UUIDs', () => {
      const uuid1 = Uuid7Util.createUuidv7()
      const uuid2 = Uuid7Util.createUuidv7()
      const uuid3 = Uuid7Util.createUuidv7()

      // UUIDv7 should be lexicographically sortable
      const sorted = [uuid1, uuid2, uuid3].sort()
      expect(sorted).toEqual([uuid1, uuid2, uuid3])
    })
  })
})
