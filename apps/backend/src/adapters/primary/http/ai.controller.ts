import type { LoggerPort } from '../../../application/ports/logger.port.js'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { FastifyUtil } from '../../../shared/utils/fastify.utils.js'
import { authMiddleware } from '../../../infrastructure/http/middleware/auth.middleware.js'
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
  validateUIMessages,
} from 'ai'
import { google } from '@ai-sdk/google'
import { AppendedChatUseCase } from '../../../application/use-cases/append-chat.use-case.js'
import { EnvConfig } from '../../../infrastructure/config/env.config.js'
import { HeartOfDarknessTool } from '../../../infrastructure/ai/tools/heart-of-darkness.tool.js'
import { SaveChatUseCase } from '../../../application/use-cases/save-chat.use-case.js'
import { GetChatUseCase } from '../../../application/use-cases/get-chat.use-case.js'
import type { ChatIdType } from '../../../domain/value-objects/chatID.js'
import type { UserIdType } from '../../../domain/value-objects/userID.js'
import { UserId } from '../../../domain/value-objects/userID.js'
import { ChatId } from '../../../domain/value-objects/chatID.js'
import { SYSTEM_PROMPT } from '../../../shared/constants/ai-constants.js'
import { GetChatsByUserIdUseCase } from '../../../application/use-cases/get-chats-by-userid.use-case.js'

export class AIController {
  private readonly heartOfDarknessTool: HeartOfDarknessTool

  constructor(
    private readonly getChatUseCase: GetChatUseCase,
    private readonly logger: LoggerPort,
    private readonly appendChatUseCase: AppendedChatUseCase,
    private readonly saveChatUseCase: SaveChatUseCase,
    private readonly getChatsByUserIdUseCase: GetChatsByUserIdUseCase
  ) {
    this.heartOfDarknessTool = new HeartOfDarknessTool(this.logger)
  }

  registerRoutes(app: FastifyInstance): void {
    app.post(
      '/ai/chat',
      {
        preHandler: [authMiddleware],
      },
      this.chat.bind(this)
    )
    app.get(
      '/ai/chats/:userId',
      {
        preHandler: [authMiddleware],
      },
      this.getAIChatsByUserId.bind(this)
    )
  }

  /**
   * Handles AI chat requests
   * The flow of chat is as follows: return FastifyUtil.createResponse('Last message must be from the user', 400)
   * 1. Validate the request body against the AIReturnedResponseSchema
   * 2. Retrieve the chat using the GetChatUseCase
   * 3. Validate that the most recent message is from the user
   * 4. If the chat does not exist, create a new chat
   * 5. If the chat exists, append the most recent message to the chat
   * 6. Run the streamText from the ai NPM package to get the AI response
   *
   * @returns {Promise<void>}
   *
   * @param request
   * @param reply
   */
  async chat(request: FastifyRequest, reply: FastifyReply) {
    this.logger.debug('Received chat request')

    let messages: UIMessage[]
    let id: string
    let trigger: string

    try {
      const body = request.body as any

      this.logger.info('Request body:', {
        id: body?.id,
        trigger: body?.trigger,
        messages: body?.messages,
      })

      // Validate messages using validateUIMessages from 'ai' package
      messages = await validateUIMessages({
        messages: body?.messages || [],
      })

      // Extract id and trigger from body
      id = body?.id

      trigger = body?.trigger

      if (!id || !trigger) {
        return reply.status(400).send({
          error: 'Invalid request body',
          details: 'id and trigger are required',
        })
      }

      try {
        id = new ChatId(id).getValue()
      } catch {
        return reply.status(400).send({
          error: 'Invalid id format',
          details: 'incorrect ChatId format',
        })
      }

      this.logger.debug('Validated messages', { messageCount: messages.length, id, trigger })
    } catch (e) {
      return reply.status(400).send({
        error: 'Invalid request body',
        details: e instanceof Error ? e.message : e,
      })
    }

    if (!request.user?.sub) {
      return reply.status(401).send(FastifyUtil.createResponse('User not authenticated', 401))
    }

    // Conversion of string request.user.sub id to UserIdType branded type
    // happens in middleware so no need to instantiate a new UserId here
    const userId = request.user.sub

    // Convert string id to ChatIdType branded type
    const chatId = new ChatId(id).getValue()

    this.logger.debug('Processing chat request', {
      chatId,
      userId,
      messageCount: messages.length,
    })

    // Filter out system messages as they're not stored in the database
    const userAndAssistantMessages = messages.filter(
      (msg) => msg.role === 'user' || msg.role === 'assistant'
    ) as any[]

    const chat = await this.getChatUseCase.execute(chatId, userAndAssistantMessages)

    this.logger.info('Received chat', { chat: chat ?? null })

    const mostRecentMessage = messages[messages.length - 1]

    if (!mostRecentMessage) {
      return reply.status(400).send(FastifyUtil.createResponse('No messages provided', 400))
    }

    if (mostRecentMessage.role !== 'user') {
      return reply
        .status(400)
        .send(FastifyUtil.createResponse('Last message must be from the user', 400))
    }

    if (!chat) {
      this.logger.info('Chat does not exist, creating new chat', { id })
      await this.saveChatUseCase.execute(chatId, userId, messages)
    } else {
      await this.appendChatUseCase.execute(chatId, [mostRecentMessage as UIMessage])
      this.logger.info('Chat exists, appending most recent message', { id })
    }

    if (!EnvConfig.MODEL_NAME) {
      this.logger.error('MODEL_NAME environment variable is not configured')
      return reply
        .status(500)
        .send(FastifyUtil.createResponse('AI service configuration error', 500))
    }

    const result = streamText({
      model: google(EnvConfig.MODEL_NAME),
      messages: await convertToModelMessages(messages as UIMessage[]),
      system: `${SYSTEM_PROMPT}`,
      tools: {
        heartOfDarknessQA: this.heartOfDarknessTool.getTool(),
      },
      stopWhen: [stepCountIs(5)],
      onChunk({ chunk }) {
        // Called for each partial piece of output
        if (chunk.type === 'text-delta') {
          process.stdout.write(chunk.text)
          // For debugging, prefer using the application logger at debug level instead of stdout,
          // and ensure such logging is disabled or minimized in production.
          // Example:
          // logger.debug({ text: chunk.text }, 'AI stream text-delta chunk')        }
          // you can also inspect chunk.reasoning / chunk.sources / etc.
        }
        // you can also inspect chunk.reasoning / chunk.sources / etc.
      },
      onFinish: ({ text, finishReason, usage, response, totalUsage }) => {
        // Called once when the full output is complete
        // The reason the model finished generating the text.
        // "stop" | "length" | "content-filter" | "tool-calls" | "error" | "other" | "unknown"
        this.logger.debug('Stream finished', { finishReason })
        this.logger.debug('Stream usage info', { usage, totalUsage })
        this.logger.debug('streamText.onFinish')

        // Model messages (AssistantModelMessage or ToolModelMessage)
        // Minimal information, no UI data
        // Not suitable for UI applications
        this.logger.debug('Stream messages', { messages: JSON.stringify(messages) })
        // 'response.messages' is an array of ToolModelMessage and AssistantModelMessage,
        // which are the model messages that were generated during the stream.
        // This is useful if you don't need UIMessages - for simpler applications.
        this.logger.debug('Stream response', { response: JSON.stringify(response) })
      },
      onError: ({ error }) => {
        this.logger.error('Stream error', error as Error)
      },
    })

    return result.toUIMessageStreamResponse({
      originalMessages: messages as UIMessage[],
      onFinish: async ({ messages, responseMessage }) => {
        // 'messages' is the full message history, including the original messages
        // Includes original user message and assistant's response with all parts
        // Ideal for persisting entire conversations
        this.logger.debug('toUIMessageStreamResponse.onFinish', {
          chatId: id,
          messageCount: Array.isArray(messages) ? messages.length : undefined,
        })

        // Single message
        // Just the newly generated assistant message
        // Good for persisting only the latest response
        this.logger.debug('Response message', { responseMessage })
        await this.appendChatUseCase.execute(chatId, [responseMessage])
      },
    })
  }

