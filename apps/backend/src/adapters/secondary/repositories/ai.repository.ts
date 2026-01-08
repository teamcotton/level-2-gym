import type { AIServicePort } from 'apps/backend/src/application/ports/ai.port.js'
import { desc, eq, asc, sql } from 'drizzle-orm'
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

  /**
   * Private helper method to insert messages and their associated parts into the database.
   * This method handles the common logic shared between createChat and appendToChatMessages.
   */
  private async insertMessagesWithParts(
    chatId: ChatIdType,
    messagesToInsert: UIMessage[]
  ): Promise<void> {
    if (messagesToInsert.length === 0) {
      return
    }

    const messageRecords = messagesToInsert.map((msg) => ({
      chatId: chatId,
      role: msg.role,
    }))

    // Insert messages and get their IDs back so we can link parts
    const insertedMessages = await db.insert(messages).values(messageRecords).returning()

    this.logger.info('insertedMessages', insertedMessages)

    // Map all message parts from all messages to DB format
    const partsRecords = insertedMessages.flatMap((insertedMsg, index) => {
      const correspondingMessage = messagesToInsert[index]
      if (!correspondingMessage?.parts) return []
      return mapUIMessagePartsToDBParts(
        correspondingMessage.parts as any,
        insertedMsg.id,
        this.logger
      )
    })

    this.logger.info('partsRecords', partsRecords)

    // Insert all message parts
    if (partsRecords.length > 0) {
      await db.insert(parts).values(partsRecords)
    }
  }

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
    await this.insertMessagesWithParts(chatId, initialMessages)

    return chatId
  }

  async appendToChatMessages(
    chatId: ChatIdType,
    messagesToAppend: UIMessage[] = []
  ): Promise<string> {
    const isArrayString = isArray(messagesToAppend) ? 'yes' : 'no'
    this.logger.info('chatId', chatId)
    this.logger.info('messagesToAppend', messagesToAppend)
    this.logger.info('isArray', { isArrayString })

    // 1. Update the chat table updated_at column
    await db.update(chats).set({ updatedAt: new Date() }).where(eq(chats.id, chatId))

    // 2. Insert the new messages into the messages table
    await this.insertMessagesWithParts(chatId, messagesToAppend)

    return chatId
  }

  async getChatsByUserId(userId: UserIdType): Promise<ChatIdType[]> {
    const result = await db
      .select({
        id: chats.id,
      })
      .from(chats)
      .where(eq(chats.userId, userId))
      .orderBy(desc(chats.updatedAt))

    return result.map((row) => row.id as ChatIdType)
  }

  async getChatResponse(chatId: ChatIdType): Promise<ChatResponseResult | null> {
    // Query chats table by id, then join with messages and parts
    const result = await db
      .select({ message: messages, part: parts })
      .from(chats)
      .innerJoin(messages, eq(messages.chatId, chats.id))
      .leftJoin(parts, eq(parts.messageId, messages.id))
      .where(eq(chats.id, chatId))
      .orderBy(asc(messages.createdAt), sql`${parts.order} ASC NULLS LAST`) // Order by message creation time first, then part order (nulls last)

    return result
  }

  async getAIChatByChatId(chatId: ChatIdType): Promise<ChatResponseResult | null> {
    // Query chats table by id, then join with messages and parts
    const result = await db
      .select({ message: messages, part: parts })
      .from(chats)
      .innerJoin(messages, eq(messages.chatId, chats.id))
      .leftJoin(parts, eq(parts.messageId, messages.id))
      .where(eq(chats.id, chatId))
      .orderBy(asc(messages.createdAt), sql`${parts.order} ASC NULLS LAST`) // Order by message creation time first, then part order (nulls last)

    return result
  }
}
