import { beforeEach, describe, expect, it } from 'vitest'

import { Chat } from '../../../src/domain/entities/chat.js'

describe('Chat Entity', () => {
  let testUserId: string
  let testChat: Chat

  beforeEach(() => {
    testUserId = 'user-123'
    testChat = new Chat(testUserId)
  })

  describe('Constructor', () => {
    it('should create a chat with required userId', () => {
      expect(testChat).toBeInstanceOf(Chat)
      expect(testChat.getUserId()).toBe('user-123')
    })

    it('should generate a unique UUID v7 id by default', () => {
      const chat = new Chat('user-456')
      const id = chat.getId()

      expect(id).toBeDefined()
      expect(typeof id).toBe('string')
      expect(id.length).toBeGreaterThan(0)
    })

    it('should accept a custom id', () => {
      const customId = '01234567-89ab-cdef-0123-456789abcdef'
      const chat = new Chat('user-789', customId)

      expect(chat.getId()).toBe(customId)
    })

    it('should have id property accessible', () => {
      // TypeScript readonly is compile-time only, property is still accessible
      expect(testChat.id).toBeDefined()
      expect(typeof testChat.id).toBe('string')
    })

    it('should set createdAt to current date by default', () => {
      const beforeCreation = new Date()
      const chat = new Chat('user-456')
      const afterCreation = new Date()

      const createdAt = chat.getCreatedAt()
      expect(createdAt).toBeInstanceOf(Date)
      expect(createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime())
      expect(createdAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime())
    })

    it('should accept a custom createdAt date', () => {
      const customDate = new Date('2024-01-01T00:00:00Z')
      const chat = new Chat('user-789', undefined, customDate)

      expect(chat.getCreatedAt()).toEqual(customDate)
    })

    it('should set updatedAt to current date by default', () => {
      const beforeCreation = new Date()
      const chat = new Chat('user-456')
      const afterCreation = new Date()

      const updatedAt = chat.getUpdatedAt()
      expect(updatedAt).toBeInstanceOf(Date)
      expect(updatedAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime())
      expect(updatedAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime())
    })

    it('should accept a custom updatedAt date', () => {
      const customDate = new Date('2024-12-31T23:59:59Z')
      const chat = new Chat('user-789', undefined, undefined, customDate)

      expect(chat.getUpdatedAt()).toEqual(customDate)
    })

    it('should accept all custom parameters', () => {
      const customId = '01234567-89ab-cdef-0123-456789abcdef'
      const customCreatedAt = new Date('2024-01-01T00:00:00Z')
      const customUpdatedAt = new Date('2024-12-31T23:59:59Z')
      const chat = new Chat('user-999', customId, customCreatedAt, customUpdatedAt)

      expect(chat.getUserId()).toBe('user-999')
      expect(chat.getId()).toBe(customId)
      expect(chat.getCreatedAt()).toEqual(customCreatedAt)
      expect(chat.getUpdatedAt()).toEqual(customUpdatedAt)
    })
  })

  describe('getId()', () => {
    it('should return the chat id', () => {
      const id = testChat.getId()
      expect(id).toBeDefined()
      expect(typeof id).toBe('string')
    })

    it('should return the same id on multiple calls', () => {
      const id1 = testChat.getId()
      const id2 = testChat.getId()

      expect(id1).toBe(id2)
    })

    it('should return the custom id when provided', () => {
      const customId = 'custom-chat-id-123'
      const chat = new Chat('user-456', customId)

      expect(chat.getId()).toBe(customId)
    })
  })

  describe('getUserId()', () => {
    it('should return the user id', () => {
      const userId = testChat.getUserId()
      expect(userId).toBe('user-123')
      expect(typeof userId).toBe('string')
    })

    it('should return the same user id on multiple calls', () => {
      const userId1 = testChat.getUserId()
      const userId2 = testChat.getUserId()

      expect(userId1).toBe(userId2)
    })

    it('should return different user ids for different chat instances', () => {
      const chat1 = new Chat('user-111')
      const chat2 = new Chat('user-222')

      expect(chat1.getUserId()).toBe('user-111')
      expect(chat2.getUserId()).toBe('user-222')
      expect(chat1.getUserId()).not.toBe(chat2.getUserId())
    })
  })

  describe('getCreatedAt()', () => {
    it('should return the createdAt date', () => {
      const createdAt = testChat.getCreatedAt()
      expect(createdAt).toBeInstanceOf(Date)
    })

    it('should return the same date on multiple calls', () => {
      const date1 = testChat.getCreatedAt()
      const date2 = testChat.getCreatedAt()

      expect(date1).toEqual(date2)
      expect(date1.getTime()).toBe(date2.getTime())
    })

    it('should return the custom createdAt date when provided', () => {
      const customDate = new Date('2023-06-15T10:30:00Z')
      const chat = new Chat('user-456', undefined, customDate)

      expect(chat.getCreatedAt()).toEqual(customDate)
    })
  })

  describe('getUpdatedAt()', () => {
    it('should return the updatedAt date', () => {
      const updatedAt = testChat.getUpdatedAt()
      expect(updatedAt).toBeInstanceOf(Date)
    })

    it('should return the same date on multiple calls', () => {
      const date1 = testChat.getUpdatedAt()
      const date2 = testChat.getUpdatedAt()

      expect(date1).toEqual(date2)
      expect(date1.getTime()).toBe(date2.getTime())
    })

    it('should return the custom updatedAt date when provided', () => {
      const customDate = new Date('2023-12-25T15:45:00Z')
      const chat = new Chat('user-456', undefined, undefined, customDate)

      expect(chat.getUpdatedAt()).toEqual(customDate)
    })
  })

  describe('UUID v7 Generation', () => {
    it('should generate unique ids for multiple chat instances', () => {
      const chat1 = new Chat('user-123')
      const chat2 = new Chat('user-123')
      const chat3 = new Chat('user-123')

      const id1 = chat1.getId()
      const id2 = chat2.getId()
      const id3 = chat3.getId()

      expect(id1).not.toBe(id2)
      expect(id2).not.toBe(id3)
      expect(id1).not.toBe(id3)
    })

    it('should generate valid UUIDv7 format', () => {
      const chat = new Chat('user-456')
      const id = chat.getId()

      // UUIDv7 format: xxxxxxxx-xxxx-7xxx-xxxx-xxxxxxxxxxxx
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      expect(id).toMatch(uuidPattern)
    })
  })

  describe('Immutability', () => {
    it('should not allow modification of userId through getter', () => {
      const userId = testChat.getUserId()
      const originalUserId = testChat.getUserId()

      // userId is a string (primitive), so it's immutable by nature
      expect(userId).toBe(originalUserId)
    })

    it('should not allow modification of id through getter', () => {
      const id = testChat.getId()
      const originalId = testChat.getId()

      // id is a string (primitive), so it's immutable by nature
      expect(id).toBe(originalId)
    })

    it('should not allow modification of createdAt date', () => {
      const createdAt = testChat.getCreatedAt()
      const originalTime = createdAt.getTime()

      // Try to modify the returned date
      createdAt.setFullYear(2000)

      // The original chat's createdAt should remain unchanged
      expect(testChat.getCreatedAt().getTime()).toBe(originalTime)
    })

    it('should not allow modification of updatedAt date', () => {
      const updatedAt = testChat.getUpdatedAt()
      const originalTime = updatedAt.getTime()

      // Try to modify the returned date
      updatedAt.setFullYear(2000)

      // The original chat's updatedAt should remain unchanged
      expect(testChat.getUpdatedAt().getTime()).toBe(originalTime)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty string userId', () => {
      const chat = new Chat('')

      expect(chat.getUserId()).toBe('')
    })

    it('should handle very long userId', () => {
      const longUserId = 'user-' + 'x'.repeat(1000)
      const chat = new Chat(longUserId)

      expect(chat.getUserId()).toBe(longUserId)
    })

    it('should handle special characters in userId', () => {
      const specialUserId = 'user@#$%^&*()-_=+[]{}|;:,.<>?'
      const chat = new Chat(specialUserId)

      expect(chat.getUserId()).toBe(specialUserId)
    })

    it('should handle dates in the future', () => {
      const futureDate = new Date('2099-12-31T23:59:59Z')
      const chat = new Chat('user-123', undefined, futureDate, futureDate)

      expect(chat.getCreatedAt()).toEqual(futureDate)
      expect(chat.getUpdatedAt()).toEqual(futureDate)
    })

    it('should handle dates in the past', () => {
      const pastDate = new Date('1970-01-01T00:00:00Z')
      const chat = new Chat('user-123', undefined, pastDate, pastDate)

      expect(chat.getCreatedAt()).toEqual(pastDate)
      expect(chat.getUpdatedAt()).toEqual(pastDate)
    })

    it('should handle updatedAt before createdAt', () => {
      const createdAt = new Date('2024-12-31T23:59:59Z')
      const updatedAt = new Date('2024-01-01T00:00:00Z')
      const chat = new Chat('user-123', undefined, createdAt, updatedAt)

      // The Chat class doesn't validate this relationship
      expect(chat.getCreatedAt()).toEqual(createdAt)
      expect(chat.getUpdatedAt()).toEqual(updatedAt)
      expect(chat.getUpdatedAt().getTime()).toBeLessThan(chat.getCreatedAt().getTime())
    })
  })
})
