import { describe, expect, it } from 'vitest'

import {
  redactAuditLogEntry,
  redactCreateAuditLogDTO,
  redactSensitiveData,
} from '../../../src/domain/audit/redact-sensitive-data.js'
import type { CreateAuditLogDTO } from '../../../src/application/ports/audit-log.port.js'
import { EntityType, AuditAction } from '../../../src/domain/audit/entity-type.enum.js'

describe('redactSensitiveData', () => {
  describe('primitive values', () => {
    it('should return null as is', () => {
      expect(redactSensitiveData(null)).toBe(null)
    })

    it('should return undefined as is', () => {
      expect(redactSensitiveData(undefined)).toBe(undefined)
    })

    it('should return string as is', () => {
      expect(redactSensitiveData('test')).toBe('test')
    })

    it('should return number as is', () => {
      expect(redactSensitiveData(123)).toBe(123)
    })

    it('should return boolean as is', () => {
      expect(redactSensitiveData(true)).toBe(true)
    })
  })

  describe('objects with sensitive fields', () => {
    it('should redact password field', () => {
      const data = {
        email: 'user@example.com',
        password: 'secret123',
      }

      const result = redactSensitiveData(data) as typeof data

      expect(result.email).toBe('user@example.com')
      expect(result.password).toBe('[REDACTED]')
    })

    it('should redact multiple sensitive fields', () => {
      const data = {
        username: 'john',
        password: 'secret123',
        token: 'abc123xyz',
        apiKey: 'key-123',
        name: 'John Doe',
      }

      const result = redactSensitiveData(data) as typeof data

      expect(result.username).toBe('john')
      expect(result.name).toBe('John Doe')
      expect(result.password).toBe('[REDACTED]')
      expect(result.token).toBe('[REDACTED]')
      expect(result.apiKey).toBe('[REDACTED]')
    })

    it('should be case-insensitive for field names', () => {
      const data = {
        Password: 'secret',
        PASSWORD: 'another',
        PaSsWoRd: 'mixed',
      }

      const result = redactSensitiveData(data) as Record<string, string>

      expect(result.Password).toBe('[REDACTED]')
      expect(result.PASSWORD).toBe('[REDACTED]')
      expect(result.PaSsWoRd).toBe('[REDACTED]')
    })

    it('should redact financial information', () => {
      const data = {
        name: 'John Doe',
        creditCard: '4111-1111-1111-1111',
        cvv: '123',
        bankAccount: '123456789',
      }

      const result = redactSensitiveData(data) as typeof data

      expect(result.name).toBe('John Doe')
      expect(result.creditCard).toBe('[REDACTED]')
      expect(result.cvv).toBe('[REDACTED]')
      expect(result.bankAccount).toBe('[REDACTED]')
    })

    it('should redact PII fields', () => {
      const data = {
        name: 'John Doe',
        ssn: '123-45-6789',
        passport: 'AB123456',
        dob: '1990-01-01',
      }

      const result = redactSensitiveData(data) as typeof data

      expect(result.name).toBe('John Doe')
      expect(result.ssn).toBe('[REDACTED]')
      expect(result.passport).toBe('[REDACTED]')
      expect(result.dob).toBe('[REDACTED]')
    })
  })

  describe('nested objects', () => {
    it('should redact sensitive fields in nested objects', () => {
      const data = {
        user: {
          name: 'John',
          email: 'john@example.com',
          password: 'secret123',
        },
        profile: {
          bio: 'Developer',
          ssn: '123-45-6789',
        },
      }

      const result = redactSensitiveData(data) as typeof data

      expect(result.user.name).toBe('John')
      expect(result.user.email).toBe('john@example.com')
      expect(result.user.password).toBe('[REDACTED]')
      expect(result.profile.bio).toBe('Developer')
      expect(result.profile.ssn).toBe('[REDACTED]')
    })

    it('should handle deeply nested objects', () => {
      const data = {
        level1: {
          level2: {
            level3: {
              password: 'secret',
              data: 'safe',
            },
          },
        },
      }

      const result = redactSensitiveData(data) as typeof data

      expect(result.level1.level2.level3.data).toBe('safe')
      expect(result.level1.level2.level3.password).toBe('[REDACTED]')
    })

    it('should prevent infinite recursion with max depth', () => {
      const data = {
        level1: {
          level2: {
            level3: {
              tooDeep: 'value',
            },
          },
        },
      }

      const result = redactSensitiveData(data, 0, 2) as any

      // At max depth (2), it returns the object but doesn't recurse deeper
      expect(result.level1.level2.level3).toBe('[MAX_DEPTH_EXCEEDED]')
    })
  })

  describe('arrays', () => {
    it('should redact sensitive fields in array items', () => {
      const data = [
        { name: 'User 1', password: 'pass1' },
        { name: 'User 2', password: 'pass2' },
      ]

      const result = redactSensitiveData(data) as typeof data

      expect(result[0]!.name).toBe('User 1')
      expect(result[0]!.password).toBe('[REDACTED]')
      expect(result[1]!.name).toBe('User 2')
      expect(result[1]!.password).toBe('[REDACTED]')
    })

    it('should handle arrays within objects', () => {
      const data = {
        users: [
          { username: 'john', token: 'token1' },
          { username: 'jane', token: 'token2' },
        ],
      }

      const result = redactSensitiveData(data) as typeof data

      expect(result.users[0]!.username).toBe('john')
      expect(result.users[0]!.token).toBe('[REDACTED]')
      expect(result.users[1]!.username).toBe('jane')
      expect(result.users[1]!.token).toBe('[REDACTED]')
    })
  })

  describe('special object types', () => {
    it('should preserve Date objects', () => {
      const date = new Date('2024-01-01')
      const data = {
        createdAt: date,
        password: 'secret',
      }

      const result = redactSensitiveData(data) as typeof data

      expect(result.createdAt).toBeInstanceOf(Date)
      expect(result.createdAt.getTime()).toBe(date.getTime())
      expect(result.password).toBe('[REDACTED]')
    })
  })

  describe('before/after structure', () => {
    it('should redact sensitive fields in before/after structure', () => {
      const data = {
        before: {
          name: 'Old Name',
          email: 'old@example.com',
          password: 'oldpass',
        },
        after: {
          name: 'New Name',
          email: 'new@example.com',
          password: 'newpass',
        },
      }

      const result = redactSensitiveData(data) as typeof data

      expect(result.before.name).toBe('Old Name')
      expect(result.before.email).toBe('old@example.com')
      expect(result.before.password).toBe('[REDACTED]')
      expect(result.after.name).toBe('New Name')
      expect(result.after.email).toBe('new@example.com')
      expect(result.after.password).toBe('[REDACTED]')
    })
  })

  describe('edge cases', () => {
    it('should handle empty objects', () => {
      const result = redactSensitiveData({})
      expect(result).toEqual({})
    })

    it('should handle empty arrays', () => {
      const result = redactSensitiveData([])
      expect(result).toEqual([])
    })

    it('should handle objects with null values', () => {
      const data = {
        name: 'John',
        password: null,
        token: undefined,
      }

      const result = redactSensitiveData(data) as typeof data

      expect(result.name).toBe('John')
      expect(result.password).toBe('[REDACTED]')
      expect(result.token).toBe('[REDACTED]')
    })
  })
})

