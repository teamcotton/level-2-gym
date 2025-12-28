import type { UserRepositoryPort, PaginationParams } from '../ports/user.repository.port.js'
import type { LoggerPort } from '../ports/logger.port.js'
import { InternalErrorException } from '../../shared/exceptions/internal-error.exception.js'

/**
 * Data Transfer Object for user information
 * @interface UserDto
 */
export interface UserDto {
  userId: string
  email: string
  name: string
  role: string
  createdAt: Date
}

/**
 * Data Transfer Object for paginated users response
 * @interface PaginatedUsersDto
 */
export interface PaginatedUsersDto {
  data: UserDto[]
  total: number
  limit: number
  offset: number
}

/**
 * Use case for retrieving all users with pagination support
 *
 * This use case handles the business logic for fetching users from the repository,
 * transforming domain entities into DTOs, and returning paginated results.
 *
 * @class GetAllUsersUseCase
 * @example
 * ```typescript
 * const useCase = new GetAllUsersUseCase(userRepository, logger)
 * const result = await useCase.execute({ limit: 10, offset: 0 })
 * ```
 */
export class GetAllUsersUseCase {
  /**
   * Creates an instance of GetAllUsersUseCase
   * @param {UserRepositoryPort} userRepository - Repository for accessing user data
   * @param {LoggerPort} logger - Logger for tracking operations
   */
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly logger: LoggerPort
  ) {}

  /**
   * Executes the get all users use case
   *
   * Retrieves all users from the repository with optional pagination parameters,
   * transforms them into DTOs, and returns a paginated response.
   *
   * @param {PaginationParams} [params] - Optional pagination parameters (limit, offset)
   * @returns {Promise<PaginatedUsersDto>} Paginated list of users with metadata
   * @throws {Error} If the repository operation fails
   * @example
   * ```typescript
   * // Get first 20 users
   * const result = await useCase.execute({ limit: 20, offset: 0 })
   *
   * // Get all users (default pagination)
   * const allUsers = await useCase.execute()
   * ```
   */
  async execute(params?: PaginationParams): Promise<PaginatedUsersDto> {
    this.logger.info('Fetching all users', { params })

    try {
      const result = await this.userRepository.findAll(params)

      const userDtos = result.data.map((user) => {
        if (!user.id) {
          throw new InternalErrorException('User ID is missing', {
            email: user.getEmail(),
          })
        }
        return {
          userId: user.id,
          email: user.getEmail(),
          name: user.getName(),
          role: user.getRole(),
          createdAt: user.getCreatedAt(),
        }
      })

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
