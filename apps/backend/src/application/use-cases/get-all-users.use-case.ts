import type {
  UserRepositoryPort,
  PaginationParams,
  PaginatedResult,
} from '../ports/user.repository.port.js'
import type { LoggerPort } from '../ports/logger.port.js'

export interface UserDto {
  userId: string
  email: string
  name: string
  role: string
  createdAt: Date
}

export class GetAllUsersUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly logger: LoggerPort
  ) {}

  async execute(pagination?: PaginationParams): Promise<PaginatedResult<UserDto>> {
    this.logger.info('Fetching all users', { pagination })

    try {
      const result = await this.userRepository.findAll(pagination)

      const userDtos = result.data.map((user) => ({
        userId: user.id,
        email: user.getEmail(),
        name: user.getName(),
        role: user.getRole(),
        createdAt: user.getCreatedAt(),
      }))

      const paginatedResult: PaginatedResult<UserDto> = {
        data: userDtos,
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
      }

      this.logger.info('Successfully fetched all users', {
        count: userDtos.length,
        total: result.total,
      })

      return paginatedResult
    } catch (error) {
      this.logger.error('Failed to fetch all users', error as Error)
      throw error
    }
  }
}