describe('redactAuditLogEntry', () => {
  it('should redact changes field in audit log entry', () => {
    const entry = {
      userId: 'user-123',
      entityType: 'user',
      entityId: 'user-456',
      action: 'update',
      changes: {
        before: { email: 'old@example.com', password: 'oldpass' },
        after: { email: 'new@example.com', password: 'newpass' },
      },
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
    }

    const result = redactAuditLogEntry(entry)

    expect(result.userId).toBe('user-123')
    expect(result.entityType).toBe('user')
    expect(result.action).toBe('update')
    expect(result.ipAddress).toBe('192.168.1.1')

    const changes = result.changes as any
    expect(changes.before.email).toBe('old@example.com')
    expect(changes.before.password).toBe('[REDACTED]')
    expect(changes.after.email).toBe('new@example.com')
    expect(changes.after.password).toBe('[REDACTED]')
  })

  it('should handle entry without changes field', () => {
    const entry = {
      userId: 'user-123',
      entityType: 'user',
      entityId: 'user-456',
      action: 'delete',
    }

    const result = redactAuditLogEntry(entry)

    expect(result).toEqual(entry)
  })

  it('should handle entry with null changes', () => {
    const entry = {
      userId: 'user-123',
      entityType: 'user',
      entityId: 'user-456',
      action: 'delete',
      changes: null,
    }

    const result = redactAuditLogEntry(entry)

    expect(result.changes).toBe(null)
  })

  it('should preserve all non-changes fields', () => {
    const entry = {
      userId: 'user-123',
      entityType: 'user',
      entityId: 'user-456',
      action: 'login',
      changes: { success: true, password: 'secret' },
      ipAddress: '10.0.0.1',
      userAgent: 'Chrome',
      customField: 'preserved',
    }

    const result = redactAuditLogEntry(entry)

    expect(result.userId).toBe('user-123')
    expect(result.entityType).toBe('user')
    expect(result.entityId).toBe('user-456')
    expect(result.action).toBe('login')
    expect(result.ipAddress).toBe('10.0.0.1')
    expect(result.userAgent).toBe('Chrome')
    expect(result.customField).toBe('preserved')

    const changes = result.changes as any
    expect(changes.success).toBe(true)
    expect(changes.password).toBe('[REDACTED]')
  })

  it('should handle login failure with email in changes', () => {
    const entry = {
      userId: null,
      entityType: 'user',
      entityId: 'unknown',
      action: 'login_failed',
      changes: {
        email: 'user@example.com',
        password: 'wrongpass',
        reason: 'invalid_password',
      },
    }

    const result = redactAuditLogEntry(entry)

    const changes = result.changes as any
    expect(changes.email).toBe('user@example.com')
    expect(changes.password).toBe('[REDACTED]')
    expect(changes.reason).toBe('invalid_password')
  })

  it('should redact tokens in changes', () => {
    const entry = {
      userId: 'user-123',
      entityType: 'user',
      entityId: 'user-456',
      action: 'token_refresh',
      changes: {
        oldToken: 'eyJhbGciOi...',
        newToken: 'eyJhbGciOj...',
        expiresIn: 3600,
      },
    }

    const result = redactAuditLogEntry(entry)

    const changes = result.changes as any
    expect(changes.oldToken).toBe('[REDACTED]')
    expect(changes.newToken).toBe('[REDACTED]')
    expect(changes.expiresIn).toBe(3600)
  })
})

