import type { UserRepositoryPort, PaginationParams } from '../ports/user.repository.port.js'
import type { LoggerPort } from '../ports/logger.port.js'

export interface UserDto {
  userId: string
  email: string
  name: string
  role: string
  createdAt: Date
}

export interface PaginatedUsersDto {
  data: UserDto[]
  total: number
  limit: number
  offset: number
}

export class GetAllUsersUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly logger: LoggerPort
  ) {}

  async execute(params?: PaginationParams): Promise<PaginatedUsersDto> {
    this.logger.info('Fetching all users', { params })

    try {
      const result = await this.userRepository.findAll(params)

      const userDtos = result.data.map((user) => ({
        userId: user.id,
        email: user.getEmail(),
        name: user.getName(),
        role: user.getRole(),
        createdAt: user.getCreatedAt(),
      }))

      this.logger.info('Successfully fetched all users', {
        count: userDtos.length,
        total: result.total,
      })

      return {
        data: userDtos,
        total: result.total,
        limit: result.limit,
        offset: result.offset,
      }
    } catch (error) {
      this.logger.error('Failed to fetch all users', error as Error)
      throw error
    }
  }
}
