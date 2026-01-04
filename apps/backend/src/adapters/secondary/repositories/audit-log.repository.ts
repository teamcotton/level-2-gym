import { db } from '../../../infrastructure/database/index.js'
import { auditLog, type DBAuditLogSelect } from '../../../infrastructure/database/schema.js'
import type { AuditLogPort, CreateAuditLogDTO } from '../../../application/ports/audit-log.port.js'
import { eq, desc, and } from 'drizzle-orm'
import type { LoggerPort } from '../../../application/ports/logger.port.js'
import { AuditLog } from '../../../domain/audit/audit-log.entity.js'
import { EntityType, AuditAction } from '../../../domain/audit/entity-type.enum.js'
import { redactAuditLogEntry } from '../../../domain/audit/redact-sensitive-data.js'

export class AuditLogRepository implements AuditLogPort {
  constructor(private readonly logger: LoggerPort) {}

  async log(entry: CreateAuditLogDTO): Promise<void> {
    try {
      // Redact sensitive data before storing in database
      const redactedEntry = redactAuditLogEntry(
        entry as unknown as Record<string, unknown>
      ) as unknown as CreateAuditLogDTO

      await db.insert(auditLog).values({
        userId: redactedEntry.userId ?? null,
        entityType: redactedEntry.entityType,
        entityId: redactedEntry.entityId,
        action: redactedEntry.action,
        changes: redactedEntry.changes ?? null,
        ipAddress: redactedEntry.ipAddress ?? null,
        userAgent: redactedEntry.userAgent ?? null,
      })

      this.logger.info('Audit log entry created', {
        entityType: entry.entityType,
        entityId: entry.entityId,
        action: entry.action,
      })
    } catch (error) {
      this.logger.error('Failed to create audit log entry', error as Error, { entry })
      // Don't throw - audit logging should not break business operations
    }
  }

  async getByEntity(entityType: EntityType, entityId: string): Promise<AuditLog[]> {
    const results = await db
      .select()
      .from(auditLog)
      .where(and(eq(auditLog.entityType, entityType), eq(auditLog.entityId, entityId)))
      .orderBy(desc(auditLog.createdAt))

    return results.map(this.mapToEntity)
  }

  async getByUser(userId: string, limit: number = 100): Promise<AuditLog[]> {
    const results = await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.userId, userId))
      .orderBy(desc(auditLog.createdAt))
      .limit(limit)

    return results.map(this.mapToEntity)
  }

  async getByAction(action: AuditAction, limit: number = 100): Promise<AuditLog[]> {
    const results = await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.action, action))
      .orderBy(desc(auditLog.createdAt))
      .limit(limit)

    return results.map(this.mapToEntity)
  }

  private mapToEntity(row: DBAuditLogSelect): AuditLog {
    return new AuditLog(
      row.id,
      row.userId,
      row.entityType as EntityType,
      row.entityId,
      row.action as AuditAction,
      row.changes as Record<string, any> | null,
      row.ipAddress,
      row.userAgent,
      row.createdAt
    )
  }
}
