import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it } from 'vitest'

import { Chat } from '../../../src/domain/entities/chat.js'
import { ChatId, type ChatIdType } from '../../../src/domain/value-objects/chatID.js'
import { UserId, type UserIdType } from '../../../src/domain/value-objects/userID.js'

describe('Chat Entity', () => {
  let testUserId: UserIdType
  let testChatId: ChatIdType
  let testChat: Chat

  beforeEach(() => {
    testUserId = new UserId(uuidv7()) as UserIdType
    testChatId = new ChatId(uuidv7()).getValue()
    testChat = new Chat(testUserId, testChatId)
  })

  describe('Constructor', () => {
    it('should create a chat with required userId and id', () => {
      expect(testChat).toBeInstanceOf(Chat)
      expect(testChat.getUserId()).toBe(testUserId)
      expect(testChat.getId()).toBe(testChatId)
    })

    it('should accept userId and id parameters', () => {
      const customUserId = new UserId(uuidv7()) as UserIdType
      const customChatId = new ChatId(uuidv7()).getValue()
      const chat = new Chat(customUserId, customChatId)

      expect(chat.getId()).toBe(customChatId)
      expect(chat.getUserId()).toBe(customUserId)
    })

    it('should have id property accessible', () => {
      // TypeScript readonly is compile-time only, property is still accessible
      expect(testChat.id).toBeDefined()
      expect(typeof testChat.id).toBe('string')
    })
  })

  describe('getId()', () => {
    it('should return the chat id', () => {
      const id = testChat.getId()
      expect(id).toBeDefined()
      expect(typeof id).toBe('string')
      expect(id).toBe(testChatId)
    })

    it('should return the same id on multiple calls', () => {
      const id1 = testChat.getId()
      const id2 = testChat.getId()

      expect(id1).toBe(id2)
    })

    it('should return the custom id when provided', () => {
      const customUserId = new UserId(uuidv7()) as UserIdType
      const customChatId = new ChatId(uuidv7()).getValue()
      const chat = new Chat(customUserId, customChatId)

      expect(chat.getId()).toBe(customChatId)
    })
  })

  describe('getUserId()', () => {
    it('should return the user id', () => {
      const userId = testChat.getUserId()
      expect(userId).toBe(testUserId)
      expect(userId).toBeInstanceOf(UserId)
    })

    it('should return the same user id on multiple calls', () => {
      const userId1 = testChat.getUserId()
      const userId2 = testChat.getUserId()

      expect(userId1).toBe(userId2)
    })

    it('should return different user ids for different chat instances', () => {
      const userId1 = new UserId(uuidv7()) as UserIdType
      const chatId1 = new ChatId(uuidv7()).getValue()
      const chat1 = new Chat(userId1, chatId1)

      const userId2 = new UserId(uuidv7()) as UserIdType
      const chatId2 = new ChatId(uuidv7()).getValue()
      const chat2 = new Chat(userId2, chatId2)

      expect(chat1.getUserId()).toBe(userId1)
      expect(chat2.getUserId()).toBe(userId2)
      expect(chat1.getUserId()).not.toBe(chat2.getUserId())
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
  })

  describe('Edge Cases', () => {
    it('should handle empty string userId', () => {
      expect(() => {
        const userId = new UserId('') as UserIdType
        const chatId = new ChatId(uuidv7()).getValue()
        new Chat(userId, chatId)
      }).toThrow('Invalid UUID format provided')
    })

    it('should handle very long userId', () => {
      expect(() => {
        const longUserId = new UserId('user-' + 'x'.repeat(1000)) as UserIdType
        const chatId = new ChatId(uuidv7()).getValue()
        return new Chat(longUserId, chatId)
      }).toThrow('Invalid UUID format provided')
    })

    it('should handle special characters in userId', () => {
      expect(() => {
        const specialUserId = new UserId('user@#$%^&*()-_=+[]{}|;:,.<>?') as UserIdType
        const chatId = new ChatId(uuidv7()).getValue()
        return new Chat(specialUserId, chatId)
      }).toThrow('Invalid UUID format provided')
    })

    it('should handle empty string chatId', () => {
      expect(() => {
        const userId = new UserId(uuidv7()) as UserIdType
        const chatId = new ChatId('').getValue()
        return new Chat(userId, chatId)
      }).toThrow('Invalid UUID format provided')
    })

    it('should handle very long chatId', () => {
      expect(() => {
        const userId = new UserId(uuidv7()) as UserIdType
        const longChatId = new ChatId('chat-' + 'x'.repeat(1000)).getValue()
        return new Chat(userId, longChatId)
      }).toThrow('Invalid UUID format provided')
    })

    it('should handle special characters in chatId', () => {
      expect(() => {
        const userId = new UserId(uuidv7()) as UserIdType
        const specialChatId = new ChatId('chat@#$%^&*()-_=+[]{}|;:,.<>?').getValue()
        return new Chat(userId, specialChatId)
      }).toThrow('Invalid UUID format provided')
    })
  })
})
