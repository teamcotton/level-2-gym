import type { LoggerPort } from '../ports/logger.port.js'
import { AIRepository } from '../../adapters/secondary/repositories/ai.repository.js'

export class SaveChatUseCase {
  constructor(
    private readonly logger: LoggerPort,
    private readonly aiRepository: AIRepository
  ) {}

  async execute(chatId: string, userId: string, messages: any[]): Promise<string> {
    // Placeholder implementation
    this.logger.info(`Saving chat ${chatId} for user ${userId} with ${messages.length} messages.`)

    const savedChatId = await this.aiRepository.createChat(chatId, userId, messages)
    this.logger.info(`Chat saved with ID: ${savedChatId}`)

    return savedChatId
  }
}
