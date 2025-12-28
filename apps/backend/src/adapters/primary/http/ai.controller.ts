import type { LoggerPort } from '../../../application/ports/logger.port.js'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { AIEntity } from '../../../domain/entities/ai.js'
import { AIReturnedResponseSchema } from '@norberts-spark/shared'
import { z } from 'zod'

export class AIController {
  constructor(private readonly logger: LoggerPort) {}

  registerRoutes(app: FastifyInstance): void {
    app.post('/ai/chat', this.chat.bind(this))
  }

  async chat(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    this.logger.info('Received AI chat request', { body: request.body })
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
