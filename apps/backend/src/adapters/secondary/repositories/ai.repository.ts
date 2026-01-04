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
import { mapUIMessagePartsToDBParts } from '../../../shared/mapper/index.js'
import { isArray } from '@norberts-spark/shared'

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
      userId: userId,
      id: chatId,
    }
    this.logger.info('isArray')
    const isArrayString = isArray(initialMessages) ? 'yes' : 'no'
    this.logger.info('chatId', chatId)
    this.logger.info('userId', userId)
    this.logger.info('initialMessages', initialMessages)
    this.logger.info('isArray', { isArrayString })

    this.logger.info('createChat', newChat)

    await db.insert(chats).values(newChat)

    this.logger.info('initialMessages', initialMessages)

    if (
      !isArray(initialMessages) &&
      typeof initialMessages === 'object' &&
      Object.keys(initialMessages).length > 0
    ) {
      initialMessages = [initialMessages]
    }

    // Insert initial messages if provided
    if (initialMessages.length > 0) {
      const messageRecords = initialMessages.map((msg) => ({
        chatId: chatId,
        role: msg.role,
      }))

      // Insert messages and get their IDs back so we can link parts
      const insertedMessages = await db.insert(messages).values(messageRecords).returning()

      this.logger.info('insertedMessages', insertedMessages)

      // Map all message parts from all messages to DB format
      const partsRecords = insertedMessages.flatMap((insertedMsg, index) => {
        const correspondingMessage = initialMessages[index]
        if (!correspondingMessage?.parts) return []
        return mapUIMessagePartsToDBParts(correspondingMessage.parts as any, insertedMsg.id)
      })

      this.logger.info('partsRecords', partsRecords)

      // Insert all message parts
      if (partsRecords.length > 0) {
        await db.insert(parts).values(partsRecords)
      }
    }

    return chatId
  }

  async getChatResponse(chatId: ChatIdType): Promise<ChatResponseResult | null> {
    try {
      // Query chats table by id, then join with messages and parts
      const result = await db
        .select({
          message: messages,
          part: parts,
        })
        .from(chats)
        .innerJoin(messages, eq(messages.chatId, chats.id))
        .leftJoin(parts, eq(parts.messageId, messages.id))
        .where(eq(chats.id, chatId))

      return result
    } catch (error) {
      throw error
    }
  }
}
