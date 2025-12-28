import type { AIServicePort } from 'apps/backend/src/application/ports/ai.port.js'
import { eq } from 'drizzle-orm'
import { db } from '../../../infrastructure/database/index.js'
import {
  messages,
  parts,
  type DBMessageSelect,
  type MyDBUIMessagePartSelect,
} from '../../../infrastructure/database/schema.js'

export type ChatResponseResult = {
  message: DBMessageSelect
  part: MyDBUIMessagePartSelect | null
}[]

export class AIRepository implements AIServicePort {
  async getChatResponse(chatId: string): Promise<ChatResponseResult | null> {
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
