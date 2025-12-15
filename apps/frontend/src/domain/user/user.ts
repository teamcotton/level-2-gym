import { z } from 'zod'

/**
 * User domain model with Zod schemas for runtime validation.
 * Follows DDD architecture pattern with value objects and entity schemas.
 */

// Value object schemas
export const RoleSchema = z.enum(['user', 'admin', 'moderator'])

// User entity schema
export const UserSchema = z.object({
  id: z.string().uuid('User ID must be a valid UUID'),
  name: z.string().min(1, 'Name is required').max(100, 'Name must not exceed 100 characters'),
  email: z.string().email('Please enter a valid email address'),
  role: RoleSchema,
  createdAt: z
    .string()
    .datetime({ offset: true, message: 'Created at must be a valid ISO 8601 datetime' }),
})

// Types inferred from schemas
export type Role = z.infer<typeof RoleSchema>
export type User = z.infer<typeof UserSchema>
