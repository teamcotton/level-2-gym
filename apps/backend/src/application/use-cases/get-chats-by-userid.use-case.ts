import type { UserIdType } from '../../domain/value-objects/userID.js'
import type { LoggerPort } from '../ports/logger.port.js'
import { AIRepository } from '../../adapters/secondary/repositories/ai.repository.js'

export class GetChatsByUserIdUseCase {
  constructor(
    private readonly aiRepository: AIRepository,
    private readonly logger: LoggerPort
  ) {}

  async execute(userId: UserIdType): Promise<any> {
    this.logger.info(`Getting chats for chat ID: ${userId}`)
    const chats = await this.aiRepository.getChatsByUserId(userId)
    this.logger.info(`Retrieved ${chats.length} chats for chat ID: ${userId}`)
    return chats
  }
}
