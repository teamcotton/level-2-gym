import type { ChatResponseResult } from '../../adapters/secondary/repositories/ai.repository.js'

export interface AIServicePort {
  getChatResponse(userId: string): Promise<ChatResponseResult | null>
}
