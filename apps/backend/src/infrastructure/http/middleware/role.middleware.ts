import type { FastifyRequest, FastifyReply, preHandlerAsyncHookHandler } from 'fastify'
/**
 * Creates a Fastify middleware that requires the authenticated user to have one of the specified roles.
 *
 * This middleware should be chained after `authMiddleware` to ensure `request.user` is populated.
 * It checks if the authenticated user's roles include at least one of the required roles.
 *
 * @param requiredRoles - Array of roles that are allowed to access the route (e.g., ['admin', 'moderator']).
 *                        Must be a non-empty array. Empty arrays will throw an error at function creation time.
 * @returns Fastify preHandler hook that validates user roles and returns error responses for unauthorized access
 * @throws {Error} If requiredRoles is an empty array
 *
 * @example
 * ```typescript
 * import { authMiddleware } from './middleware/auth.middleware.js'
 * import { requireRole } from './middleware/role.middleware.js'
 *
 * // Protect route - only admins and moderators can access
 * app.get('/users', {
 *   preHandler: [authMiddleware, requireRole(['admin', 'moderator'])]
 * }, async (request, reply) => {
 *   // User is guaranteed to be authenticated and have admin or moderator role
 *   return { users: await getAllUsers() }
 * })
 *
 * // Single role requirement
 * app.delete('/users/:id', {
 *   preHandler: [authMiddleware, requireRole(['admin'])]
 * }, async (request, reply) => {
 *   // Only admins can delete users
 *   return { success: true }
 * })
 * ```
 *
 * @remarks
 * **Usage Requirements:**
 * - Must be used AFTER `authMiddleware` in the preHandler chain
 * - `authMiddleware` must successfully authenticate and populate `request.user`
 * - User roles are stored in `request.user.roles` as an array of strings
 *
 * **Authorization Flow:**
 * 1. Checks if user is authenticated (request.user exists)
 * 2. Checks if user has roles array
 * 3. Verifies at least one user role matches required roles
 * 4. Allows request to proceed if authorized, otherwise returns a 401/403 response via reply.code()
 *
 * **Error Responses:**
 * - 401 Unauthorized: User not authenticated (missing request.user)
 * - 403 Forbidden: User authenticated but lacks required role
 *
 * **Logging Behavior:**
 * - WARN: Missing authentication, missing roles, or insufficient permissions
 * - INFO: Successful role checks
 * - Context includes: method, route, userId, userRoles, requiredRoles
 *
 * @see {@link authMiddleware} for authentication middleware that must be used first
 */
export function requireRole(requiredRoles: string[]): preHandlerAsyncHookHandler {
  // Validate that requiredRoles is not empty
  if (!requiredRoles || requiredRoles.length === 0) {
    throw new Error(
      'requireRole: requiredRoles must be a non-empty array. ' +
        'Empty arrays are not allowed as they would deny all access. ' +
        'If you need to allow all authenticated users, do not use this middleware.'
    )
  }

  return async (request: FastifyRequest, reply: FastifyReply): Promise<void | FastifyReply> => {
    const route = (request as any).routerPath ?? request.url
    const method = request.method

    // Ensure user is authenticated
    if (!request.user) {
      request.log.warn(
        {
          method,
          route,
          requiredRoles,
        },
        'Role check failed: User not authenticated'
      )
      return reply.code(401).send({
        success: false,
        error: 'Authentication required',
      })
    }

    // Check if user has roles
    const userRoles = request.user.roles || []

    if (userRoles.length === 0) {
      request.log.warn(
        {
          method,
          route,
          userId: request.user.sub,
          requiredRoles,
        },
        'Role check failed: User has no roles assigned'
      )
      return reply.code(403).send({
        success: false,
        error: `Access denied. Required roles: ${requiredRoles.join(', ')}`,
      })
    }

    // Check if user has at least one of the required roles
    const hasRequiredRole = requiredRoles.some((role) => userRoles.includes(role))

    if (!hasRequiredRole) {
      request.log.warn(
        {
          method,
          route,
          userId: request.user.sub,
          userRoles,
          requiredRoles,
        },
        'Role check failed: Insufficient permissions'
      )
      return reply.code(403).send({
        success: false,
        error: `Access denied. Required roles: ${requiredRoles.join(', ')}`,
      })
    }

    // User has required role, allow request to proceed
    request.log.info(
      {
        method,
        route,
        userId: request.user.sub,
        userRoles,
      },
      'Role check passed'
    )
  }
}
