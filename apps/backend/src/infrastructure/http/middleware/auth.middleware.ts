import type { FastifyRequest, FastifyReply } from 'fastify'
import { JwtUtil } from '../../security/jwt.util.js'
import { UnauthorizedException } from '../../../shared/exceptions/unauthorized.exception.js'
import { ErrorCode } from '../../../shared/constants/error-codes.js'

// Maximum allowed token length to prevent DOS attacks (typical JWT is 200-500 bytes)
const MAX_TOKEN_LENGTH = 8192

// Regular expression for valid JWT format: Base64URL characters and dots
// Note: Base64URL encoding (RFC 4648 §5) used by JWT does NOT include padding (=)
const JWT_FORMAT_REGEX = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/

/**
 * Validates token format to fail fast before expensive verification
 * @param token - The JWT token to validate
 * @throws UnauthorizedException if token format is invalid
 */
function validateTokenFormat(token: string): void {
  // Check token length to prevent DOS from extremely large tokens
  if (token.length > MAX_TOKEN_LENGTH) {
    throw new UnauthorizedException('Token exceeds maximum allowed length', ErrorCode.UNAUTHORIZED)
  }

  // Check token has exactly 3 parts (header.payload.signature)
  const parts = token.split('.')
  if (parts.length !== 3) {
    throw new UnauthorizedException('Invalid token format', ErrorCode.UNAUTHORIZED)
  }

  // Ensure each part has content (check before regex to give more specific error)
  if (parts.some((part) => part.length === 0)) {
    throw new UnauthorizedException('Invalid token structure', ErrorCode.UNAUTHORIZED)
  }

  // Validate token contains only valid Base64URL characters and dots
  if (!JWT_FORMAT_REGEX.test(token)) {
    throw new UnauthorizedException('Invalid token characters', ErrorCode.UNAUTHORIZED)
  }
}

/**
 * Fastify middleware for JWT-based authentication
 *
 * Authenticates incoming requests by validating JWT tokens from the Authorization header.
 * Extracts and verifies Bearer tokens, validates their format and cryptographic signature,
 * and attaches verified user claims to the request object for downstream route handlers.
 *
 * @param request - Fastify request object containing headers and authentication state
 * @param reply - Fastify reply object for sending authentication error responses
 * @returns Promise that resolves to void on success or FastifyReply on authentication failure
 *
 * @throws {UnauthorizedException} When token validation fails (caught internally and converted to 401 response)
 *
 * @example
 * ```typescript
 * // Register as global preHandler hook
 * fastify.addHook('preHandler', authMiddleware)
 *
 * // Or apply to specific routes
 * fastify.get('/protected', { preHandler: authMiddleware }, async (request, reply) => {
 *   const user = request.user // Typed user claims available
 *   return { userId: user.sub, email: user.email }
 * })
 * ```
 *
 * @remarks
 * **Authentication Flow:**
 * 1. Extracts Bearer token from `Authorization` header
 * 2. Validates token format (length, structure, character set)
 * 3. Verifies cryptographic signature and expiration via JwtUtil
 * 4. Attaches decoded user claims to `request.user`
 * 5. Logs all authentication attempts (success and failures)
 *
 * **Authorization Header Format:**
 * - Required format: `Bearer <token>`
 * - Case-sensitive "Bearer" prefix
 * - Single space separator
 * - Token must be valid JWT with 3 Base64URL-encoded parts
 *
 * **Error Response Strategy:**
 * - Low-level errors (format, signature): Generic `"Invalid or expired token"` message
 * - High-level errors (expired, missing claims): Specific error messages
 * - Prevents exposing implementation details to potential attackers
 *
 * **Security Features:**
 * - DOS protection via MAX_TOKEN_LENGTH (8KB limit)
 * - Fast-fail token format validation before expensive cryptographic verification
 * - Structured logging with error codes for security monitoring
 * - Generic error messages for low-level failures to prevent information disclosure
 *
 * **Logging Behavior:**
 * - INFO: All authentication attempts with method and route
 * - WARN: Missing tokens, invalid tokens, verification failures
 * - Context includes: method, route, errorCode (for UnauthorizedException)
 *
 * @see {@link JwtUtil.verifyToken} for token verification implementation
 * @see {@link validateTokenFormat} for format validation rules
 */
export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void | FastifyReply> {
  try {
    const header = request.headers.authorization
    const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null

    request.log.info(
      {
        method: request.method,
        route: (request as any).routerPath ?? request.url,
      },
      'Authentication attempt'
    )

    if (!token) {
      request.log.warn(
        {
          method: request.method,
          route: (request as any).routerPath ?? request.url,
        },
        'Authentication failed: missing bearer token'
      )
      return reply.code(401).send({ error: 'No token provided' })
    }

    // Validate token format before expensive verification
    validateTokenFormat(token)

    request.user = JwtUtil.verifyToken(token)
  } catch (error) {
    if (error instanceof UnauthorizedException) {
      request.log.warn(
        {
          method: request.method,
          route: (request as any).routerPath ?? request.url,
          errorCode: error.code,
        },
        `Authentication failed: ${error.message}`
      )
      // Return generic error message for low-level token errors to avoid exposing implementation details
      // High-level semantic errors (expired, missing claims) return specific messages
      const lowLevelErrorMessages = new Set([
        'Token exceeds maximum allowed length',
        'Invalid token format',
        'Invalid token characters',
        'Invalid token structure',
        'Invalid token',
        'Invalid token payload',
      ])

      if (lowLevelErrorMessages.has(error.message)) {
        return reply.code(401).send({ error: 'Invalid or expired token' })
      }

      return reply.code(error.statusCode).send({ error: error.message })
    }
    request.log.warn(
      {
        method: request.method,
        route: (request as any).routerPath ?? request.url,
        err: error,
      },
      'Authentication failed: invalid or expired token'
    )
    return reply.code(401).send({ error: 'Invalid or expired token' })
  }
}