describe('redactCreateAuditLogDTO', () => {
  it('should redact changes field in CreateAuditLogDTO', () => {
    const entry: CreateAuditLogDTO = {
      userId: 'user-123',
      entityType: EntityType.USER,
      entityId: 'user-456',
      action: AuditAction.UPDATE,
      changes: {
        before: { email: 'old@example.com', password: 'oldpass' },
        after: { email: 'new@example.com', password: 'newpass' },
      },
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
    }

    const result = redactCreateAuditLogDTO(entry)

    expect(result.userId).toBe('user-123')
    expect(result.entityType).toBe(EntityType.USER)
    expect(result.action).toBe(AuditAction.UPDATE)
    expect(result.ipAddress).toBe('192.168.1.1')

    const changes = result.changes as Record<string, unknown>
    const before = changes.before as Record<string, unknown>
    const after = changes.after as Record<string, unknown>
    expect(before.email).toBe('old@example.com')
    expect(before.password).toBe('[REDACTED]')
    expect(after.email).toBe('new@example.com')
    expect(after.password).toBe('[REDACTED]')
  })

  it('should handle DTO without changes field', () => {
    const entry: CreateAuditLogDTO = {
      userId: 'user-123',
      entityType: EntityType.USER,
      entityId: 'user-456',
      action: AuditAction.DELETE,
    }

    const result = redactCreateAuditLogDTO(entry)

    expect(result).toEqual(entry)
  })

  it('should handle DTO with undefined changes', () => {
    const entry: CreateAuditLogDTO = {
      userId: 'user-123',
      entityType: EntityType.USER,
      entityId: 'user-456',
      action: AuditAction.DELETE,
      changes: undefined,
    }

    const result = redactCreateAuditLogDTO(entry)

    expect(result.changes).toBe(undefined)
  })

  it('should preserve all non-changes fields in DTO', () => {
    const entry: CreateAuditLogDTO = {
      userId: 'user-123',
      entityType: EntityType.USER,
      entityId: 'user-456',
      action: AuditAction.LOGIN,
      changes: { success: true, password: 'secret' },
      ipAddress: '10.0.0.1',
      userAgent: 'Chrome',
    }

    const result = redactCreateAuditLogDTO(entry)

    expect(result.userId).toBe('user-123')
    expect(result.entityType).toBe(EntityType.USER)
    expect(result.entityId).toBe('user-456')
    expect(result.action).toBe(AuditAction.LOGIN)
    expect(result.ipAddress).toBe('10.0.0.1')
    expect(result.userAgent).toBe('Chrome')

    const changes = result.changes as Record<string, unknown>
    expect(changes.success).toBe(true)
    expect(changes.password).toBe('[REDACTED]')
  })

  it('should handle login failure with sensitive data in changes', () => {
    const entry: CreateAuditLogDTO = {
      userId: null,
      entityType: EntityType.USER,
      entityId: 'unknown',
      action: AuditAction.LOGIN_FAILED,
      changes: {
        reason: 'invalid_password',
        token: 'secret-token',
        apiKey: 'secret-key',
      },
    }

    const result = redactCreateAuditLogDTO(entry)

    const changes = result.changes as Record<string, unknown>
    expect(changes.reason).toBe('invalid_password')
    expect(changes.token).toBe('[REDACTED]')
    expect(changes.apiKey).toBe('[REDACTED]')
  })

  it('should maintain type safety with CreateAuditLogDTO', () => {
    const entry: CreateAuditLogDTO = {
      userId: 'user-123',
      entityType: EntityType.USER,
      entityId: 'user-456',
      action: AuditAction.UPDATE,
      changes: {
        before: { name: 'Old', password: 'old' },
        after: { name: 'New', password: 'new' },
      },
    }

    // This should compile without type errors
    const result: CreateAuditLogDTO = redactCreateAuditLogDTO(entry)

    expect(result.userId).toBe('user-123')
    expect(result.entityType).toBe(EntityType.USER)
  })
})
