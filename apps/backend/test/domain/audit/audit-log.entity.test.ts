import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it } from 'vitest'

import type {
  DeleteChanges,
  LoginChanges,
  UpdateChanges,
} from '../../../src/domain/audit/audit-changes.types.js'
import { AuditLog } from '../../../src/domain/audit/audit-log.entity.js'
import { AuditAction, EntityType } from '../../../src/domain/audit/entity-type.enum.js'

describe('AuditLog Entity', () => {
  let testId: string
  let testUserId: string
  let testEntityId: string
  let testCreatedAt: Date
  let testAuditLog: AuditLog

  beforeEach(() => {
    testId = uuidv7()
    testUserId = uuidv7()
    testEntityId = uuidv7()
    testCreatedAt = new Date()
    testAuditLog = new AuditLog(
      testId,
      testUserId,
      EntityType.USER,
      testEntityId,
      AuditAction.CREATE,
      { created: { name: 'Test User' } },
      '192.168.1.1',
      'Mozilla/5.0',
      testCreatedAt
    )
  })

  describe('Constructor', () => {
    it('should create an audit log with all required fields', () => {
      expect(testAuditLog).toBeInstanceOf(AuditLog)
      expect(testAuditLog.id).toBe(testId)
      expect(testAuditLog.userId).toBe(testUserId)
      expect(testAuditLog.entityType).toBe(EntityType.USER)
      expect(testAuditLog.entityId).toBe(testEntityId)
      expect(testAuditLog.action).toBe(AuditAction.CREATE)
      expect(testAuditLog.changes).toEqual({ created: { name: 'Test User' } })
      expect(testAuditLog.ipAddress).toBe('192.168.1.1')
      expect(testAuditLog.userAgent).toBe('Mozilla/5.0')
      expect(testAuditLog.createdAt).toBe(testCreatedAt)
    })

    it('should accept null userId for system actions', () => {
      const systemAuditLog = new AuditLog(
        testId,
        null,
        EntityType.CHAT,
        testEntityId,
        AuditAction.DELETE,
        null,
        null,
        null,
        testCreatedAt
      )

      expect(systemAuditLog.userId).toBeNull()
      expect(systemAuditLog.entityType).toBe(EntityType.CHAT)
    })

    it('should accept null changes field', () => {
      const auditLog = new AuditLog(
        testId,
        testUserId,
        EntityType.MESSAGE,
        testEntityId,
        AuditAction.CREATE,
        null,
        '10.0.0.1',
        'Chrome',
        testCreatedAt
      )

      expect(auditLog.changes).toBeNull()
    })

    it('should accept null ipAddress', () => {
      const auditLog = new AuditLog(
        testId,
        testUserId,
        EntityType.PART,
        testEntityId,
        AuditAction.UPDATE,
        { before: {}, after: {} },
        null,
        'Safari',
        testCreatedAt
      )

      expect(auditLog.ipAddress).toBeNull()
    })

    it('should accept null userAgent', () => {
      const auditLog = new AuditLog(
        testId,
        testUserId,
        EntityType.AI_OPTIONS,
        testEntityId,
        AuditAction.DELETE,
        { deleted: { promptText: 'test' } },
        '172.16.0.1',
        null,
        testCreatedAt
      )

      expect(auditLog.userAgent).toBeNull()
    })
  })

  describe('Property Access', () => {
    it('should have readonly id property', () => {
      expect(testAuditLog.id).toBe(testId)
      // TypeScript readonly is compile-time only, but we can verify the property exists
      expect(Object.getOwnPropertyDescriptor(testAuditLog, 'id')).toBeDefined()
    })

    it('should have readonly userId property', () => {
      expect(testAuditLog.userId).toBe(testUserId)
      expect(Object.getOwnPropertyDescriptor(testAuditLog, 'userId')).toBeDefined()
    })

    it('should have readonly entityType property', () => {
      expect(testAuditLog.entityType).toBe(EntityType.USER)
      expect(Object.getOwnPropertyDescriptor(testAuditLog, 'entityType')).toBeDefined()
    })

    it('should have readonly entityId property', () => {
      expect(testAuditLog.entityId).toBe(testEntityId)
      expect(Object.getOwnPropertyDescriptor(testAuditLog, 'entityId')).toBeDefined()
    })

    it('should have readonly action property', () => {
      expect(testAuditLog.action).toBe(AuditAction.CREATE)
      expect(Object.getOwnPropertyDescriptor(testAuditLog, 'action')).toBeDefined()
    })

    it('should have readonly changes property', () => {
      expect(testAuditLog.changes).toEqual({ created: { name: 'Test User' } })
      expect(Object.getOwnPropertyDescriptor(testAuditLog, 'changes')).toBeDefined()
    })

    it('should have readonly ipAddress property', () => {
      expect(testAuditLog.ipAddress).toBe('192.168.1.1')
      expect(Object.getOwnPropertyDescriptor(testAuditLog, 'ipAddress')).toBeDefined()
    })

    it('should have readonly userAgent property', () => {
      expect(testAuditLog.userAgent).toBe('Mozilla/5.0')
      expect(Object.getOwnPropertyDescriptor(testAuditLog, 'userAgent')).toBeDefined()
    })

    it('should have readonly createdAt property', () => {
      expect(testAuditLog.createdAt).toBe(testCreatedAt)
      expect(Object.getOwnPropertyDescriptor(testAuditLog, 'createdAt')).toBeDefined()
    })
  })

  describe('Entity Types', () => {
    it('should accept USER entity type', () => {
      const auditLog = new AuditLog(
        testId,
        testUserId,
        EntityType.USER,
        testEntityId,
        AuditAction.CREATE,
        null,
        null,
        null,
        testCreatedAt
      )

      expect(auditLog.entityType).toBe(EntityType.USER)
      expect(auditLog.entityType).toBe('user')
    })

    it('should accept CHAT entity type', () => {
      const auditLog = new AuditLog(
        testId,
        testUserId,
        EntityType.CHAT,
        testEntityId,
        AuditAction.CREATE,
        null,
        null,
        null,
        testCreatedAt
      )

      expect(auditLog.entityType).toBe(EntityType.CHAT)
      expect(auditLog.entityType).toBe('chat')
    })

    it('should accept MESSAGE entity type', () => {
      const auditLog = new AuditLog(
        testId,
        testUserId,
        EntityType.MESSAGE,
        testEntityId,
        AuditAction.CREATE,
        null,
        null,
        null,
        testCreatedAt
      )

      expect(auditLog.entityType).toBe(EntityType.MESSAGE)
      expect(auditLog.entityType).toBe('message')
    })

    it('should accept PART entity type', () => {
      const auditLog = new AuditLog(
        testId,
        testUserId,
        EntityType.PART,
        testEntityId,
        AuditAction.CREATE,
        null,
        null,
        null,
        testCreatedAt
      )

      expect(auditLog.entityType).toBe(EntityType.PART)
      expect(auditLog.entityType).toBe('part')
    })

    it('should accept AI_OPTIONS entity type', () => {
      const auditLog = new AuditLog(
        testId,
        testUserId,
        EntityType.AI_OPTIONS,
        testEntityId,
        AuditAction.CREATE,
        null,
        null,
        null,
        testCreatedAt
      )

      expect(auditLog.entityType).toBe(EntityType.AI_OPTIONS)
      expect(auditLog.entityType).toBe('ai_options')
    })
  })

  describe('Audit Actions', () => {
    it('should accept CREATE action', () => {
      const auditLog = new AuditLog(
        testId,
        testUserId,
        EntityType.USER,
        testEntityId,
        AuditAction.CREATE,
        null,
        null,
        null,
        testCreatedAt
      )

      expect(auditLog.action).toBe(AuditAction.CREATE)
      expect(auditLog.action).toBe('create')
    })

    it('should accept UPDATE action', () => {
      const auditLog = new AuditLog(
        testId,
        testUserId,
        EntityType.USER,
        testEntityId,
        AuditAction.UPDATE,
        null,
        null,
        null,
        testCreatedAt
      )

      expect(auditLog.action).toBe(AuditAction.UPDATE)
      expect(auditLog.action).toBe('update')
    })

    it('should accept DELETE action', () => {
      const auditLog = new AuditLog(
        testId,
        testUserId,
        EntityType.USER,
        testEntityId,
        AuditAction.DELETE,
        null,
        null,
        null,
        testCreatedAt
      )

      expect(auditLog.action).toBe(AuditAction.DELETE)
      expect(auditLog.action).toBe('delete')
    })

    it('should accept LOGIN action', () => {
      const auditLog = new AuditLog(
        testId,
        testUserId,
        EntityType.USER,
        testEntityId,
        AuditAction.LOGIN,
        null,
        null,
        null,
        testCreatedAt
      )

      expect(auditLog.action).toBe(AuditAction.LOGIN)
      expect(auditLog.action).toBe('login')
    })

    it('should accept LOGOUT action', () => {
      const auditLog = new AuditLog(
        testId,
        testUserId,
        EntityType.USER,
        testEntityId,
        AuditAction.LOGOUT,
        null,
        null,
        null,
        testCreatedAt
      )

      expect(auditLog.action).toBe(AuditAction.LOGOUT)
      expect(auditLog.action).toBe('logout')
    })

    it('should accept LOGIN_FAILED action', () => {
      const auditLog = new AuditLog(
        testId,
        testUserId,
        EntityType.USER,
        testEntityId,
        AuditAction.LOGIN_FAILED,
        null,
        null,
        null,
        testCreatedAt
      )

      expect(auditLog.action).toBe(AuditAction.LOGIN_FAILED)
      expect(auditLog.action).toBe('login_failed')
    })

    it('should accept PASSWORD_CHANGE action', () => {
      const auditLog = new AuditLog(
        testId,
        testUserId,
        EntityType.USER,
        testEntityId,
        AuditAction.PASSWORD_CHANGE,
        null,
        null,
        null,
        testCreatedAt
      )

      expect(auditLog.action).toBe(AuditAction.PASSWORD_CHANGE)
      expect(auditLog.action).toBe('password_change')
    })

    it('should accept EMAIL_CHANGE action', () => {
      const auditLog = new AuditLog(
        testId,
        testUserId,
        EntityType.USER,
        testEntityId,
        AuditAction.EMAIL_CHANGE,
        null,
        null,
        null,
        testCreatedAt
      )

      expect(auditLog.action).toBe(AuditAction.EMAIL_CHANGE)
      expect(auditLog.action).toBe('email_change')
    })
  })

  describe('Changes Object Structure', () => {
    it('should store create changes with initial values', () => {
      const changes = {
        created: {
          name: 'John Doe',
          email: 'john@example.com',
          role: 'user',
        },
      }

      const auditLog = new AuditLog(
        testId,
        testUserId,
        EntityType.USER,
        testEntityId,
        AuditAction.CREATE,
        changes,
        null,
        null,
        testCreatedAt
      )

      expect(auditLog.changes).toEqual(changes)
      expect(auditLog.changes).toHaveProperty('created')
    })

    it('should store update changes with before/after values', () => {
      const changes = {
        before: {
          name: 'Old Name',
          email: 'old@example.com',
        },
        after: {
          name: 'New Name',
          email: 'new@example.com',
        },
      }

      const auditLog = new AuditLog(
        testId,
        testUserId,
        EntityType.USER,
        testEntityId,
        AuditAction.UPDATE,
        changes,
        null,
        null,
        testCreatedAt
      )

      expect(auditLog.changes).toEqual(changes)
      expect(auditLog.changes).toHaveProperty('before')
      expect(auditLog.changes).toHaveProperty('after')
    })

    it('should store delete changes with deleted entity data', () => {
      const changes = {
        deleted: {
          chatId: testEntityId,
          messageCount: 42,
          wasActive: true,
        },
      }

      const auditLog = new AuditLog(
        testId,
        testUserId,
        EntityType.CHAT,
        testEntityId,
        AuditAction.DELETE,
        changes,
        null,
        null,
        testCreatedAt
      )

      expect(auditLog.changes).toEqual(changes)
      expect(auditLog.changes).toHaveProperty('deleted')
    })

    it('should store login metadata', () => {
      const changes = {
        success: true,
        method: 'jwt',
        sessionDuration: '7d',
      }

      const auditLog = new AuditLog(
        testId,
        testUserId,
        EntityType.USER,
        testEntityId,
        AuditAction.LOGIN,
        changes,
        '192.168.1.1',
        'Mozilla/5.0',
        testCreatedAt
      )

      expect(auditLog.changes).toEqual(changes)
      expect((auditLog.changes as LoginChanges)?.success).toBe(true)
    })

    it('should handle complex nested changes objects', () => {
      const changes: UpdateChanges = {
        before: {
          profile: {
            address: {
              city: 'Old City',
              country: 'Old Country',
            },
            preferences: {
              theme: 'light',
              language: 'en',
            },
          },
        },
        after: {
          profile: {
            address: {
              city: 'New City',
              country: 'New Country',
            },
            preferences: {
              theme: 'dark',
              language: 'es',
            },
          },
        },
      }

      const auditLog = new AuditLog(
        testId,
        testUserId,
        EntityType.USER,
        testEntityId,
        AuditAction.UPDATE,
        changes,
        null,
        null,
        testCreatedAt
      )

      expect(auditLog.changes).toEqual(changes)
      expect(((auditLog.changes as UpdateChanges)?.before as any).profile.address.city).toBe(
        'Old City'
      )
      expect(((auditLog.changes as UpdateChanges)?.after as any).profile.address.city).toBe(
        'New City'
      )
    })

    it('should handle empty changes object', () => {
      const changes = {}

      const auditLog = new AuditLog(
        testId,
        testUserId,
        EntityType.USER,
        testEntityId,
        AuditAction.UPDATE,
        changes,
        null,
        null,
        testCreatedAt
      )

      expect(auditLog.changes).toEqual({})
    })
  })

  describe('IP Address Formats', () => {
    it('should accept IPv4 addresses', () => {
      const auditLog = new AuditLog(
        testId,
        testUserId,
        EntityType.USER,
        testEntityId,
        AuditAction.LOGIN,
        null,
        '192.168.1.1',
        null,
        testCreatedAt
      )

      expect(auditLog.ipAddress).toBe('192.168.1.1')
    })

    it('should accept IPv6 addresses', () => {
      const auditLog = new AuditLog(
        testId,
        testUserId,
        EntityType.USER,
        testEntityId,
        AuditAction.LOGIN,
        null,
        '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
        null,
        testCreatedAt
      )

      expect(auditLog.ipAddress).toBe('2001:0db8:85a3:0000:0000:8a2e:0370:7334')
    })

    it('should accept localhost addresses', () => {
      const auditLog = new AuditLog(
        testId,
        testUserId,
        EntityType.USER,
        testEntityId,
        AuditAction.LOGIN,
        null,
        '127.0.0.1',
        null,
        testCreatedAt
      )

      expect(auditLog.ipAddress).toBe('127.0.0.1')
    })
  })

  describe('User Agent Strings', () => {
    it('should accept Chrome user agent', () => {
      const userAgent =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'

      const auditLog = new AuditLog(
        testId,
        testUserId,
        EntityType.USER,
        testEntityId,
        AuditAction.LOGIN,
        null,
        null,
        userAgent,
        testCreatedAt
      )

      expect(auditLog.userAgent).toBe(userAgent)
    })

    it('should accept Firefox user agent', () => {
      const userAgent =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'

      const auditLog = new AuditLog(
        testId,
        testUserId,
        EntityType.USER,
        testEntityId,
        AuditAction.LOGIN,
        null,
        null,
        userAgent,
        testCreatedAt
      )

      expect(auditLog.userAgent).toBe(userAgent)
    })

    it('should accept mobile user agent', () => {
      const userAgent =
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1'

      const auditLog = new AuditLog(
        testId,
        testUserId,
        EntityType.USER,
        testEntityId,
        AuditAction.LOGIN,
        null,
        null,
        userAgent,
        testCreatedAt
      )

      expect(auditLog.userAgent).toBe(userAgent)
    })

    it('should accept API client user agent', () => {
      const userAgent = 'axios/0.21.1'

      const auditLog = new AuditLog(
        testId,
        testUserId,
        EntityType.USER,
        testEntityId,
        AuditAction.CREATE,
        null,
        null,
        userAgent,
        testCreatedAt
      )

      expect(auditLog.userAgent).toBe(userAgent)
    })
  })

  describe('Timestamp Handling', () => {
    it('should store the exact timestamp provided', () => {
      const specificDate = new Date('2026-01-04T12:00:00.000Z')

      const auditLog = new AuditLog(
        testId,
        testUserId,
        EntityType.USER,
        testEntityId,
        AuditAction.LOGIN,
        null,
        null,
        null,
        specificDate
      )

      expect(auditLog.createdAt).toBe(specificDate)
      expect(auditLog.createdAt.toISOString()).toBe('2026-01-04T12:00:00.000Z')
    })

    it('should preserve milliseconds in timestamp', () => {
      const dateWithMillis = new Date('2026-01-04T12:34:56.789Z')

      const auditLog = new AuditLog(
        testId,
        testUserId,
        EntityType.USER,
        testEntityId,
        AuditAction.UPDATE,
        null,
        null,
        null,
        dateWithMillis
      )

      expect(auditLog.createdAt.getMilliseconds()).toBe(789)
    })
  })

  describe('Real-world Scenarios', () => {
    it('should represent a successful user login', () => {
      const loginAudit = new AuditLog(
        uuidv7(),
        testUserId,
        EntityType.USER,
        testUserId,
        AuditAction.LOGIN,
        { success: true, method: 'jwt' },
        '203.0.113.1',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        new Date()
      )

      expect(loginAudit.action).toBe(AuditAction.LOGIN)
      expect(loginAudit.userId).toBe(testUserId)
      expect((loginAudit.changes as LoginChanges)?.success).toBe(true)
      expect(loginAudit.ipAddress).toBeTruthy()
      expect(loginAudit.userAgent).toBeTruthy()
    })

    it('should represent a failed login attempt', () => {
      const failedLoginAudit = new AuditLog(
        uuidv7(),
        null,
        EntityType.USER,
        'unknown',
        AuditAction.LOGIN_FAILED,
        { email: 'test@example.com', reason: 'invalid_password' },
        '198.51.100.42',
        'curl/7.68.0',
        new Date()
      )

      expect(failedLoginAudit.action).toBe(AuditAction.LOGIN_FAILED)
      expect(failedLoginAudit.userId).toBeNull()
      expect((failedLoginAudit.changes as any)?.reason).toBe('invalid_password')
    })

    it('should represent a user profile update', () => {
      const updateAudit = new AuditLog(
        uuidv7(),
        testUserId,
        EntityType.USER,
        testUserId,
        AuditAction.UPDATE,
        {
          before: { name: 'John Doe', email: 'john@old.com' },
          after: { name: 'John Doe', email: 'john@new.com' },
        },
        '192.0.2.146',
        'Mozilla/5.0',
        new Date()
      )

      expect(updateAudit.action).toBe(AuditAction.UPDATE)
      expect((updateAudit.changes as UpdateChanges)?.before.email).toBe('john@old.com')
      expect((updateAudit.changes as UpdateChanges)?.after.email).toBe('john@new.com')
    })

    it('should represent a chat creation', () => {
      const chatId = uuidv7()
      const createChatAudit = new AuditLog(
        uuidv7(),
        testUserId,
        EntityType.CHAT,
        chatId,
        AuditAction.CREATE,
        { created: { chatId, userId: testUserId, messageCount: 0 } },
        '10.0.0.1',
        'Next.js',
        new Date()
      )

      expect(createChatAudit.action).toBe(AuditAction.CREATE)
      expect(createChatAudit.entityType).toBe(EntityType.CHAT)
      expect((createChatAudit.changes as any)?.created.chatId).toBe(chatId)
    })

    it('should represent a chat deletion', () => {
      const chatId = uuidv7()
      const deleteChatAudit = new AuditLog(
        uuidv7(),
        testUserId,
        EntityType.CHAT,
        chatId,
        AuditAction.DELETE,
        { deleted: { chatId, messageCount: 42, wasActive: true } },
        '172.16.0.1',
        'Safari/605.1.15',
        new Date()
      )

      expect(deleteChatAudit.action).toBe(AuditAction.DELETE)
      expect(deleteChatAudit.entityType).toBe(EntityType.CHAT)
      expect(((deleteChatAudit.changes as DeleteChanges)?.deleted as any).messageCount).toBe(42)
    })

    it('should represent a system-initiated action', () => {
      const systemAudit = new AuditLog(
        uuidv7(),
        null,
        EntityType.AI_OPTIONS,
        uuidv7(),
        AuditAction.DELETE,
        { deleted: { reason: 'cleanup_old_records' } },
        null,
        null,
        new Date()
      )

      expect(systemAudit.userId).toBeNull()
      expect(systemAudit.ipAddress).toBeNull()
      expect(systemAudit.userAgent).toBeNull()
    })
  })
})
