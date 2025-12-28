import type { AIServicePort } from '../../application/ports/ai.port.js'
import { Uuid7Util } from '../../shared/utils/uuid7.util.js'

import type { ChatResponseResult } from '../../adapters/secondary/repositories/ai.repository.js'

export class AIEntity {
  /**
   * Creates an instance of AIController
   * @param {AIServicePort} aiService - Service for handling AI-related operations
   */
  constructor(private readonly aiService: AIServicePort) {}

  getChat(userId: string): Promise<ChatResponseResult | null> {
    const uuidVersion = Uuid7Util.processUserUUID(userId)
    if (uuidVersion !== 'v7') {
      return Promise.reject(new Error(`Invalid userId provided ${uuidVersion}`))
    }

    return this.aiService.getChatResponse(userId)
  }
}
