import type { LoggerPort } from '../ports/logger.port.js'
import type { UIMessage } from 'ai'
import { AIRepository } from '../../adapters/secondary/repositories/ai.repository.js'

export interface CreateChatResult {
  id: string
  initialMessages: UIMessage[]
}

export class CreateChatUseCase {
  constructor(
    private readonly logger: LoggerPort,
    private readonly aiRepository: AIRepository
  ) {}
  //(id: string, initialMessages: UIMessage[] = []
  async execute(
    chatId: string,
    userId: string,
    messages: UIMessage[] = []
  ): Promise<CreateChatResult> {
    this.logger.info('Appending chat messages', { userId, messageCount: messages.length })
    //chatId: string, userId: string, initialMessages: UIMessage[] = []
    const id = await this.aiRepository.createChat(chatId, userId, messages)

    // This is a placeholder return value
    return {
      id,
      initialMessages: messages,
    }
  }
}
