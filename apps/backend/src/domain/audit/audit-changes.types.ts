/**
 * Type-safe change structures for audit logs
 *
 * These types provide better type safety and autocomplete support
 * for different audit log actions instead of using Record<string, any>.
 */

/**
 * Changes tracked when an entity is created
 */
export interface CreateChanges {
  created: Record<string, unknown>
}

/**
 * Changes tracked when an entity is updated
 * Captures the state before and after the update
 */
export interface UpdateChanges {
  before: Record<string, unknown>
  after: Record<string, unknown>
}

/**
 * Changes tracked when an entity is deleted
 */
export interface DeleteChanges {
  deleted: Record<string, unknown>
}

/**
 * Metadata tracked for successful login attempts
 */
export interface LoginChanges {
  success: boolean
  method?: string
  sessionDuration?: string
  [key: string]: unknown
}

/**
 * Metadata tracked for failed login attempts
 */
export interface LoginFailedChanges {
  email?: string
  reason: string
  [key: string]: unknown
}

/**
 * Metadata tracked for logout actions
 */
export interface LogoutChanges {
  reason?: string
  sessionDuration?: string
  [key: string]: unknown
}

/**
 * Metadata tracked for password change actions
 */
export interface PasswordChangeChanges {
  success: boolean
  method?: string
  [key: string]: unknown
}

/**
 * Metadata tracked for email change actions
 */
export interface EmailChangeChanges {
  before?: string
  after?: string
  verified?: boolean
  [key: string]: unknown
}

/**
 * Union type of all possible change structures
 * This provides type safety while allowing flexibility for different audit actions
 */
export type AuditChanges =
  | CreateChanges
  | UpdateChanges
  | DeleteChanges
  | LoginChanges
  | LoginFailedChanges
  | LogoutChanges
  | PasswordChangeChanges
  | EmailChangeChanges
  | Record<string, unknown> // Fallback for custom change structures
