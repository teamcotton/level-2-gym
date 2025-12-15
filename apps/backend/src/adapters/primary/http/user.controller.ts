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
    app.get('/users/:id', this.getUser.bind(this))
    app.get('/users', this.getAllUsers.bind(this))
  }

  async getAllUsers(
    request: FastifyRequest<{
      Querystring: { page?: string; pageSize?: string }
    }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      // Parse and validate pagination parameters
      const page = request.query.page ? parseInt(request.query.page, 10) : undefined
      const pageSize = request.query.pageSize ? parseInt(request.query.pageSize, 10) : undefined

      // Validate pagination parameters
      if (page !== undefined && (isNaN(page) || page < 1)) {
        reply.code(400).send({
          success: false,
          error: 'Invalid page parameter. Must be a positive integer.',
        })
        return
      }

      if (pageSize !== undefined && (isNaN(pageSize) || pageSize < 1 || pageSize > 100)) {
        reply.code(400).send({
          success: false,
          error: 'Invalid pageSize parameter. Must be between 1 and 100.',
        })
        return
      }

      const pagination =
        page || pageSize ? { page: page ?? 1, pageSize: pageSize ?? 10 } : undefined

      const result = await this.getAllUsersUseCase.execute(pagination)

      reply.code(200).send({
        success: true,
        data: result.data,
        pagination: {
          page: result.page,
          pageSize: result.pageSize,
          total: result.total,
          totalPages: result.totalPages,
        },
      })
    } catch (error) {
      const err = error as Error
      const statusCode = err instanceof BaseException ? err.statusCode : 500
      reply.code(statusCode).send({
        success: false,
        error: err.message,
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
      reply.code(statusCode).send({
        success: false,
        error: err.message,
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
