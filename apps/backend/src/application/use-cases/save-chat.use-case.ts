import type { LoggerPort } from '../ports/logger.port.js'
import { AIRepository } from '../../adapters/secondary/repositories/ai.repository.js'
import type { UserIdType } from '../../domain/value-objects/userID.js'
import type { ChatIdType } from '../../domain/value-objects/chatID.js'

export class SaveChatUseCase {
  constructor(
    private readonly logger: LoggerPort,
    private readonly aiRepository: AIRepository
  ) {}

  async execute(chatId: ChatIdType, userId: UserIdType, messages: any[]): Promise<string> {
    // Placeholder implementation
    this.logger.info(`Saving chat ${chatId} for user ${userId} with ${messages.length} messages.`)
    this.logger.info('Messages:', messages)

    const savedChatId = await this.aiRepository.createChat(chatId, userId, messages)
    this.logger.info(`Chat saved with ID: ${savedChatId}`)

    return savedChatId
  }
}
