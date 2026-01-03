import type { UIMessage } from 'ai'
import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AIRepository } from '../../../../src/adapters/secondary/repositories/ai.repository.js'
import type { LoggerPort } from '../../../../src/application/ports/logger.port.js'
import { ChatId, type ChatIdType } from '../../../../src/domain/value-objects/chatID.js'
import { UserId, type UserIdType } from '../../../../src/domain/value-objects/userID.js'
import { db } from '../../../../src/infrastructure/database/index.js'
import { Uuid7Util } from '../../../../src/shared/utils/uuid7.util.js'

// Mock the database module
vi.mock('../../../../src/infrastructure/database/index.js', () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
  },
}))

// Mock the Uuid7Util
vi.mock('../../../../src/shared/utils/uuid7.util.js', () => ({
  Uuid7Util: {
    createUuidv7: vi.fn(),
    isValidUUID: vi.fn(() => true),
    uuidVersionValidation: vi.fn((_uuid: string) => 'v7'),
  },
}))

describe('AIRepository', () => {
  let repository: AIRepository
  let mockLogger: LoggerPort
  const mockChatIdString = uuidv7()
  const mockUserIdString = uuidv7()
  const mockChatId = new ChatId(mockChatIdString).getValue()
  const mockUserId = new UserId(mockUserIdString) as UserIdType

  beforeEach(() => {
    vi.clearAllMocks()

    // Create mock logger
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    }

    repository = new AIRepository(mockLogger)
    vi.mocked(Uuid7Util.createUuidv7).mockReturnValue(mockChatIdString)
  })

  describe('createChat', () => {
    it('should create a new chat without initial messages', async () => {
      const mockValues = vi.fn().mockResolvedValue(undefined)
      const mockInsert = vi.fn().mockReturnValue({ values: mockValues })
      vi.mocked(db.insert).mockReturnValue(mockInsert() as any)

      const chatId = await repository.createChat(mockChatId, mockUserId)

      expect(chatId).toBe(mockChatIdString)
      expect(db.insert).toHaveBeenCalledTimes(1)
      expect(mockValues).toHaveBeenCalledWith({
        id: mockChatIdString,
        userId: mockUserIdString,
      })
    })

    it('should create a new chat with empty initial messages array', async () => {
      const mockValues = vi.fn().mockResolvedValue(undefined)
      const mockInsert = vi.fn().mockReturnValue({ values: mockValues })
      vi.mocked(db.insert).mockReturnValue(mockInsert() as any)

      const chatId = await repository.createChat(mockChatId, mockUserId, [])

      expect(chatId).toBe(mockChatIdString)
      expect(db.insert).toHaveBeenCalledTimes(1)
      expect(mockValues).toHaveBeenCalledWith({
        id: mockChatIdString,
        userId: mockUserIdString,
      })
    })

    it('should create a new chat with initial messages', async () => {
      const initialMessages: UIMessage[] = [
        {
          id: 'msg-1',
          role: 'user',
          content: [{ type: 'text', text: 'Hello AI' }],
        } as any,
        {
          id: 'msg-2',
          role: 'assistant',
          content: [{ type: 'text', text: 'Hello! How can I help you?' }],
        } as any,
      ]

      const mockInsertedMessages = [
        { id: 'db-msg-1', chatId: mockChatIdString, role: 'user' },
        { id: 'db-msg-2', chatId: mockChatIdString, role: 'assistant' },
      ]

      // Mock for chats insert
      const mockChatValues = vi.fn().mockResolvedValue(undefined)
      const mockChatInsert = vi.fn().mockReturnValue({ values: mockChatValues })

      // Mock for messages insert
      const mockMessagesReturning = vi.fn().mockResolvedValue(mockInsertedMessages)
      const mockMessagesValues = vi.fn().mockReturnValue({ returning: mockMessagesReturning })
      const mockMessagesInsert = vi.fn().mockReturnValue({ values: mockMessagesValues })

      // Mock for parts insert
      const mockPartsValues = vi.fn().mockResolvedValue(undefined)
      const mockPartsInsert = vi.fn().mockReturnValue({ values: mockPartsValues })

      vi.mocked(db.insert)
        .mockReturnValueOnce(mockChatInsert() as any)
        .mockReturnValueOnce(mockMessagesInsert() as any)
        .mockReturnValueOnce(mockPartsInsert() as any)

      const chatId = await repository.createChat(mockChatId, mockUserId, initialMessages)

      expect(chatId).toBe(mockChatIdString)
      expect(db.insert).toHaveBeenCalledTimes(3)

      // Verify chat insert
      expect(mockChatValues).toHaveBeenCalledWith({
        id: mockChatIdString,
        userId: mockUserIdString,
      })

      // Verify messages insert
      expect(mockMessagesValues).toHaveBeenCalledWith([
        { chatId: mockChatIdString, role: 'user' },
        { chatId: mockChatIdString, role: 'assistant' },
      ])

      // Verify parts insert
      expect(mockPartsValues).toHaveBeenCalledWith([
        { messageId: 'db-msg-1', type: 'text', text: 'Hello AI' },
        { messageId: 'db-msg-2', type: 'text', text: 'Hello! How can I help you?' },
      ])
    })

    it('should handle messages with multiple parts', async () => {
      const initialMessages: UIMessage[] = [
        {
          id: 'msg-1',
          role: 'user',
          content: [
            { type: 'text', text: 'First part' },
            { type: 'text', text: 'Second part' },
            { type: 'text', text: 'Third part' },
          ],
        } as any,
      ]

      const mockInsertedMessages = [{ id: 'db-msg-1', chatId: mockChatIdString, role: 'user' }]

      const mockChatValues = vi.fn().mockResolvedValue(undefined)
      const mockChatInsert = vi.fn().mockReturnValue({ values: mockChatValues })

      const mockMessagesReturning = vi.fn().mockResolvedValue(mockInsertedMessages)
      const mockMessagesValues = vi.fn().mockReturnValue({ returning: mockMessagesReturning })
      const mockMessagesInsert = vi.fn().mockReturnValue({ values: mockMessagesValues })

      const mockPartsValues = vi.fn().mockResolvedValue(undefined)
      const mockPartsInsert = vi.fn().mockReturnValue({ values: mockPartsValues })

      vi.mocked(db.insert)
        .mockReturnValueOnce(mockChatInsert() as any)
        .mockReturnValueOnce(mockMessagesInsert() as any)
        .mockReturnValueOnce(mockPartsInsert() as any)

      await repository.createChat(mockChatId, mockUserId, initialMessages)

      expect(mockPartsValues).toHaveBeenCalledWith([
        { messageId: 'db-msg-1', type: 'text', text: 'First part' },
        { messageId: 'db-msg-1', type: 'text', text: 'Second part' },
        { messageId: 'db-msg-1', type: 'text', text: 'Third part' },
      ])
    })

    it('should filter out invalid parts without type or text', async () => {
      const initialMessages: UIMessage[] = [
        {
          id: 'msg-1',
          role: 'user',
          content: [
            { type: 'text', text: 'Valid part' },
            { type: 'text' }, // Missing text
            { text: 'No type' }, // Missing type
            null, // Null part
            { type: 'text', text: 'Another valid part' },
          ],
        } as any,
      ]

      const mockInsertedMessages = [{ id: 'db-msg-1', chatId: mockChatIdString, role: 'user' }]

      const mockChatValues = vi.fn().mockResolvedValue(undefined)
      const mockChatInsert = vi.fn().mockReturnValue({ values: mockChatValues })

      const mockMessagesReturning = vi.fn().mockResolvedValue(mockInsertedMessages)
      const mockMessagesValues = vi.fn().mockReturnValue({ returning: mockMessagesReturning })
      const mockMessagesInsert = vi.fn().mockReturnValue({ values: mockMessagesValues })

      const mockPartsValues = vi.fn().mockResolvedValue(undefined)
      const mockPartsInsert = vi.fn().mockReturnValue({ values: mockPartsValues })

      vi.mocked(db.insert)
        .mockReturnValueOnce(mockChatInsert() as any)
        .mockReturnValueOnce(mockMessagesInsert() as any)
        .mockReturnValueOnce(mockPartsInsert() as any)

      await repository.createChat(mockChatId, mockUserId, initialMessages)

      // Should only insert valid parts
      expect(mockPartsValues).toHaveBeenCalledWith([
        { messageId: 'db-msg-1', type: 'text', text: 'Valid part' },
        { messageId: 'db-msg-1', type: 'text', text: 'Another valid part' },
      ])
    })

    it('should not insert parts if no valid parts exist', async () => {
      const initialMessages: UIMessage[] = [
        {
          id: 'msg-1',
          role: 'user',
          content: [], // Empty content
        } as any,
      ]

      const mockInsertedMessages = [{ id: 'db-msg-1', chatId: mockChatIdString, role: 'user' }]

      const mockChatValues = vi.fn().mockResolvedValue(undefined)
      const mockChatInsert = vi.fn().mockReturnValue({ values: mockChatValues })

      const mockMessagesReturning = vi.fn().mockResolvedValue(mockInsertedMessages)
      const mockMessagesValues = vi.fn().mockReturnValue({ returning: mockMessagesReturning })
      const mockMessagesInsert = vi.fn().mockReturnValue({ values: mockMessagesValues })

      vi.mocked(db.insert)
        .mockReturnValueOnce(mockChatInsert() as any)
        .mockReturnValueOnce(mockMessagesInsert() as any)

      await repository.createChat(mockChatId, mockUserId, initialMessages)

      // Should only call insert twice (chat and messages, not parts)
      expect(db.insert).toHaveBeenCalledTimes(2)
    })

    it('should handle messages with non-array content', async () => {
      const initialMessages: UIMessage[] = [
        {
          id: 'msg-1',
          role: 'user',
          content: 'Simple string content', // Not an array
        } as any,
      ]

      const mockInsertedMessages = [{ id: 'db-msg-1', chatId: mockChatIdString, role: 'user' }]

      const mockChatValues = vi.fn().mockResolvedValue(undefined)
      const mockChatInsert = vi.fn().mockReturnValue({ values: mockChatValues })

      const mockMessagesReturning = vi.fn().mockResolvedValue(mockInsertedMessages)
      const mockMessagesValues = vi.fn().mockReturnValue({ returning: mockMessagesReturning })
      const mockMessagesInsert = vi.fn().mockReturnValue({ values: mockMessagesValues })

      vi.mocked(db.insert)
        .mockReturnValueOnce(mockChatInsert() as any)
        .mockReturnValueOnce(mockMessagesInsert() as any)

      await repository.createChat(mockChatId, mockUserId, initialMessages)

      // Should insert message but not parts (content is not an array)
      expect(db.insert).toHaveBeenCalledTimes(2)
    })
  })

  describe('getChatResponse', () => {
    it('should retrieve chat messages with parts', async () => {
      const mockResult = [
        {
          message: { id: 'msg-1', chatId: mockChatIdString, role: 'user', createdAt: new Date() },
          part: { id: 'part-1', messageId: 'msg-1', type: 'text', textText: 'Hello' },
        },
        {
          message: {
            id: 'msg-2',
            chatId: mockChatIdString,
            role: 'assistant',
            createdAt: new Date(),
          },
          part: { id: 'part-2', messageId: 'msg-2', type: 'text', textText: 'Hi there!' },
        },
      ]

      const mockWhere = vi.fn().mockResolvedValue(mockResult)
      const mockLeftJoin = vi.fn().mockReturnValue({ where: mockWhere })
      const mockFrom = vi.fn().mockReturnValue({ leftJoin: mockLeftJoin })
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any)

      const result = await repository.getChatResponse(mockChatId)

      expect(result).toEqual(mockResult)
      expect(db.select).toHaveBeenCalledTimes(1)
    })

    it('should return null when chat has no messages', async () => {
      const mockWhere = vi.fn().mockResolvedValue(null)
      const mockLeftJoin = vi.fn().mockReturnValue({ where: mockWhere })
      const mockFrom = vi.fn().mockReturnValue({ leftJoin: mockLeftJoin })
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any)

      const result = await repository.getChatResponse(mockChatId)

      expect(result).toBeNull()
    })

    it('should handle messages without parts', async () => {
      const mockResult = [
        {
          message: { id: 'msg-1', chatId: mockChatIdString, role: 'user', createdAt: new Date() },
          part: null,
        },
      ]

      const mockWhere = vi.fn().mockResolvedValue(mockResult)
      const mockLeftJoin = vi.fn().mockReturnValue({ where: mockWhere })
      const mockFrom = vi.fn().mockReturnValue({ leftJoin: mockLeftJoin })
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any)

      const result = await repository.getChatResponse(mockChatId)

      expect(result).toEqual(mockResult)
      expect(result?.[0]?.part).toBeNull()
    })

    it('should handle multiple parts for the same message', async () => {
      const mockResult = [
        {
          message: { id: 'msg-1', chatId: mockChatIdString, role: 'user', createdAt: new Date() },
          part: { id: 'part-1', messageId: 'msg-1', type: 'text', textText: 'First part' },
        },
        {
          message: { id: 'msg-1', chatId: mockChatIdString, role: 'user', createdAt: new Date() },
          part: { id: 'part-2', messageId: 'msg-1', type: 'text', textText: 'Second part' },
        },
      ]

      const mockWhere = vi.fn().mockResolvedValue(mockResult)
      const mockLeftJoin = vi.fn().mockReturnValue({ where: mockWhere })
      const mockFrom = vi.fn().mockReturnValue({ leftJoin: mockLeftJoin })
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any)

      const result = await repository.getChatResponse(mockChatId)

      expect(result).toEqual(mockResult)
      expect(result).toHaveLength(2)
      expect(result?.[0]?.message.id).toBe(result?.[1]?.message.id)
    })

    it('should throw error when database query fails', async () => {
      const dbError = new Error('Database connection failed')

      const mockWhere = vi.fn().mockRejectedValue(dbError)
      const mockLeftJoin = vi.fn().mockReturnValue({ where: mockWhere })
      const mockFrom = vi.fn().mockReturnValue({ leftJoin: mockLeftJoin })
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any)

      await expect(repository.getChatResponse(mockChatId)).rejects.toThrow(
        'Database connection failed'
      )
    })

    it('should query with correct chat ID', async () => {
      const specificChatId = 'specific-chat-id-123'
      const mockResult = [
        {
          message: {
            id: 'msg-1',
            chatId: specificChatId,
            role: 'user',
            createdAt: new Date(),
          },
          part: { id: 'part-1', messageId: 'msg-1', type: 'text', textText: 'Test' },
        },
      ]

      const mockWhere = vi.fn().mockResolvedValue(mockResult)
      const mockLeftJoin = vi.fn().mockReturnValue({ where: mockWhere })
      const mockFrom = vi.fn().mockReturnValue({ leftJoin: mockLeftJoin })
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any)

      const result = await repository.getChatResponse(specificChatId)

      expect(result).toEqual(mockResult)
      expect(mockWhere).toHaveBeenCalledTimes(1)
    })

    it('should return empty array when chat exists but has no messages', async () => {
      const mockResult: any[] = []

      const mockWhere = vi.fn().mockResolvedValue(mockResult)
      const mockLeftJoin = vi.fn().mockReturnValue({ where: mockWhere })
      const mockFrom = vi.fn().mockReturnValue({ leftJoin: mockLeftJoin })
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any)

      const result = await repository.getChatResponse(mockChatId)

      expect(result).toEqual([])
    })
  })
})
