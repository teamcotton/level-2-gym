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
  _reply: FastifyReply
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
