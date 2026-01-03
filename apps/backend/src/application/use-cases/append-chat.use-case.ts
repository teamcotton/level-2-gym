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
    // Here you would add the logic to append messages to the chat with the given chatId
    // For example, you might interact with a repository or database layer to perform the update
    // Retrieve chat data from DB
    const chatData = await this.aiService.getChatResponse(chatIdString)

    if (chatData) {
      this.logger.info('Chat data retrieved successfully', {
        chatId: chatIdString,
        messageCount: chatData.length,
      })
    } else {
      this.logger.info('No chat data found for user', { chatId: chatIdString })
      return null
    }

    // TODO: Append messages to chatData in the database

    /* chatData[chatId]!.messages = [...chatData[chatId]!.messages, ...messages]
    chatData[chatId]!.updatedAt = new Date().toISOString()*/

    // This is a placeholder return value
    return {
      chatId: chatIdString,
      appendedMessages: messages,
    }
  }
}
