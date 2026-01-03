import type { LoggerPort } from '../../../application/ports/logger.port.js'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { AIReturnedResponseSchema } from '@norberts-spark/shared'
import { FastifyUtil } from '../../../shared/utils/fastify.utils.js'
import { authMiddleware } from '../../../infrastructure/http/middleware/auth.middleware.js'

import { z } from 'zod'
import { convertToModelMessages, stepCountIs, streamText, type UIMessage } from 'ai'
import { google } from '@ai-sdk/google'
import { AppendedChatUseCase } from '../../../application/use-cases/append-chat.use-case.js'
import { EnvConfig } from '../../../infrastructure/config/env.config.js'
import { HeartOfDarknessTool } from '../../../infrastructure/ai/tools/heart-of-darkness.tool.js'
import { SaveChatUseCase } from '../../../application/use-cases/save-chat.use-case.js'
import { GetChatUseCase } from '../../../application/use-cases/get-chat.use-case.js'
import { ChatId } from '../../../domain/value-objects/chatID.js'

export class AIController {
  private readonly heartOfDarknessTool: HeartOfDarknessTool

  constructor(
    private readonly getChatUseCase: GetChatUseCase,
    private readonly logger: LoggerPort,
    private readonly appendChatUseCase: AppendedChatUseCase,
    private readonly saveChatUseCase: SaveChatUseCase
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
    let parsed
    try {
      const body = request.body
      parsed = AIReturnedResponseSchema.parse(body)
      this.logger.debug('Parsed AI chat request body', { parsed })
    } catch (e) {
      return reply.status(400).send({
        error: 'Invalid request body',
        details: e instanceof z.ZodError ? e.issues : e,
      })
    }

    const { messages, id } = parsed

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

    const chat = await this.getChatUseCase.execute(userId, messages)

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

    const SYSTEM_PROMPT = `You must respond in the same style of Charles Marlow the narrator in Joseph Conrad's The Heart of Darkness novella. Only answer factual questions about the novella when using the heartOfDarknessQA tool. Do not use other sources.`

    const logger = this.logger

    if (!EnvConfig.MODEL_NAME) {
      this.logger.error('MODEL_NAME environment variable is not configured')
      return reply
        .status(500)
        .send(FastifyUtil.createResponse('AI service configuration error', 500))
    }

    const result = streamText({
      model: google(EnvConfig.MODEL_NAME),
      messages: convertToModelMessages(messages as UIMessage[]),
      system: ` ${SYSTEM_PROMPT}
      You have access to the following tools:
      - heartOfDarknessQA (for answering questions about the novella Heart of Darkness)
    `,
      tools: {
        heartOfDarknessQA: this.heartOfDarknessTool.getTool(),
      },
      stopWhen: [stepCountIs(10)],
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
      onFinish({ text, finishReason, usage, response, totalUsage }) {
        // Called once when the full output is complete
        // console.log('\n--- DONE ---')
        // console.log('Full text:', text)
        // The reason the model finished generating the text.
        // "stop" | "length" | "content-filter" | "tool-calls" | "error" | "other" | "unknown"
        logger.info('Finish reason:', { finishReason })
        logger.info('Usage info:', { usage, totalUsage })
        // use proper logging for production
        logger.info('streamText.onFinish')
        // Model messages (AssistantModelMessage or ToolModelMessage)
        // Minimal information, no UI data
        // Not suitable for UI applications
        logger.info('  messages')
        logger.debug(JSON.stringify(messages), { depth: null })
        // 'response.messages' is an array of ToolModelMessage and AssistantModelMessage,
        // which are the model messages that were generated during the stream.
        // This is useful if you don't need UIMessages - for simpler applications.
        logger.info('  response')
        logger.info(JSON.stringify(response), { depth: null })
      },
      onError({ error }) {
        // use proper logging for production
        logger.error('Stream error:', error as Error)
      },
    })

    return result.toUIMessageStreamResponse({
      originalMessages: messages as UIMessage[],
      onFinish: async ({ responseMessage }) => {
        // 'messages' is the full message history, including the original messages
        // Includes original user message and assistant's response with all parts
        // Ideal for persisting entire conversations
        this.logger.info('toUIMessageStreamResponse.onFinish', {
          chatId: id,
          messageCount: Array.isArray(messages) ? messages.length : undefined,
        })

        // Single message
        // Just the newly generated assistant message
        // Good for persisting only the latest response
        // console.log('toUIMessageStreamResponse.onFinish')
        // console.log('  responseMessage')
        // console.dir(responseMessage, { depth: null })
        await this.appendChatUseCase.execute(chatId, [responseMessage])
      },
    })
  }
}
