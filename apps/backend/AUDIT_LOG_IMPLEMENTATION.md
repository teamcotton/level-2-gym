# Audit Log Implementation Guide

## Overview

The `audit_log` table is designed to track all significant actions and changes across the system for security, compliance, and debugging purposes. This guide provides a comprehensive approach to implementing audit logging throughout the application.

## Table Structure

```sql
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    changes JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Column Definitions

- **id**: Unique identifier (UUID v7 - sortable by time)
- **user_id**: Reference to user who performed the action (nullable for system actions)
- **entity_type**: Type of entity affected (e.g., `user`, `chat`, `message`, `part`)
- **entity_id**: UUID of the affected entity
- **action**: Action performed (e.g., `create`, `update`, `delete`, `login`, `logout`)
- **changes**: JSONB object containing before/after values for updates or relevant metadata
- **ip_address**: IP address from which the action was performed
- **user_agent**: User agent string of the client
- **created_at**: Timestamp when the action was performed

### Indexes

```sql
CREATE INDEX audit_log_user_id_idx ON audit_log(user_id);
CREATE INDEX audit_log_entity_type_entity_id_idx ON audit_log(entity_type, entity_id);
CREATE INDEX audit_log_created_at_idx ON audit_log(created_at DESC);
CREATE INDEX audit_log_action_idx ON audit_log(action);
```

## Implementation Strategy

### 1. Domain Layer (Pure Business Logic)

**Location**: `src/domain/audit/`

Create domain entities and value objects:

```typescript
// src/domain/audit/audit-log.entity.ts
export class AuditLog {
  constructor(
    public readonly id: string,
    public readonly userId: string | null,
    public readonly entityType: EntityType,
    public readonly entityId: string,
    public readonly action: AuditAction,
    public readonly changes: Record<string, any> | null,
    public readonly ipAddress: string | null,
    public readonly userAgent: string | null,
    public readonly createdAt: Date
  ) {}
}

// src/domain/audit/entity-type.enum.ts
export enum EntityType {
  USER = 'user',
  CHAT = 'chat',
  MESSAGE = 'message',
  PART = 'part',
  AI_OPTIONS = 'ai_options',
}

// src/domain/audit/audit-action.enum.ts
export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  LOGIN_FAILED = 'login_failed',
  PASSWORD_CHANGE = 'password_change',
  EMAIL_CHANGE = 'email_change',
}
```

### 2. Application Layer (Use Cases & Ports)

**Location**: `src/application/ports/audit-log.port.ts`

Define the port interface:

```typescript
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
  changes?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}
```

### 3. Infrastructure Layer (Database Implementation)

**Location**: `src/adapters/secondary/repositories/audit-log.repository.ts`

Implement the repository:

```typescript
import { db } from '../../../infrastructure/database/index.js'
import { auditLog } from '../../../infrastructure/database/schema.js'
import type { AuditLogPort, CreateAuditLogDTO } from '../../../application/ports/audit-log.port.js'
import { eq, desc, and } from 'drizzle-orm'

export class AuditLogRepository implements AuditLogPort {
  constructor(private readonly logger: LoggerPort) {}

