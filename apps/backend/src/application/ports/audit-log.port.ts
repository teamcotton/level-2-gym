import { AuditLog } from '../../domain/audit/audit-log.entity.js'
import { EntityType } from '../../domain/audit/entity-type.enum.js'
import { AuditAction } from '../../domain/audit/entity-type.enum.js'
import type { AuditChanges } from '../../domain/audit/audit-changes.types.js'

export interface AuditLogPort {
  /**
   * Create an audit log entry
   */
  log(entry: CreateAuditLogDTO): Promise<void>

  /**
   * Query audit logs for a specific entity
   */
  getByEntity(entityType: EntityType, entityId: string): Promise<AuditLog[]>

  /**
   * Query audit logs for a specific user
   */
  getByUser(userId: string, limit?: number): Promise<AuditLog[]>

  /**
   * Query audit logs by action type
   */
  getByAction(action: AuditAction, limit?: number): Promise<AuditLog[]>
}

export interface CreateAuditLogDTO {
  userId: string | null
  entityType: EntityType
  entityId: string
  action: AuditAction
  changes?: AuditChanges
  ipAddress?: string
  userAgent?: string
}
