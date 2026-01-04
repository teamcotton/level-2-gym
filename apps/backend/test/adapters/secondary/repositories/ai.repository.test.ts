import type { UIMessage } from 'ai'
import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AIRepository } from '../../../../src/adapters/secondary/repositories/ai.repository.js'
import type { LoggerPort } from '../../../../src/application/ports/logger.port.js'
import { ChatId } from '../../../../src/domain/value-objects/chatID.js'
import { UserId } from '../../../../src/domain/value-objects/userID.js'
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
  const mockChatId = new ChatId(mockChatIdString).getValue()

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
    it('should successfully create chat with specific chat ID, user ID, and message with parts', async () => {
      // Arrange: Setup test data with specific values
      const testChatIdString = '019b86fb-f42f-7ea7-b30c-8ebf80c3f4a9'
      const testUserIdString = '019b6742-b220-7e5c-a4cd-459ff52f6579'
      const testChatId = new ChatId(testChatIdString).getValue()
      const testUserId = new UserId(testUserIdString).getValue()

      const initialMessages: UIMessage[] = [
        {
          id: 'b00cKhlKQI6VjXcD',
          role: 'user',
          parts: [{ type: 'text', text: 'hello' }],
        } as any,
      ]

      const mockInsertedMessages = [
        {
          id: 'generated-msg-id',
          chatId: testChatIdString,
          role: 'user',
          createdAt: new Date(),
        },
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

      // Act: Call createChat with the test data
      const result = await repository.createChat(testChatId, testUserId, initialMessages)

      // Assert: Verify the chat was created successfully
      expect(result).toBe(testChatIdString)
      expect(db.insert).toHaveBeenCalledTimes(3)

      // Verify chat insert was called with correct data
      expect(mockChatValues).toHaveBeenCalledWith({
        id: testChatIdString,
        userId: testUserIdString,
      })

      // Verify messages insert was called with correct data
      expect(mockMessagesValues).toHaveBeenCalledWith([{ chatId: testChatIdString, role: 'user' }])

      // Verify parts insert was called with correct data
      expect(mockPartsValues).toHaveBeenCalledWith([
        {
          messageId: 'generated-msg-id',
          type: 'text',
          textText: 'hello',
          order: 0,
        },
      ])

      // Verify logger was called
      expect(mockLogger.info).toHaveBeenCalled()
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
      const mockInnerJoin = vi.fn().mockReturnValue({ leftJoin: mockLeftJoin })
      const mockFrom = vi.fn().mockReturnValue({ innerJoin: mockInnerJoin })
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any)

      const result = await repository.getChatResponse(mockChatId)

      expect(result).toEqual(mockResult)
      expect(db.select).toHaveBeenCalledTimes(1)
    })

    it('should return empty array when chat has no messages', async () => {
      const mockWhere = vi.fn().mockResolvedValue([])
      const mockLeftJoin = vi.fn().mockReturnValue({ where: mockWhere })
      const mockInnerJoin = vi.fn().mockReturnValue({ leftJoin: mockLeftJoin })
      const mockFrom = vi.fn().mockReturnValue({ innerJoin: mockInnerJoin })
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any)

      const result = await repository.getChatResponse(mockChatId)

      expect(result).toEqual([])
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
      const mockInnerJoin = vi.fn().mockReturnValue({ leftJoin: mockLeftJoin })
      const mockFrom = vi.fn().mockReturnValue({ innerJoin: mockInnerJoin })
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
      const mockInnerJoin = vi.fn().mockReturnValue({ leftJoin: mockLeftJoin })
      const mockFrom = vi.fn().mockReturnValue({ innerJoin: mockInnerJoin })
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
      const mockInnerJoin = vi.fn().mockReturnValue({ leftJoin: mockLeftJoin })
      const mockFrom = vi.fn().mockReturnValue({ innerJoin: mockInnerJoin })
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any)

      await expect(repository.getChatResponse(mockChatId)).rejects.toThrow(
        'Database connection failed'
      )
    })

    it('should query with correct chat ID', async () => {
      const specificChatIdString = uuidv7()
      const specificChatId = new ChatId(specificChatIdString).getValue()
      const mockResult = [
        {
          message: {
            id: 'msg-1',
            chatId: specificChatIdString,
            role: 'user',
            createdAt: new Date(),
          },
          part: { id: 'part-1', messageId: 'msg-1', type: 'text', textText: 'Test' },
        },
      ]

      const mockWhere = vi.fn().mockResolvedValue(mockResult)
      const mockLeftJoin = vi.fn().mockReturnValue({ where: mockWhere })
      const mockInnerJoin = vi.fn().mockReturnValue({ leftJoin: mockLeftJoin })
      const mockFrom = vi.fn().mockReturnValue({ innerJoin: mockInnerJoin })
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any)

      const result = await repository.getChatResponse(specificChatId)

      expect(result).toEqual(mockResult)
      expect(mockWhere).toHaveBeenCalledTimes(1)
    })

    it('should return empty array when chat exists but has no messages', async () => {
      const mockResult: any[] = []

      const mockWhere = vi.fn().mockResolvedValue(mockResult)
      const mockLeftJoin = vi.fn().mockReturnValue({ where: mockWhere })
      const mockInnerJoin = vi.fn().mockReturnValue({ leftJoin: mockLeftJoin })
      const mockFrom = vi.fn().mockReturnValue({ innerJoin: mockInnerJoin })
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any)

      const result = await repository.getChatResponse(mockChatId)

      expect(result).toEqual([])
    })
  })

  describe('appendToChatMessages', () => {
    it('should successfully append messages with parts to an existing chat', async () => {
      // Arrange
      const testChatIdString = '019b86fb-f42f-7ea7-b30c-8ebf80c3f4a9'
      const testChatId = new ChatId(testChatIdString).getValue()

      const initialMessages: UIMessage[] = [
        {
          id: 'msg-1',
          role: 'user',
          parts: [{ type: 'text', text: 'What is the capital of France?' }],
        } as any,
        {
          id: 'msg-2',
          role: 'assistant',
          parts: [{ type: 'text', text: 'The capital of France is Paris.' }],
        } as any,
      ]

      const mockInsertedMessages = [
        {
          id: 'generated-msg-id-1',
          chatId: testChatIdString,
          role: 'user',
          createdAt: new Date(),
        },
        {
          id: 'generated-msg-id-2',
          chatId: testChatIdString,
          role: 'assistant',
          createdAt: new Date(),
        },
      ]

      // Mock for chats update
      const mockUpdateWhere = vi.fn().mockResolvedValue(undefined)
      const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere })
      const mockUpdate = vi.fn().mockReturnValue({ set: mockUpdateSet })

      // Mock for messages insert
      const mockMessagesReturning = vi.fn().mockResolvedValue(mockInsertedMessages)
      const mockMessagesValues = vi.fn().mockReturnValue({ returning: mockMessagesReturning })
      const mockMessagesInsert = vi.fn().mockReturnValue({ values: mockMessagesValues })

      // Mock for parts insert
      const mockPartsValues = vi.fn().mockResolvedValue(undefined)
      const mockPartsInsert = vi.fn().mockReturnValue({ values: mockPartsValues })

      // Setup mocks
      vi.mocked(db).update = mockUpdate as any
      vi.mocked(db.insert)
        .mockReturnValueOnce(mockMessagesInsert() as any)
        .mockReturnValueOnce(mockPartsInsert() as any)

      // Act
      const result = await repository.appendToChatMessages(testChatId, initialMessages)

      // Assert
      expect(result).toBe(testChatIdString)
      expect(mockUpdate).toHaveBeenCalledTimes(1)
      expect(db.insert).toHaveBeenCalledTimes(2) // messages and parts
      expect(mockMessagesReturning).toHaveBeenCalledTimes(1)
      expect(mockPartsValues).toHaveBeenCalledTimes(1)
    })

    it('should update chat timestamp when appending messages', async () => {
      // Arrange
      const testChatIdString = '019b86fb-f42f-7ea7-b30c-8ebf80c3f4a9'
      const testChatId = new ChatId(testChatIdString).getValue()

      const initialMessages: UIMessage[] = [
        {
          id: 'msg-1',
          role: 'user',
          parts: [{ type: 'text', text: 'Hello' }],
        } as any,
      ]

      const mockInsertedMessages = [
        {
          id: 'generated-msg-id',
          chatId: testChatIdString,
          role: 'user',
          createdAt: new Date(),
        },
      ]

      // Mock for chats update
      const mockUpdateWhere = vi.fn().mockResolvedValue(undefined)
      const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere })
      const mockUpdate = vi.fn().mockReturnValue({ set: mockUpdateSet })

      // Mock for messages insert
      const mockMessagesReturning = vi.fn().mockResolvedValue(mockInsertedMessages)
      const mockMessagesValues = vi.fn().mockReturnValue({ returning: mockMessagesReturning })
      const mockMessagesInsert = vi.fn().mockReturnValue({ values: mockMessagesValues })

      // Mock for parts insert
      const mockPartsValues = vi.fn().mockResolvedValue(undefined)
      const mockPartsInsert = vi.fn().mockReturnValue({ values: mockPartsValues })

      // Setup mocks
      vi.mocked(db).update = mockUpdate as any
      vi.mocked(db.insert)
        .mockReturnValueOnce(mockMessagesInsert() as any)
        .mockReturnValueOnce(mockPartsInsert() as any)

      // Act
      await repository.appendToChatMessages(testChatId, initialMessages)

      // Assert - verify update was called with a Date object
      expect(mockUpdateSet).toHaveBeenCalledWith(
        expect.objectContaining({
          updatedAt: expect.any(Date),
        })
      )
    })

    it('should handle empty messages array without inserting parts', async () => {
      // Arrange
      const testChatIdString = '019b86fb-f42f-7ea7-b30c-8ebf80c3f4a9'
      const testChatId = new ChatId(testChatIdString).getValue()
      const initialMessages: UIMessage[] = []

      // Mock for chats update only
      const mockUpdateWhere = vi.fn().mockResolvedValue(undefined)
      const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere })
      const mockUpdate = vi.fn().mockReturnValue({ set: mockUpdateSet })

      // Setup mocks
      vi.mocked(db).update = mockUpdate as any

      // Act
      const result = await repository.appendToChatMessages(testChatId, initialMessages)

      // Assert
      expect(result).toBe(testChatIdString)
      expect(mockUpdate).toHaveBeenCalledTimes(1)
      expect(db.insert).not.toHaveBeenCalled()
    })

    it('should handle messages without parts', async () => {
      // Arrange
      const testChatIdString = '019b86fb-f42f-7ea7-b30c-8ebf80c3f4a9'
      const testChatId = new ChatId(testChatIdString).getValue()

      const initialMessages: UIMessage[] = [
        {
          id: 'msg-1',
          role: 'user',
          parts: [],
        } as any,
      ]

      const mockInsertedMessages = [
        {
          id: 'generated-msg-id',
          chatId: testChatIdString,
          role: 'user',
          createdAt: new Date(),
        },
      ]

      // Mock for chats update
      const mockUpdateWhere = vi.fn().mockResolvedValue(undefined)
      const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere })
      const mockUpdate = vi.fn().mockReturnValue({ set: mockUpdateSet })

      // Mock for messages insert
      const mockMessagesReturning = vi.fn().mockResolvedValue(mockInsertedMessages)
      const mockMessagesValues = vi.fn().mockReturnValue({ returning: mockMessagesReturning })
      const mockMessagesInsert = vi.fn().mockReturnValue({ values: mockMessagesValues })

      // Setup mocks
      vi.mocked(db).update = mockUpdate as any
      vi.mocked(db.insert).mockReturnValueOnce(mockMessagesInsert() as any)

      // Act
      const result = await repository.appendToChatMessages(testChatId, initialMessages)

      // Assert
      expect(result).toBe(testChatIdString)
      expect(db.insert).toHaveBeenCalledTimes(1) // Only messages, no parts
    })

    it('should handle multiple messages with different part types', async () => {
      // Arrange
      const testChatIdString = '019b86fb-f42f-7ea7-b30c-8ebf80c3f4a9'
      const testChatId = new ChatId(testChatIdString).getValue()

      const initialMessages: UIMessage[] = [
        {
          id: 'msg-1',
          role: 'user',
          parts: [
            { type: 'text', text: 'Question with file' },
            {
              type: 'file',
              mediaType: 'image/png',
              filename: 'screenshot.png',
              url: 'https://example.com/img.png',
            },
          ],
        } as any,
        {
          id: 'msg-2',
          role: 'assistant',
          parts: [
            { type: 'reasoning', text: 'Let me analyze this...', providerMetadata: {} },
            { type: 'text', text: 'Here is my response' },
          ],
        } as any,
      ]

      const mockInsertedMessages = [
        {
          id: 'generated-msg-id-1',
          chatId: testChatIdString,
          role: 'user',
          createdAt: new Date(),
        },
        {
          id: 'generated-msg-id-2',
          chatId: testChatIdString,
          role: 'assistant',
          createdAt: new Date(),
        },
      ]

      // Mock for chats update
      const mockUpdateWhere = vi.fn().mockResolvedValue(undefined)
      const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere })
      const mockUpdate = vi.fn().mockReturnValue({ set: mockUpdateSet })

      // Mock for messages insert
      const mockMessagesReturning = vi.fn().mockResolvedValue(mockInsertedMessages)
      const mockMessagesValues = vi.fn().mockReturnValue({ returning: mockMessagesReturning })
      const mockMessagesInsert = vi.fn().mockReturnValue({ values: mockMessagesValues })

      // Mock for parts insert
      const mockPartsValues = vi.fn().mockResolvedValue(undefined)
      const mockPartsInsert = vi.fn().mockReturnValue({ values: mockPartsValues })

      // Setup mocks
      vi.mocked(db).update = mockUpdate as any
      vi.mocked(db.insert)
        .mockReturnValueOnce(mockMessagesInsert() as any)
        .mockReturnValueOnce(mockPartsInsert() as any)

      // Act
      const result = await repository.appendToChatMessages(testChatId, initialMessages)

      // Assert
      expect(result).toBe(testChatIdString)
      expect(db.insert).toHaveBeenCalledTimes(2) // messages and parts

      // Verify parts insert was called with 4 parts total (2 per message)
      const partsInsertCall = mockPartsValues.mock.calls?.[0]?.[0]
      expect(partsInsertCall).toHaveLength(4)
    })

    it('should preserve message order when inserting', async () => {
      // Arrange
      const testChatIdString = '019b86fb-f42f-7ea7-b30c-8ebf80c3f4a9'
      const testChatId = new ChatId(testChatIdString).getValue()

      const initialMessages: UIMessage[] = [
        { id: 'msg-1', role: 'user', parts: [{ type: 'text', text: 'First' }] } as any,
        { id: 'msg-2', role: 'assistant', parts: [{ type: 'text', text: 'Second' }] } as any,
        { id: 'msg-3', role: 'user', parts: [{ type: 'text', text: 'Third' }] } as any,
      ]

      const mockInsertedMessages = initialMessages.map((msg, idx) => ({
        id: `generated-msg-id-${idx}`,
        chatId: testChatIdString,
        role: msg.role,
        createdAt: new Date(),
      }))

      // Mock for chats update
      const mockUpdateWhere = vi.fn().mockResolvedValue(undefined)
      const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere })
      const mockUpdate = vi.fn().mockReturnValue({ set: mockUpdateSet })

      // Mock for messages insert
      const mockMessagesReturning = vi.fn().mockResolvedValue(mockInsertedMessages)
      const mockMessagesValues = vi.fn().mockReturnValue({ returning: mockMessagesReturning })
      const mockMessagesInsert = vi.fn().mockReturnValue({ values: mockMessagesValues })

      // Mock for parts insert
      const mockPartsValues = vi.fn().mockResolvedValue(undefined)
      const mockPartsInsert = vi.fn().mockReturnValue({ values: mockPartsValues })

      // Setup mocks
      vi.mocked(db).update = mockUpdate as any
      vi.mocked(db.insert)
        .mockReturnValueOnce(mockMessagesInsert() as any)
        .mockReturnValueOnce(mockPartsInsert() as any)

      // Act
      await repository.appendToChatMessages(testChatId, initialMessages)

      // Assert - verify messages were inserted in correct order with correct roles
      const messagesInsertCall = mockMessagesValues?.mock?.calls?.[0]?.[0]
      expect(messagesInsertCall).toHaveLength(3)
      expect(messagesInsertCall[0].role).toBe('user')
      expect(messagesInsertCall[1].role).toBe('assistant')
      expect(messagesInsertCall[2].role).toBe('user')
    })

    it('should return the same chatId that was passed in', async () => {
      // Arrange
      const testChatIdString = '019b86fb-f42f-7ea7-b30c-8ebf80c3f4a9'
      const testChatId = new ChatId(testChatIdString).getValue()
      const initialMessages: UIMessage[] = []

      // Mock for chats update
      const mockUpdateWhere = vi.fn().mockResolvedValue(undefined)
      const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere })
      const mockUpdate = vi.fn().mockReturnValue({ set: mockUpdateSet })

      // Setup mocks
      vi.mocked(db).update = mockUpdate as any

      // Act
      const result = await repository.appendToChatMessages(testChatId, initialMessages)

      // Assert
      expect(result).toBe(testChatIdString)
      expect(result).toEqual(testChatId)
    })
  })
})