  async log(entry: CreateAuditLogDTO): Promise<void> {
    try {
      await db.insert(auditLog).values({
        userId: entry.userId,
        entityType: entry.entityType,
        entityId: entry.entityId,
        action: entry.action,
        changes: entry.changes ?? null,
        ipAddress: entry.ipAddress ?? null,
        userAgent: entry.userAgent ?? null,
      })

      this.logger.info('Audit log entry created', {
        entityType: entry.entityType,
        entityId: entry.entityId,
        action: entry.action,
      })
    } catch (error) {
      this.logger.error('Failed to create audit log entry', {
        error,
        entityType: entry.entityType,
        entityId: entry.entityId,
        action: entry.action,
      })
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

  private mapToEntity(row: any): AuditLog {
    return new AuditLog(
      row.id,
      row.userId,
      row.entityType,
      row.entityId,
      row.action,
      row.changes,
      row.ipAddress,
      row.userAgent,
      row.createdAt
    )
  }
}
```

### 4. Fastify Middleware (Request Context Capture)

**Location**: `src/infrastructure/http/middleware/audit-context.middleware.ts`

Create middleware to capture request context:

```typescript
import type { FastifyRequest, FastifyReply } from 'fastify'

/**
 * Extracts and attaches audit context to the request object
 *
 * This middleware runs after authMiddleware and captures:
 * - User ID from JWT claims
 * - Client IP address
 * - User agent string
 */
export async function auditContextMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Attach audit context to request for use in use cases
  request.auditContext = {
    userId: request.user?.sub ?? null,
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'] ?? null,
  }
}

// Extend Fastify types
declare module 'fastify' {
  interface FastifyRequest {
    auditContext?: {
      userId: string | null
      ipAddress: string
      userAgent: string | null
    }
  }
}
```

### 5. Use Case Integration

**Example**: Login use case with audit logging

```typescript
// src/application/use-cases/login-user.use-case.ts
export class LoginUserUseCase {
  constructor(
    private readonly userRepository: UserPort,
    private readonly logger: LoggerPort,
    private readonly tokenGenerator: TokenGeneratorPort,
    private readonly auditLog: AuditLogPort // Add audit log port
  ) {}

  async execute(
    email: string,
    password: string,
    auditContext: { ipAddress: string; userAgent: string | null }
  ): Promise<LoginUserResult> {
    try {
      const user = await this.userRepository.findByEmail(email)

      if (!user) {
        // Log failed login attempt
        await this.auditLog.log({
          userId: null,
          entityType: EntityType.USER,
          entityId: 'unknown',
          action: AuditAction.LOGIN_FAILED,
          changes: { email, reason: 'user_not_found' },
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
        })

        throw new UnauthorizedException('Invalid credentials')
      }

      const isPasswordValid = await user.password.matches(password)

      if (!isPasswordValid) {
        // Log failed login attempt with user ID
        await this.auditLog.log({
          userId: user.userId,
          entityType: EntityType.USER,
          entityId: user.userId,
          action: AuditAction.LOGIN_FAILED,
          changes: { reason: 'invalid_password' },
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
        })

        throw new UnauthorizedException('Invalid credentials')
      }

      const token = this.tokenGenerator.generate({
        sub: user.userId,
        email: user.email,
        role: user.role,
      })

      // Log successful login
      await this.auditLog.log({
        userId: user.userId,
        entityType: EntityType.USER,
        entityId: user.userId,
        action: AuditAction.LOGIN,
        changes: { success: true },
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
      })

      return { token }
    } catch (error) {
      this.logger.error('Login failed', { error, email })
      throw error
    }
  }
}
```

### 6. Controller Integration

**Example**: Pass audit context from request to use case

```typescript
// src/adapters/primary/http/auth.controller.ts
export class AuthController {
  async login(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { email, password } = request.body as LoginRequest

      const result = await this.loginUserUseCase.execute(email, password, {
        ipAddress: request.auditContext?.ipAddress ?? request.ip,
        userAgent: request.auditContext?.userAgent ?? null,
      })

      return reply.code(200).send({ success: true, data: result })
    } catch (error) {
      // Error handling...
    }
  }
}
```

### 7. CRUD Operations Auditing

**Example**: User update with before/after tracking

```typescript
// src/application/use-cases/update-user.use-case.ts
export class UpdateUserUseCase {
  constructor(
    private readonly userRepository: UserPort,
    private readonly auditLog: AuditLogPort
  ) {}

