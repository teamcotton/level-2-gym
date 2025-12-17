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
