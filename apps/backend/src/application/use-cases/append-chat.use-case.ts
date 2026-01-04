import type { LoggerPort } from '../ports/logger.port.js'
import type { UIMessage } from 'ai'
import type { AIServicePort } from '../ports/ai.port.js'
import type { ChatIdType } from '../../domain/value-objects/chatID.js'

export interface AppendedChatResult {
  chatId: string
  appendedMessages: UIMessage[]
}

export class AppendedChatUseCase {
  constructor(
    private readonly aiService: AIServicePort,
    private readonly logger: LoggerPort
  ) {}

  async execute(chatId: ChatIdType, messages: UIMessage[]): Promise<AppendedChatResult | null> {
    const chatIdString = chatId
    if (!chatIdString) {
      this.logger.info('Invalid chatId value received in AppendedChatUseCase', { chatId })
      return null
    }
    this.logger.info('Appending chat messages', {
      chatId: chatIdString,
      messageCount: messages.length,
    })
    this.logger.debug('Appended chat', { chatId: chatIdString, messages })
    await this.aiService.appendToChatMessages(chatIdString, messages)

    // This is a placeholder return value
    return {
      chatId: chatIdString,
      appendedMessages: messages,
    }
  }
}
