import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ChatId, type ChatIdType } from '../../../src/domain/value-objects/chatID.js'
import { Uuid7Util } from '../../../src/shared/utils/uuid7.util.js'

// Mock Uuid7Util
vi.mock('../../../src/shared/utils/uuid7.util.js', () => ({
  Uuid7Util: {
    isValidUUID: vi.fn(),
    uuidVersionValidation: vi.fn(),
  },
}))

describe('ChatId Value Object', () => {
  let validUuid: string

  beforeEach(() => {
    validUuid = uuidv7()
    vi.clearAllMocks()
    // Default mock behavior for valid UUID
    vi.mocked(Uuid7Util.isValidUUID).mockReturnValue(true)
    vi.mocked(Uuid7Util.uuidVersionValidation).mockReturnValue('v7')
  })

  describe('Constructor', () => {
    it('should create a ChatId with a valid UUID', () => {
      const chatId = new ChatId(validUuid)

      expect(chatId).toBeInstanceOf(ChatId)
      expect(chatId.getValue()).toBe(validUuid)
    })

    it('should validate UUID format using Uuid7Util.isValidUUID', () => {
      new ChatId(validUuid)

      expect(Uuid7Util.isValidUUID).toHaveBeenCalledWith(validUuid)
      expect(Uuid7Util.isValidUUID).toHaveBeenCalledTimes(1)
    })

    it('should validate UUID version using Uuid7Util.uuidVersionValidation', () => {
      new ChatId(validUuid)

      expect(Uuid7Util.uuidVersionValidation).toHaveBeenCalledWith(validUuid)
      expect(Uuid7Util.uuidVersionValidation).toHaveBeenCalledTimes(1)
    })

    it('should throw error for invalid UUID format', () => {
      vi.mocked(Uuid7Util.isValidUUID).mockReturnValue(false)
      const invalidUuid = 'not-a-valid-uuid'

      expect(() => new ChatId(invalidUuid)).toThrow('Invalid UUID format provided')
    })

    it('should throw error for non-UUID strings', () => {
      vi.mocked(Uuid7Util.isValidUUID).mockReturnValue(false)

      expect(() => new ChatId('chat-123')).toThrow('Invalid UUID format provided')
      expect(() => new ChatId('12345')).toThrow('Invalid UUID format provided')
      expect(() => new ChatId('')).toThrow('Invalid UUID format provided')
    })

    it('should throw error for UUID with incorrect format structure', () => {
      vi.mocked(Uuid7Util.isValidUUID).mockReturnValue(false)
      const malformedUuid = '018d3f78-1234-7abc-def0' // Missing part

      expect(() => new ChatId(malformedUuid)).toThrow('Invalid UUID format provided')
    })

    it('should accept different valid UUIDv7 strings', () => {
      const uuid1 = uuidv7()
      const uuid2 = uuidv7()
      const uuid3 = uuidv7()

      const chatId1 = new ChatId(uuid1)
      const chatId2 = new ChatId(uuid2)
      const chatId3 = new ChatId(uuid3)

      expect(chatId1.getValue()).toBe(uuid1)
      expect(chatId2.getValue()).toBe(uuid2)
      expect(chatId3.getValue()).toBe(uuid3)
      expect(chatId1.getValue()).not.toBe(chatId2.getValue())
      expect(chatId2.getValue()).not.toBe(chatId3.getValue())
    })
  })

  describe('getValue()', () => {
    it('should return the UUID string value', () => {
      const chatId = new ChatId(validUuid)

      expect(chatId.getValue()).toBe(validUuid)
      expect(typeof chatId.getValue()).toBe('string')
    })

    it('should return consistent value on multiple calls', () => {
      const chatId = new ChatId(validUuid)

      const value1 = chatId.getValue()
      const value2 = chatId.getValue()
      const value3 = chatId.getValue()

      expect(value1).toBe(value2)
      expect(value2).toBe(value3)
      expect(value1).toBe(validUuid)
    })

    it('should not return version string', () => {
      const chatId = new ChatId(validUuid)
      const value = chatId.getValue()

      expect(value).not.toBe('v7')
      expect(value).not.toBe('v4')
      expect(value).toBe(validUuid)
    })

    it('should return UUID that matches UUIDv7 pattern', () => {
      const chatId = new ChatId(validUuid)
      const value = chatId.getValue()

      // UUIDv7 format: 8-4-4-4-12 hexadecimal characters
      expect(value).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      )
    })
  })

  describe('Type Safety with ChatIdType', () => {
    it('should be assignable to ChatIdType with type assertion', () => {
      const chatIdObj = new ChatId(validUuid)
      const chatId: ChatIdType = chatIdObj.getValue()

      expect(chatIdObj).toBeInstanceOf(ChatId)
      expect(chatId).toBe(validUuid)
    })

    it('should maintain type brand for compile-time safety', () => {
      const chatIdObj = new ChatId(validUuid)
      const chatId = chatIdObj.getValue() as ChatIdType<string>

      expect(chatId).toBe(validUuid)
      // This test verifies that the branded type works at compile-time
      // At runtime, ChatIdType is just a branded string
      expect(chatIdObj).toBeInstanceOf(ChatId)
    })
  })

  describe('Immutability', () => {
    it('should return the same value after construction', () => {
      const chatId = new ChatId(validUuid)
      const initialValue = chatId.getValue()

      // Attempt to get value multiple times
      chatId.getValue()
      chatId.getValue()

      expect(chatId.getValue()).toBe(initialValue)
    })

    it('should maintain private value integrity', () => {
      const chatId = new ChatId(validUuid)
      const initialValue = chatId.getValue()

      // Even if attempting to access or modify private internals,
      // getValue() should always return the original UUID
      const value1 = chatId.getValue()
      const value2 = chatId.getValue()

      expect(value1).toBe(initialValue)
      expect(value2).toBe(initialValue)
      expect(value1).toBe(value2)
    })
  })

  describe('Edge Cases', () => {
    it('should handle UUIDs with uppercase letters', () => {
      const uppercaseUuid = validUuid.toUpperCase()
      const chatId = new ChatId(uppercaseUuid)

      expect(chatId.getValue()).toBe(uppercaseUuid)
    })

    it('should handle UUIDs with mixed case', () => {
      const mixedCaseUuid = validUuid
        .split('')
        .map((char, i) => (i % 2 === 0 ? char.toLowerCase() : char.toUpperCase()))
        .join('')
      const chatId = new ChatId(mixedCaseUuid)

      expect(chatId.getValue()).toBe(mixedCaseUuid)
    })

    it('should throw error when Uuid7Util.isValidUUID returns false', () => {
      vi.mocked(Uuid7Util.isValidUUID).mockReturnValue(false)

      expect(() => new ChatId(validUuid)).toThrow('Invalid UUID format provided')
      expect(Uuid7Util.isValidUUID).toHaveBeenCalledWith(validUuid)
    })

    it('should call uuidVersionValidation even for valid UUIDs', () => {
      new ChatId(validUuid)

      expect(Uuid7Util.uuidVersionValidation).toHaveBeenCalledWith(validUuid)
    })
  })

  describe('Multiple Instances', () => {
    it('should create independent instances with different UUIDs', () => {
      const uuid1 = uuidv7()
      const uuid2 = uuidv7()
      const chatId1 = new ChatId(uuid1)
      const chatId2 = new ChatId(uuid2)

      expect(chatId1.getValue()).not.toBe(chatId2.getValue())
      expect(chatId1).not.toBe(chatId2)
    })

    it('should create separate instances even with same UUID', () => {
      const chatId1 = new ChatId(validUuid)
      const chatId2 = new ChatId(validUuid)

      expect(chatId1.getValue()).toBe(chatId2.getValue())
      expect(chatId1).not.toBe(chatId2) // Different instances
    })

    it('should validate each instance independently', () => {
      const uuid1 = uuidv7()
      const uuid2 = uuidv7()

      new ChatId(uuid1)
      new ChatId(uuid2)

      expect(Uuid7Util.isValidUUID).toHaveBeenCalledTimes(2)
      expect(Uuid7Util.uuidVersionValidation).toHaveBeenCalledTimes(2)
    })
  })

  describe('Error Messages', () => {
    it('should provide clear error message for invalid UUID', () => {
      vi.mocked(Uuid7Util.isValidUUID).mockReturnValue(false)

      expect(() => new ChatId('invalid')).toThrow('Invalid UUID format provided')
    })

    it('should throw immediately on invalid UUID before version validation', () => {
      vi.mocked(Uuid7Util.isValidUUID).mockReturnValue(false)

      expect(() => new ChatId('invalid')).toThrow()
      expect(Uuid7Util.uuidVersionValidation).not.toHaveBeenCalled()
    })
  })

  describe('Integration with Real UUIDs', () => {
    it('should work with actual uuidv7 generated values', () => {
      // Generate multiple real UUIDv7 values
      const realUuids = Array.from({ length: 5 }, () => uuidv7())

      realUuids.forEach((uuid) => {
        const chatId = new ChatId(uuid)
        expect(chatId.getValue()).toBe(uuid)
        expect(typeof chatId.getValue()).toBe('string')
      })
    })

    it('should maintain timestamp ordering property of UUIDv7', () => {
      const uuid1 = uuidv7()
      const uuid2 = uuidv7()

      const chatId1 = new ChatId(uuid1)
      const chatId2 = new ChatId(uuid2)

      // UUIDv7 should be lexicographically sortable by timestamp
      expect(uuid1 <= uuid2).toBe(true)
      expect(chatId1.getValue() <= chatId2.getValue()).toBe(true)
    })
  })
})
