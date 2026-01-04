import type { ChatResponseResult } from '../../adapters/secondary/repositories/ai.repository.js'
import type { UIMessage } from 'ai'
import type { UserIdType } from '../../domain/value-objects/userID.js'
import type { ChatIdType } from '../../domain/value-objects/chatID.js'

export interface AIServicePort {
  getChatResponse(chatId: ChatIdType): Promise<ChatResponseResult | null>
  createChat(
    chatId: ChatIdType | string,
    userId: UserIdType | string,
    initialMessages: UIMessage[]
  ): Promise<string>
  appendToChatMessages(chatId: ChatIdType | string, messages: UIMessage[]): Promise<string>
}
