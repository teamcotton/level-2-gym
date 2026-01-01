import type { ChatResponseResult } from '../../adapters/secondary/repositories/ai.repository.js'
import type { UIMessage } from 'ai'

export interface AIServicePort {
  getChatResponse(userId: string): Promise<ChatResponseResult | null>
  createChat(chatId: string, userId: string, initialMessages: UIMessage[]): Promise<string>
}