  async execute(userId: string, updates: UpdateUserDTO, auditContext: AuditContext): Promise<User> {
    // Get current state before update
    const userBefore = await this.userRepository.findById(userId)

    if (!userBefore) {
      throw new NotFoundException('User not found')
    }

    // Apply updates
    const updatedUser = await this.userRepository.update(userId, updates)

    // Track what changed
    const changes = {
      before: {
        name: userBefore.name,
        email: userBefore.email,
        role: userBefore.role,
      },
      after: {
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    }

    // Log the update
    await this.auditLog.log({
      userId: auditContext.userId,
      entityType: EntityType.USER,
      entityId: userId,
      action: AuditAction.UPDATE,
      changes,
      ipAddress: auditContext.ipAddress,
      userAgent: auditContext.userAgent,
    })

    return updatedUser
  }
}
```

## Best Practices

### 1. What to Audit

**Always audit:**

- User authentication events (login, logout, failed attempts)
- User account changes (password, email, role)
- Creation/deletion of critical entities (chats, messages)
- Permission changes
- Access to sensitive data

**Consider auditing:**

- Updates to business entities
- Configuration changes
- API calls to external services
- Bulk operations

**Don't audit:**

- Read operations (unless for sensitive data)
- High-frequency background tasks
- System health checks

### 2. Error Handling

```typescript
// Audit logging should NEVER break business operations
try {
  await auditLog.log(entry)
} catch (error) {
  logger.error('Audit logging failed', { error })
  // Continue with business logic
}
```

### 3. Performance Considerations

- **Async logging**: Use background jobs for non-critical audits
- **Batch inserts**: For bulk operations, batch audit log entries
- **Index management**: Ensure proper indexes for query patterns
- **Retention policy**: Implement data archival for old audit logs

```typescript
// Example: Batch audit logging
async logBatch(entries: CreateAuditLogDTO[]): Promise<void> {
  try {
    await db.insert(auditLog).values(entries)
  } catch (error) {
    this.logger.error('Batch audit logging failed', { error, count: entries.length })
  }
}
```

### 4. Privacy Considerations

- **Sensitive data**: Never log passwords, tokens, or PII in plaintext
- **GDPR compliance**: Implement right-to-erasure for audit logs
- **Redaction**: Redact sensitive fields in the changes object

```typescript
// Example: Redacting sensitive fields
function redactSensitiveData(changes: Record<string, any>): Record<string, any> {
  const redacted = { ...changes }
  const sensitiveFields = ['password', 'token', 'creditCard', 'ssn']

  for (const field of sensitiveFields) {
    if (field in redacted) {
      redacted[field] = '[REDACTED]'
    }
  }

  return redacted
}
```

### 5. Changes Object Structure

For **updates**, use before/after structure:

```json
{
  "before": {
    "name": "Old Name",
    "email": "old@example.com"
  },
  "after": {
    "name": "New Name",
    "email": "new@example.com"
  }
}
```

For **creates**, include initial values:

```json
{
  "created": {
    "chatId": "019b86fb-f42f-7ea7-b30c-8ebf80c3f4a9",
    "userId": "019b6742-b220-7e5c-a4cd-459ff52f6579",
    "messageCount": 1
  }
}
```

For **deletes**, include what was deleted:

```json
{
  "deleted": {
    "chatId": "019b86fb-f42f-7ea7-b30c-8ebf80c3f4a9",
    "messageCount": 42,
    "wasActive": true
  }
}
```

For **authentication**, include metadata:

```json
{
  "success": true,
  "method": "jwt",
  "sessionDuration": "7d"
}
```

## Testing Strategy

### 1. Repository Tests

```typescript
describe('AuditLogRepository', () => {
  it('should create audit log entry', async () => {
    const entry: CreateAuditLogDTO = {
      userId: 'user-123',
      entityType: EntityType.CHAT,
      entityId: 'chat-456',
      action: AuditAction.CREATE,
      changes: { created: { messageCount: 0 } },
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
    }

    await auditLogRepository.log(entry)

    const logs = await auditLogRepository.getByEntity(EntityType.CHAT, 'chat-456')
    expect(logs).toHaveLength(1)
    expect(logs[0].action).toBe(AuditAction.CREATE)
  })

  it('should not throw when audit logging fails', async () => {
    // Mock database error
    vi.spyOn(db, 'insert').mockRejectedValue(new Error('DB error'))

    await expect(auditLogRepository.log(entry)).resolves.not.toThrow()
  })
})
```

### 2. Use Case Tests

```typescript
describe('LoginUserUseCase', () => {
  it('should log failed login attempt with user ID', async () => {
    const auditLogSpy = vi.spyOn(auditLogRepository, 'log')

    await expect(
      loginUseCase.execute('user@example.com', 'wrong-password', auditContext)
    ).rejects.toThrow()

    expect(auditLogSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.LOGIN_FAILED,
        entityType: EntityType.USER,
      })
    )
  })
})
```

## Dependency Injection Setup

Update the DI container to include audit logging:

```typescript
// src/infrastructure/di/container.ts
export class DIContainer {
  private static auditLogRepository: AuditLogRepository

