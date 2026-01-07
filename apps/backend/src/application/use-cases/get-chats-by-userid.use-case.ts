import type { UserIdType } from '../../domain/value-objects/userID.js'
import type { LoggerPort } from '../ports/logger.port.js'
import type { ChatIdType } from '../../domain/value-objects/chatID.js'
import { AIRepository } from '../../adapters/secondary/repositories/ai.repository.js'

export class GetChatsByUserIdUseCase {
  constructor(
    private readonly aiRepository: AIRepository,
    private readonly logger: LoggerPort
  ) {}

  async execute(userId: UserIdType): Promise<ChatIdType[] | undefined> {
    this.logger.info(`Getting chats for user ID: ${userId}`)
    const chats = await this.aiRepository.getChatsByUserId(userId)
    this.logger.info(`Retrieved ${chats?.length} chats for user ID: ${userId}`)
    return chats
  }
}
