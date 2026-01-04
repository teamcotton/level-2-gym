import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuditLogRepository } from '../../../../src/adapters/secondary/repositories/audit-log.repository.js'
import type { CreateAuditLogDTO } from '../../../../src/application/ports/audit-log.port.js'
import type { LoggerPort } from '../../../../src/application/ports/logger.port.js'
import { AuditLog } from '../../../../src/domain/audit/audit-log.entity.js'
import { AuditAction, EntityType } from '../../../../src/domain/audit/entity-type.enum.js'
import { db } from '../../../../src/infrastructure/database/index.js'

// Mock the database module
vi.mock('../../../../src/infrastructure/database/index.js', () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
  },
}))

describe('AuditLogRepository', () => {
  let repository: AuditLogRepository
  let mockLogger: LoggerPort

  beforeEach(() => {
    vi.clearAllMocks()

    // Create mock logger
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    }

    repository = new AuditLogRepository(mockLogger)
  })

  describe('log', () => {
    it('should successfully create audit log entry with all fields', async () => {
      const entry: CreateAuditLogDTO = {
        userId: uuidv7(),
        entityType: EntityType.USER,
        entityId: uuidv7(),
        action: AuditAction.CREATE,
        changes: { created: { name: 'Test User' } },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      }

      const mockValues = vi.fn().mockResolvedValue(undefined)
      const mockInsert = vi.fn().mockReturnValue({ values: mockValues })
      vi.mocked(db.insert).mockReturnValue(mockInsert() as any)

      await repository.log(entry)

      expect(db.insert).toHaveBeenCalledTimes(1)
      expect(mockValues).toHaveBeenCalledWith({
        userId: entry.userId,
        entityType: entry.entityType,
        entityId: entry.entityId,
        action: entry.action,
        changes: entry.changes,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
      })
      expect(mockLogger.info).toHaveBeenCalledWith('Audit log entry created', {
        entityType: entry.entityType,
        entityId: entry.entityId,
        action: entry.action,
      })
    })

    it('should create audit log entry with null userId for system actions', async () => {
      const entry: CreateAuditLogDTO = {
        userId: null,
        entityType: EntityType.CHAT,
        entityId: uuidv7(),
        action: AuditAction.DELETE,
      }

      const mockValues = vi.fn().mockResolvedValue(undefined)
      const mockInsert = vi.fn().mockReturnValue({ values: mockValues })
      vi.mocked(db.insert).mockReturnValue(mockInsert() as any)

      await repository.log(entry)

      expect(mockValues).toHaveBeenCalledWith({
        userId: null,
        entityType: entry.entityType,
        entityId: entry.entityId,
        action: entry.action,
        changes: null,
        ipAddress: null,
        userAgent: null,
      })
    })

    it('should convert undefined optional fields to null', async () => {
      const entry: CreateAuditLogDTO = {
        userId: uuidv7(),
        entityType: EntityType.MESSAGE,
        entityId: uuidv7(),
        action: AuditAction.UPDATE,
        // changes, ipAddress, userAgent are undefined
      }

      const mockValues = vi.fn().mockResolvedValue(undefined)
      const mockInsert = vi.fn().mockReturnValue({ values: mockValues })
      vi.mocked(db.insert).mockReturnValue(mockInsert() as any)

      await repository.log(entry)

      expect(mockValues).toHaveBeenCalledWith({
        userId: entry.userId,
        entityType: entry.entityType,
        entityId: entry.entityId,
        action: entry.action,
        changes: null,
        ipAddress: null,
        userAgent: null,
      })
    })

    it('should log successful creation to logger', async () => {
      const entry: CreateAuditLogDTO = {
        userId: uuidv7(),
        entityType: EntityType.PART,
        entityId: uuidv7(),
        action: AuditAction.CREATE,
      }

      const mockValues = vi.fn().mockResolvedValue(undefined)
      const mockInsert = vi.fn().mockReturnValue({ values: mockValues })
      vi.mocked(db.insert).mockReturnValue(mockInsert() as any)

      await repository.log(entry)

      expect(mockLogger.info).toHaveBeenCalledWith('Audit log entry created', {
        entityType: entry.entityType,
        entityId: entry.entityId,
        action: entry.action,
      })
      expect(mockLogger.error).not.toHaveBeenCalled()
    })

    it('should not throw when database insert fails', async () => {
      const entry: CreateAuditLogDTO = {
        userId: uuidv7(),
        entityType: EntityType.USER,
        entityId: uuidv7(),
        action: AuditAction.LOGIN,
      }

      const dbError = new Error('Database connection failed')
      const mockValues = vi.fn().mockRejectedValue(dbError)
      const mockInsert = vi.fn().mockReturnValue({ values: mockValues })
      vi.mocked(db.insert).mockReturnValue(mockInsert() as any)

      await expect(repository.log(entry)).resolves.not.toThrow()
    })

    it('should log error when database insert fails', async () => {
      const entry: CreateAuditLogDTO = {
        userId: uuidv7(),
        entityType: EntityType.USER,
        entityId: uuidv7(),
        action: AuditAction.LOGIN,
      }

      const dbError = new Error('Database connection failed')
      const mockValues = vi.fn().mockRejectedValue(dbError)
      const mockInsert = vi.fn().mockReturnValue({ values: mockValues })
      vi.mocked(db.insert).mockReturnValue(mockInsert() as any)

      await repository.log(entry)

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to create audit log entry',
        dbError,
        { entry }
      )
      expect(mockLogger.info).not.toHaveBeenCalled()
    })

    it('should handle different entity types', async () => {
      const entityTypes: EntityType[] = [
        EntityType.USER,
        EntityType.CHAT,
        EntityType.MESSAGE,
        EntityType.PART,
        EntityType.AI_OPTIONS,
      ]

      for (const entityType of entityTypes) {
        vi.clearAllMocks()
        const entry: CreateAuditLogDTO = {
          userId: uuidv7(),
          entityType,
          entityId: uuidv7(),
          action: AuditAction.CREATE,
        }

        const mockValues = vi.fn().mockResolvedValue(undefined)
        const mockInsert = vi.fn().mockReturnValue({ values: mockValues })
        vi.mocked(db.insert).mockReturnValue(mockInsert() as any)

        await repository.log(entry)

        expect(mockValues).toHaveBeenCalledWith(
          expect.objectContaining({
            entityType,
          })
        )
      }
    })

    it('should handle different audit actions', async () => {
      const actions: AuditAction[] = [
        AuditAction.CREATE,
        AuditAction.UPDATE,
        AuditAction.DELETE,
        AuditAction.LOGIN,
        AuditAction.LOGOUT,
        AuditAction.LOGIN_FAILED,
        AuditAction.PASSWORD_CHANGE,
        AuditAction.EMAIL_CHANGE,
      ]

      for (const action of actions) {
        vi.clearAllMocks()
        const entry: CreateAuditLogDTO = {
          userId: uuidv7(),
          entityType: EntityType.USER,
          entityId: uuidv7(),
          action,
        }

        const mockValues = vi.fn().mockResolvedValue(undefined)
        const mockInsert = vi.fn().mockReturnValue({ values: mockValues })
        vi.mocked(db.insert).mockReturnValue(mockInsert() as any)

        await repository.log(entry)

        expect(mockValues).toHaveBeenCalledWith(
          expect.objectContaining({
            action,
          })
        )
      }
    })

    it('should handle complex changes object', async () => {
      const entry: CreateAuditLogDTO = {
        userId: uuidv7(),
        entityType: EntityType.USER,
        entityId: uuidv7(),
        action: AuditAction.UPDATE,
        changes: {
          before: {
            name: 'Old Name',
            email: 'old@example.com',
            profile: {
              address: { city: 'Old City' },
            },
          },
          after: {
            name: 'New Name',
            email: 'new@example.com',
            profile: {
              address: { city: 'New City' },
            },
          },
        },
      }

      const mockValues = vi.fn().mockResolvedValue(undefined)
      const mockInsert = vi.fn().mockReturnValue({ values: mockValues })
      vi.mocked(db.insert).mockReturnValue(mockInsert() as any)

      await repository.log(entry)

      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          changes: entry.changes,
        })
      )
    })
  })

  describe('getByEntity', () => {
    it('should retrieve audit logs for a specific entity', async () => {
      const entityType = EntityType.CHAT
      const entityId = uuidv7()
      const userId = uuidv7()

      const mockResults = [
        {
          id: uuidv7(),
          userId,
          entityType,
          entityId,
          action: AuditAction.CREATE,
          changes: { created: {} },
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          createdAt: new Date('2026-01-04T12:00:00Z'),
        },
        {
          id: uuidv7(),
          userId,
          entityType,
          entityId,
          action: AuditAction.UPDATE,
          changes: { before: {}, after: {} },
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          createdAt: new Date('2026-01-04T11:00:00Z'),
        },
      ]

      const mockOrderBy = vi.fn().mockResolvedValue(mockResults)
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      const result = await repository.getByEntity(entityType, entityId)

      expect(db.select).toHaveBeenCalledTimes(1)
      expect(result).toHaveLength(2)
      expect(result[0]).toBeInstanceOf(AuditLog)
      expect(result[0]!.entityType).toBe(entityType)
      expect(result[0]!.entityId).toBe(entityId)
      expect(result[0]!.action).toBe(AuditAction.CREATE)
      expect(result[1]).toBeInstanceOf(AuditLog)
      expect(result[1]!.action).toBe(AuditAction.UPDATE)
    })

    it('should return empty array when no audit logs found for entity', async () => {
      const entityType = EntityType.MESSAGE
      const entityId = uuidv7()

      const mockOrderBy = vi.fn().mockResolvedValue([])
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      const result = await repository.getByEntity(entityType, entityId)

      expect(result).toEqual([])
      expect(result).toHaveLength(0)
    })

    it('should order results by createdAt descending', async () => {
      const entityType = EntityType.USER
      const entityId = uuidv7()

      const mockResults = [
        {
          id: uuidv7(),
          userId: entityId,
          entityType,
          entityId,
          action: AuditAction.UPDATE,
          changes: null,
          ipAddress: null,
          userAgent: null,
          createdAt: new Date('2026-01-04T14:00:00Z'),
        },
        {
          id: uuidv7(),
          userId: entityId,
          entityType,
          entityId,
          action: AuditAction.CREATE,
          changes: null,
          ipAddress: null,
          userAgent: null,
          createdAt: new Date('2026-01-04T12:00:00Z'),
        },
      ]

      const mockOrderBy = vi.fn().mockResolvedValue(mockResults)
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      const result = await repository.getByEntity(entityType, entityId)

      expect(result[0]!.createdAt.getTime()).toBeGreaterThan(result[1]!.createdAt.getTime())
    })

    it('should map database rows to AuditLog entities', async () => {
      const entityType = EntityType.PART
      const entityId = uuidv7()
      const userId = uuidv7()
      const logId = uuidv7()
      const createdAt = new Date()

      const mockResults = [
        {
          id: logId,
          userId,
          entityType,
          entityId,
          action: AuditAction.DELETE,
          changes: { deleted: { content: 'test' } },
          ipAddress: '10.0.0.1',
          userAgent: 'Chrome',
          createdAt,
        },
      ]

      const mockOrderBy = vi.fn().mockResolvedValue(mockResults)
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      const result = await repository.getByEntity(entityType, entityId)

      expect(result[0]!.id).toBe(logId)
      expect(result[0]!.userId).toBe(userId)
      expect(result[0]!.entityType).toBe(entityType)
      expect(result[0]!.entityId).toBe(entityId)
      expect(result[0]!.action).toBe(AuditAction.DELETE)
      expect(result[0]!.changes).toEqual({ deleted: { content: 'test' } })
      expect(result[0]!.ipAddress).toBe('10.0.0.1')
      expect(result[0]!.userAgent).toBe('Chrome')
      expect(result[0]!.createdAt).toBe(createdAt)
    })
  })

  describe('getByUser', () => {
    it('should retrieve audit logs for a specific user with default limit', async () => {
      const userId = uuidv7()

      const mockResults = [
        {
          id: uuidv7(),
          userId,
          entityType: EntityType.USER,
          entityId: userId,
          action: AuditAction.LOGIN,
          changes: null,
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          createdAt: new Date(),
        },
      ]

      const mockLimit = vi.fn().mockResolvedValue(mockResults)
      const mockOrderBy = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      const result = await repository.getByUser(userId)

      expect(db.select).toHaveBeenCalledTimes(1)
      expect(mockLimit).toHaveBeenCalledWith(100) // Default limit
      expect(result).toHaveLength(1)
      expect(result[0]).toBeInstanceOf(AuditLog)
      expect(result[0]!.userId).toBe(userId)
    })

    it('should retrieve audit logs with custom limit', async () => {
      const userId = uuidv7()
      const customLimit = 50

      const mockResults = Array(50)
        .fill(null)
        .map(() => ({
          id: uuidv7(),
          userId,
          entityType: EntityType.USER,
          entityId: userId,
          action: AuditAction.UPDATE,
          changes: null,
          ipAddress: null,
          userAgent: null,
          createdAt: new Date(),
        }))

      const mockLimit = vi.fn().mockResolvedValue(mockResults)
      const mockOrderBy = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      const result = await repository.getByUser(userId, customLimit)

      expect(mockLimit).toHaveBeenCalledWith(customLimit)
      expect(result).toHaveLength(50)
    })

    it('should return empty array when no audit logs found for user', async () => {
      const userId = uuidv7()

      const mockLimit = vi.fn().mockResolvedValue([])
      const mockOrderBy = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      const result = await repository.getByUser(userId)

      expect(result).toEqual([])
    })

    it('should order results by createdAt descending', async () => {
      const userId = uuidv7()

      const mockResults = [
        {
          id: uuidv7(),
          userId,
          entityType: EntityType.USER,
          entityId: userId,
          action: AuditAction.LOGOUT,
          changes: null,
          ipAddress: null,
          userAgent: null,
          createdAt: new Date('2026-01-04T15:00:00Z'),
        },
        {
          id: uuidv7(),
          userId,
          entityType: EntityType.USER,
          entityId: userId,
          action: AuditAction.LOGIN,
          changes: null,
          ipAddress: null,
          userAgent: null,
          createdAt: new Date('2026-01-04T14:00:00Z'),
        },
      ]

      const mockLimit = vi.fn().mockResolvedValue(mockResults)
      const mockOrderBy = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      const result = await repository.getByUser(userId)

      expect(result[0]!.action).toBe(AuditAction.LOGOUT)
      expect(result[1]!.action).toBe(AuditAction.LOGIN)
      expect(result[0]!.createdAt.getTime()).toBeGreaterThan(result[1]!.createdAt.getTime())
    })

    it('should retrieve logs across different entity types for same user', async () => {
      const userId = uuidv7()

      const mockResults = [
        {
          id: uuidv7(),
          userId,
          entityType: EntityType.USER,
          entityId: userId,
          action: AuditAction.UPDATE,
          changes: null,
          ipAddress: null,
          userAgent: null,
          createdAt: new Date('2026-01-04T13:00:00Z'),
        },
        {
          id: uuidv7(),
          userId,
          entityType: EntityType.CHAT,
          entityId: uuidv7(),
          action: AuditAction.CREATE,
          changes: null,
          ipAddress: null,
          userAgent: null,
          createdAt: new Date('2026-01-04T12:00:00Z'),
        },
      ]

      const mockLimit = vi.fn().mockResolvedValue(mockResults)
      const mockOrderBy = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      const result = await repository.getByUser(userId)

      expect(result).toHaveLength(2)
      expect(result[0]!.entityType).toBe(EntityType.USER)
      expect(result[1]!.entityType).toBe(EntityType.CHAT)
      expect(result[0]!.userId).toBe(userId)
      expect(result[1]!.userId).toBe(userId)
    })
  })

  describe('getByAction', () => {
    it('should retrieve audit logs for a specific action with default limit', async () => {
      const action = AuditAction.LOGIN

      const mockResults = [
        {
          id: uuidv7(),
          userId: uuidv7(),
          entityType: EntityType.USER,
          entityId: uuidv7(),
          action,
          changes: { success: true },
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          createdAt: new Date(),
        },
      ]

      const mockLimit = vi.fn().mockResolvedValue(mockResults)
      const mockOrderBy = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      const result = await repository.getByAction(action)

      expect(db.select).toHaveBeenCalledTimes(1)
      expect(mockLimit).toHaveBeenCalledWith(100) // Default limit
      expect(result).toHaveLength(1)
      expect(result[0]).toBeInstanceOf(AuditLog)
      expect(result[0]!.action).toBe(action)
    })

    it('should retrieve audit logs with custom limit', async () => {
      const action = AuditAction.DELETE
      const customLimit = 25

      const mockResults = Array(25)
        .fill(null)
        .map(() => ({
          id: uuidv7(),
          userId: uuidv7(),
          entityType: EntityType.CHAT,
          entityId: uuidv7(),
          action,
          changes: null,
          ipAddress: null,
          userAgent: null,
          createdAt: new Date(),
        }))

      const mockLimit = vi.fn().mockResolvedValue(mockResults)
      const mockOrderBy = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      const result = await repository.getByAction(action, customLimit)

      expect(mockLimit).toHaveBeenCalledWith(customLimit)
      expect(result).toHaveLength(25)
    })

    it('should return empty array when no audit logs found for action', async () => {
      const action = AuditAction.PASSWORD_CHANGE

      const mockLimit = vi.fn().mockResolvedValue([])
      const mockOrderBy = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      const result = await repository.getByAction(action)

      expect(result).toEqual([])
    })

    it('should retrieve logs across different entity types for same action', async () => {
      const action = AuditAction.CREATE

      const mockResults = [
        {
          id: uuidv7(),
          userId: uuidv7(),
          entityType: EntityType.CHAT,
          entityId: uuidv7(),
          action,
          changes: null,
          ipAddress: null,
          userAgent: null,
          createdAt: new Date('2026-01-04T13:00:00Z'),
        },
        {
          id: uuidv7(),
          userId: uuidv7(),
          entityType: EntityType.MESSAGE,
          entityId: uuidv7(),
          action,
          changes: null,
          ipAddress: null,
          userAgent: null,
          createdAt: new Date('2026-01-04T12:00:00Z'),
        },
      ]

      const mockLimit = vi.fn().mockResolvedValue(mockResults)
      const mockOrderBy = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      const result = await repository.getByAction(action)

      expect(result).toHaveLength(2)
      expect(result[0]!.entityType).toBe(EntityType.CHAT)
      expect(result[1]!.entityType).toBe(EntityType.MESSAGE)
      expect(result[0]!.action).toBe(action)
      expect(result[1]!.action).toBe(action)
    })

    it('should order results by createdAt descending', async () => {
      const action = AuditAction.UPDATE

      const mockResults = [
        {
          id: uuidv7(),
          userId: uuidv7(),
          entityType: EntityType.USER,
          entityId: uuidv7(),
          action,
          changes: null,
          ipAddress: null,
          userAgent: null,
          createdAt: new Date('2026-01-04T16:00:00Z'),
        },
        {
          id: uuidv7(),
          userId: uuidv7(),
          entityType: EntityType.USER,
          entityId: uuidv7(),
          action,
          changes: null,
          ipAddress: null,
          userAgent: null,
          createdAt: new Date('2026-01-04T14:00:00Z'),
        },
      ]

      const mockLimit = vi.fn().mockResolvedValue(mockResults)
      const mockOrderBy = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      const result = await repository.getByAction(action)

      expect(result[0]!.createdAt.getTime()).toBeGreaterThan(result[1]!.createdAt.getTime())
    })

    it('should handle all audit action types', async () => {
      const actions: AuditAction[] = [
        AuditAction.CREATE,
        AuditAction.UPDATE,
        AuditAction.DELETE,
        AuditAction.LOGIN,
        AuditAction.LOGOUT,
        AuditAction.LOGIN_FAILED,
        AuditAction.PASSWORD_CHANGE,
        AuditAction.EMAIL_CHANGE,
      ]

      for (const action of actions) {
        vi.clearAllMocks()

        const mockResults = [
          {
            id: uuidv7(),
            userId: uuidv7(),
            entityType: EntityType.USER,
            entityId: uuidv7(),
            action,
            changes: null,
            ipAddress: null,
            userAgent: null,
            createdAt: new Date(),
          },
        ]

        const mockLimit = vi.fn().mockResolvedValue(mockResults)
        const mockOrderBy = vi.fn().mockReturnValue({ limit: mockLimit })
        const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy })
        const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
        const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
        vi.mocked(db.select).mockReturnValue(mockSelect() as any)

        const result = await repository.getByAction(action)

        expect(result).toHaveLength(1)
        expect(result[0]!.action).toBe(action)
      }
    })
  })

  describe('mapToEntity', () => {
    it('should correctly map database row to AuditLog entity', async () => {
      const entityType = EntityType.CHAT
      const entityId = uuidv7()
      const userId = uuidv7()
      const logId = uuidv7()
      const changes = { before: { name: 'Old' }, after: { name: 'New' } }
      const ipAddress = '203.0.113.42'
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      const createdAt = new Date('2026-01-04T10:30:00Z')

      const mockResult = {
        id: logId,
        userId,
        entityType,
        entityId,
        action: AuditAction.UPDATE,
        changes,
        ipAddress,
        userAgent,
        createdAt,
      }

      const mockOrderBy = vi.fn().mockResolvedValue([mockResult])
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      const result = await repository.getByEntity(entityType, entityId)

      expect(result[0]).toBeInstanceOf(AuditLog)
      expect(result[0]!.id).toBe(logId)
      expect(result[0]!.userId).toBe(userId)
      expect(result[0]!.entityType).toBe(entityType)
      expect(result[0]!.entityId).toBe(entityId)
      expect(result[0]!.action).toBe(AuditAction.UPDATE)
      expect(result[0]!.changes).toEqual(changes)
      expect(result[0]!.ipAddress).toBe(ipAddress)
      expect(result[0]!.userAgent).toBe(userAgent)
      expect(result[0]!.createdAt).toBe(createdAt)
    })

    it('should handle null values in database row', async () => {
      const entityType = EntityType.AI_OPTIONS
      const entityId = uuidv7()

      const mockResult = {
        id: uuidv7(),
        userId: null,
        entityType,
        entityId,
        action: AuditAction.DELETE,
        changes: null,
        ipAddress: null,
        userAgent: null,
        createdAt: new Date(),
      }

      const mockOrderBy = vi.fn().mockResolvedValue([mockResult])
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
      vi.mocked(db.select).mockReturnValue(mockSelect() as any)

      const result = await repository.getByEntity(entityType, entityId)

      expect(result[0]!.userId).toBeNull()
      expect(result[0]!.changes).toBeNull()
      expect(result[0]!.ipAddress).toBeNull()
      expect(result[0]!.userAgent).toBeNull()
    })
  })
})
