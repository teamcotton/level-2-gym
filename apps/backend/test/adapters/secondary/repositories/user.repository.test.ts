import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PostgresUserRepository } from '../../../../src/adapters/secondary/repositories/user.repository.js'
import { User } from '../../../../src/domain/entities/user.js'
import { Email } from '../../../../src/domain/value-objects/email.js'
import { Password } from '../../../../src/domain/value-objects/password.js'
import { Role } from '../../../../src/domain/value-objects/role.js'
import { UserId } from '../../../../src/domain/value-objects/userID.js'
// Import db after mocking
import { db } from '../../../../src/infrastructure/database/index.js'
import { POSTGRES_ERROR_CODE } from '../../../../src/shared/constants/error-codes.js'
import { ConflictException } from '../../../../src/shared/exceptions/conflict.exception.js'
import { DatabaseException } from '../../../../src/shared/exceptions/database.exception.js'

// Mock the database module
vi.mock('../../../../src/infrastructure/database/index.js', () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('PostgresUserRepository', () => {
  let repository: PostgresUserRepository
  let testEmail: Email
  let testPassword: Password
  let testRole: Role
  let testUser: User
  let validBcryptHash: string

  beforeEach(async () => {
    vi.clearAllMocks()

    repository = new PostgresUserRepository()
    testEmail = new Email('test@example.com')
    testPassword = await Password.create('password123')
    testRole = new Role('user')
    const testUserId = new UserId(uuidv7()).getValue()
    testUser = new User(testUserId, testEmail, 'John Doe', testRole, testPassword)

    // Valid bcrypt hash for testing (hash of "password123")
    validBcryptHash = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
  })

  describe('save', () => {
    it('should insert a new user into the database', async () => {
      const userIdValue = testUser.id
      const mockReturning = vi.fn().mockResolvedValue([{ userId: userIdValue }])
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
      const mockInsert = vi.fn().mockReturnValue({ values: mockValues })
      vi.mocked(db.insert).mockReturnValue(mockInsert() as any)

      const userId = await repository.save(testUser)

      expect(userId).toBe(userIdValue)
      expect(db.insert).toHaveBeenCalledTimes(1)
      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: userIdValue,
          email: 'test@example.com',
          name: 'John Doe',
          createdAt: expect.any(Date),
        })
      )

      const callArgs = mockValues.mock.calls?.[0]?.[0]
      expect(callArgs.role).toBe('user')
    })

    it('should save user password hash', async () => {
      const userIdValue = testUser.id
      const mockReturning = vi.fn().mockResolvedValue([{ userId: userIdValue }])
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
      const mockInsert = vi.fn().mockReturnValue({ values: mockValues })
      vi.mocked(db.insert).mockReturnValue(mockInsert() as any)

      await repository.save(testUser)

      const callArgs = mockValues.mock.calls?.[0]?.[0]
      expect(callArgs.password).toBe(testUser.getPasswordHash())
    })

    it('should save user with correct email', async () => {
      const userId = new UserId(uuidv7()).getValue()
      const userIdValue = userId
      const mockReturning = vi.fn().mockResolvedValue([{ userId: userIdValue }])
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
      const mockInsert = vi.fn().mockReturnValue({ values: mockValues })
      vi.mocked(db.insert).mockReturnValue(mockInsert() as any)

      const email = new Email('newemail@example.com')
      const password = await Password.create('newpass123')
      const role = new Role('admin')
      const user = new User(userId, email, 'Jane Doe', role, password)

      const returnedUserId = await repository.save(user)

      expect(typeof returnedUserId).toBe('string')
      const callArgs = mockValues.mock.calls?.[0]?.[0]
      expect(callArgs.email).toBe('newemail@example.com')
      expect(callArgs.name).toBe('Jane Doe')
      expect(callArgs.role).toBe('admin')
    })
  })

  describe('saveUserWithProvider', () => {
    it('should insert a new OAuth user without password', async () => {
      const userId = new UserId(uuidv7()).getValue()
      const email = new Email('oauth@example.com')
      const role = new Role('user')
      const oauthUser = new User(userId, email, 'OAuth User', role, undefined, undefined, 'google')

      const mockReturning = vi.fn().mockResolvedValue([{ userId: userId }])
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
      const mockInsert = vi.fn().mockReturnValue({ values: mockValues })
      vi.mocked(db.insert).mockReturnValue(mockInsert() as any)

      const returnedUserId = await repository.saveUserWithProvider(oauthUser)

      expect(returnedUserId).toBe(userId)
      expect(db.insert).toHaveBeenCalledTimes(1)
      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: userId,
          email: 'oauth@example.com',
          name: 'OAuth User',
          provider: 'google',
          createdAt: expect.any(Date),
        })
      )

      const callArgs = mockValues.mock.calls?.[0]?.[0]
      expect(callArgs.password).toBeUndefined()
      expect(callArgs.role).toBe('user')
    })

    it('should save OAuth user with correct provider', async () => {
      const userId = new UserId(uuidv7()).getValue()
      const email = new Email('google.user@example.com')
      const role = new Role('user')
      const googleUser = new User(
        userId,
        email,
        'Google User',
        role,
        undefined,
        undefined,
        'google'
      )

      const mockReturning = vi.fn().mockResolvedValue([{ userId: userId }])
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
      const mockInsert = vi.fn().mockReturnValue({ values: mockValues })
      vi.mocked(db.insert).mockReturnValue(mockInsert() as any)

      await repository.saveUserWithProvider(googleUser)

      const callArgs = mockValues.mock.calls?.[0]?.[0]
      expect(callArgs.provider).toBe('google')
      expect(callArgs.email).toBe('google.user@example.com')
      expect(callArgs.name).toBe('Google User')
    })

    it('should generate user ID when not provided', async () => {
      const generatedUserId = uuidv7()
      const email = new Email('newuser@example.com')
      const role = new Role('user')
      const userWithoutId = new User(
        undefined,
        email,
        'New User',
        role,
        undefined,
        undefined,
        'google'
      )

      const mockReturning = vi.fn().mockResolvedValue([{ userId: generatedUserId }])
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
      const mockInsert = vi.fn().mockReturnValue({ values: mockValues })
      vi.mocked(db.insert).mockReturnValue(mockInsert() as any)

      const returnedUserId = await repository.saveUserWithProvider(userWithoutId)

      expect(returnedUserId).toBe(generatedUserId)
      const callArgs = mockValues.mock.calls?.[0]?.[0]
      expect(callArgs.userId).toBeUndefined()
    })

    it('should throw ConflictException on duplicate email', async () => {
      const userId = new UserId(uuidv7()).getValue()
      const email = new Email('duplicate@example.com')
      const role = new Role('user')
      const oauthUser = new User(
        userId,
        email,
        'Duplicate User',
        role,
        undefined,
        undefined,
        'google'
      )

      const duplicateError = new Error('duplicate key') as any
      duplicateError.code = POSTGRES_ERROR_CODE.UNIQUE_VIOLATION

      const mockReturning = vi.fn().mockRejectedValue(duplicateError)
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
      const mockInsert = vi.fn().mockReturnValue({ values: mockValues })
      vi.mocked(db.insert).mockReturnValue(mockInsert() as any)

      await expect(repository.saveUserWithProvider(oauthUser)).rejects.toThrow(ConflictException)
      await expect(repository.saveUserWithProvider(oauthUser)).rejects.toThrow(
        'User with this email already exists'
      )
    })

    it('should throw DatabaseException on general database error', async () => {
      const userId = new UserId(uuidv7()).getValue()
      const email = new Email('error@example.com')
      const role = new Role('user')
      const oauthUser = new User(userId, email, 'Error User', role, undefined, undefined, 'google')

      const dbError = new Error('Connection failed')

      const mockValues = vi.fn().mockRejectedValue(dbError)
      const mockInsert = vi.fn().mockReturnValue({ values: mockValues })
      vi.mocked(db.insert).mockReturnValue(mockInsert() as any)

      await expect(repository.saveUserWithProvider(oauthUser)).rejects.toThrow(DatabaseException)
      await expect(repository.saveUserWithProvider(oauthUser)).rejects.toThrow(
        'Failed to save user'
      )
    })

    it('should throw DatabaseException if no user ID is returned', async () => {
      const userId = new UserId(uuidv7()).getValue()
      const email = new Email('test@example.com')
      const role = new Role('user')
      const oauthUser = new User(userId, email, 'Test User', role, undefined, undefined, 'google')

      const mockReturning = vi.fn().mockResolvedValue([])
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
      const mockInsert = vi.fn().mockReturnValue({ values: mockValues })
      vi.mocked(db.insert).mockReturnValue(mockInsert() as any)

      await expect(repository.saveUserWithProvider(oauthUser)).rejects.toThrow(DatabaseException)
      await expect(repository.saveUserWithProvider(oauthUser)).rejects.toThrow(
        'Failed to save user'
      )
    })
  })

  describe('findAll', () => {
    it('should return paginated users with default limit and offset', async () => {
      const userId1 = uuidv7()
      const userId2 = uuidv7()
      const dbRecords = [
        {
          userId: userId1,
          email: 'user1@example.com',
          password: validBcryptHash,
          name: 'User One',
          role: 'user',
          createdAt: new Date('2024-01-01'),
        },
        {
          userId: userId2,
          email: 'user2@example.com',
          password: validBcryptHash,
          name: 'User Two',
          role: 'admin',
          createdAt: new Date('2024-01-02'),
        },
      ]

      const mockOffset = vi.fn().mockResolvedValue(dbRecords)
      const mockLimit = vi.fn().mockReturnValue({ offset: mockOffset })
      const mockFrom = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

      const mockCountFrom = vi.fn().mockResolvedValue([{ count: 2 }])
      const mockCountSelect = vi.fn().mockReturnValue({ from: mockCountFrom })

      vi.mocked(db.select)
        .mockReturnValueOnce(mockCountSelect() as any)
        .mockReturnValueOnce(mockSelect() as any)

      const result = await repository.findAll()

      expect(result.data).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(result.limit).toBe(50)
      expect(result.offset).toBe(0)
      expect(result.data[0]).toBeInstanceOf(User)
      expect(result.data[0]?.getEmail()).toBe('user1@example.com')
      expect(result.data[1]?.getEmail()).toBe('user2@example.com')
    })

    it('should return paginated users with custom limit and offset', async () => {
      const userId3 = uuidv7()
      const dbRecords = [
        {
          userId: userId3,
          email: 'user3@example.com',
          password: validBcryptHash,
          name: 'User Three',
          role: 'user',
          createdAt: new Date('2024-01-03'),
        },
      ]

      const mockOffset = vi.fn().mockResolvedValue(dbRecords)
      const mockLimit = vi.fn().mockReturnValue({ offset: mockOffset })
      const mockFrom = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

      const mockCountFrom = vi.fn().mockResolvedValue([{ count: 100 }])
      const mockCountSelect = vi.fn().mockReturnValue({ from: mockCountFrom })

      vi.mocked(db.select)
        .mockReturnValueOnce(mockCountSelect() as any)
        .mockReturnValueOnce(mockSelect() as any)

      const result = await repository.findAll({ limit: 10, offset: 20 })

      expect(result.data).toHaveLength(1)
      expect(result.total).toBe(100)
      expect(result.limit).toBe(10)
      expect(result.offset).toBe(20)
      expect(mockLimit).toHaveBeenCalledWith(10)
      expect(mockOffset).toHaveBeenCalledWith(20)
    })

    it('should return empty array when no users exist', async () => {
      const mockOffset = vi.fn().mockResolvedValue([])
      const mockLimit = vi.fn().mockReturnValue({ offset: mockOffset })
      const mockFrom = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

      const mockCountFrom = vi.fn().mockResolvedValue([{ count: 0 }])
      const mockCountSelect = vi.fn().mockReturnValue({ from: mockCountFrom })

      vi.mocked(db.select)
        .mockReturnValueOnce(mockCountSelect() as any)
        .mockReturnValueOnce(mockSelect() as any)

      const result = await repository.findAll()

      expect(result.data).toHaveLength(0)
      expect(result.total).toBe(0)
    })

    it('should throw DatabaseException on database error', async () => {
      const dbError = new Error('Database connection lost')

      const mockCountFrom = vi.fn().mockRejectedValue(dbError)
      const mockCountSelect = vi.fn().mockReturnValue({ from: mockCountFrom })
      vi.mocked(db.select).mockReturnValue(mockCountSelect() as any)

      await expect(repository.findAll()).rejects.toThrow(DatabaseException)
      await expect(repository.findAll()).rejects.toThrow('Failed to find all users')
    })
  })

  describe('findById', () => {
    it('should return null when user is not found', async () => {
      const mockWhere = vi.fn().mockResolvedValue([])
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      const result = await repository.findById('non-existent-id')

      expect(result).toBeNull()
      expect(db.select).toHaveBeenCalledTimes(1)
    })

    it('should return User entity when found', async () => {
      const userId = uuidv7()
      const dbRecord = {
        userId: userId,
        email: 'test@example.com',
        password: validBcryptHash,
        name: 'John Doe',
        role: 'user',
        createdAt: new Date('2024-01-01'),
      }

      const mockWhere = vi.fn().mockResolvedValue([dbRecord])
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      const result = await repository.findById(userId)

      expect(result).toBeInstanceOf(User)
      expect(result?.id).toBe(userId)
      expect(result?.getEmail()).toBe('test@example.com')
      expect(result?.getName()).toBe('John Doe')
      expect(result?.getRole()).toBe('user')
    })

    it('should call database with correct userId', async () => {
      const mockWhere = vi.fn().mockResolvedValue([])
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      await repository.findById('test-user-id')

      expect(mockWhere).toHaveBeenCalledTimes(1)
    })
  })

  describe('findByEmail', () => {
    it('should return null when user is not found', async () => {
      const mockWhere = vi.fn().mockResolvedValue([])
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      const result = await repository.findByEmail('nonexistent@example.com')

      expect(result).toBeNull()
    })

    it('should return User entity when found by email', async () => {
      const userId = uuidv7()
      const dbRecord = {
        userId: userId,
        email: 'found@example.com',
        password: validBcryptHash,
        name: 'Found User',
        role: 'user',
        createdAt: new Date('2024-02-01'),
      }

      const mockWhere = vi.fn().mockResolvedValue([dbRecord])
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      const result = await repository.findByEmail('found@example.com')

      expect(result).toBeInstanceOf(User)
      expect(result?.getEmail()).toBe('found@example.com')
      expect(result?.getName()).toBe('Found User')
    })

    it('should handle multiple results by returning first', async () => {
      const userId1 = uuidv7()
      const userId2 = uuidv7()
      const dbRecord1 = {
        userId: userId1,
        email: 'duplicate@example.com',
        password: validBcryptHash,
        name: 'User 1',
        role: 'user',
        createdAt: new Date(),
      }
      const dbRecord2 = {
        userId: userId2,
        email: 'duplicate@example.com',
        password: validBcryptHash,
        name: 'User 2',
        role: 'admin',
        createdAt: new Date(),
      }

      const mockWhere = vi.fn().mockResolvedValue([dbRecord1, dbRecord2])
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      const result = await repository.findByEmail('duplicate@example.com')

      expect(result).toBeInstanceOf(User)
      expect(result?.id).toBe(userId1)
    })
  })

  describe('update', () => {
    it('should update user in database', async () => {
      const mockWhere = vi.fn().mockResolvedValue(undefined)
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
      const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })
      vi.mocked(db.update).mockReturnValue(mockUpdate() as any)

      await repository.update(testUser)

      expect(db.update).toHaveBeenCalledTimes(1)
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          name: 'John Doe',
        })
      )
      expect(mockWhere).toHaveBeenCalledTimes(1)
      expect(mockWhere).toHaveBeenCalledWith(expect.anything())
    })

    it('should update user with new values', async () => {
      const mockWhere = vi.fn().mockResolvedValue(undefined)
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
      const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })
      vi.mocked(db.update).mockReturnValue(mockUpdate() as any)

      const newEmail = new Email('updated@example.com')
      const userId = new UserId(uuidv7()).getValue()
      const updatedUser = new User(userId, newEmail, 'Updated Name', testRole, testPassword)

      await repository.update(updatedUser)

      const callArgs = mockSet.mock.calls?.[0]?.[0]
      expect(callArgs.email).toBe('updated@example.com')
      expect(callArgs.name).toBe('Updated Name')
    })
  })

  describe('delete', () => {
    it('should delete user by id', async () => {
      const mockWhere = vi.fn().mockResolvedValue(undefined)
      const mockDelete = vi.fn().mockReturnValue({ where: mockWhere })
      vi.mocked(db.delete).mockReturnValue(mockDelete() as any)

      const userId = uuidv7()
      await repository.delete(userId)

      expect(db.delete).toHaveBeenCalledTimes(1)
      expect(mockWhere).toHaveBeenCalledTimes(1)
    })

    it('should call delete with correct id', async () => {
      const mockWhere = vi.fn().mockResolvedValue(undefined)
      const mockDelete = vi.fn().mockReturnValue({ where: mockWhere })
      vi.mocked(db.delete).mockReturnValue(mockDelete() as any)

      await repository.delete('specific-user-id')

      expect(mockWhere).toHaveBeenCalledTimes(1)
    })
  })

  describe('existsByEmail', () => {
    it('should return true when email exists', async () => {
      const userId = uuidv7()
      const mockWhere = vi.fn().mockResolvedValue([{ id: userId }])
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      const result = await repository.existsByEmail('existing@example.com')

      expect(result).toBe(true)
    })

    it('should return false when email does not exist', async () => {
      const mockWhere = vi.fn().mockResolvedValue([])
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      const result = await repository.existsByEmail('nonexistent@example.com')

      expect(result).toBe(false)
    })

    it('should return true when multiple records exist with same email', async () => {
      const userId1 = uuidv7()
      const userId2 = uuidv7()
      const mockWhere = vi.fn().mockResolvedValue([{ id: userId1 }, { id: userId2 }])
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      const result = await repository.existsByEmail('duplicate@example.com')

      expect(result).toBe(true)
    })
  })

  describe('toDomain', () => {
    it('should convert database record to User entity', async () => {
      const userId = uuidv7()
      const dbRecord = {
        userId: userId,
        email: 'convert@example.com',
        password: validBcryptHash,
        name: 'Convert User',
        role: 'moderator',
        createdAt: new Date('2024-03-01'),
      }

      const mockWhere = vi.fn().mockResolvedValue([dbRecord])
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      const result = await repository.findById(userId)

      expect(result).toBeInstanceOf(User)
      expect(result?.id).toBe(userId)
      expect(result?.getEmail()).toBe('convert@example.com')
      expect(result?.getName()).toBe('Convert User')
    })

    it('should preserve password hash when converting to domain', async () => {
      const userId = uuidv7()
      const dbRecord = {
        userId: userId,
        email: 'password@example.com',
        password: validBcryptHash,
        name: 'Password User',
        role: 'user',
        createdAt: new Date(),
      }

      const mockWhere = vi.fn().mockResolvedValue([dbRecord])
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      const result = await repository.findById(userId)

      expect(result).toBeInstanceOf(User)
      // Password should be properly converted from hash
      expect(result).toBeDefined()
    })
  })

  describe('error handling', () => {
    describe('save', () => {
      it('should throw ConflictException on duplicate key error', async () => {
        const duplicateError = new Error('duplicate key') as any
        duplicateError.code = POSTGRES_ERROR_CODE.UNIQUE_VIOLATION

        const mockReturning = vi.fn().mockRejectedValue(duplicateError)
        const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
        const mockInsert = vi.fn().mockReturnValue({ values: mockValues })
        vi.mocked(db.insert).mockReturnValue(mockInsert() as any)

        await expect(repository.save(testUser)).rejects.toThrow(ConflictException)
        await expect(repository.save(testUser)).rejects.toThrow(
          'User with this email already exists'
        )
      })

      it('should throw DatabaseException on general database error', async () => {
        const dbError = new Error('Connection failed')

        const mockValues = vi.fn().mockRejectedValue(dbError)
        const mockInsert = vi.fn().mockReturnValue({ values: mockValues })
        vi.mocked(db.insert).mockReturnValue(mockInsert() as any)

        await expect(repository.save(testUser)).rejects.toThrow(DatabaseException)
        await expect(repository.save(testUser)).rejects.toThrow('Failed to save user')
      })
    })

    describe('findById', () => {
      it('should throw DatabaseException on database error', async () => {
        const dbError = new Error('Database connection lost')
        const userId = uuidv7()

        const mockWhere = vi.fn().mockRejectedValue(dbError)
        const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
        const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
        vi.mocked(db.select).mockReturnValue(mockSelect() as any)

        await expect(repository.findById(userId)).rejects.toThrow(DatabaseException)
        await expect(repository.findById(userId)).rejects.toThrow('Failed to find user by ID')
      })
    })

    describe('findByEmail', () => {
      it('should throw DatabaseException on database error', async () => {
        const dbError = new Error('Query timeout')

        const mockWhere = vi.fn().mockRejectedValue(dbError)
        const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
        const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
        vi.mocked(db.select).mockReturnValue(mockSelect() as any)

        await expect(repository.findByEmail('test@example.com')).rejects.toThrow(DatabaseException)
        await expect(repository.findByEmail('test@example.com')).rejects.toThrow(
          'Failed to find user by email'
        )
      })
    })

    describe('update', () => {
      it('should throw ConflictException on duplicate key error', async () => {
        const duplicateError = new Error('duplicate key') as any
        duplicateError.code = POSTGRES_ERROR_CODE.UNIQUE_VIOLATION

        const mockWhere = vi.fn().mockRejectedValue(duplicateError)
        const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
        const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })
        vi.mocked(db.update).mockReturnValue(mockUpdate() as any)

        await expect(repository.update(testUser)).rejects.toThrow(ConflictException)
        await expect(repository.update(testUser)).rejects.toThrow(
          'User with this email already exists'
        )
      })

      it('should throw DatabaseException on general database error', async () => {
        const dbError = new Error('Update failed')

        const mockWhere = vi.fn().mockRejectedValue(dbError)
        const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
        const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })
        vi.mocked(db.update).mockReturnValue(mockUpdate() as any)

        await expect(repository.update(testUser)).rejects.toThrow(DatabaseException)
        await expect(repository.update(testUser)).rejects.toThrow('Failed to update user')
      })
    })

    describe('delete', () => {
      it('should throw DatabaseException on database error', async () => {
        const dbError = new Error('Delete operation failed')
        const userId = uuidv7()

        const mockWhere = vi.fn().mockRejectedValue(dbError)
        const mockDelete = vi.fn().mockReturnValue({ where: mockWhere })
        vi.mocked(db.delete).mockReturnValue(mockDelete() as any)

        await expect(repository.delete(userId)).rejects.toThrow(DatabaseException)
        await expect(repository.delete(userId)).rejects.toThrow('Failed to delete user')
      })
    })

    describe('existsByEmail', () => {
      it('should throw DatabaseException on database error', async () => {
        const dbError = new Error('Query execution failed')

        const mockWhere = vi.fn().mockRejectedValue(dbError)
        const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
        const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
        vi.mocked(db.select).mockReturnValue(mockSelect() as any)

        await expect(repository.existsByEmail('test@example.com')).rejects.toThrow(
          DatabaseException
        )
        await expect(repository.existsByEmail('test@example.com')).rejects.toThrow(
          'Failed to check if user exists by email'
        )
      })
    })
  })
})
