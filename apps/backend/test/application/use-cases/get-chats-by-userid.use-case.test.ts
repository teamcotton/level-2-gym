import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AIRepository } from '../../../src/adapters/secondary/repositories/ai.repository.js'
import type { LoggerPort } from '../../../src/application/ports/logger.port.js'
import { GetChatsByUserIdUseCase } from '../../../src/application/use-cases/get-chats-by-userid.use-case.js'
import { ChatId, type ChatIdType } from '../../../src/domain/value-objects/chatID.js'
import { UserId, type UserIdType } from '../../../src/domain/value-objects/userID.js'
import { InternalErrorException } from '../../../src/shared/exceptions/internal-error.exception.js'

describe('GetChatsByUserIdUseCase', () => {
  let useCase: GetChatsByUserIdUseCase
  let mockLogger: LoggerPort
  let mockAIRepository: AIRepository
  let testUserId: UserIdType

  beforeEach(() => {
    vi.clearAllMocks()

    // Create test user ID
    testUserId = new UserId(uuidv7()).getValue()

    // Create mock implementations
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    }

    mockAIRepository = {
      getChatsByUserId: vi.fn(),
    } as unknown as AIRepository

    // Create use case instance with mocks
    useCase = new GetChatsByUserIdUseCase(mockAIRepository, mockLogger)
  })

  describe('execute() - successful scenarios', () => {
    it('should retrieve chats for a user successfully', async () => {
      const mockChats: ChatIdType[] = [
        new ChatId(uuidv7()).getValue(),
        new ChatId(uuidv7()).getValue(),
        new ChatId(uuidv7()).getValue(),
      ]

      vi.mocked(mockAIRepository.getChatsByUserId).mockResolvedValue(mockChats)

      const result = await useCase.execute(testUserId)

      expect(result).toEqual(mockChats)
      expect(result).toHaveLength(3)
      expect(mockAIRepository.getChatsByUserId).toHaveBeenCalledWith(testUserId)
      expect(mockAIRepository.getChatsByUserId).toHaveBeenCalledTimes(1)
      expect(mockLogger.info).toHaveBeenCalledTimes(2)
      expect(mockLogger.info).toHaveBeenCalledWith(`Getting chats for user ID: ${testUserId}`)
      expect(mockLogger.info).toHaveBeenCalledWith(`Retrieved 3 chats for user ID: ${testUserId}`)
    })

    it('should return empty array when user has no chats', async () => {
      const mockChats: ChatIdType[] = []

      vi.mocked(mockAIRepository.getChatsByUserId).mockResolvedValue(mockChats)

      const result = await useCase.execute(testUserId)

      expect(result).toEqual([])
      expect(result).toHaveLength(0)
      expect(mockAIRepository.getChatsByUserId).toHaveBeenCalledWith(testUserId)
      expect(mockLogger.info).toHaveBeenCalledWith(`Retrieved 0 chats for user ID: ${testUserId}`)
    })

    it('should return single chat when user has one chat', async () => {
      const mockChats: ChatIdType[] = [new ChatId(uuidv7()).getValue()]

      vi.mocked(mockAIRepository.getChatsByUserId).mockResolvedValue(mockChats)

      const result = await useCase.execute(testUserId)

      expect(result).toEqual(mockChats)
      expect(result).toHaveLength(1)
      expect(mockAIRepository.getChatsByUserId).toHaveBeenCalledWith(testUserId)
      expect(mockLogger.info).toHaveBeenCalledWith(`Retrieved 1 chat for user ID: ${testUserId}`)
    })

    it('should handle large number of chats', async () => {
      const mockChats: ChatIdType[] = Array.from({ length: 100 }, () =>
        new ChatId(uuidv7()).getValue()
      )

      vi.mocked(mockAIRepository.getChatsByUserId).mockResolvedValue(mockChats)

      const result = await useCase.execute(testUserId)

      expect(result).toEqual(mockChats)
      expect(result).toHaveLength(100)
      expect(mockAIRepository.getChatsByUserId).toHaveBeenCalledWith(testUserId)
      expect(mockLogger.info).toHaveBeenCalledWith(`Retrieved 100 chats for user ID: ${testUserId}`)
    })

    it('should call logger with correct userId', async () => {
      const specificUserId = new UserId(uuidv7()).getValue()
      const mockChats: ChatIdType[] = []

      vi.mocked(mockAIRepository.getChatsByUserId).mockResolvedValue(mockChats)

      await useCase.execute(specificUserId)

      expect(mockLogger.info).toHaveBeenCalledWith(`Getting chats for user ID: ${specificUserId}`)
      expect(mockLogger.info).toHaveBeenCalledWith(
        `Retrieved 0 chats for user ID: ${specificUserId}`
      )
    })
  })

  describe('execute() - error scenarios', () => {
    it('should throw InternalErrorException when repository fails', async () => {
      const repositoryError = new Error('Database connection failed')
      vi.mocked(mockAIRepository.getChatsByUserId).mockRejectedValue(repositoryError)

      await expect(useCase.execute(testUserId)).rejects.toThrow()
      expect(mockAIRepository.getChatsByUserId).toHaveBeenCalledWith(testUserId)
    })

    it('should propagate repository errors', async () => {
      const error = new InternalErrorException('Failed to retrieve chats')
      vi.mocked(mockAIRepository.getChatsByUserId).mockRejectedValue(error)

      await expect(useCase.execute(testUserId)).rejects.toThrow('Failed to retrieve chats')
      expect(mockLogger.info).toHaveBeenCalledWith(`Getting chats for user ID: ${testUserId}`)
    })

    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network timeout')
      vi.mocked(mockAIRepository.getChatsByUserId).mockRejectedValue(networkError)

      await expect(useCase.execute(testUserId)).rejects.toThrow('Network timeout')
    })
  })

  describe('execute() - logging behavior', () => {
    it('should log before and after repository call', async () => {
      const mockChats: ChatIdType[] = [new ChatId(uuidv7()).getValue()]
      vi.mocked(mockAIRepository.getChatsByUserId).mockResolvedValue(mockChats)

      await useCase.execute(testUserId)

      expect(mockLogger.info).toHaveBeenNthCalledWith(1, `Getting chats for user ID: ${testUserId}`)
      expect(mockLogger.info).toHaveBeenNthCalledWith(
        2,
        `Retrieved 1 chat for user ID: ${testUserId}`
      )
    })

    it('should only log initial message when error occurs', async () => {
      const error = new Error('Repository error')
      vi.mocked(mockAIRepository.getChatsByUserId).mockRejectedValue(error)

      await expect(useCase.execute(testUserId)).rejects.toThrow()

      expect(mockLogger.info).toHaveBeenCalledTimes(1)
      expect(mockLogger.info).toHaveBeenCalledWith(`Getting chats for user ID: ${testUserId}`)
    })

    it('should not call error logger on repository failure', async () => {
      const error = new Error('Repository error')
      vi.mocked(mockAIRepository.getChatsByUserId).mockRejectedValue(error)

      await expect(useCase.execute(testUserId)).rejects.toThrow()

      expect(mockLogger.error).not.toHaveBeenCalled()
    })
  })

  describe('execute() - integration with value objects', () => {
    it('should work with different valid user IDs', async () => {
      const userId1 = new UserId(uuidv7()).getValue()
      const userId2 = new UserId(uuidv7()).getValue()
      const mockChats: ChatIdType[] = []

      vi.mocked(mockAIRepository.getChatsByUserId).mockResolvedValue(mockChats)

      await useCase.execute(userId1)
      await useCase.execute(userId2)

      expect(mockAIRepository.getChatsByUserId).toHaveBeenCalledWith(userId1)
      expect(mockAIRepository.getChatsByUserId).toHaveBeenCalledWith(userId2)
      expect(mockAIRepository.getChatsByUserId).toHaveBeenCalledTimes(2)
    })

    it('should return ChatIdType array from repository', async () => {
      const chatId1 = new ChatId(uuidv7()).getValue()
      const chatId2 = new ChatId(uuidv7()).getValue()
      const mockChats: ChatIdType[] = [chatId1, chatId2]

      vi.mocked(mockAIRepository.getChatsByUserId).mockResolvedValue(mockChats)

      const result = await useCase.execute(testUserId)

      expect(result).toEqual(mockChats)
      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(2)
      // Type assertion safe here because we just verified it's an array
      expect((result as ChatIdType[])[0]).toBe(chatId1)
      expect((result as ChatIdType[])[1]).toBe(chatId2)
    })
  })
})
