import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import type { GetChatUseCase } from '../../../application/use-cases/get-chat.use-case.js'
import { AIReturnedResponseSchema } from '@norberts-spark/shared'
import { z } from 'zod'

export class AIController {
  constructor(private readonly getChatUseCase: GetChatUseCase) {}

  registerRoutes(app: FastifyInstance): void {
    app.post('/ai/chat', this.chat.bind(this))
  }

  async chat(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    let parsed
    try {
      const body = request.body
      parsed = AIReturnedResponseSchema.parse(body)
    } catch (e) {
      return reply.status(400).send({
        error: 'Invalid request body',
        details: e instanceof z.ZodError ? e.issues : e,
      })
    }
    const { messages, id } = parsed

    return reply.status(200).send({
      id,
      messages,
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