  static initialize() {
    // Initialize repositories
    this.auditLogRepository = new AuditLogRepository(this.logger)

    // Pass to use cases that need auditing
    this.loginUserUseCase = new LoginUserUseCase(
      this.userRepository,
      this.logger,
      this.tokenGenerator,
      this.auditLogRepository // Add here
    )
  }

  static getAuditLogRepository(): AuditLogRepository {
    return this.auditLogRepository
  }
}
```

## API Endpoints for Audit Logs

Create read-only endpoints for administrators:

```typescript
// src/adapters/primary/http/audit.controller.ts
export class AuditController {
  constructor(private readonly auditLogRepository: AuditLogPort) {}

  registerRoutes(app: FastifyInstance): void {
    // Get audit logs for an entity
    app.get(
      '/audit/:entityType/:entityId',
      { preHandler: [authMiddleware, requireRole(['admin'])] },
      this.getByEntity.bind(this)
    )

    // Get audit logs for a user
    app.get(
      '/audit/user/:userId',
      { preHandler: [authMiddleware, requireRole(['admin'])] },
      this.getByUser.bind(this)
    )

    // Get recent audit logs by action
    app.get(
      '/audit/action/:action',
      { preHandler: [authMiddleware, requireRole(['admin'])] },
      this.getByAction.bind(this)
    )
  }

  async getByEntity(request: FastifyRequest, reply: FastifyReply) {
    const { entityType, entityId } = request.params as {
      entityType: string
      entityId: string
    }

    const logs = await this.auditLogRepository.getByEntity(entityType as EntityType, entityId)

    return reply.code(200).send({ success: true, data: logs })
  }
}
```

## Migration Path

### Phase 1: Infrastructure

1. ✅ Table already exists in schema
2. Create domain entities and enums
3. Create AuditLogPort interface
4. Implement AuditLogRepository

### Phase 2: Request Context

1. Create auditContextMiddleware
2. Register middleware in Fastify after authMiddleware
3. Extend FastifyRequest type

### Phase 3: Critical Operations

1. Add audit logging to LoginUserUseCase
2. Add audit logging to RegisterUserUseCase
3. Add audit logging to UpdateUserUseCase
4. Add audit logging to DeleteUserUseCase

### Phase 4: Business Operations

1. Add audit logging to CreateChatUseCase
2. Add audit logging to DeleteChatUseCase
3. Add audit logging to message operations

### Phase 5: Admin Interface

1. Create AuditController
2. Register routes with role-based access control
3. Add pagination support
4. Add filtering and search capabilities

## Monitoring & Alerting

Consider setting up alerts for:

- Unusual number of failed login attempts
- Bulk delete operations
- Role changes
- After-hours access to sensitive data
- Audit log repository failures (logging the logs!)

## Summary

The audit log implementation provides:

- ✅ Complete audit trail for compliance
- ✅ Security incident investigation capabilities
- ✅ User activity tracking
- ✅ Non-intrusive integration (doesn't break business logic)
- ✅ Structured change tracking with before/after states
- ✅ IP address and user agent capture
- ✅ Optimized for query performance with proper indexes
- ✅ Type-safe with TypeScript enums and interfaces

This implementation follows the hexagonal architecture pattern with clear separation between domain, application, and infrastructure layers.
