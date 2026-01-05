import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { LoggerPort } from '../../../src/application/ports/logger.port.js'
import type {
  PaginationParams,
  UserRepositoryPort,
} from '../../../src/application/ports/user.repository.port.js'
import {
  GetAllUsersUseCase,
  type PaginatedUsersDto,
} from '../../../src/application/use-cases/get-all-users.use-case.js'
import { User } from '../../../src/domain/entities/user.js'
import { Email } from '../../../src/domain/value-objects/email.js'
import { Password } from '../../../src/domain/value-objects/password.js'
import { Role } from '../../../src/domain/value-objects/role.js'
import { UserId } from '../../../src/domain/value-objects/userID.js'
import { InternalErrorException } from '../../../src/shared/exceptions/internal-error.exception.js'

describe('GetAllUsersUseCase', () => {
  let useCase: GetAllUsersUseCase
  let mockUserRepository: UserRepositoryPort
  let mockLogger: LoggerPort

  // Helper function to create a test user
  const createTestUser = async (
    email: string,
    name: string,
    role: string,
    id?: string
  ): Promise<User> => {
    const emailObj = new Email(email)
    const password = await Password.create('TestPassword123!')
    const roleObj = new Role(role)
    const userId = new UserId(id || uuidv7()).getValue()
    return new User(userId, emailObj, password, name, roleObj, new Date('2024-01-01'))
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Create mock implementations
    mockUserRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByEmail: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      existsByEmail: vi.fn(),
    }

    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    }

    // Create use case instance with mocks
    useCase = new GetAllUsersUseCase(mockUserRepository, mockLogger)
  })

  describe('execute() - successful scenarios', () => {
    it('should fetch all users with default pagination', async () => {
      const user1 = await createTestUser('john@example.com', 'John Doe', 'user')
      const user2 = await createTestUser('jane@example.com', 'Jane Smith', 'admin')

      vi.mocked(mockUserRepository.findAll).mockResolvedValue({
        data: [user1, user2],
        total: 2,
        limit: 10,
        offset: 0,
      })

      const result = await useCase.execute()

      expect(mockUserRepository.findAll).toHaveBeenCalledWith(undefined)
      expect(result.data).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(result.limit).toBe(10)
      expect(result.offset).toBe(0)
    })

    it('should fetch all users with custom pagination params', async () => {
      const user1 = await createTestUser('user1@example.com', 'User One', 'user')

      const params: PaginationParams = { limit: 5, offset: 10 }

      vi.mocked(mockUserRepository.findAll).mockResolvedValue({
        data: [user1],
        total: 15,
        limit: 5,
        offset: 10,
      })

      const result = await useCase.execute(params)

      expect(mockUserRepository.findAll).toHaveBeenCalledWith(params)
      expect(result.data).toHaveLength(1)
      expect(result.total).toBe(15)
      expect(result.limit).toBe(5)
      expect(result.offset).toBe(10)
    })

    it('should transform users to DTOs correctly', async () => {
      const user = await createTestUser('test@example.com', 'Test User', 'admin')

      vi.mocked(mockUserRepository.findAll).mockResolvedValue({
        data: [user],
        total: 1,
        limit: 10,
        offset: 0,
      })

      const result = await useCase.execute()

      expect(result.data[0]).toMatchObject({
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        createdAt: new Date('2024-01-01'),
      })
      expect(result.data[0]!.userId).toBe(user.id)
    })

    it('should handle empty user list', async () => {
      vi.mocked(mockUserRepository.findAll).mockResolvedValue({
        data: [],
        total: 0,
        limit: 10,
        offset: 0,
      })

      const result = await useCase.execute()

      expect(result.data).toHaveLength(0)
      expect(result.total).toBe(0)
    })

    it('should handle multiple pages of users', async () => {
      const users = await Promise.all([
        createTestUser('user1@example.com', 'User 1', 'user'),
        createTestUser('user2@example.com', 'User 2', 'user'),
        createTestUser('user3@example.com', 'User 3', 'admin'),
      ])

      vi.mocked(mockUserRepository.findAll).mockResolvedValue({
        data: users,
        total: 100,
        limit: 3,
        offset: 0,
      })

      const result = await useCase.execute({ limit: 3, offset: 0 })

      expect(result.data).toHaveLength(3)
      expect(result.total).toBe(100)
      expect(result.data[0]!.email).toBe('user1@example.com')
      expect(result.data[1]!.email).toBe('user2@example.com')
      expect(result.data[2]!.email).toBe('user3@example.com')
    })

    it('should preserve user roles in DTOs', async () => {
      const adminUser = await createTestUser('admin@example.com', 'Admin', 'admin')
      const regularUser = await createTestUser('user@example.com', 'User', 'user')

      vi.mocked(mockUserRepository.findAll).mockResolvedValue({
        data: [adminUser, regularUser],
        total: 2,
        limit: 10,
        offset: 0,
      })

      const result = await useCase.execute()

      expect(result.data[0]!.role).toBe('admin')
      expect(result.data[1]!.role).toBe('user')
    })
  })

  describe('execute() - logging', () => {
    it('should log before fetching users', async () => {
      vi.mocked(mockUserRepository.findAll).mockResolvedValue({
        data: [],
        total: 0,
        limit: 10,
        offset: 0,
      })

      const params: PaginationParams = { limit: 20, offset: 5 }
      await useCase.execute(params)

      expect(mockLogger.info).toHaveBeenCalledWith('Fetching all users', { params })
    })

    it('should log after successfully fetching users', async () => {
      const users = await Promise.all([
        createTestUser('user1@example.com', 'User 1', 'user'),
        createTestUser('user2@example.com', 'User 2', 'user'),
      ])

      vi.mocked(mockUserRepository.findAll).mockResolvedValue({
        data: users,
        total: 50,
        limit: 10,
        offset: 0,
      })

      await useCase.execute()

      expect(mockLogger.info).toHaveBeenCalledWith('Successfully fetched all users', {
        count: 2,
        total: 50,
      })
    })

    it('should log with undefined params when none provided', async () => {
      vi.mocked(mockUserRepository.findAll).mockResolvedValue({
        data: [],
        total: 0,
        limit: 10,
        offset: 0,
      })

      await useCase.execute()

      expect(mockLogger.info).toHaveBeenCalledWith('Fetching all users', { params: undefined })
    })

    it('should log correct count even with pagination', async () => {
      const users = await Promise.all([
        createTestUser('user1@example.com', 'User 1', 'user'),
        createTestUser('user2@example.com', 'User 2', 'user'),
        createTestUser('user3@example.com', 'User 3', 'user'),
      ])

      vi.mocked(mockUserRepository.findAll).mockResolvedValue({
        data: users,
        total: 100,
        limit: 3,
        offset: 0,
      })

      await useCase.execute({ limit: 3, offset: 0 })

      expect(mockLogger.info).toHaveBeenCalledWith('Successfully fetched all users', {
        count: 3,
        total: 100,
      })
    })
  })

  describe('execute() - error handling', () => {
    it('should throw InternalErrorException when user ID is missing', async () => {
      const email = new Email('test@example.com')
      const password = await Password.create('TestPass123!')
      const role = new Role('user')
      const userWithoutId = new User(undefined, email, password, 'Test', role)

      vi.mocked(mockUserRepository.findAll).mockResolvedValue({
        data: [userWithoutId],
        total: 1,
        limit: 10,
        offset: 0,
      })

      await expect(useCase.execute()).rejects.toThrow(InternalErrorException)
      await expect(useCase.execute()).rejects.toThrow('User ID is missing')
    })

    it('should include user email in error when ID is missing', async () => {
      const email = new Email('missing-id@example.com')
      const password = await Password.create('TestPass123!')
      const role = new Role('user')
      const userWithoutId = new User(undefined, email, password, 'Test', role)

      vi.mocked(mockUserRepository.findAll).mockResolvedValue({
        data: [userWithoutId],
        total: 1,
        limit: 10,
        offset: 0,
      })

      await expect(useCase.execute()).rejects.toThrow(InternalErrorException)

      let caughtError: InternalErrorException | null = null
      try {
        await useCase.execute()
      } catch (error) {
        caughtError = error as InternalErrorException
      }

      expect(caughtError).not.toBeNull()
      expect(caughtError?.details).toEqual({ email: 'missing-id@example.com' })
    })

    it('should handle repository errors and rethrow', async () => {
      const repositoryError = new Error('Database connection failed')
      vi.mocked(mockUserRepository.findAll).mockRejectedValue(repositoryError)

      await expect(useCase.execute()).rejects.toThrow('Database connection failed')
    })

    it('should log error when repository fails', async () => {
      const repositoryError = new Error('Query timeout')
      vi.mocked(mockUserRepository.findAll).mockRejectedValue(repositoryError)

      try {
        await useCase.execute()
      } catch {
        // Expected error
      }

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to fetch all users', repositoryError)
    })

    it('should rethrow the original error from repository', async () => {
      const customError = new Error('Custom repository error')
      vi.mocked(mockUserRepository.findAll).mockRejectedValue(customError)

      await expect(useCase.execute()).rejects.toBe(customError)
    })

    it('should handle non-Error thrown values from repository', async () => {
      const stringError = 'String error'
      vi.mocked(mockUserRepository.findAll).mockRejectedValue(stringError)

      await expect(useCase.execute()).rejects.toBe(stringError)
    })

    it('should stop processing when first user has missing ID', async () => {
      const validUser = await createTestUser('valid@example.com', 'Valid', 'user')
      const email = new Email('invalid@example.com')
      const password = await Password.create('TestPass123!')
      const role = new Role('user')
      const invalidUser = new User(undefined, email, password, 'Invalid', role)

      vi.mocked(mockUserRepository.findAll).mockResolvedValue({
        data: [invalidUser, validUser],
        total: 2,
        limit: 10,
        offset: 0,
      })

      await expect(useCase.execute()).rejects.toThrow(InternalErrorException)
    })
  })

  describe('execute() - edge cases', () => {
    it('should handle limit of 0', async () => {
      vi.mocked(mockUserRepository.findAll).mockResolvedValue({
        data: [],
        total: 100,
        limit: 0,
        offset: 0,
      })

      const result = await useCase.execute({ limit: 0, offset: 0 })

      expect(result.data).toHaveLength(0)
      expect(result.total).toBe(100)
      expect(result.limit).toBe(0)
    })

    it('should handle large offset', async () => {
      vi.mocked(mockUserRepository.findAll).mockResolvedValue({
        data: [],
        total: 50,
        limit: 10,
        offset: 1000,
      })

      const result = await useCase.execute({ limit: 10, offset: 1000 })

      expect(result.data).toHaveLength(0)
      expect(result.offset).toBe(1000)
    })

    it('should handle large limit', async () => {
      const users = await Promise.all(
        Array.from({ length: 5 }, (_, i) =>
          createTestUser(`user${i}@example.com`, `User ${i}`, 'user')
        )
      )

      vi.mocked(mockUserRepository.findAll).mockResolvedValue({
        data: users,
        total: 5,
        limit: 1000,
        offset: 0,
      })

      const result = await useCase.execute({ limit: 1000, offset: 0 })

      expect(result.data).toHaveLength(5)
      expect(result.limit).toBe(1000)
    })

    it('should handle users with special characters in names', async () => {
      const user = await createTestUser('test@example.com', "O'Brien-Smith", 'user')

      vi.mocked(mockUserRepository.findAll).mockResolvedValue({
        data: [user],
        total: 1,
        limit: 10,
        offset: 0,
      })

      const result = await useCase.execute()

      expect(result.data[0]!.name).toBe("O'Brien-Smith")
    })

    it('should handle users with unicode characters in names', async () => {
      const user = await createTestUser('test@example.com', '张伟 张三', 'user')

      vi.mocked(mockUserRepository.findAll).mockResolvedValue({
        data: [user],
        total: 1,
        limit: 10,
        offset: 0,
      })

      const result = await useCase.execute()

      expect(result.data[0]!.name).toBe('张伟 张三')
    })

    it('should handle users with very long names', async () => {
      const longName = 'A'.repeat(500)
      const user = await createTestUser('test@example.com', longName, 'user')

      vi.mocked(mockUserRepository.findAll).mockResolvedValue({
        data: [user],
        total: 1,
        limit: 10,
        offset: 0,
      })

      const result = await useCase.execute()

      expect(result.data[0]!.name).toBe(longName)
      expect(result.data[0]!.name.length).toBe(500)
    })
  })

  describe('execute() - return type structure', () => {
    it('should return PaginatedUsersDto with correct structure', async () => {
      const user = await createTestUser('test@example.com', 'Test', 'user')

      vi.mocked(mockUserRepository.findAll).mockResolvedValue({
        data: [user],
        total: 1,
        limit: 10,
        offset: 0,
      })

      const result: PaginatedUsersDto = await useCase.execute()

      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('total')
      expect(result).toHaveProperty('limit')
      expect(result).toHaveProperty('offset')
      expect(Array.isArray(result.data)).toBe(true)
    })

    it('should return UserDto with correct structure in data array', async () => {
      const user = await createTestUser('test@example.com', 'Test', 'user')

      vi.mocked(mockUserRepository.findAll).mockResolvedValue({
        data: [user],
        total: 1,
        limit: 10,
        offset: 0,
      })

      const result = await useCase.execute()

      const userDto = result.data[0]!
      expect(userDto).toHaveProperty('userId')
      expect(userDto).toHaveProperty('email')
      expect(userDto).toHaveProperty('name')
      expect(userDto).toHaveProperty('role')
      expect(userDto).toHaveProperty('createdAt')
    })

    // Removed redundant DTO field type checks (covered by TypeScript and higher-level tests)
  })

  describe('integration scenarios', () => {
    it('should handle sequential calls with different pagination', async () => {
      const users1 = await Promise.all([
        createTestUser('user1@example.com', 'User 1', 'user'),
        createTestUser('user2@example.com', 'User 2', 'user'),
      ])

      const users2 = await Promise.all([
        createTestUser('user3@example.com', 'User 3', 'user'),
        createTestUser('user4@example.com', 'User 4', 'user'),
      ])

      // First call - page 1
      vi.mocked(mockUserRepository.findAll).mockResolvedValueOnce({
        data: users1,
        total: 4,
        limit: 2,
        offset: 0,
      })

      const result1 = await useCase.execute({ limit: 2, offset: 0 })

      // Second call - page 2
      vi.mocked(mockUserRepository.findAll).mockResolvedValueOnce({
        data: users2,
        total: 4,
        limit: 2,
        offset: 2,
      })

      const result2 = await useCase.execute({ limit: 2, offset: 2 })

      expect(result1.data[0]!.email).toBe('user1@example.com')
      expect(result1.data[1]!.email).toBe('user2@example.com')
      expect(result2.data[0]!.email).toBe('user3@example.com')
      expect(result2.data[1]!.email).toBe('user4@example.com')
    })

    it('should work correctly when called multiple times', async () => {
      const user = await createTestUser('test@example.com', 'Test', 'user')

      vi.mocked(mockUserRepository.findAll).mockResolvedValue({
        data: [user],
        total: 1,
        limit: 10,
        offset: 0,
      })

      await useCase.execute()
      await useCase.execute()
      await useCase.execute()

      expect(mockUserRepository.findAll).toHaveBeenCalledTimes(3)
      expect(mockLogger.info).toHaveBeenCalledTimes(6) // 2 logs per call
    })

    it('should handle mix of users with different roles', async () => {
      const users = await Promise.all([
        createTestUser('admin@example.com', 'Admin User', 'admin'),
        createTestUser('user1@example.com', 'Regular User 1', 'user'),
        createTestUser('user2@example.com', 'Regular User 2', 'user'),
        createTestUser('mod@example.com', 'Moderator', 'moderator'),
      ])

      vi.mocked(mockUserRepository.findAll).mockResolvedValue({
        data: users,
        total: 4,
        limit: 10,
        offset: 0,
      })

      const result = await useCase.execute()

      expect(result.data).toHaveLength(4)
      expect(result.data[0]!.role).toBe('admin')
      expect(result.data[1]!.role).toBe('user')
      expect(result.data[2]!.role).toBe('user')
      expect(result.data[3]!.role).toBe('moderator')
    })
  })
})
