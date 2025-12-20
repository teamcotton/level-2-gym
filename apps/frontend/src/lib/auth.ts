import type { Session } from 'next-auth'
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
 * Higher-order function that wraps Server Actions with authentication
 *
 * Automatically checks authentication and passes the session to the wrapped function.
 * Throws an error if the user is not authenticated.
 *
 * @template TArgs - The argument types of the wrapped function
 * @template TReturn - The return type of the wrapped function
 * @param {Function} action - The Server Action to wrap with authentication
 * @returns {Function} The wrapped function that requires authentication
 *
 * @throws {Error} If user is not authenticated
 *
 * @example
 * ```typescript
 * // Wrap a Server Action with authentication
 * export const protectedAction = withAuth(
 *   async (session: Session, data: SomeData) => {
 *     'use server'
 *     // Access session.user.id, session.accessToken, etc.
 *     const userId = session.user.id
 *     // Your protected logic here
 *     return { success: true }
 *   }
 * )
 * ```
 *
 * @example
 * ```typescript
 * // Use in a component
 * const result = await protectedAction(someData)
 * ```
 *
 * @see {@link getAuthSession} for getting session without throwing
 * @see {@link requireAuth} for authentication check that throws
 */
export function withAuth<TArgs extends unknown[], TReturn>(
  action: (session: Session, ...args: TArgs) => Promise<TReturn>
): (...args: TArgs) => Promise<TReturn> {
  return async (...args: TArgs): Promise<TReturn> => {
    const session = await getServerSession(authOptions)

    if (!session) {
      throw new Error('Unauthorized - Please sign in')
    }

    return action(session, ...args)
  }
}

/**
 * Higher-order function that wraps Server Actions with role-based authentication
 *
 * Automatically checks authentication and verifies the user has one of the required roles
 * before executing the wrapped function. Passes the session to the wrapped function.
 *
 * @template TArgs - The argument types of the wrapped function
 * @template TReturn - The return type of the wrapped function
 * @param {string | string[]} requiredRoles - Single role or array of roles required to access the action
 * @param {Function} action - The Server Action to wrap with role-based authentication
 * @returns {Function} The wrapped function that requires authentication and specific roles
 *
 * @throws {Error} If user is not authenticated
 * @throws {Error} If user doesn't have required role(s)
 *
 * @example
 * ```typescript
 * // Require admin role
 * export const adminAction = withRole('admin',
 *   async (session: Session, data: SomeData) => {
 *     'use server'
 *     // Only admins can execute this
 *     return { success: true }
 *   }
 * )
 * ```
 *
 * @example
 * ```typescript
 * // Require one of multiple roles
 * export const moderatorAction = withRole(['admin', 'moderator'],
 *   async (session: Session, data: SomeData) => {
 *     'use server'
 *     // Admins or moderators can execute this
 *     return { success: true }
 *   }
 * )
 * ```
 *
 * @see {@link withAuth} for basic authentication without role checking
 * @see {@link hasRole} for manual role checking
 */
export function withRole<TArgs extends unknown[], TReturn>(
  requiredRoles: string | string[],
  action: (session: Session, ...args: TArgs) => Promise<TReturn>
): (...args: TArgs) => Promise<TReturn> {
  return async (...args: TArgs): Promise<TReturn> => {
    const session = await getServerSession(authOptions)

    if (!session) {
      throw new Error('Unauthorized - Please sign in')
    }

    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]
    const hasRequiredRole = roles.some((role) => session.user?.roles?.includes(role))

    if (!hasRequiredRole) {
      throw new Error(`Forbidden - Requires one of: ${roles.join(', ')}`)
    }

    return action(session, ...args)
  }
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
