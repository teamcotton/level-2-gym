import type { UserIdType } from '../../domain/value-objects/userID.js'
import type { ChatIdType } from '../../domain/value-objects/chatID.js'
import type { LoggerPort } from '../ports/logger.port.js'
import type { AIServicePort } from '../ports/ai.port.js'

export class GetChatsByUserIdUseCase {
  constructor(
    private readonly aiRepository: AIServicePort,
    private readonly logger: LoggerPort
  ) {}

  async execute(userId: UserIdType): Promise<ChatIdType[]> {
    this.logger.info(`Getting chats for user ID: ${userId}`)
    const chats = await this.aiRepository.getChatsByUserId(userId)
    this.logger.info(
      `Retrieved ${chats.length} chat${chats.length === 1 ? '' : 's'} for user ID: ${userId}`
    )
    return chats
  }
}
