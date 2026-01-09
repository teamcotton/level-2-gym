import type { FastifyRequest, FastifyReply } from 'fastify'
import { timingSafeEqual } from 'crypto'
import { EnvConfig } from '../../config/env.config.js'
import { obscured } from 'obscured'

/**
 * Fastify middleware for OAuth sync endpoint authentication
 *
 * Authenticates OAuth sync requests from the frontend by validating a shared secret
 * provided in the X-OAuth-Sync-Secret header. This prevents unauthorized external
 * requests from creating or updating user records via the OAuth sync endpoint.
 *
 * @param request - Fastify request object containing headers
 * @param reply - Fastify reply object for sending authentication error responses
 * @returns Promise that resolves to void on success or FastifyReply on authentication failure
 *
 * @throws {UnauthorizedException} When secret validation fails (caught internally and converted to 401 response)
 *
 * @example
 * ```typescript
 * // Apply to specific OAuth sync route
 * fastify.post('/auth/oauth-sync', { preHandler: oauthSyncAuthMiddleware }, async (request, reply) => {
 *   // OAuth sync logic here
 * })
 * ```
 *
 * @remarks
 * **Authentication Flow:**
 * 1. Extracts shared secret from `X-OAuth-Sync-Secret` header
 * 2. Validates secret matches configured OAUTH_SYNC_SECRET environment variable
 * 3. Logs authentication attempts (success and failures)
 *
 * **Header Format:**
 * - Required header: `X-OAuth-Sync-Secret: <secret>`
 * - Secret must match OAUTH_SYNC_SECRET environment variable exactly
 *
 * **Security Features:**
 * - Constant-time comparison using Node.js crypto.timingSafeEqual() to prevent timing attacks
 * - Structured logging for security monitoring
 * - Generic error messages to prevent information disclosure
 *
 * **Error Response:**
 * ```json
 * {
 *   "success": false,
 *   "error": "Unauthorized access to OAuth sync endpoint"
 * }
 * ```
 *
 * @see {@link EnvConfig.OAUTH_SYNC_SECRET} for configuration
 */
export async function oauthSyncAuthMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void | FastifyReply> {
  try {
    const providedSecret = request.headers['x-oauth-sync-secret']

    request.log.info(
      {
        method: request.method,
        route: (request as any).routerPath ?? request.url,
      },
      'OAuth sync authentication attempt'
    )

    if (!providedSecret || typeof providedSecret !== 'string') {
      request.log.warn(
        {
          method: request.method,
          route: (request as any).routerPath ?? request.url,
        },
        'OAuth sync authentication failed: missing secret'
      )
      return reply
        .code(401)
        .send({ success: false, error: 'Unauthorized access to OAuth sync endpoint' })
    }

    // Get the configured secret
    const configuredSecret = obscured.value(EnvConfig.OAUTH_SYNC_SECRET)

    if (!configuredSecret) {
      request.log.error(
        {
          method: request.method,
          route: (request as any).routerPath ?? request.url,
        },
        'OAuth sync authentication failed: OAUTH_SYNC_SECRET not configured'
      )
      return reply
        .code(401)
        .send({ success: false, error: 'Unauthorized access to OAuth sync endpoint' })
    }

    // Use constant-time comparison to prevent timing attacks
    // Check length first as timingSafeEqual requires equal-length buffers
    if (
      providedSecret.length !== configuredSecret.length ||
      !timingSafeEqual(Buffer.from(providedSecret), Buffer.from(configuredSecret))
    ) {
      request.log.warn(
        {
          method: request.method,
          route: (request as any).routerPath ?? request.url,
        },
        'OAuth sync authentication failed: invalid secret'
      )
      return reply
        .code(401)
        .send({ success: false, error: 'Unauthorized access to OAuth sync endpoint' })
    }

    // Authentication successful
    request.log.info(
      {
        method: request.method,
        route: (request as any).routerPath ?? request.url,
      },
      'OAuth sync authentication successful'
    )
  } catch (error) {
    request.log.error(
      {
        method: request.method,
        route: (request as any).routerPath ?? request.url,
        err: error,
      },
      'OAuth sync authentication error'
    )
    return reply
      .code(401)
      .send({ success: false, error: 'Unauthorized access to OAuth sync endpoint' })
  }
}
