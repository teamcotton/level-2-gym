import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { RegisterUserUseCase } from '../../../application/use-cases/register-user.use-case.js'
import { GetAllUsersUseCase } from '../../../application/use-cases/get-all-users.use-case.js'
import { RegisterUserDto } from '../../../application/dtos/register-user.dto.js'
import { BaseException } from '../../../shared/exceptions/base.exception.js'

export class UserController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly getAllUsersUseCase: GetAllUsersUseCase
  ) {}

  registerRoutes(app: FastifyInstance): void {
    app.post('/users/register', this.register.bind(this))
    app.get('/users', this.getAllUsers.bind(this))
    app.get('/users/:id', this.getUser.bind(this))
  }

  async getAllUsers(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      // Extract pagination parameters from query string
      const query = request.query as { limit?: string; offset?: string }
      const limit = query.limit ? parseInt(query.limit, 10) : undefined
      const offset = query.offset ? parseInt(query.offset, 10) : undefined

      // Validate pagination parameters
      if (limit !== undefined && (isNaN(limit) || limit < 1 || limit > 100)) {
        reply.code(400).send({
          success: false,
          error: 'Invalid limit parameter. Must be between 1 and 100.',
        })
        return
      }

      if (offset !== undefined && (isNaN(offset) || offset < 0)) {
        reply.code(400).send({
          success: false,
          error: 'Invalid offset parameter. Must be 0 or greater.',
        })
        return
      }

      const result = await this.getAllUsersUseCase.execute({ limit, offset })

      reply.code(200).send({
        success: true,
        data: result.data,
        pagination: {
          total: result.total,
          limit: result.limit,
          offset: result.offset,
        },
      })
    } catch (error) {
      const err = error as Error
      const statusCode = err instanceof BaseException ? err.statusCode : 500
      const errorMessage = err?.message || 'An unexpected error occurred'
      reply.code(statusCode).send({
        success: false,
        error: errorMessage,
      })
    }
  }

  async register(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      // Convert HTTP request to DTO
      const dto = RegisterUserDto.validate(request.body)

      // Execute use case
      const result = await this.registerUserUseCase.execute(dto)

      // Convert result to HTTP response
      reply.code(201).send({
        success: true,
        data: result,
      })
    } catch (error) {
      const err = error as Error
      const statusCode = err instanceof BaseException ? err.statusCode : 500
      const errorMessage = err?.message || 'An unexpected error occurred'
      reply.code(statusCode).send({
        success: false,
        error: errorMessage,
      })
    }
  }

  async getUser(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    // Implementation here
    reply.send({ id: request.params.id })
  }
}
