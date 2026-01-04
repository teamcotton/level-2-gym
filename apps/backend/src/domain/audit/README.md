# Audit Domain

This directory contains the domain logic for audit logging in the application.

## Type-Safe Audit Changes

The audit log system uses a union type `AuditChanges` to provide type safety and autocomplete support for different change structures based on the action type.

### Available Change Types

#### CreateChanges

Used when an entity is created:

```typescript
const changes: CreateChanges = {
  created: {
    name: 'John Doe',
    email: 'john@example.com',
    role: 'user',
  },
}
```

#### UpdateChanges

Used when an entity is updated, capturing before/after states:

```typescript
const changes: UpdateChanges = {
  before: {
    name: 'Old Name',
    email: 'old@example.com',
  },
  after: {
    name: 'New Name',
    email: 'new@example.com',
  },
}
```

#### DeleteChanges

Used when an entity is deleted:

```typescript
const changes: DeleteChanges = {
  deleted: {
    chatId: '123',
    messageCount: 42,
    wasActive: true,
  },
}
```

#### LoginChanges

Used for successful login events:

```typescript
const changes: LoginChanges = {
  success: true,
  method: 'jwt',
  sessionDuration: '7d',
}
```

#### LoginFailedChanges

Used for failed login attempts:

```typescript
const changes: LoginFailedChanges = {
  email: 'user@example.com',
  reason: 'invalid_password',
}
```

#### LogoutChanges

Used for logout events:

```typescript
const changes: LogoutChanges = {
  reason: 'user_initiated',
  sessionDuration: '2h',
}
```

#### PasswordChangeChanges

Used for password change events:

```typescript
const changes: PasswordChangeChanges = {
  success: true,
  method: 'email_verification',
}
```

#### EmailChangeChanges

Used for email change events:

```typescript
const changes: EmailChangeChanges = {
  before: 'old@example.com',
  after: 'new@example.com',
  verified: true,
}
```

### Usage Example

```typescript
import { AuditLogPort, CreateAuditLogDTO } from '../application/ports/audit-log.port.js'
import { AuditAction, EntityType } from '../domain/audit/entity-type.enum.js'
import type { LoginFailedChanges } from '../domain/audit/audit-changes.types.js'

// Type-safe audit log creation
const auditEntry: CreateAuditLogDTO = {
  userId: null,
  entityType: EntityType.USER,
  entityId: 'unknown',
  action: AuditAction.LOGIN_FAILED,
  changes: {
    email: 'user@example.com',
    reason: 'invalid_password',
  } satisfies LoginFailedChanges, // Type-checked!
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0',
}

await auditLog.log(auditEntry)
```

### Benefits

1. **Type Safety**: TypeScript will catch type errors at compile time
2. **Autocomplete**: IDEs provide intelligent code completion for change structures
3. **Documentation**: Change structures are self-documenting with TypeScript types
4. **Flexibility**: The union type includes `Record<string, unknown>` as a fallback for custom change structures

### Sensitive Data Redaction

All audit log entries are automatically redacted for sensitive fields (passwords, tokens, API keys, etc.) before being stored in the database. See `redact-sensitive-data.ts` for the complete list of sensitive fields.
