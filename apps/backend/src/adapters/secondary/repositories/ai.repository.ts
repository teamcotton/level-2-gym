import type { AIServicePort } from 'apps/backend/src/application/ports/ai.port.js'
import { eq } from 'drizzle-orm'
import { db } from '../../../infrastructure/database/index.js'
import {
  chats,
  messages,
  parts,
  type DBMessageSelect,
  type MyDBUIMessagePartSelect,
} from '../../../infrastructure/database/schema.js'
import type { UIMessage } from 'ai'
import type { UserIdType } from '../../../domain/value-objects/userID.js'
import type { ChatIdType } from '../../../domain/value-objects/chatID.js'
import type { LoggerPort } from '../../../application/ports/logger.port.js'

export type ChatResponseResult = {
  message: DBMessageSelect
  part: MyDBUIMessagePartSelect | null
}[]

export class AIRepository implements AIServicePort {
  constructor(private readonly logger: LoggerPort) {}

  async createChat(
    chatId: ChatIdType,
    userId: UserIdType,
    initialMessages: UIMessage[] = []
  ): Promise<string> {
    const newChat = {
      userId: userId.getValue()!,
      id: chatId,
    }
    this.logger.info('createChat', newChat)

    await db.insert(chats).values(newChat)

    // Insert initial messages if provided
    if (initialMessages.length > 0) {
      const messageRecords = initialMessages.map((msg) => ({
        chatId: chatId,
        role: msg.role,
      }))

      // Insert messages and get their IDs back so we can link parts
      const insertedMessages = await db.insert(messages).values(messageRecords).returning()

      // Insert message parts linked to the corresponding messages
      const partsRecords = insertedMessages.flatMap((insertedMessage, index) => {
        const uiMessage = initialMessages[index]

        // UIMessage.content is typically an array of structured parts (e.g. { type: 'text', text: string })
        const content = Array.isArray((uiMessage as any).content) ? (uiMessage as any).content : []

        return content
          .filter(
            (part: any) => part && typeof part.type === 'string' && typeof part.text === 'string'
          )
          .map((part: any) => ({
            messageId: insertedMessage.id,
            type: part.type,
            text: part.text,
          }))
      })

      if (partsRecords.length > 0) {
        await db.insert(parts).values(partsRecords)
      }
    }

    return chatId
  }
  async getChatResponse(chatId: string | any): Promise<ChatResponseResult | null> {
    try {
      // Query messages based on chatId and retrieve related parts
      const result = await db
        .select({
          message: messages,
          part: parts,
        })
        .from(messages)
        .leftJoin(parts, eq(parts.messageId, messages.id))
        .where(eq(messages.chatId, chatId))

      if (!result) {
        return null
      }

      return result
    } catch (error) {
      throw error
    }
  }
}
