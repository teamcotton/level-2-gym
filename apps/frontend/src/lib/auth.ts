import { getServerSession } from 'next-auth'

import { authOptions } from './auth-config.js'

/**
 * Get the authentication token from the current session
 * Use this in Server Actions or API routes to get the JWT token for backend requests
 *
 * @returns The JWT access token or null if not authenticated
 *
 * @example
 * ```typescript
 * const token = await getAuthToken()
 * if (!token) {
 *   throw new Error('Unauthorized')
 * }
 * ```
 */
export async function getAuthToken(): Promise<string | null> {
  const session = await getServerSession(authOptions)
  return session?.accessToken || null
}

/**
 * Get the current authenticated user session
 * Use this in Server Components or Server Actions
 *
 * @returns The user session or null if not authenticated
 *
 * @example
 * ```typescript
 * const session = await getAuthSession()
 * if (!session) {
 *   redirect('/login')
 * }
 * ```
 */
export async function getAuthSession() {
  return await getServerSession(authOptions)
}

/**
 * Check if the user has a specific role
 *
 * @param requiredRole - The role to check for
 * @returns True if the user has the role, false otherwise
 *
 * @example
 * ```typescript
 * const isAdmin = await hasRole('admin')
 * if (!isAdmin) {
 *   throw new Error('Forbidden')
 * }
 * ```
 */
export async function hasRole(requiredRole: string): Promise<boolean> {
  const session = await getServerSession(authOptions)
  return session?.user?.roles?.includes(requiredRole) || false
}

/**
 * Check if the user has any of the specified roles
 *
 * @param requiredRoles - Array of roles to check for
 * @returns True if the user has at least one of the roles, false otherwise
 *
 * @example
 * ```typescript
 * const canAccess = await hasAnyRole(['admin', 'moderator'])
 * if (!canAccess) {
 *   throw new Error('Forbidden')
 * }
 * ```
 */
export async function hasAnyRole(requiredRoles: string[]): Promise<boolean> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.roles) return false

  return requiredRoles.some((role) => session.user.roles.includes(role))
}

/**
 * Check if the user has all of the specified roles
 *
 * @param requiredRoles - Array of roles to check for
 * @returns True if the user has all the roles, false otherwise
 *
 * @example
 * ```typescript
 * const canAccess = await hasAllRoles(['admin', 'superuser'])
 * if (!canAccess) {
 *   throw new Error('Forbidden')
 * }
 * ```
 */
export async function hasAllRoles(requiredRoles: string[]): Promise<boolean> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.roles) return false

  return requiredRoles.every((role) => session.user.roles.includes(role))
}

/**
 * Require authentication - throws error if not authenticated
 * Use this in Server Actions that require authentication
 *
 * @returns The authenticated session
 * @throws Error if not authenticated
 *
 * @example
 * ```typescript
 * export async function protectedAction() {
 *   'use server'
 *   const session = await requireAuth()
 *   // Proceed with authenticated logic
 * }
 * ```
 */
export async function requireAuth() {
  const session = await getServerSession(authOptions)
  if (!session) {
    throw new Error('Unauthorized - Please sign in')
  }
  return session
}

/**
 * Require a specific role - throws error if user doesn't have the role
 * Use this in Server Actions that require specific permissions
 *
 * @param requiredRole - The role required to access the resource
 * @returns The authenticated session
 * @throws Error if not authenticated or doesn't have required role
 *
 * @example
 * ```typescript
 * export async function adminAction() {
 *   'use server'
 *   const session = await requireRole('admin')
 *   // Proceed with admin logic
 * }
 * ```
 */
export async function requireRole(requiredRole: string) {
  const session = await requireAuth()
  if (!session.user.roles?.includes(requiredRole)) {
    throw new Error(`Forbidden - Requires ${requiredRole} role`)
  }
  return session
}
