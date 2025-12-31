import type { LoggerPort } from '../../../application/ports/logger.port.js'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import type { GetChatUseCase } from '../../../application/use-cases/get-chat.use-case.js'
import { AIReturnedResponseSchema } from '@norberts-spark/shared'
import { FastifyUtil } from '../../../shared/utils/fastify.utils.js'

import { z } from 'zod'
import { convertToModelMessages, stepCountIs, streamText, tool, type UIMessage } from 'ai'
import { google } from '@ai-sdk/google'
import { appendToChatMessages } from '../../../shared/persistance-layer.js'
import { GetText } from '../../../infrastructure/ai/tools/getText.js'

const getTextInstance = new GetText('data', 'heart-of-darkness.txt')

export class AIController {
  constructor(
    private readonly getChatUseCase: GetChatUseCase,
    private readonly logger: LoggerPort
  ) {}

  registerRoutes(app: FastifyInstance): void {
    app.post('/ai/chat', this.chat.bind(this))
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

    const chat = await this.getChatUseCase.execute(id, [])

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
      const userId = request.user?.sub
      if (!userId) {
        return reply.status(401).send(FastifyUtil.createResponse('User not authenticated', 401))
      }
      this.logger.info('Chat does not exist, creating new chat', { id })
      await this.getChatUseCase.execute(userId, messages)
    } else {
      // to be implemented
      this.logger.info('Chat exists, appending most recent message', { id })
    }

    const SYSTEM_PROMPT = `You must respond in the same style of Charles Marlow the narrator in Joseph Conrad's The Heart of Darkness novella. Only answer factual questions about the novella when using the heartOfDarknessQA tool. Do not use other sources.`

    const logger = this.logger

    const result = streamText({
      model: google('gemini-2.0-flash-001'),
      messages: convertToModelMessages(messages as UIMessage[]),
      system: ` ${SYSTEM_PROMPT}
      You have access to the following tools:
      - heartOfDarknessQA (for answering questions about the novella Heart of Darkness)
    `,
      tools: {
        heartOfDarknessQA: tool({
          description:
            'Answer questions about Joseph Conrad\'s novella "Heart of Darkness" using the full text of the book',
          inputSchema: z.object({
            question: z.string().describe('The question to answer about Heart of Darkness'),
          }),
          execute: async ({ question }) => {
            try {
              // Read the Heart of Darkness text file using the singleton instance
              const filePath = getTextInstance.filePath

              let heartOfDarknessText

              if (getTextInstance.hasCachedContent(filePath)) {
                heartOfDarknessText = getTextInstance.getCachedContent(filePath)
                this.logger.info('CACHED')
              } else {
                heartOfDarknessText = await getTextInstance.getText()
                this.logger.info('FROM FILE')
              }

              // Return the full text as context for the AI to use in answering
              return {
                question,
                textLength: heartOfDarknessText ? heartOfDarknessText.length : 0,
                context: heartOfDarknessText,
                instructions:
                  'Use the provided full text of Heart of Darkness to answer the question comprehensively and accurately. Reference specific passages where relevant.',
              }
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
              throw new Error(`Error loading Heart of Darkness text: ${errorMessage}`)
            }
          },
        }),
      },
      stopWhen: [stepCountIs(10)],
      onChunk({ chunk }) {
        // Called for each partial piece of output
        if (chunk.type === 'text-delta') {
          process.stdout.write(chunk.text)
          // (Debugging) To log chunk text, use console.log or a logger. For production, do not output to stdout.
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
        this.logger.info('toUIMessageStreamResponse.onFinish')
        this.logger.info('  messages')
        this.logger.info(JSON.stringify(messages), { depth: null })

        // Single message
        // Just the newly generated assistant message
        // Good for persisting only the latest response
        // console.log('toUIMessageStreamResponse.onFinish')
        // console.log('  responseMessage')
        // console.dir(responseMessage, { depth: null })
        await appendToChatMessages(id, [responseMessage])
      },
    })
  }
}

/**
 * const UIMessageSchema = z.object({
 *     id: z.string(),
 *     role: z.string(),
 *     content: z.string().optional(),
 *     name: z.string().optional(),
 *     parts: z.array(z.any()).optional(),
 *     trigger: z.string().optional(),
 *   })
 *   const RequestBodySchema = z.object({
 *     messages: z.array(UIMessageSchema),
 *     id: z.string(),
 *   })
 */