  /**
   * Retrieves all chat IDs associated with a specific user.
   *
   * This endpoint implements authorization checks to ensure users can only access their own chat history
   * unless they have admin or moderator privileges. The authorization flow is:
   * 1. User can access their own chat history (userId matches authenticated user's ID)
   * 2. Admin or moderator can access any user's chat history
   *
   * @param request - The Fastify request object containing the userId parameter and authenticated user info
   * @param reply - The Fastify reply object for sending responses
   * @returns A promise that resolves to an array of ChatIdType or void if an error response is sent
   *
   * @throws {400} When userId parameter is missing or has invalid format (not a valid UUID v7)
   * @throws {401} When user is not authenticated
   * @throws {403} When user attempts to access another user's chat history without admin/moderator role
   * @throws {500} When an error occurs while fetching chats from the repository
   *
   * @example
   * ```typescript
   * // Route: GET /ai/chats/:userId
   * // Example request: GET /ai/chats/01935e8a-7890-7123-b456-123456789abc
   * // Example response: ["01935e8a-1234-7abc-b456-111111111111", "01935e8a-5678-7def-b456-222222222222"]
   * ```
   */

  async getAIChatsByUserId(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<ChatIdType[] | void> {
    this.logger.debug('Received getAIChatsByUserId request')

    const params = request.params as Record<string, unknown>
    const userIdParam = params.userId as string

    if (!userIdParam) {
      return reply.status(400).send(FastifyUtil.createResponse('Invalid userId parameter', 400))
    }

    let userId: UserIdType

    try {
      userId = new UserId(userIdParam).getValue()
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Invalid userId format in getAIChatsByUserId: ${userIdParam}`, error)
      }
      return reply.status(400).send(FastifyUtil.createResponse('Invalid userId format', 400))
    }

    // Authorization check: User can only access their own chat history unless they have admin/moderator role
    const authenticatedUserId = request.user?.sub
    const userRoles = request.user?.roles || []

    if (!authenticatedUserId) {
      this.logger.warn('Authorization check failed: User not authenticated')
      return reply.status(401).send(FastifyUtil.createResponse('Authentication required', 401))
    }

    // Check if user is accessing their own data OR has admin/moderator role
    const isOwnData = authenticatedUserId === userId
    const hasAdminRole = userRoles.includes('admin') || userRoles.includes('moderator')

    if (!isOwnData && !hasAdminRole) {
      this.logger.warn(
        `Authorization check failed: User ${authenticatedUserId} attempted to access chats for user ${userId} without required permissions`
      )
      return reply
        .status(403)
        .send(
          FastifyUtil.createResponse(
            'Access denied. You can only access your own chat history or must have admin/moderator role',
            403
          )
        )
    }

    try {
      return await this.getChatsByUserIdUseCase.execute(userId)
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Error while fetching chats for userId in getAIChatsByUserId: ${userId}`,
          error
        )
      }
      return reply.status(500).send(FastifyUtil.createResponse('Internal server error', 500))
    }
  }
}
