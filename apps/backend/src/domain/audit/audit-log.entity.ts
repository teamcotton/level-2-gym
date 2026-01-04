import { EntityType, AuditAction } from './entity-type.enum.js'
import type { AuditChanges } from './audit-changes.types.js'

export class AuditLog {
  constructor(
    public readonly id: string,
    public readonly userId: string | null,
    public readonly entityType: EntityType,
    public readonly entityId: string,
    public readonly action: AuditAction,
    public readonly changes: AuditChanges | null,
    public readonly ipAddress: string | null,
    public readonly userAgent: string | null,
    public readonly createdAt: Date
  ) {}
}
