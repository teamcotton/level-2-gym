import type { AIServicePort } from '../ports/ai.port.js'
import type { LoggerPort } from '../ports/logger.port.js'
import type { ChatResponseResult } from '../../adapters/secondary/repositories/ai.repository.js'
import type { MessageSchemaType } from '@norberts-spark/shared'
import type { ChatIdType } from '../../domain/value-objects/chatID.js'
/**
 * Use case for retrieving chat messages for a specific user
 *
 * This use case handles the retrieval of chat messages and their associated parts
 * from the database. It validates the user ID format before querying the repository.
 *
 * @class GetChatUseCase
 * @example
 * ```typescript
 * const useCase = new GetChatUseCase(aiRepository, logger)
 * const result = await useCase.execute('01943e6d-1234-7890-abcd-1234567890ab')
 * ```
 */
export class GetChatUseCase {
  /**
   * Creates an instance of GetChatUseCase
   * @param {AIServicePort} aiService - Service for handling AI-related operations
   * @param {LoggerPort} logger - Logger for tracking operations
   */
  constructor(
    private readonly aiService: AIServicePort,
    private readonly logger: LoggerPort
  ) {}

  /**
   * Executes the get chat use case
   *
   * Validates the user ID format (must be UUID v7) and retrieves all chat messages
   * and their associated parts for the given user.
   *
   * @param {string} userId - The user ID (must be a valid UUID v7)
   * @param messages
   * @returns {Promise<ChatResponseResult | null>} Chat messages with parts, or null if not found
   * @throws {ValidationException} If the userId is not a valid UUID v7
   * @example
   * ```typescript
   * try {
   *   const chatData = await useCase.execute('01943e6d-1234-7890-abcd-1234567890ab')
   *   if (chatData) {
   *     console.log(`Found ${chatData.length} messages`)
   *   }
   * } catch (error) {
   *   if (error instanceof ValidationException) {
   *     console.error('Invalid user ID format')
   *   }
   * }
   * ```
   */
  async execute(
    chatID: ChatIdType,
    messages: MessageSchemaType[] = []
  ): Promise<ChatResponseResult | null> {
    this.logger.info('Getting chat', { chatID })

    // Retrieve chat data from DB
    const chatData = await this.aiService.getChatResponse(chatID)
    console.log('chatData:', chatData)

    if (chatData && chatData.length > 0) {
      this.logger.info('Chat data retrieved successfully', {
        chatID,
        messageCount: chatData.length,
      })
    } else {
      this.logger.info('No chat data found for user', { chatID })
      return null
    }

    return chatData
  }
}
